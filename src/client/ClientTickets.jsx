import API_URL from "../config/api";
import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
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
}) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>
            </div>

            <p className="mt-4 text-[10px] text-slate-500">
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
        <div>
            <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">
                        Client Support
                    </p>

                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                        Support Tickets
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Raise software issues, track support
                        progress and communicate with your
                        assigned engineer.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setRaiseTicketOpen(true)
                    }
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-cyan-600"
                >
                    <Plus size={16} />
                    Raise New Ticket
                </button>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Total Tickets"
                    value={tickets.length}
                    description="All support requests"
                    icon={Headphones}
                    iconClass="bg-cyan-100 text-cyan-700"
                />

                <SummaryCard
                    label="Open Tickets"
                    value={openTicketCount}
                    description="Tickets awaiting resolution"
                    icon={AlertTriangle}
                    iconClass="bg-amber-100 text-amber-700"
                />

                <SummaryCard
                    label="In Progress"
                    value={inProgressCount}
                    description="Currently handled by support"
                    icon={Clock3}
                    iconClass="bg-violet-100 text-violet-700"
                />

                <SummaryCard
                    label="Resolved"
                    value={resolvedCount}
                    description="Successfully completed requests"
                    icon={CheckCircle2}
                    iconClass="bg-emerald-100 text-emerald-700"
                />
            </section>

            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-950">
                            My Support Requests
                        </h2>

                        <p className="mt-1 text-[10px] text-slate-500">
                            Tickets raised by Shree Ganesh
                            Industries
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative sm:w-[280px]">
                            <Search
                                size={16}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
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
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        >
                            <option value="All">
                                All Status
                            </option>
                            <option value="New">New</option>
                            <option value="Assigned">
                                Assigned
                            </option>
                            <option value="In Progress">
                                In Progress
                            </option>
                            <option value="Waiting">
                                Waiting
                            </option>
                            <option value="Resolved">
                                Resolved
                            </option>
                            <option value="Closed">
                                Closed
                            </option>
                            <option value="Reopened">
                                Reopened
                            </option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(event) =>
                                setPriorityFilter(
                                    event.target.value
                                )
                            }
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        >
                            <option value="All">
                                All Priority
                            </option>
                            <option value="Low">Low</option>
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
                </div>
                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        Loading tickets...
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">

                        {filteredTickets.map((ticket) => (
                            <button
                                key={ticket._id || ticket.id}
                                type="button"
                                 onClick={() => setSelectedTicketId(ticket._id || ticket.id)
                                }
                                className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-slate-50/70 lg:flex-row lg:items-center"
                            >
                                <div className="flex min-w-0 flex-1 items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                                        <Headphones size={18} />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-[10px] font-semibold text-cyan-700">
                                                {ticket.ticketCode}
                                            </p>

                                            <span className="text-[9px] text-slate-300">
                                                •
                                            </span>

                                            <p className="text-[10px] text-slate-500">
                                                {ticket.productName}
                                            </p>
                                        </div>

                                        <h3 className="mt-1 text-sm font-semibold text-slate-950">
                                            {ticket.title}
                                        </h3>

                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-500">
                                            <span>
                                                Created:{" "}
                                                {ticket.createdAt}
                                            </span>

                                            <span>
                                                Assigned:{" "}
                                                {ticket.assignedEmployeeName}
                                            </span>

                                            <span>
                                                Category:{" "}
                                                {ticket.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <PriorityBadge
                                        priority={ticket.priority}
                                    />

                                    <StatusBadge
                                        status={ticket.status}
                                    />

                                    <ChevronRight
                                        size={17}
                                        className="ml-1 text-slate-300"
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                {filteredTickets.length === 0 && (
                    <div className="flex min-h-[300px] items-center justify-center bg-slate-50/40">
                        <div className="text-center">
                            <Search
                                size={28}
                                className="mx-auto text-slate-300"
                            />

                            <p className="mt-3 text-sm font-semibold text-slate-700">
                                No ticket found
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Change the search or filter
                                selection.
                            </p>
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
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-600">
                                    Client Support
                                </p>

                                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                                    {isEditing ? "Edit Ticket" : "Raise New Ticket"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setRaiseTicketOpen(false)
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmitTicket}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4">
                                    <p className="text-xs font-semibold text-cyan-900">
                                        Shree Ganesh Industries
                                    </p>

                                    <p className="mt-1 text-[10px] text-cyan-700">
                                        Your ticket will be sent
                                        directly to the Total Solution
                                        support team.
                                    </p>
                                </div>

                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Product
                                        </label>

                                        <select
                                            name="product"
                                            value={ticketForm.product}
                                            onChange={handleFormChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
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
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
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
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
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
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
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

                                <div className="mt-4">
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Issue Title
                                    </label>

                                    <input
                                        name="title"
                                        value={ticketForm.title}
                                        onChange={handleFormChange}
                                        placeholder="Example: Sales invoice total is incorrect"
                                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                        rows={7}
                                        placeholder="Explain what happened, which screen was used and what result you expected..."
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-xs leading-5 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Screenshot or Attachment
                                    </label>

                                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-cyan-400 hover:bg-cyan-50">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-700">
                                                <FileImage
                                                    size={18}
                                                />
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-slate-700">
                                                    {ticketForm.attachmentName ||
                                                        "Upload screenshot"}
                                                </p>

                                                <p className="mt-1 text-[9px] text-slate-500">
                                                    PNG, JPG or PDF
                                                </p>
                                            </div>
                                        </div>

                                        <Paperclip
                                            size={17}
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

                            <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2 sm:px-6">
                                <button
                                    type="button"
                                    onClick={closeRaiseForm}
                                    className="h-11 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f172a] text-xs font-semibold text-white transition hover:bg-cyan-600"
                                >
                                    <Send size={15} />
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
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[10px] font-semibold text-cyan-700">
                                        {
                                            selectedTicket.ticketNo
                                        }
                                    </p>

                                    <StatusBadge
                                        status={
                                            selectedTicket.status
                                        }
                                    />
                                </div>

                                <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">
                                    {selectedTicket.title}
                                </h2>
                            </div>

                            <div className="flex items-center gap-2">
                                {canEditSelectedTicket && (
                                    <button
                                        type="button"
                                        onClick={openEditTicket}
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Edit Ticket
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedTicketId(null)
                                    }
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                        Product
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-800">
                            {selectedTicket.productName || selectedTicket.product}
                        </p>
                    </div>

                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                        Priority
                                    </p>
                                    <div className="mt-1">
                                        <PriorityBadge
                                            priority={
                                                selectedTicket.priority
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                        Assigned To
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-800">
                                        {
                                            selectedTicket.assignedTo
                                        }
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                        Updated
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-800">
                                        {
                                            selectedTicket.updatedAt
                                        }
                                    </p>
                                </div>
                            </div>

                            <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Issue Description
                                </h3>

                                <p className="mt-3 text-xs leading-6 text-slate-500">
                                    {
                                        selectedTicket.description
                                    }
                                </p>

                                {selectedTicket.attachments?.length > 0 ? (
                                    <div className="mt-4 space-y-3">
                                        {selectedTicket.attachments.map(
                                            (attachment) => (
                                                <div
                                                    key={
                                                        attachment.url ||
                                                        attachment.fileUrl ||
                                                        attachment.originalName
                                                    }
                                                    className="rounded-2xl border border-slate-200 p-4"
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-slate-900 truncate">
                                                                {
                                                                    attachment.originalName ||
                                                                    attachment.fileName
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
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
                                                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
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
                                                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
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
                                                            className="mt-4 max-w-full rounded-xl border border-slate-200"
                                                        />
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                                        No attachments added to this ticket.
                                    </div>
                                )}
                            </section>

                            <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                                <div className="flex items-center gap-2">
                                    <History
                                        size={17}
                                        className="text-cyan-700"
                                    />

                                    <h3 className="text-sm font-semibold text-slate-950">
                                        Ticket Timeline
                                    </h3>
                                </div>

                                <div className="mt-5 space-y-5">
                                    {selectedTicket.timeline.map(
                                        (
                                            activity,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    activity.id
                                                }
                                                className="relative flex gap-4"
                                            >
                                                {index <
                                                    selectedTicket
                                                        .timeline
                                                        .length -
                                                    1 && (
                                                        <span className="absolute left-[15px] top-8 h-[calc(100%+4px)] w-px bg-slate-200" />
                                                    )}

                                                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700">
                                                    <CheckCircle2
                                                        size={
                                                            14
                                                        }
                                                    />
                                                </div>

                                                <div className="min-w-0 pb-1">
                                                    <p className="text-xs font-semibold text-slate-800">
                                                        {
                                                            activity.title
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                                                        {
                                                            activity.description
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-[9px] text-slate-400">
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

                            <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                                <div className="flex items-center gap-2">
                                    <MessageSquare
                                        size={17}
                                        className="text-cyan-700"
                                    />

                                    <h3 className="text-sm font-semibold text-slate-950">
                                        Conversation
                                    </h3>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {(selectedTicket.replies || []).map((reply) => (
                                        <div
                                            key={reply._id || reply.createdAt}
                                            className={`rounded-xl p-4 ${reply.senderRole === "client"
                                                    ? "ml-8 bg-cyan-50"
                                                    : "mr-8 bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <UserRound
                                                    size={14}
                                                    className="text-slate-500"
                                                />

                                                <p className="text-[10px] font-semibold text-slate-800">
                                                    {reply.senderName}
                                                </p>

                                                <span className="text-[9px] text-slate-400">
                                                    {reply.senderRole}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-xs leading-5 text-slate-600">
                                                {reply.message}
                                            </p>

                                            <p className="mt-2 text-[9px] text-slate-400">
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
                                        <div className="mt-4 flex gap-3">
                                            <textarea
                                                value={replyMessage}
                                                onChange={(event) =>
                                                    setReplyMessage(
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                rows={3}
                                                placeholder="Write a reply or provide additional information..."
                                                className="min-h-[84px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                            />

                                            <button
                                                type="button"
                                                onClick={
                                                    handleSendReply
                                                }
                                                className="flex w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f172a] text-white transition hover:bg-cyan-600"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    )}
                            </section>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row sm:px-6">
                            {selectedTicket.status ===
                                "Resolved" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={
                                                handleConfirmResolution
                                            }
                                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                        >
                                            <CheckCircle2
                                                size={16}
                                            />
                                            Confirm & Close
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                handleReopenTicket
                                            }
                                            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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
                                        className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
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