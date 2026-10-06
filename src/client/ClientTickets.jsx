import API_URL from "../config/api";
import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    FileImage,
    Headphones,
    History,
    MessageSquare,
    Paperclip,
    Plus,
    Search,
    Send,
    UserRound,
    X,
} from "lucide-react";

const initialTickets = [
    {
        id: 1,
        ticketNo: "TKT-1042",
        title: "GST report mismatch in monthly summary",
        product: "NexERP",
        category: "Reports",
        priority: "High",
        status: "In Progress",
        createdAt: "15 Jul 2026, 09:40 AM",
        updatedAt: "15 Jul 2026, 10:05 AM",
        assignedTo: "Akash Pawar",
        description:
            "The monthly GST summary total does not match the sales invoice GST amount.",
        attachmentName: "gst-report-mismatch.png",
        timeline: [
            {
                id: 1,
                type: "created",
                title: "Ticket raised",
                description:
                    "Support request was submitted from the client portal.",
                user: "Ramesh Patil",
                time: "15 Jul 2026, 09:40 AM",
            },
            {
                id: 2,
                type: "assigned",
                title: "Ticket assigned",
                description:
                    "Ticket was assigned to Akash Pawar.",
                user: "Admin",
                time: "15 Jul 2026, 09:52 AM",
            },
            {
                id: 3,
                type: "progress",
                title: "Work started",
                description:
                    "The support engineer started investigating the GST calculation.",
                user: "Akash Pawar",
                time: "15 Jul 2026, 10:05 AM",
            },
        ],
        messages: [
            {
                id: 1,
                sender: "Akash Pawar",
                role: "Support Engineer",
                message:
                    "We are checking the invoice tax values and GST summary calculation. We will update you shortly.",
                time: "15 Jul 2026, 10:12 AM",
            },
        ],
    },
    {
        id: 2,
        ticketNo: "TKT-1036",
        title: "Sales invoice total not matching",
        product: "NexERP",
        category: "Billing",
        priority: "Medium",
        status: "Resolved",
        createdAt: "09 Jul 2026, 11:20 AM",
        updatedAt: "10 Jul 2026, 04:15 PM",
        assignedTo: "Akash Pawar",
        description:
            "Invoice total was different after applying the cash discount.",
        attachmentName: "",
        timeline: [
            {
                id: 1,
                type: "created",
                title: "Ticket raised",
                description:
                    "Support request was submitted from the client portal.",
                user: "Ramesh Patil",
                time: "09 Jul 2026, 11:20 AM",
            },
            {
                id: 2,
                type: "resolved",
                title: "Ticket resolved",
                description:
                    "The invoice calculation issue was corrected.",
                user: "Akash Pawar",
                time: "10 Jul 2026, 04:15 PM",
            },
        ],
        messages: [
            {
                id: 1,
                sender: "Akash Pawar",
                role: "Support Engineer",
                message:
                    "The cash discount calculation has been corrected. Please verify the invoice again.",
                time: "10 Jul 2026, 04:15 PM",
            },
        ],
    },
    {
        id: 3,
        ticketNo: "TKT-1034",
        title: "Backup process showing warning",
        product: "NexERP",
        category: "Backup",
        priority: "Low",
        status: "Closed",
        createdAt: "05 Jul 2026, 03:10 PM",
        updatedAt: "06 Jul 2026, 12:30 PM",
        assignedTo: "Rohit More",
        description:
            "A warning appeared while taking the daily database backup.",
        attachmentName: "",
        timeline: [
            {
                id: 1,
                type: "created",
                title: "Ticket raised",
                description: "Backup warning reported by the client.",
                user: "Ramesh Patil",
                time: "05 Jul 2026, 03:10 PM",
            },
            {
                id: 2,
                type: "resolved",
                title: "Backup configuration updated",
                description:
                    "Backup folder permissions were corrected.",
                user: "Rohit More",
                time: "06 Jul 2026, 11:50 AM",
            },
            {
                id: 3,
                type: "closed",
                title: "Ticket closed",
                description:
                    "The client confirmed that the backup completed successfully.",
                user: "Ramesh Patil",
                time: "06 Jul 2026, 12:30 PM",
            },
        ],
        messages: [],
    },
];

const emptyTicketForm = {
  product: "",
  category: "Billing",
  priority: "Medium",
  title: "",
  description: "",
  contactMethod: "Phone",
  attachment: null,
  attachmentName: "",
};;

function StatusBadge({ status }) {
    const styles = {
        New: "bg-blue-50 text-blue-700 ring-blue-600/10",
        Assigned:
            "bg-slate-100 text-slate-700 ring-slate-500/10",
        "In Progress":
            "bg-violet-50 text-violet-700 ring-violet-600/10",
        Waiting:
            "bg-amber-50 text-amber-700 ring-amber-600/10",
        Resolved:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Closed:
            "bg-slate-100 text-slate-600 ring-slate-500/10",
        Reopened:
            "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${styles[status] ||
                "bg-slate-100 text-slate-600 ring-slate-500/10"
                }`}
        >
            {status}
        </span>
    );
}

function PriorityBadge({ priority }) {
    const styles = {
        Low: "bg-slate-100 text-slate-600 ring-slate-500/10",
        Medium:
            "bg-amber-50 text-amber-700 ring-amber-600/10",
        High:
            "bg-orange-50 text-orange-700 ring-orange-600/10",
        Critical:
            "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${styles[priority] || styles.Low
                }`}
        >
            {priority}
        </span>
    );
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
        <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition hover:border-slate-300">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 truncate text-xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
                >
                    <Icon size={16} />
                </div>
            </div>

            <p className={`mt-2.5 truncate text-[10px] font-medium ${descriptionClass}`}>
                {description}
            </p>
        </article>
    );
}

export default function ClientTickets({ client }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [raiseTicketOpen, setRaiseTicketOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [editingTicketId, setEditingTicketId] = useState(null);
    const [ticketForm, setTicketForm] =
        useState(emptyTicketForm);
    const [replyMessage, setReplyMessage] = useState("");

    const selectedTicket =
        tickets.find(
            (ticket) => (ticket._id || ticket.id) === selectedTicketId
        ) || null;

    const isEditing = Boolean(editingTicketId);
    const canEditSelectedTicket =
        selectedTicket &&
        ["New", "Assigned"].includes(
            selectedTicket.status
        );

    const openEditTicket = () => {
        if (!selectedTicket) return;

        setEditingTicketId(
            selectedTicket._id || selectedTicket.id
        );

        setTicketForm({
            product:
                selectedTicket.productName ||
                selectedTicket.product ||
                "",
            category:
                selectedTicket.category ||
                "Billing",
            priority:
                selectedTicket.priority ||
                "Medium",
            title:
                selectedTicket.title || "",
            description:
                selectedTicket.description || "",
            contactMethod:
                selectedTicket.contactMethod ||
                "Phone",
            attachment: null,
            attachmentName:
                selectedTicket.attachments?.[0]?.originalName ||
                selectedTicket.attachments?.[0]?.fileName ||
                selectedTicket.attachmentName ||
                "",
        });

        setRaiseTicketOpen(true);
    };

    const closeRaiseForm = () => {
        setRaiseTicketOpen(false);
        setEditingTicketId(null);
        setTicketForm(emptyTicketForm);
    };

    const filteredTickets = useMemo(() => {
        const search = searchValue.trim().toLowerCase();

        return tickets.filter((ticket) => {
            const matchesSearch =
                !search ||
                [
                    ticket.ticketCode,
                    ticket.title,
                    ticket.productName,
                    ticket.category,
                    ticket.assignedEmployeeName,
                    ticket.status,
                ].some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(search)
                );

            const matchesStatus =
                statusFilter === "All" ||
                ticket.status === statusFilter;

            const matchesPriority =
                priorityFilter === "All" ||
                ticket.priority === priorityFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );
        });
    }, [
        tickets,
        searchValue,
        statusFilter,
        priorityFilter,
    ]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, statusFilter, priorityFilter]);

    const totalTickets = filteredTickets.length;
    const totalPages = Math.max(1, Math.ceil(totalTickets / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const paginatedTickets = useMemo(() => {
        const startIndex = (safePage - 1) * pageSize;
        return filteredTickets.slice(startIndex, startIndex + pageSize);
    }, [filteredTickets, safePage, pageSize]);

    const loadTickets = async () => {
        try {
            setLoading(true);

            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            const response = await fetch(
    `${API_URL}/api/client/tickets`,
    {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }
);

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to load tickets"
                );
            }

            setTickets(result.data || []);
        } catch (error) {
            console.error("Load tickets error:", error);
            alert(error.message || "Unable to load tickets");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadTickets();
    }, []);
    const openTicketCount = tickets.filter(
        (ticket) =>
            !["Resolved", "Closed"].includes(ticket.status)
    ).length;

    const resolvedCount = tickets.filter(
        (ticket) =>
            ["Resolved", "Closed"].includes(ticket.status)
    ).length;

    const inProgressCount = tickets.filter(
        (ticket) => ticket.status === "In Progress"
    ).length;

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setTicketForm((current) => ({
            ...current,
            [name]: value,
        }));
    };
const handleAttachmentChange = (event) => {
  const file = event.target.files?.[0] || null;

  setTicketForm((current) => ({
    ...current,
    attachment: file,
    attachmentName: file?.name || "",
  }));
};

    const generateTicketNumber = () => {
        const highestNumber = tickets.reduce(
            (highest, ticket) => {
                const number = Number(
                    String(ticket.ticketNo).replace(
                        "TKT-",
                        ""
                    )
                );

                return Number.isFinite(number)
                    ? Math.max(highest, number)
                    : highest;
            },
            1000
        );

        return `TKT-${highestNumber + 1}`;
    };

const handleSubmitTicket = async (event) => {
  event.preventDefault();

  try {
    setSubmitting(true);

    const token =
      localStorage.getItem("client-connect-token") ||
      sessionStorage.getItem("client-connect-token");

    if (!token) {
      throw new Error("Client session not found. Please log in again.");
    }

    const formData = new FormData();

    formData.append("title", ticketForm.title);
    formData.append("description", ticketForm.description);
    formData.append("productName", ticketForm.product);
    formData.append("category", ticketForm.category);
    formData.append("priority", ticketForm.priority);
    formData.append("module", "General");

    if (ticketForm.attachment) {
      formData.append("attachment", ticketForm.attachment);
    }

  const endpoint = editingTicketId
    ? `${API_URL}/api/client/tickets/${editingTicketId}`
    : `${API_URL}/api/client/tickets`;

    const response = await fetch(endpoint, {
      method: editingTicketId ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to submit ticket");
    }

    await loadTickets();
    setSelectedTicketId(result.data?._id || result.data?.id || null);
    closeRaiseForm();

    alert(
      editingTicketId
        ? `Ticket ${result.data.ticketCode} updated successfully`
        : `Ticket ${result.data.ticketCode} created successfully`
    );
  } catch (error) {
    console.error("Submit ticket error:", error);
    alert(error.message || "Unable to submit ticket");
  } finally {
    setSubmitting(false);
  }
};
    const handleSendReply = () => {
        if (!selectedTicket || !replyMessage.trim()) {
            return;
        }

        const currentDateTime =
            new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });

        setTickets((current) =>
            current.map((ticket) =>
                ticket.id === selectedTicket.id
                    ? {
                        ...ticket,
                        updatedAt:
                            currentDateTime,
                        messages: [
                            ...(ticket.messages ||
                                []),
                            {
                                id: Date.now(),
                                sender:
                                    "Ramesh Patil",
                                role: "Client",
                                message:
                                    replyMessage.trim(),
                                time: currentDateTime,
                            },
                        ],
                        timeline: [
                            ...(ticket.timeline ||
                                []),
                            {
                                id:
                                    Date.now() +
                                    1,
                                type: "message",
                                title:
                                    "Client replied",
                                description:
                                    replyMessage.trim(),
                                user: "Ramesh Patil",
                                time: currentDateTime,
                            },
                        ],
                    }
                    : ticket
            )
        );

        setReplyMessage("");
    };

    const handleReopenTicket = () => {
        if (!selectedTicket) return;

        setTickets((current) =>
            current.map((ticket) =>
                ticket.id === selectedTicket.id
                    ? {
                        ...ticket,
                        status: "Reopened",
                        updatedAt:
                            new Date().toLocaleString(
                                "en-IN"
                            ),
                    }
                    : ticket
            )
        );
    };

    const handleConfirmResolution = () => {
        if (!selectedTicket) return;

        setTickets((current) =>
            current.map((ticket) =>
                ticket.id === selectedTicket.id
                    ? {
                        ...ticket,
                        status: "Closed",
                        updatedAt:
                            new Date().toLocaleString(
                                "en-IN"
                            ),
                    }
                    : ticket
            )
        );
    };

    return (
        <div className="space-y-4">
            {/* Header Banner */}
            <section className="flex flex-col gap-4 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#1B59F8]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1B59F8]" />
                        Client Support
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Support Tickets
                    </h1>

                    <p className="mt-1 max-w-2xl text-xs text-slate-500 leading-relaxed">
                        Raise software issues, track resolution progress and communicate directly with your assigned engineer.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setRaiseTicketOpen(true)}
                    className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1548D1] active:scale-98"
                >
                    <Plus size={14} strokeWidth={2.5} />
                    Raise New Ticket
                </button>
            </section>

            {/* KPI Cards */}
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <SummaryCard
                    label="Total Tickets"
                    value={tickets.length}
                    description="All support requests"
                    icon={Headphones}
                    iconClass="bg-blue-50 text-[#1B59F8]"
                />

                <SummaryCard
                    label="Open Tickets"
                    value={openTicketCount}
                    description="Awaiting resolution"
                    icon={AlertTriangle}
                    iconClass="bg-amber-50 text-amber-700"
                    descriptionClass="text-amber-600 font-semibold"
                />

                <SummaryCard
                    label="In Progress"
                    value={inProgressCount}
                    description="Currently being handled"
                    icon={Clock3}
                    iconClass="bg-indigo-50 text-indigo-700"
                />

                <SummaryCard
                    label="Resolved"
                    value={resolvedCount}
                    description="Successfully completed"
                    icon={CheckCircle2}
                    iconClass="bg-emerald-50 text-emerald-700"
                    descriptionClass="text-emerald-600 font-semibold"
                />
            </section>

            {/* Support Requests List Card */}
            <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xs font-bold text-slate-900">
                            My Support Requests
                        </h2>

                        <p className="text-[10px] text-slate-500">
                            Tickets raised for {client?.companyName || "your company"}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-[220px]">
                            <Search
                                size={13}
                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                value={searchValue}
                                onChange={(event) =>
                                    setSearchValue(
                                        event.target.value
                                    )
                                }
                                placeholder="Search tickets..."
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20 focus:outline-hidden transition"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20 focus:outline-hidden transition"
                        >
                            <option value="All">All Status</option>
                            <option value="New">New</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Waiting">Waiting</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                            <option value="Reopened">Reopened</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(event) =>
                                setPriorityFilter(
                                    event.target.value
                                )
                            }
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20 focus:outline-hidden transition"
                        >
                            <option value="All">All Priority</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                        Loading tickets...
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {paginatedTickets.map((ticket) => (
                            <button
                                key={ticket._id || ticket.id}
                                type="button"
                                onClick={() => setSelectedTicketId(ticket._id || ticket.id)}
                                className="flex w-full flex-col gap-3 p-3.5 sm:px-4 sm:py-3 text-left transition hover:bg-slate-50/70 sm:flex-row sm:items-center"
                            >
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8]">
                                        <Headphones size={15} />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                            <span className="font-semibold text-[#1B59F8]">
                                                {ticket.ticketCode}
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-500">
                                                {ticket.productName}
                                            </span>
                                        </div>

                                        <h3 className="mt-0.5 text-xs font-bold text-slate-900 line-clamp-1">
                                            {ticket.title}
                                        </h3>

                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-slate-500">
                                            <span>Created: {ticket.createdAt}</span>
                                            <span>Assigned: {ticket.assignedEmployeeName}</span>
                                            <span>Category: {ticket.category}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                                    <PriorityBadge priority={ticket.priority} />
                                    <StatusBadge status={ticket.status} />
                                    <ChevronRight size={14} className="text-slate-300 ml-0.5" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {filteredTickets.length > 0 && (
                    <div className="flex flex-col gap-2.5 border-t border-slate-200/80 bg-slate-50/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <span>
                                Showing{" "}
                                <span className="font-semibold text-slate-800">
                                    {(safePage - 1) * pageSize + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold text-slate-800">
                                    {Math.min(safePage * pageSize, totalTickets)}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-800">
                                    {totalTickets}
                                </span>{" "}
                                tickets
                            </span>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500">Per page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="h-7 rounded-md border border-slate-200/90 bg-white px-1.5 text-xs text-slate-700 shadow-2xs focus:border-[#1B59F8] focus:outline-hidden"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={safePage <= 1}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Previous page"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="px-2 text-xs font-medium text-slate-700">
                                    {safePage} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={safePage >= totalPages}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Next page"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {filteredTickets.length === 0 && !loading && (
                    <div className="flex min-h-[200px] items-center justify-center bg-slate-50/40">
                        <div className="text-center">
                            <Search size={22} className="mx-auto text-slate-300" />
                            <p className="mt-2 text-xs font-semibold text-slate-700">No ticket found</p>
                            <p className="mt-0.5 text-[10px] text-slate-500">Try changing your search or filter selection.</p>
                        </div>
                    </div>
                )}
            </section>

            {raiseTicketOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close raise ticket form"
                        onClick={() =>
                            setRaiseTicketOpen(false)
                        }
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[680px] flex-col bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-3.5 sm:px-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                                    Client Support
                                </p>

                                <h2 className="mt-0.5 text-base font-bold text-slate-900">
                                    {isEditing ? "Edit Ticket" : "Raise New Ticket"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setRaiseTicketOpen(false)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmitTicket}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                                    <p className="text-xs font-semibold text-blue-950">
                                        {client?.companyName || "Your Company"}
                                    </p>

                                    <p className="mt-0.5 text-[11px] text-blue-700">
                                        Your ticket will be sent directly to the support team.
                                    </p>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            Product
                                        </label>

                                        <select
                                            name="product"
                                            value={ticketForm.product}
                                            onChange={handleFormChange}
                                            className="h-8.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100 transition"
                                        >
                                            <option value="">Select Product</option>
                                            {client?.products?.map((product) => (
                                                <option
                                                    key={product.productId || product._id}
                                                    value={product.productName}
                                                >
                                                    {product.productName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            Category
                                        </label>

                                        <select
                                            name="category"
                                            value={
                                                ticketForm.category
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            className="h-8.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100 transition"
                                        >
                                            <option value="Billing">
                                                Billing
                                            </option>
                                            <option value="Reports">
                                                Reports
                                            </option>
                                            <option value="Inventory">
                                                Inventory
                                            </option>
                                            <option value="Accounts">
                                                Accounts
                                            </option>
                                            <option value="GST">
                                                GST
                                            </option>
                                            <option value="Backup">
                                                Backup
                                            </option>
                                            <option value="Login">
                                                Login
                                            </option>
                                            <option value="Other">
                                                Other
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            Priority
                                        </label>

                                        <select
                                            name="priority"
                                            value={
                                                ticketForm.priority
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            className="h-8.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100 transition"
                                        >
                                            <option value="Low">
                                                Low
                                            </option>
                                            <option value="Medium">
                                                Medium
                                            </option>
                                            <option value="High">
                                                High
                                            </option>
                                            <option value="Critical">
                                                Critical
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            Preferred Contact
                                        </label>

                                        <select
                                            name="contactMethod"
                                            value={
                                                ticketForm.contactMethod
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            className="h-8.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100 transition"
                                        >
                                            <option value="Phone">
                                                Phone
                                            </option>
                                            <option value="WhatsApp">
                                                WhatsApp
                                            </option>
                                            <option value="Email">
                                                Email
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-3.5">
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Issue Title
                                    </label>

                                    <input
                                        name="title"
                                        value={ticketForm.title}
                                        onChange={handleFormChange}
                                        placeholder="Example: Sales invoice total is incorrect"
                                        className="h-8.5 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100 transition"
                                    />
                                </div>

                                <div className="mt-3.5">
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Issue Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={
                                            ticketForm.description
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows={6}
                                        placeholder="Explain what happened, which screen was used and what result you expected..."
                                        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100 transition"
                                    />
                                </div>

                                <div className="mt-3.5">
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Screenshot or Attachment
                                    </label>

                                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-3 transition hover:border-[#1B59F8] hover:bg-blue-50/30">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8]">
                                                <FileImage
                                                    size={16}
                                                />
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium text-slate-700">
                                                    {ticketForm.attachmentName ||
                                                        "Upload screenshot"}
                                                </p>

                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                    PNG, JPG or PDF
                                                </p>
                                            </div>
                                        </div>

                                        <Paperclip
                                            size={15}
                                            className="text-slate-400"
                                        />

                                        <input
                                            type="file"
                                            accept=".png,.jpg,.jpeg,.pdf"
                                            onChange={
                                                handleAttachmentChange
                                            }
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200/90 p-4 sm:px-6">
                                <button
                                    type="button"
                                    onClick={closeRaiseForm}
                                    className="h-8.5 px-4 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                                >
                                    <Send size={13} />
                                    {isEditing ? "Update Ticket" : "Submit Ticket"}
                                </button>
                            </div>
                        </form>
                    </aside>
                </>
            )}

            {selectedTicket && (
                <>
                    <button
                        type="button"
                        aria-label="Close ticket details"
                        onClick={() =>
                            setSelectedTicketId(null)
                        }
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[760px] flex-col bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-3.5 sm:px-6">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#1B59F8]">
                                        {selectedTicket.ticketNo}
                                    </span>

                                    <StatusBadge
                                        status={
                                            selectedTicket.status
                                        }
                                    />
                                </div>

                                <h2 className="mt-1 truncate text-base font-bold text-slate-900">
                                    {selectedTicket.title}
                                </h2>
                            </div>

                            <div className="flex items-center gap-2">
                                {canEditSelectedTicket && (
                                    <button
                                        type="button"
                                        onClick={openEditTicket}
                                        className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Edit Ticket
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedTicketId(null)
                                    }
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5">
                                    <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                                        Product
                                    </p>
                                    <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
                                        {selectedTicket.productName || selectedTicket.product}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5">
                                    <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                                        Priority
                                    </p>
                                    <div className="mt-0.5">
                                        <PriorityBadge
                                            priority={
                                                selectedTicket.priority
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5">
                                    <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                                        Assigned To
                                    </p>
                                    <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
                                        {
                                            selectedTicket.assignedTo
                                        }
                                    </p>
                                </div>

                                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5">
                                    <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                                        Updated
                                    </p>
                                    <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
                                        {
                                            selectedTicket.updatedAt
                                        }
                                    </p>
                                </div>
                            </div>

                            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Issue Description
                                </h3>

                                <p className="mt-2 text-xs leading-5 text-slate-600">
                                    {
                                        selectedTicket.description
                                    }
                                </p>

                                {selectedTicket.attachments?.length > 0 ? (
                                    <div className="mt-3 space-y-2.5">
                                        {selectedTicket.attachments.map(
                                            (attachment) => (
                                                <div
                                                    key={
                                                        attachment.url ||
                                                        attachment.fileUrl ||
                                                        attachment.originalName
                                                    }
                                                    className="rounded-lg border border-slate-200/90 bg-slate-50/40 p-3"
                                                >
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-slate-800 truncate">
                                                                {
                                                                    attachment.originalName ||
                                                                    attachment.fileName
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-[10px] text-slate-500">
                                                                {attachment.mimeType || attachment.fileType} · {attachment.size ? `${attachment.size >= 1024 * 1024 ? `${(attachment.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(attachment.size / 1024))} KB`}` : "—"}
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            <a
                                                                href={
                                                                    attachment.url ||
                                                                    `${API_URL}${attachment.fileUrl}`
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="h-7 px-2.5 inline-flex items-center rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                View
                                                            </a>
                                                            <a
                                                                href={
                                                                    attachment.url ||
                                                                    `${API_URL}${attachment.fileUrl}`
                                                                }
                                                                download={
                                                                    attachment.originalName ||
                                                                    attachment.fileName
                                                                }
                                                                className="h-7 px-2.5 inline-flex items-center rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                Download
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/(image\/png|image\/jpe?g|image\/gif|image\/svg\+xml)/.test(
                                                        attachment.mimeType || attachment.fileType || ""
                                                    ) && (
                                                        <img
                                                            src={
                                                                attachment.url ||
                                                                `${API_URL}${attachment.fileUrl}`
                                                            }
                                                            alt={
                                                                attachment.originalName ||
                                                                attachment.fileName
                                                            }
                                                            className="mt-3 max-w-full rounded-lg border border-slate-200"
                                                        />
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
                                        No attachments added to this ticket.
                                    </div>
                                )}
                            </section>

                            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                                <div className="flex items-center gap-1.5">
                                    <History
                                        size={15}
                                        className="text-[#1B59F8]"
                                    />

                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                        Ticket Timeline
                                    </h3>
                                </div>

                                <div className="mt-3.5 space-y-4">
                                    {selectedTicket.timeline.map(
                                        (
                                            activity,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    activity.id
                                                }
                                                className="relative flex gap-3"
                                            >
                                                {index <
                                                    selectedTicket
                                                        .timeline
                                                        .length -
                                                    1 && (
                                                        <span className="absolute left-[13px] top-7 h-[calc(100%+4px)] w-px bg-slate-200" />
                                                    )}

                                                <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[#1B59F8]">
                                                    <CheckCircle2
                                                        size={
                                                            13
                                                        }
                                                    />
                                                </div>

                                                <div className="min-w-0 pb-1">
                                                    <p className="text-xs font-bold text-slate-800">
                                                        {
                                                            activity.title
                                                        }
                                                    </p>

                                                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                                                        {
                                                            activity.description
                                                        }
                                                    </p>

                                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                                        {
                                                            activity.user
                                                        }{" "}
                                                        ·{" "}
                                                        {
                                                            activity.time
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                                <div className="flex items-center gap-1.5">
                                    <MessageSquare
                                        size={15}
                                        className="text-[#1B59F8]"
                                    />

                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                        Conversation
                                    </h3>
                                </div>

                                <div className="mt-3 space-y-2.5">
                                    {(selectedTicket.replies || []).map((reply) => (
                                        <div
                                            key={reply._id || reply.createdAt}
                                            className={`rounded-lg p-3 ${reply.senderRole === "client"
                                                    ? "ml-6 border border-blue-100 bg-blue-50/60"
                                                    : "mr-6 border border-slate-200/70 bg-slate-50/70"
                                                }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <UserRound
                                                    size={13}
                                                    className="text-slate-500"
                                                />

                                                <p className="text-[11px] font-bold text-slate-800">
                                                    {reply.senderName}
                                                </p>

                                                <span className="text-[10px] font-medium text-slate-400">
                                                    · {reply.senderRole}
                                                </span>
                                            </div>

                                            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                                                {reply.message}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-400">
                                                {reply.createdAt
                                                    ? new Date(reply.createdAt).toLocaleString("en-IN")
                                                    : ""}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {!["Closed"].includes(
                                    selectedTicket.status
                                ) && (
                                        <div className="mt-3.5 flex gap-2">
                                            <textarea
                                                value={replyMessage}
                                                onChange={(event) =>
                                                    setReplyMessage(
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                rows={2}
                                                placeholder="Write a reply or provide additional information..."
                                                className="min-h-[72px] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100 transition"
                                            />

                                            <button
                                                type="button"
                                                onClick={
                                                    handleSendReply
                                                }
                                                className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#1B59F8] text-white shadow-2xs transition hover:bg-blue-700 self-end"
                                            >
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    )}
                            </section>
                        </div>

                        <div className="flex flex-col gap-2.5 border-t border-slate-200/90 p-4 sm:flex-row sm:px-6">
                            {selectedTicket.status ===
                                "Resolved" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={
                                                handleConfirmResolution
                                            }
                                            className="flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700"
                                        >
                                            <CheckCircle2
                                                size={14}
                                            />
                                            Confirm & Close
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                handleReopenTicket
                                            }
                                            className="flex h-8.5 flex-1 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                        >
                                            Reopen Ticket
                                        </button>
                                    </>
                                )}

                            {selectedTicket.status !==
                                "Resolved" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedTicketId(
                                                null
                                            )
                                        }
                                        className="h-8.5 flex-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Close Details
                                    </button>
                                )}
                        </div>
                    </aside>
                </>
            )}
        </div>
    );
}