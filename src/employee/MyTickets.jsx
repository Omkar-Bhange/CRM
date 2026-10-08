import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import API_URL from "../config/api";
import {
    AlertCircle,
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    CalendarClock,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    CircleDot,
    Clock3,
    File,
    FileText,
    Filter,
    Headphones,
    Inbox,
    Link2,
    ListTodo,
    Mail,
    MessageSquare,
    Paperclip,
    Phone,
    PhoneCall,
    Plus,
    RotateCcw,
    Search,
    Send,
    ShieldAlert,
    Upload,
    UserRound,
    X,
    Star,
} from "lucide-react";
const initialTickets = [
    {
        id: 1,
        ticketNo: "TKT-1042",
        title: "GST report mismatch in monthly summary",
        description:
            "The monthly GST summary is showing a different taxable amount compared with the sales register. The client has shared sample invoices and the report for verification.",
        client: "Shree Ganesh Industries",
        clientCode: "CL-1001",
        contactPerson: "Ramesh Patil",
        contactMobile: "9876543210",
        contactEmail: "ramesh@shreeganesh.com",
        project: "NexERP",
        module: "GST Reports",
        version: "v3.4.2",
        priority: "High",
        status: "In Progress",
        source: "Client Portal",
        createdAt: "2026-07-13T10:10:00",
        dueDate: "2026-07-14",
        assignedTo: "Akash Pawar",
        reportedBy: "Ramesh Patil",
        timeSpentMinutes: 105,
        linkedTaskIds: [1],
        resolutionNote: "",
        resolvedAt: "",
    },
    {
        id: 2,
        ticketNo: "TKT-1045",
        title: "Barcode printer is not printing labels",
        description:
            "The barcode printer is detected in Windows but RetailPOS does not print labels after selecting the product batch.",
        client: "Omkar Traders",
        clientCode: "CL-1003",
        contactPerson: "Vijay Kulkarni",
        contactMobile: "9890123456",
        contactEmail: "vijay@omkartraders.com",
        project: "RetailPOS",
        module: "Barcode Printing",
        version: "v4.1.3",
        priority: "Critical",
        status: "Assigned",
        source: "Phone Call",
        createdAt: "2026-07-14T09:25:00",
        dueDate: "2026-07-14",
        assignedTo: "Akash Pawar",
        reportedBy: "Vijay Kulkarni",
        timeSpentMinutes: 0,
        linkedTaskIds: [],
        resolutionNote: "",
        resolvedAt: "",
    },
    {
        id: 3,
        ticketNo: "TKT-1038",
        title: "New user login and permission required",
        description:
            "Create a new user for the accounts department with sales return and credit-note permissions.",
        client: "GreenLeaf Agro",
        clientCode: "CL-1005",
        contactPerson: "Priya Joshi",
        contactMobile: "9012345678",
        contactEmail: "priya@greenleafagro.com",
        project: "StockPro",
        module: "User Permissions",
        version: "v2.5.0",
        priority: "Low",
        status: "Resolved",
        source: "WhatsApp",
        createdAt: "2026-07-08T09:00:00",
        dueDate: "2026-07-08",
        assignedTo: "Akash Pawar",
        reportedBy: "Priya Joshi",
        timeSpentMinutes: 35,
        linkedTaskIds: [2],
        resolutionNote:
            "Created the requested user account, assigned the required permissions and verified successful login with the client.",
        resolvedAt: "2026-07-08T10:05:00",
    },
    {
        id: 4,
        ticketNo: "TKT-1033",
        title: "Sales report export displays blank Excel",
        description:
            "The Excel file downloads successfully but does not contain sales rows for the selected date range.",
        client: "Kavya Textiles Pvt Ltd",
        clientCode: "CL-1002",
        contactPerson: "Sunita Sharma",
        contactMobile: "9823012456",
        contactEmail: "sunita@kavyatextiles.com",
        project: "BillFlow",
        module: "Sales Reports",
        version: "v2.8.1",
        priority: "Medium",
        status: "Waiting for Client",
        source: "Email",
        createdAt: "2026-07-11T14:20:00",
        dueDate: "2026-07-13",
        assignedTo: "Akash Pawar",
        reportedBy: "Sunita Sharma",
        timeSpentMinutes: 50,
        linkedTaskIds: [],
        resolutionNote: "",
        resolvedAt: "",
    },
];

const initialLinkedTasks = [
    {
        id: 1,
        ticketId: 1,
        taskNo: "TSK-2084",
        title: "Fix GST report mismatch",
        status: "In Progress",
        priority: "High",
        progress: 70,
        spentTime: "1h 45m",
    },
    {
        id: 2,
        ticketId: 3,
        taskNo: "TSK-2072",
        title: "Create new user login",
        status: "Completed",
        priority: "Low",
        progress: 100,
        spentTime: "35m",
    },
];

const initialMessages = [
    {
        id: 1,
        ticketId: 1,
        type: "client",
        user: "Ramesh Patil",
        initials: "RP",
        message:
            "The report amount is different from the sales register by ₹1,246. Please verify the attached report.",
        createdAt: "13 Jul 2026, 10:10 AM",
    },
    {
        id: 2,
        ticketId: 1,
        type: "employee",
        user: "Akash Pawar",
        initials: "AP",
        message:
            "I am checking the taxable-value and rounding calculations. I will share an update after testing sample invoices.",
        createdAt: "13 Jul 2026, 11:05 AM",
    },
    {
        id: 3,
        ticketId: 1,
        type: "client",
        user: "Ramesh Patil",
        initials: "RP",
        message:
            "I have also attached two invoices where the difference is visible.",
        createdAt: "13 Jul 2026, 11:18 AM",
    },
];

const initialInternalNotes = [
    {
        id: 1,
        ticketId: 1,
        user: "Akash Pawar",
        initials: "AP",
        message:
            "Mismatch appears only when an invoice has cash discount and fractional taxable values.",
        createdAt: "14 Jul 2026, 10:40 AM",
    },
];

const initialFiles = [
    {
        id: 1,
        ticketId: 1,
        name: "GST_Monthly_Summary.pdf",
        type: "PDF",
        size: "840 KB",
        uploadedBy: "Ramesh Patil",
        uploadedAt: "13 Jul 2026, 10:10 AM",
    },
    {
        id: 2,
        ticketId: 1,
        name: "Sample_Invoices.xlsx",
        type: "Excel",
        size: "215 KB",
        uploadedBy: "Ramesh Patil",
        uploadedAt: "13 Jul 2026, 11:18 AM",
    },
];

const initialCalls = [
    {
        id: 1,
        ticketId: 1,
        callType: "Outgoing",
        contactPerson: "Ramesh Patil",
        mobile: "9876543210",
        startedAt: "14 Jul 2026, 12:10 PM",
        duration: "25m",
        summary:
            "Explained the rounding issue and requested three sample invoices for final verification.",
    },
];

const initialTimeline = [
    {
        id: 1,
        ticketId: 1,
        type: "created",
        title: "Ticket created",
        description: "Ticket was raised through the client portal.",
        createdAt: "13 Jul 2026, 10:10 AM",
    },
    {
        id: 2,
        ticketId: 1,
        type: "assigned",
        title: "Ticket assigned",
        description: "Ticket was assigned to Akash Pawar.",
        createdAt: "13 Jul 2026, 10:20 AM",
    },
    {
        id: 3,
        ticketId: 1,
        type: "status",
        title: "Work started",
        description: "Status changed from Assigned to In Progress.",
        createdAt: "13 Jul 2026, 10:35 AM",
    },
];

const statusOptions = [
    "Assigned",
    "In Progress",
    "Waiting for Client",
    "Testing",
    "Resolved",
    "Closed",
];

const priorityOptions = ["Low", "Medium", "High", "Critical"];

function getTodayDateKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDate(value) {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);

    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
    const date = parseDate(value);

    if (!date) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function isTicketOverdue(ticket) {
    if (["Resolved", "Closed"].includes(ticket.status)) {
        return false;
    }

    const dueDate = parseDate(ticket.dueDate);
    const today = parseDate(getTodayDateKey());

    if (!dueDate || !today) return false;

    return dueDate < today;
}

function isTicketDueToday(ticket) {
    return (
        ticket.dueDate === getTodayDateKey() &&
        !["Resolved", "Closed"].includes(ticket.status)
    );
}
function getDateKeyFromOffset(days) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDaysDifference(dateValue) {
    if (!dateValue) return null;

    const due = parseDate(dateValue);
    const today = parseDate(getTodayDateKey());

    if (!due || !today) return null;

    const difference = due.getTime() - today.getTime();

    return Math.round(difference / (1000 * 60 * 60 * 24));
}

function getRelativeDueText(ticket) {
    if (["Resolved", "Closed"].includes(ticket.status)) {
        return ticket.status;
    }

    const difference = getDaysDifference(ticket.dueDate);

    if (difference === null) {
        return "No due date";
    }

    if (difference < 0) {
        const days = Math.abs(difference);

        return `${days} day${days !== 1 ? "s" : ""} overdue`;
    }

    if (difference === 0) {
        return "Due today";
    }

    if (difference === 1) {
        return "Due tomorrow";
    }

    return `Due in ${difference} days`;
}

function formatSectionDate(value) {
    const date = parseDate(value);

    if (!date) return "";

    return date
        .toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        .toUpperCase();
}

function formatMinutes(minutes) {
    const safeMinutes = Math.max(Number(minutes || 0), 0);
    const hours = Math.floor(safeMinutes / 60);
    const remainingMinutes = safeMinutes % 60;

    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;

    return `${hours}h ${remainingMinutes}m`;
}

function getPriorityClasses(priority) {
    const styles = {
        Low: "bg-slate-100 text-slate-600 ring-slate-500/10",
        Medium: "bg-amber-50 text-amber-700 ring-amber-600/10",
        High: "bg-orange-50 text-orange-700 ring-orange-600/10",
        Critical: "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return styles[priority] || styles.Low;
}

function getStatusClasses(status) {
    const styles = {
        Assigned: "bg-cyan-50 text-cyan-700 ring-cyan-600/10",
        "In Progress":
            "bg-violet-50 text-violet-700 ring-violet-600/10",
        "Waiting for Client":
            "bg-amber-50 text-amber-700 ring-amber-600/10",
        Testing: "bg-blue-50 text-blue-700 ring-blue-600/10",
        Resolved:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Closed: "bg-slate-100 text-slate-600 ring-slate-500/10",
    };

    return styles[status] || styles.Assigned;
}

function getTimelineIcon(type) {
    if (type === "resolved") {
        return {
            icon: CheckCircle2,
            className: "bg-emerald-100 text-emerald-700",
        };
    }

    if (type === "message") {
        return {
            icon: MessageSquare,
            className: "bg-blue-100 text-blue-700",
        };
    }
    if (type === "reply") {                          // ← add this whole block
        return {
            icon: MessageSquare,
            className: "bg-blue-100 text-blue-700",
        };
    }

    if (type === "file") {
        return {
            icon: Paperclip,
            className: "bg-amber-100 text-amber-700",
        };
    }
    if (type === "attachment") {                     // ← add this whole block
        return {
            icon: Paperclip,
            className: "bg-amber-100 text-amber-700",
        };
    }

    if (type === "call") {
        return {
            icon: PhoneCall,
            className: "bg-cyan-100 text-cyan-700",
        };
    }

    if (type === "task") {
        return {
            icon: ListTodo,
            className: "bg-violet-100 text-violet-700",
        };
    }

    return {
        icon: CircleDot,
        className: "bg-slate-100 text-slate-600",
    };
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>
            </div>

            <p className={`mt-4 text-xs ${descriptionClass}`}>
                {description}
            </p>
        </div>
    );
}

function TicketQueueRow({ ticket, onOpen }) {
    const overdue = isTicketOverdue(ticket);
    const dueToday = isTicketDueToday(ticket);
    const completed = ["Resolved", "Closed"].includes(ticket.status);

    return (
        <div
            className={`group grid gap-3 border-t border-slate-100 px-4 py-2.5 transition first:border-t-0 hover:bg-slate-50/80 xl:grid-cols-[minmax(300px,1.8fr)_minmax(170px,1fr)_105px_125px_120px_82px] xl:items-center ${
                overdue ? "bg-rose-50/30" : ""
            }`}
        >
            {/* TICKET */}
            <div className="flex min-w-0 items-center gap-3">
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        completed
                            ? "bg-emerald-100 text-emerald-700"
                            : ticket.priority === "Critical"
                              ? "bg-rose-100 text-rose-700"
                              : overdue
                                ? "bg-orange-100 text-orange-700"
                                : "bg-violet-100 text-violet-700"
                    }`}
                >
                    {completed ? (
                        <CheckCircle2 size={16} />
                    ) : ticket.priority === "Critical" ? (
                        <ShieldAlert size={16} />
                    ) : (
                        <MessageSquare size={16} />
                    )}
                </div>

                <div className="min-w-0">
                    <button
                        type="button"
                        onClick={() => onOpen(ticket)}
                        className="block max-w-full truncate text-left text-[12px] font-semibold leading-4 text-slate-900 transition hover:text-violet-700"
                    >
                        {ticket.title}
                    </button>

                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        {ticket.ticketNo && (
                            <span className="text-[9px] font-bold text-violet-600">
                                {ticket.ticketNo}
                            </span>
                        )}

                        {ticket.ticketNo && ticket.source && (
                            <span className="text-[8px] text-slate-300">
                                •
                            </span>
                        )}

                        {ticket.source && (
                            <span className="text-[9px] text-slate-500">
                                {ticket.source}
                            </span>
                        )}

                        {ticket.sla && (
                            <>
                                <span className="text-[8px] text-slate-300">•</span>
                                <span
                                    className={`rounded px-1 py-0.2 text-[8px] font-bold ${
                                        ticket.sla.firstRespondedAt || ["Resolved", "Verified", "Closed"].includes(ticket.status)
                                            ? ticket.sla.firstResponseStatus === "Met"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-amber-50 text-amber-700"
                                            : ticket.sla.firstResponseStatus === "Overdue"
                                                ? "bg-rose-50 text-rose-700"
                                                : "bg-blue-50 text-blue-700"
                                    }`}
                                    title={`First Response: ${ticket.sla.firstResponseStatus}`}
                                >
                                    Resp: {ticket.sla.firstRespondedAt || ["Resolved", "Verified", "Closed"].includes(ticket.status) ? (ticket.sla.firstResponseStatus === "Met" ? "Met" : (ticket.sla.firstResponseDisplay || "Breached")) : ticket.sla.firstResponseStatus}
                                </span>
                                <span
                                    className={`rounded px-1 py-0.2 text-[8px] font-bold ${
                                        ticket.sla.resolvedAt || ["Resolved", "Verified", "Closed"].includes(ticket.status)
                                            ? ticket.sla.resolutionStatus === "Met"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-amber-50 text-amber-700"
                                            : ticket.sla.resolutionStatus === "Overdue"
                                                ? "bg-rose-50 text-rose-700"
                                                : "bg-slate-100 text-slate-700"
                                    }`}
                                    title={`Resolution: ${ticket.sla.resolutionStatus}`}
                                >
                                    Res: {ticket.sla.resolvedAt || ["Resolved", "Verified", "Closed"].includes(ticket.status) ? (ticket.sla.resolutionStatus === "Met" ? "Met" : (ticket.sla.resolutionDisplay || "Breached")) : ticket.sla.resolutionStatus}
                                </span>
                            </>
                        )}

                        {ticket.clientFeedback?.rating && (
                            <>
                                <span className="text-[8px] text-slate-300">•</span>
                                <span
                                    className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1 py-0.2 text-[8px] font-bold text-amber-700"
                                    title={`Client Feedback: ${ticket.clientFeedback.rating}/5 stars${ticket.clientFeedback.comment ? ` - "${ticket.clientFeedback.comment}"` : ""}`}
                                >
                                    <Star size={9} className="fill-amber-400 text-amber-500" />
                                    <span>{ticket.clientFeedback.rating}/5</span>
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* CLIENT / PROJECT */}
            <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold leading-4 text-slate-800">
                    {ticket.client || "—"}
                </p>

                <p className="mt-0.5 truncate text-[9px] leading-3 text-slate-500">
                    {[ticket.project, ticket.module]
                        .filter(Boolean)
                        .join(" · ") || "General"}
                </p>
            </div>

            {/* PRIORITY */}
            <div>
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${getPriorityClasses(
                        ticket.priority
                    )}`}
                >
                    {ticket.priority}
                </span>
            </div>

            {/* STATUS */}
            <div>
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${getStatusClasses(
                        ticket.status
                    )}`}
                >
                    {ticket.status}
                </span>
            </div>

            {/* DUE */}
            <div className="min-w-0">
                <p
                    className={`truncate text-[10px] font-semibold leading-4 ${
                        overdue
                            ? "text-rose-700"
                            : dueToday
                              ? "text-amber-700"
                              : completed
                                ? "text-emerald-700"
                                : "text-slate-700"
                    }`}
                >
                    {getRelativeDueText(ticket)}
                </p>

                {ticket.dueDate && !completed && (
                    <p className="mt-0.5 text-[8px] leading-3 text-slate-400">
                        {formatDate(ticket.dueDate)}
                    </p>
                )}
            </div>

            {/* ACTION */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => onOpen(ticket)}
                    className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                >
                    Open
                </button>
            </div>
        </div>
    );
}

function TicketDaySection({
    section,
    expanded,
    onToggle,
    onOpenTicket,
}) {
    const Icon = section.icon;

    const toneClasses = {
        danger: {
            wrapper: "border-rose-200",
            header: "bg-rose-50/70 hover:bg-rose-50",
            icon: "bg-rose-100 text-rose-700",
            count: "bg-rose-100 text-rose-700",
        },

        today: {
            wrapper: "border-violet-200",
            header: "bg-violet-50/60 hover:bg-violet-50",
            icon: "bg-violet-100 text-violet-700",
            count: "bg-violet-100 text-violet-700",
        },

        upcoming: {
            wrapper: "border-blue-200",
            header: "bg-blue-50/60 hover:bg-blue-50",
            icon: "bg-blue-100 text-blue-700",
            count: "bg-blue-100 text-blue-700",
        },

        success: {
            wrapper: "border-emerald-200",
            header: "bg-emerald-50/60 hover:bg-emerald-50",
            icon: "bg-emerald-100 text-emerald-700",
            count: "bg-emerald-100 text-emerald-700",
        },

        completed: {
            wrapper: "border-slate-200",
            header: "bg-slate-50/80 hover:bg-slate-100",
            icon: "bg-slate-100 text-slate-600",
            count: "bg-slate-200 text-slate-600",
        },

        normal: {
            wrapper: "border-slate-200",
            header: "bg-white hover:bg-slate-50",
            icon: "bg-slate-100 text-slate-600",
            count: "bg-slate-100 text-slate-600",
        },
        pending: {
            wrapper:
                "border-violet-200 shadow-[0_8px_30px_rgba(124,58,237,0.06)]",
            header:
                "bg-gradient-to-r from-violet-50 via-white to-white hover:from-violet-100/70",
            icon:
                "bg-violet-100 text-violet-700",
            count:
                "bg-violet-100 text-violet-700",
        },

        empty: {
            wrapper: "border-slate-200",
            header:
                "bg-gradient-to-r from-slate-50 to-white hover:bg-slate-50",
            icon:
                "bg-emerald-50 text-emerald-600",
            count:
                "bg-slate-100 text-slate-500",
        },
    };

    const tone =
        toneClasses[section.tone] || toneClasses.normal;




    return (
        <section
          className={`overflow-hidden rounded-xl border bg-white ${tone.wrapper}`}
        >
            <button
                type="button"
                onClick={onToggle}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${tone.header}`}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <div
                       className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
                    >
                        <Icon size={16} />
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xs font-bold text-slate-900">
                                {section.title}
                            </h3>

                            <span
                                className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-bold ${tone.count}`}
                            >
                                {section.tickets.length}
                            </span>
                        </div>

                        <p className="mt-1 text-[10px] text-slate-500">
                            {section.subtitle}
                        </p>
                        {section.id === "pending" &&
                            section.stats &&
                            section.tickets.length > 0 && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    {section.stats.overdue > 0 && (
                                        <span className="rounded-md bg-rose-100 px-2 py-1 text-[9px] font-semibold text-rose-700">
                                            {section.stats.overdue} overdue
                                        </span>
                                    )}

                                    {section.stats.today > 0 && (
                                        <span className="rounded-md bg-amber-100 px-2 py-1 text-[9px] font-semibold text-amber-700">
                                            {section.stats.today} today
                                        </span>
                                    )}

                                    {section.stats.tomorrow > 0 && (
                                        <span className="rounded-md bg-blue-100 px-2 py-1 text-[9px] font-semibold text-blue-700">
                                            {section.stats.tomorrow} tomorrow
                                        </span>
                                    )}

                                    {section.stats.upcoming > 0 && (
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                                            {section.stats.upcoming} upcoming
                                        </span>
                                    )}
                                    {section.stats.unscheduled > 0 && (
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                                            {section.stats.unscheduled} unscheduled
                                        </span>
                                    )}
                                </div>
                            )}
                    </div>
                </div>

               <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm">
                    {expanded ? (
                        <ChevronDown size={14} />
                    ) : (
                        <ChevronRight size={14} />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-slate-100">
                   <div className="hidden grid-cols-[minmax(300px,1.8fr)_minmax(170px,1fr)_105px_125px_120px_82px] gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2 xl:grid">
                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Ticket
                        </span>

                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Client / Project
                        </span>

                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Priority
                        </span>

                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Status
                        </span>

                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Due
                        </span>

                        <span className="text-right text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Action
                        </span>
                    </div>

                    {section.tickets.length > 0 ? (
                        section.tickets.map((ticket) => (
                            <TicketQueueRow
                                key={ticket._id || ticket.id}
                                ticket={ticket}
                                onOpen={onOpenTicket}
                            />
                        ))
                    ) : (
                        <div className="flex min-h-[130px] items-center justify-center px-6 py-8">
                            <div className="text-center">
                                <div
                                    className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl ${section.id === "pending"
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-slate-100 text-slate-500"
                                        }`}
                                >
                                    <CheckCircle2 size={19} />
                                </div>

                                <p className="mt-3 text-xs font-semibold text-slate-800">
                                    {section.id === "pending"
                                        ? "No pending tickets"
                                        : section.id === "completedToday"
                                            ? "No tickets completed today"
                                            : "No previous completed tickets"}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    {section.id === "pending"
                                        ? "You're all caught up. New assigned tickets will appear here."
                                        : section.id === "completedToday"
                                            ? "Tickets resolved today will automatically appear here."
                                            : "Older completed tickets will appear here."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
export default function MyTickets() {
    const fileInputRef = useRef(null);

    const [tickets, setTickets] =
        useState([]);



    const [loadingTickets, setLoadingTickets] =
        useState(true);
    const [linkedTasks, setLinkedTasks] = useState(initialLinkedTasks);
    const [messages, setMessages] = useState(initialMessages);
    const [internalNotes, setInternalNotes] = useState(
        initialInternalNotes
    );
    const [files, setFiles] = useState(initialFiles);
    const [calls, setCalls] = useState(initialCalls);
    const [timeline, setTimeline] = useState(initialTimeline);

    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [detailsTab, setDetailsTab] = useState("overview");

    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [dueFilter, setDueFilter] = useState("All");
    const [filtersOpen, setFiltersOpen] = useState(false);

const [openTicketSections, setOpenTicketSections] = useState({
    pending: false,
    completedToday: false,
    completedPrevious: false,
});
    const [replyText, setReplyText] = useState("");
    const [noteText, setNoteText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const [resolutionText, setResolutionText] = useState("");

    const [callForm, setCallForm] = useState({
        callType: "Outgoing",
        contactPerson: "",
        mobile: "",
        duration: "",
        summary: "",
    });

    const [taskFormOpen, setTaskFormOpen] = useState(false);
    const [taskForm, setTaskForm] = useState({
        title: "",
        priority: "Medium",
        dueDate: "",
        estimatedTime: "",
        description: "",
    });

    const selectedTicket =
        tickets.find(
            (ticket) =>
                ticket._id === selectedTicketId
        ) || null;
    const loadTickets = async () => {
        try {
            setLoadingTickets(true);

            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");
            if (!token) {
                throw new Error("Please login again.");
            }

            const response = await fetch(
                `${API_URL}/api/employee/my-tickets`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to load tickets."
                );
            }

            setTickets(data.tickets || []);
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoadingTickets(false);
        }
    };
    useEffect(() => {
        loadTickets();
    }, []);

    const filteredTickets = useMemo(() => {
        const priorityRank = {
            Critical: 4,
            High: 3,
            Medium: 2,
            Low: 1,
        };

        return tickets
            .filter((ticket) => {
                const search = searchValue.trim().toLowerCase();

                const matchesSearch =
                    !search ||
                    [
                        ticket.ticketNo,
                        ticket.title,
                        ticket.client,
                        ticket.project,
                        ticket.module,
                        ticket.priority,
                        ticket.status,
                        ticket.source,
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

                let matchesDue = true;

                if (dueFilter === "Today") {
                    matchesDue = isTicketDueToday(ticket);
                } else if (dueFilter === "Overdue") {
                    matchesDue = isTicketOverdue(ticket);
                } else if (dueFilter === "Upcoming") {
                    matchesDue =
                        !isTicketDueToday(ticket) &&
                        !isTicketOverdue(ticket) &&
                        !["Resolved", "Closed"].includes(ticket.status);
                }

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesPriority &&
                    matchesDue
                );
            })
            .sort((a, b) => {
                const completedStatuses = ["Resolved", "Closed"];

                const aCompleted =
                    completedStatuses.includes(a.status);

                const bCompleted =
                    completedStatuses.includes(b.status);

                // Active tickets always before completed tickets
                if (aCompleted !== bCompleted) {
                    return aCompleted ? 1 : -1;
                }

                // Higher priority first
                const priorityDifference =
                    (priorityRank[b.priority] || 0) -
                    (priorityRank[a.priority] || 0);

                if (priorityDifference !== 0) {
                    return priorityDifference;
                }

                // Newest first within same priority
                const aDate = new Date(
                    a.createdAt || a.createdOn || 0
                ).getTime();

                const bDate = new Date(
                    b.createdAt || b.createdOn || 0
                ).getTime();

                return bDate - aDate;
            });
    }, [
        tickets,
        searchValue,
        statusFilter,
        priorityFilter,
        dueFilter,
    ]);
    const ticketSections = useMemo(() => {
        const todayKey = getTodayDateKey();
        const tomorrowKey = getDateKeyFromOffset(1);

        const activeTickets = filteredTickets
            .filter(
                (ticket) =>
                    !["Resolved", "Closed"].includes(ticket.status)
            )
            .sort((a, b) => {
                const priorityRank = {
                    Critical: 4,
                    High: 3,
                    Medium: 2,
                    Low: 1,
                };

                const aOverdue = isTicketOverdue(a);
                const bOverdue = isTicketOverdue(b);

                // Overdue first
                if (aOverdue !== bOverdue) {
                    return aOverdue ? -1 : 1;
                }

                const aToday = isTicketDueToday(a);
                const bToday = isTicketDueToday(b);

                // Then today's tickets
                if (aToday !== bToday) {
                    return aToday ? -1 : 1;
                }

                // Earlier due dates first
                if (a.dueDate && b.dueDate) {
                    const dateDifference =
                        parseDate(a.dueDate) - parseDate(b.dueDate);

                    if (dateDifference !== 0) {
                        return dateDifference;
                    }
                }

                // Higher priority
                const priorityDifference =
                    (priorityRank[b.priority] || 0) -
                    (priorityRank[a.priority] || 0);

                if (priorityDifference !== 0) {
                    return priorityDifference;
                }

                // Newest assigned ticket
                return (
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime()
                );
            });

        const pendingTickets = activeTickets;
        const completedTickets = filteredTickets.filter((ticket) =>
            ["Resolved", "Closed"].includes(ticket.status)
        );

        const overdueTickets = activeTickets.filter((ticket) =>
            isTicketOverdue(ticket)
        );

        const todayTickets = activeTickets.filter(
            (ticket) =>
                !isTicketOverdue(ticket) &&
                ticket.dueDate === todayKey
        );

        const tomorrowTickets = activeTickets.filter(
            (ticket) => ticket.dueDate === tomorrowKey
        );

        const upcomingTickets = activeTickets.filter((ticket) => {
            if (!ticket.dueDate) return false;

            return (
                ticket.dueDate > tomorrowKey &&
                !isTicketOverdue(ticket)
            );
        });

        const noDueDateTickets = activeTickets.filter(
            (ticket) => !ticket.dueDate
        );

        const completedTodayTickets = completedTickets.filter((ticket) => {
            const resolvedDate =
                ticket.resolvedAt ||
                ticket.updatedAt ||
                ticket.modifiedAt;

            if (!resolvedDate) return false;

            const date = new Date(resolvedDate);

            if (Number.isNaN(date.getTime())) return false;

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}` === todayKey;
        });

        const completedPreviousTickets = completedTickets.filter(
            (ticket) => !completedTodayTickets.includes(ticket)
        );
        return [
            {
                id: "pending",
                title: "Pending Work",
                subtitle:
                    activeTickets.length > 0
                        ? "Tickets that still require your action"
                        : "You're caught up — no pending tickets",

                tickets: activeTickets,

                tone:
                    activeTickets.length > 0
                        ? "pending"
                        : "empty",

                icon:
                    activeTickets.length > 0
                        ? ListTodo
                        : CheckCircle2,

                alwaysVisible: true,

                stats: {
                    overdue: overdueTickets.length,
                    today: todayTickets.length,
                    tomorrow: tomorrowTickets.length,
                    upcoming: upcomingTickets.length,
                    unscheduled: noDueDateTickets.length,
                },
            },

            {
                id: "completedToday",
                title: "Completed Today",
                subtitle:
                    completedTodayTickets.length > 0
                        ? "Tickets successfully resolved today"
                        : "No tickets completed today",

                tickets: completedTodayTickets,
                tone: "success",
                icon: CheckCircle2,
                alwaysVisible: true,
            },

            {
                id: "completedPrevious",
                title: "Previous Completed",
                subtitle: "Historical resolved tickets",
                tickets: completedPreviousTickets,
                tone: "completed",
                icon: CheckCircle2,
                alwaysVisible: true,
            },
        ];
    }, [filteredTickets]);

    const openCount = tickets.filter(
        (ticket) => !["Resolved", "Closed"].includes(ticket.status)
    ).length;

    useEffect(() => {
    if (openCount > 0) {
        setOpenTicketSections((current) => ({
            ...current,
            pending: true,
        }));
    }
}, [openCount]);

    const inProgressCount = tickets.filter(
        (ticket) => ticket.status === "In Progress"
    ).length;

    const criticalCount = tickets.filter(
        (ticket) =>
            ticket.priority === "Critical" &&
            !["Resolved", "Closed"].includes(ticket.status)
    ).length;

    const overdueCount = tickets.filter(isTicketOverdue).length;

    const resolvedCount = tickets.filter(
        (ticket) => ticket.status === "Resolved"
    ).length;

    const selectedMessages =
        selectedTicket?.replies || [];

    const selectedNotes =
        selectedTicket?.internalNotes || [];
    const selectedFiles = (selectedTicket?.attachments || []).map((file) => ({
        id: file._id,
        name: file.fileName,
        type: file.fileType,
        size: file.fileSize >= 1024 * 1024
            ? `${(file.fileSize / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.max(1, Math.round(file.fileSize / 1024))} KB`,
        uploadedBy: file.uploadedByName,
        uploadedAt: new Date(file.uploadedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    }));

    const selectedCalls = (selectedTicket?.callLogs || []).map((call) => ({
        id: call._id,
        callType: call.callType,
        contactPerson: call.contactPerson,
        mobile: call.mobile,
        startedAt: new Date(call.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        duration: call.duration,
        summary: call.summary,
    }))

    const selectedTasks =
        selectedTicket?.linkedTask
            ? [selectedTicket.linkedTask]
            : [];
    const selectedTimeline = (selectedTicket?.timeline || []).map((item) => ({
        id: item._id,
        type: item.type,
        title: item.title,
        description: item.description,
        createdAt: new Date(item.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const addTimelineEntry = (
        ticketId,
        type,
        title,
        description
    ) => {
        setTimeline((current) => [
            {
                id: Date.now() + Math.random(),
                ticketId,
                type,
                title,
                description,
                createdAt: new Date().toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            },
            ...current,
        ]);
    };

    const openTicket = (ticket) => {
        setSelectedTicketId(ticket._id);
        setDetailsTab("overview");
        setReplyText("");
        setNoteText("");
        setResolutionText(ticket.resolutionNote || "");
        setSelectedFile(null);
        setTaskFormOpen(false);

        setCallForm({
            callType: "Outgoing",
            contactPerson: ticket.contactPerson || "",
            mobile: ticket.contactMobile || "",
            duration: "",
            summary: "",
        });
    };

    const closeTicket = () => {
        setSelectedTicketId(null);
        setDetailsTab("overview");
        setReplyText("");
        setNoteText("");
        setResolutionText("");
        setSelectedFile(null);
        setTaskFormOpen(false);
    };

    const updateTicket = (updates) => {
        if (!selectedTicket) return;

        setTickets((current) =>
            current.map((ticket) =>
                ticket._id === selectedTicket._id
                    ? {
                        ...ticket,
                        ...updates,
                    }
                    : ticket
            )
        );
    };

    const handleStatusChange = async (event) => {
        if (!selectedTicket) return;

        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            const nextStatus = event.target.value;

            const response = await fetch(
                `${API_URL}/api/employee/my-tickets/${selectedTicket._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: nextStatus,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to update ticket."
                );
            }

            // Reload latest tickets from MongoDB
            await loadTickets();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const addReply = async (event) => {
        event.preventDefault();

        if (!selectedTicket || !replyText.trim()) return;

        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            const response = await fetch(
                `${API_URL}/api/employee/my-tickets/${selectedTicket._id}/reply`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: replyText.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message);
            }

            setReplyText("");

            await loadTickets();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const addInternalNote = async (event) => {
        event.preventDefault();

        if (!selectedTicket || !noteText.trim()) return;

        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            const response = await fetch(
                `${API_URL}/api/employee/my-tickets/${selectedTicket._id}/internal-note`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        note: noteText.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to save internal note."
                );
            }

            setNoteText("");

            // Reload latest ticket data from MongoDB
            await loadTickets();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    const handleFileSelection = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const type = file.name.includes(".")
            ? file.name.split(".").pop().toUpperCase()
            : "FILE";

        const size =
            file.size >= 1024 * 1024
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : `${Math.max(1, Math.round(file.size / 1024))} KB`;

        setSelectedFile({
            file,
            name: file.name,
            type,
            size,
        });
    };

    const uploadFile = async () => {
        if (!selectedTicket || !selectedFile) return;
        try {
            const token = localStorage.getItem("client-connect-token") || sessionStorage.getItem("client-connect-token");
            const formData = new FormData();
            formData.append("attachment", selectedFile.file);
            const response = await fetch(`${API_URL}/admin/ticket/${selectedTicket._id}/attachment`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to upload file.");
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            await loadTickets();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleCallFormChange = (event) => {
        const { name, value } = event.target;

        setCallForm((current) => ({
            ...current,
            [name]: value,
        }));
    };


    const addCallLog = async (event) => {
        event.preventDefault();

        if (!selectedTicket) return;

        if (!callForm.contactPerson.trim()) {
            alert("Please enter contact person.");
            return;
        }

        if (!callForm.duration.trim()) {
            alert("Please enter call duration.");
            return;
        }

        if (!callForm.summary.trim()) {
            alert("Please enter call summary.");
            return;
        }

        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            const response = await fetch(
                `${API_URL}/api/employee/my-tickets/${selectedTicket._id}/call-log`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        callType: callForm.callType,
                        contactPerson: callForm.contactPerson.trim(),
                        mobile: callForm.mobile.trim(),
                        duration: callForm.duration.trim(),
                        summary: callForm.summary.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to save call log.");
            }

            setCallForm((current) => ({
                ...current,
                duration: "",
                summary: "",
            }));

            await loadTickets();
        } catch (error) {
            alert(error.message);
        }
    };

    const resolveTicket = async () => {
        if (!selectedTicket) return;

        if (!resolutionText.trim()) {
            alert("Please enter a resolution note.");
            return;
        }

        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            const response = await fetch(
                `${API_URL}/api/employee/my-tickets/${selectedTicket._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: "Resolved",
                        resolutionNote: resolutionText.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to resolve ticket.");
            }

            setDetailsTab("overview");
            await loadTickets();
        } catch (error) {
            alert(error.message);
        }
    };

    const reopenTicket = async () => {
        if (!selectedTicket) return;

        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            const response = await fetch(
                `${API_URL}/api/employee/my-tickets/${selectedTicket._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: "In Progress",
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to reopen ticket.");
            }

            await loadTickets();
        } catch (error) {
            alert(error.message);
        }
    };
    const openCreateTask = () => {
        if (!selectedTicket) return;

        setTaskForm({
            title: `Resolve ${selectedTicket.title}`,
            priority: selectedTicket.priority,
            dueDate: selectedTicket.dueDate,
            estimatedTime: "",
            description: selectedTicket.description,
        });

        setTaskFormOpen(true);
    };

    const handleTaskFormChange = (event) => {
        const { name, value } = event.target;

        setTaskForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const createLinkedTask = async (event) => {
        event.preventDefault();

        if (!selectedTicket) return;

        if (!taskForm.title.trim()) {
            alert("Please enter task title.");
            return;
        }

        if (!taskForm.dueDate) {
            alert("Please select task due date.");
            return;
        }

        try {
            const token =
                localStorage.getItem("client-connect-token") ||
                sessionStorage.getItem("client-connect-token");

            const response = await fetch(
                `${API_URL}/api/employee/my-tickets/${selectedTicket._id}/create-task`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: taskForm.title,
                        description: taskForm.description,
                        priority: taskForm.priority,
                        dueDate: taskForm.dueDate,
                        estimatedMinutes:
                            Number(taskForm.estimatedTime) || 0,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to create task."
                );
            }

            alert(
                result.alreadyExists
                    ? `Task already linked: ${result.task.taskCode}`
                    : `Task created successfully: ${result.task.taskCode}`
            );

            setTaskFormOpen(false);

            await loadTickets();

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };
    const toggleTicketSection = (sectionId) => {
        setOpenTicketSections((current) => ({
            ...current,
            [sectionId]: !current[sectionId],
        }));
    };

    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Employee Workspace
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        My Tickets
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Manage client issues assigned to you, communicate
                        updates and record resolutions.
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                    <Headphones size={17} className="text-blue-700" />

                    <div>
                        <p className="text-[10px] font-semibold text-blue-700">
                            Support Queue
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-900">
                            {openCount} active ticket
                            {openCount !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    label="Open Tickets"
                    value={openCount}
                    description="Assigned and awaiting closure"
                    icon={Headphones}
                    iconClass="bg-violet-100 text-violet-700"
                    descriptionClass="text-violet-600"
                />

                <SummaryCard
                    label="In Progress"
                    value={inProgressCount}
                    description="Currently under investigation"
                    icon={CircleDot}
                    iconClass="bg-blue-100 text-blue-700"
                    descriptionClass="text-blue-600"
                />

                <SummaryCard
                    label="Critical"
                    value={criticalCount}
                    description="Require immediate attention"
                    icon={ShieldAlert}
                    iconClass="bg-rose-100 text-rose-700"
                    descriptionClass="text-rose-600"
                />

                <SummaryCard
                    label="Overdue"
                    value={overdueCount}
                    description="Past the promised due date"
                    icon={AlertCircle}
                    iconClass="bg-amber-100 text-amber-700"
                    descriptionClass="text-amber-600"
                />

                <SummaryCard
                    label="Resolved"
                    value={resolvedCount}
                    description="Successfully resolved"
                    icon={CheckCircle2}
                    iconClass="bg-emerald-100 text-emerald-700"
                    descriptionClass="text-emerald-600"
                />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
                {[
                    {
                        label: "All",
                        value: "All",
                        count: tickets.length,
                    },
                    {
                        label: "Pending",
                        value: "Pending",
                        count: openCount,
                    },
                    {
                        label: "Today",
                        value: "Today",
                        count: tickets.filter(isTicketDueToday).length,
                    },
                    {
                        label: "Overdue",
                        value: "Overdue",
                        count: overdueCount,
                    },
                    {
                        label: "Completed",
                        value: "Completed",
                        count: tickets.filter((ticket) =>
                            ["Resolved", "Closed"].includes(ticket.status)
                        ).length,
                    },
                ].map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                            if (item.value === "Today") {
                                setDueFilter("Today");
                                setStatusFilter("All");
                            } else if (item.value === "Overdue") {
                                setDueFilter("Overdue");
                                setStatusFilter("All");
                            } else if (item.value === "Completed") {
                                setDueFilter("All");
                                setStatusFilter("Resolved");
                            } else if (item.value === "Pending") {
                                setDueFilter("All");
                                setStatusFilter("All");
                            } else {
                                setDueFilter("All");
                                setStatusFilter("All");
                            }
                        }}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                    >
                        {item.label}

                        <span className="flex min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500">
                            {item.count}
                        </span>
                    </button>
                ))}
            </div>
           <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
               <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                            My Support Queue
                        </h3>

                        <p className="mt-1 text-[10px] text-slate-500">
                            {openCount} pending · {resolvedCount} resolved
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative">
                            <Search
                                size={15}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={searchValue}
                                onChange={(event) =>
                                    setSearchValue(event.target.value)
                                }
                                placeholder="Search ticket, client, project..."
                                className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-72"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setFiltersOpen((current) => !current)
                            }
                            className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${filtersOpen ||
                                statusFilter !== "All" ||
                                priorityFilter !== "All" ||
                                dueFilter !== "All"
                                ? "border-violet-200 bg-violet-50 text-violet-700"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <Filter size={15} />
                            Filters
                        </button>
                    </div>
                </div>

                {filtersOpen && (
                    <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 md:grid-cols-4">
                        <div>
                            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Status
                            </label>

                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
                            >
                                <option>All</option>

                                {statusOptions.map((status) => (
                                    <option key={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Priority
                            </label>

                            <select
                                value={priorityFilter}
                                onChange={(event) =>
                                    setPriorityFilter(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
                            >
                                <option>All</option>

                                {priorityOptions.map((priority) => (
                                    <option key={priority}>
                                        {priority}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Due
                            </label>

                            <select
                                value={dueFilter}
                                onChange={(event) =>
                                    setDueFilter(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none"
                            >
                                <option>All</option>
                                <option>Today</option>
                                <option>Overdue</option>
                                <option>Upcoming</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchValue("");
                                    setStatusFilter("All");
                                    setPriorityFilter("All");
                                    setDueFilter("All");
                                }}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
                {loadingTickets ? (
    <div className="flex min-h-[260px] items-center justify-center">
        <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />

            <p className="mt-3 text-xs font-medium text-slate-500">
                Loading your support queue...
            </p>
        </div>
    </div>
) : (
    <div className="space-y-2.5 bg-slate-50/40 p-3.5 sm:p-4">
        {ticketSections.map((section) => (
            <TicketDaySection
                key={section.id}
                section={section}
                expanded={
                    openTicketSections[section.id] ?? false
                }
                onToggle={() =>
                    toggleTicketSection(section.id)
                }
                onOpenTicket={openTicket}
            />
        ))}
    </div>
)}


            </div>

            {selectedTicket && (
                <>
                    <button
                        type="button"
                        aria-label="Close ticket details"
                        onClick={closeTicket}
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[820px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.22)]">
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div className="min-w-0 pr-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold text-violet-600">
                                        {selectedTicket.ticketNo}
                                    </span>

                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[9px] font-bold ring-1 ring-inset ${getPriorityClasses(
                                            selectedTicket.priority
                                        )}`}
                                    >
                                        {selectedTicket.priority}
                                    </span>

                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[9px] font-bold ring-1 ring-inset ${getStatusClasses(
                                            selectedTicket.status
                                        )}`}
                                    >
                                        {selectedTicket.status}
                                    </span>
                                </div>

                                <h2 className="mt-3 truncate text-xl font-semibold text-slate-950">
                                    {selectedTicket.title}
                                </h2>

                                <p className="mt-2 text-xs text-slate-500">
                                    Reported by {selectedTicket.reportedBy} ·{" "}
                                    {selectedTicket.source}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeTicket}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="border-b border-slate-200 px-6">
                            <div className="flex gap-1 overflow-x-auto">
                                {[
                                    { id: "overview", label: "Overview" },
                                    {
                                        id: "conversation",
                                        label: "Conversation",
                                    },
                                    {
                                        id: "internal",
                                        label: "Internal Notes",
                                    },
                                    { id: "tasks", label: "Linked Tasks" },
                                    { id: "files", label: "Files" },
                                    { id: "calls", label: "Call Logs" },
                                    {
                                        id: "resolution",
                                        label: "Resolution",
                                    },
                                    { id: "activity", label: "Activity" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() =>
                                            setDetailsTab(tab.id)
                                        }
                                        className={`whitespace-nowrap border-b-2 px-4 py-4 text-[11px] font-semibold transition ${detailsTab === tab.id
                                            ? "border-violet-600 text-violet-700"
                                            : "border-transparent text-slate-500 hover:text-slate-800"
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {detailsTab === "overview" && (
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Current Ticket Status
                                            </p>

                                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                                {selectedTicket.status}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <select
                                                value={selectedTicket.status}
                                                onChange={handleStatusChange}
                                                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            >
                                                {statusOptions.map((status) => (
                                                    <option key={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={openCreateTask}
                                                className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                            >
                                                <Plus size={15} />
                                                Create Task
                                            </button>
                                        </div>
                                    </div>

                                    {selectedTicket.sla && (
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                                                        <Clock3 size={16} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-900">
                                                            SLA Deadlines & Performance
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400">
                                                            Measured on continuous 24x7 calendar time
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                                                    {selectedTicket.priority} Priority
                                                </span>
                                            </div>

                                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                {/* First Response SLA */}
                                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                            First Response SLA
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${
                                                                selectedTicket.sla.firstRespondedAt || ["Resolved", "Verified", "Closed"].includes(selectedTicket.status)
                                                                    ? selectedTicket.sla.firstResponseStatus === "Met"
                                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                                                        : "bg-amber-50 text-amber-700 ring-amber-600/20"
                                                                    : selectedTicket.sla.firstResponseStatus === "Overdue"
                                                                        ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                                                                        : selectedTicket.sla.firstResponseStatus === "Due Soon"
                                                                            ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                                                            : "bg-blue-50 text-blue-700 ring-blue-600/20"
                                                            }`}
                                                        >
                                                            {selectedTicket.sla.firstRespondedAt || ["Resolved", "Verified", "Closed"].includes(selectedTicket.status)
                                                                ? selectedTicket.sla.firstResponseStatus === "Met"
                                                                    ? "Met ✓"
                                                                    : "Breached"
                                                                : selectedTicket.sla.firstResponseStatus}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1 text-xs text-slate-600">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Target Window:</span>
                                                            <span className="font-semibold text-slate-900">
                                                                {selectedTicket.sla.firstResponseTargetMinutes} min
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Target Due:</span>
                                                            <span className="font-medium text-slate-800">
                                                                {formatDate(selectedTicket.sla.firstResponseDueAt)}
                                                            </span>
                                                        </div>
                                                        {selectedTicket.sla.firstRespondedAt || ["Resolved", "Verified", "Closed"].includes(selectedTicket.status) ? (
                                                            <div className="flex justify-between border-t border-slate-200/60 pt-1 font-medium">
                                                                <span className="text-slate-500">First Responded:</span>
                                                                <span className="font-bold text-emerald-700">
                                                                    {selectedTicket.sla.firstResponseDisplay || selectedTicket.sla.resolutionDisplay || "At resolution"}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-between border-t border-slate-200/60 pt-1 font-medium">
                                                                <span className="text-slate-500">Remaining:</span>
                                                                <span
                                                                    className={`font-bold ${
                                                                        selectedTicket.sla.firstResponseStatus === "Overdue"
                                                                            ? "text-rose-600"
                                                                            : "text-blue-600"
                                                                    }`}
                                                                >
                                                                    {selectedTicket.sla.firstResponseStatus === "Overdue"
                                                                        ? `Overdue by ${Math.abs(selectedTicket.sla.firstResponseRemainingMinutes)}m`
                                                                        : `${selectedTicket.sla.firstResponseRemainingMinutes}m left`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Resolution SLA */}
                                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                            Resolution SLA
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${
                                                                selectedTicket.sla.resolvedAt || ["Resolved", "Verified", "Closed"].includes(selectedTicket.status)
                                                                    ? selectedTicket.sla.resolutionStatus === "Met"
                                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                                                        : "bg-amber-50 text-amber-700 ring-amber-600/20"
                                                                    : selectedTicket.sla.resolutionStatus === "Overdue"
                                                                        ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                                                                        : selectedTicket.sla.resolutionStatus === "Due Soon"
                                                                            ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                                                            : "bg-blue-50 text-blue-700 ring-blue-600/20"
                                                            }`}
                                                        >
                                                            {selectedTicket.sla.resolvedAt || ["Resolved", "Verified", "Closed"].includes(selectedTicket.status)
                                                                ? selectedTicket.sla.resolutionStatus === "Met"
                                                                    ? "Met ✓"
                                                                    : "Breached"
                                                                : selectedTicket.sla.resolutionStatus}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1 text-xs text-slate-600">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Target Window:</span>
                                                            <span className="font-semibold text-slate-900">
                                                                {selectedTicket.sla.resolutionTargetMinutes} min
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Target Due:</span>
                                                            <span className="font-medium text-slate-800">
                                                                {formatDate(selectedTicket.sla.resolutionDueAt)}
                                                            </span>
                                                        </div>
                                                        {selectedTicket.sla.resolvedAt || ["Resolved", "Verified", "Closed"].includes(selectedTicket.status) ? (
                                                            <div className="flex justify-between border-t border-slate-200/60 pt-1 font-medium">
                                                                <span className="text-slate-500">Resolved In:</span>
                                                                <span className="font-bold text-emerald-700">
                                                                    {selectedTicket.sla.resolutionDisplay || "N/A"}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-between border-t border-slate-200/60 pt-1 font-medium">
                                                                <span className="text-slate-500">Remaining:</span>
                                                                <span
                                                                    className={`font-bold ${
                                                                        selectedTicket.sla.resolutionStatus === "Overdue"
                                                                            ? "text-rose-600"
                                                                            : "text-blue-600"
                                                                    }`}
                                                                >
                                                                    {selectedTicket.sla.resolutionStatus === "Overdue"
                                                                        ? `Overdue by ${Math.abs(selectedTicket.sla.resolutionRemainingMinutes)}m`
                                                                        : `${selectedTicket.sla.resolutionRemainingMinutes}m left`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedTicket.clientFeedback?.rating && (
                                        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-2xs">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                                    <Star size={18} className="fill-amber-400 text-amber-500" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="text-xs font-bold text-amber-950">
                                                            Client Feedback
                                                        </h4>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                                            ★ {selectedTicket.clientFeedback.rating} / 5
                                                        </span>
                                                    </div>
                                                    {selectedTicket.clientFeedback.comment && (
                                                        <p className="mt-2 text-xs italic leading-relaxed text-amber-900 bg-white/80 p-3 rounded-xl border border-amber-200/60">
                                                            "{selectedTicket.clientFeedback.comment}"
                                                        </p>
                                                    )}
                                                    <p className="mt-2.5 text-[10px] text-amber-700 font-medium">
                                                        Submitted {selectedTicket.clientFeedback.submittedAt ? new Date(selectedTicket.clientFeedback.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "recently"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Issue Description
                                        </h3>

                                        <p className="mt-3 text-sm leading-6 text-slate-700">
                                            {selectedTicket.description}
                                        </p>

                                        {selectedTicket.attachments?.length > 0 && (
                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                                                <img
                                                    src={`${API_URL}${selectedTicket.attachments[0].fileUrl}`}
                                                    alt={selectedTicket.attachments[0].fileName}
                                                    className="rounded-xl border border-slate-200 max-w-full"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <BriefcaseBusiness size={15} />
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                    Client
                                                </span>
                                            </div>

                                            <p className="mt-3 text-xs font-semibold text-slate-900">
                                                {selectedTicket.client}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {selectedTicket.clientCode}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <FileText size={15} />
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                    Software
                                                </span>
                                            </div>

                                            <p className="mt-3 text-xs font-semibold text-slate-900">
                                                {selectedTicket.project}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {selectedTicket.module} ·{" "}
                                                {selectedTicket.version}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <UserRound size={15} />
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                    Contact
                                                </span>
                                            </div>

                                            <p className="mt-3 text-xs font-semibold text-slate-900">
                                                {
                                                    selectedTicket.contactPerson
                                                }
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {
                                                    selectedTicket.contactMobile
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <CalendarDays size={15} />
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                    Due Date
                                                </span>
                                            </div>

                                            <p
                                                className={`mt-3 text-xs font-semibold ${isTicketOverdue(
                                                    selectedTicket
                                                )
                                                    ? "text-rose-700"
                                                    : "text-slate-900"
                                                    }`}
                                            >
                                                {formatDate(
                                                    selectedTicket.dueDate
                                                )}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                Time spent{" "}
                                                {formatMinutes(
                                                    selectedTicket.timeSpentMinutes
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <a
                                            href={`tel:${selectedTicket.contactMobile}`}
                                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                        >
                                            <Phone size={15} />
                                            Call Client
                                        </a>

                                        <a
                                            href={`mailto:${selectedTicket.contactEmail}`}
                                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                        >
                                            <Mail size={15} />
                                            Send Email
                                        </a>
                                    </div>
                                </div>
                            )}

                            {detailsTab === "conversation" && (
                                <div>
                                    <div className="space-y-4">
                                        {selectedMessages.map((message) => {
                                            const employee =
                                                message.authorRole === "employee";

                                            return (
                                                <div
                                                    key={message._id}
                                                    className={`flex gap-3 ${employee
                                                        ? "flex-row-reverse"
                                                        : ""
                                                        }`}
                                                >
                                                    <div
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${employee
                                                            ? "bg-violet-600 text-white"
                                                            : "bg-slate-900 text-white"
                                                            }`}
                                                    >
                                                        {(message.authorName || "?")
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div
                                                        className={`max-w-[80%] rounded-2xl p-4 ${employee
                                                            ? "rounded-tr-md bg-violet-50"
                                                            : "rounded-tl-md bg-slate-50"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-5">
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {message.authorName}
                                                            </p>

                                                            <span className="text-[9px] text-slate-400">
                                                                {new Date(
                                                                    message.createdAt
                                                                ).toLocaleString()}
                                                            </span>
                                                        </div>

                                                        <p className="mt-2 text-xs leading-5 text-slate-600">
                                                            {message.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <form
                                        onSubmit={addReply}
                                        className="mt-6 rounded-2xl border border-slate-200 p-4"
                                    >
                                        <div className="mb-3 flex items-center gap-2">
                                            <MessageSquare
                                                size={15}
                                                className="text-violet-600"
                                            />

                                            <p className="text-xs font-semibold text-slate-800">
                                                Reply to client
                                            </p>
                                        </div>

                                        <textarea
                                            value={replyText}
                                            onChange={(event) =>
                                                setReplyText(
                                                    event.target.value
                                                )
                                            }
                                            rows={5}
                                            placeholder="Write an update that will be visible to the client..."
                                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs leading-5 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />

                                        <div className="mt-3 flex justify-end">
                                            <button
                                                type="submit"
                                                className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                            >
                                                <Send size={15} />
                                                Send Reply
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {detailsTab === "internal" && (
                                <div>
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                        <div className="flex items-start gap-3">
                                            <ShieldAlert
                                                size={17}
                                                className="mt-0.5 shrink-0 text-amber-700"
                                            />

                                            <p className="text-xs leading-5 text-amber-800">
                                                Internal notes are visible only
                                                to employees and administrators.
                                                Clients cannot view them.
                                            </p>
                                        </div>
                                    </div>

                                    <form
                                        onSubmit={addInternalNote}
                                        className="mt-5 rounded-2xl border border-slate-200 p-4"
                                    >
                                        <textarea
                                            value={noteText}
                                            onChange={(event) =>
                                                setNoteText(
                                                    event.target.value
                                                )
                                            }
                                            rows={4}
                                            placeholder="Add technical findings, investigation details or internal instructions..."
                                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs leading-5 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />

                                        <div className="mt-3 flex justify-end">
                                            <button
                                                type="submit"
                                                className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white"
                                            >
                                                <Plus size={15} />
                                                Add Internal Note
                                            </button>
                                        </div>
                                    </form>

                                    <div className="mt-5 space-y-3">
                                        {selectedNotes.map((note) => (
                                            <div
                                                key={note._id}
                                                className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-4"
                                            >
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[10px] font-bold text-amber-700">
                                                    {(note.authorName || "?")
                                                        .substring(0, 2)
                                                        .toUpperCase()}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {note.authorName}
                                                        </p>

                                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-700">
                                                            {note.authorRole}
                                                        </span>

                                                        <span className="text-[9px] text-slate-400">
                                                            {new Date(
                                                                note.createdAt
                                                            ).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <p className="mt-2 text-xs leading-5 text-slate-600 whitespace-pre-wrap">
                                                        {note.note}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {selectedNotes.length === 0 && (
                                            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                                                No internal notes added yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {detailsTab === "tasks" && (
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-950">
                                                Linked Tasks
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Work items created from this
                                                support ticket.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={openCreateTask}
                                            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                        >
                                            <Plus size={15} />
                                            Create Task
                                        </button>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        {selectedTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="rounded-2xl border border-slate-200 p-4"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold text-violet-600">
                                                            {task.taskCode}
                                                        </p>

                                                        <p className="mt-2 text-sm font-semibold text-slate-900">
                                                            {task.title}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[9px] font-bold ring-1 ring-inset ${getPriorityClasses(
                                                                task.priority
                                                            )}`}
                                                        >
                                                            {task.priority}
                                                        </span>

                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[9px] font-bold ring-1 ring-inset ${getStatusClasses(
                                                                task.status
                                                            )}`}
                                                        >
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center gap-3">
                                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-violet-500"
                                                            style={{
                                                                width: `${task.progress}%`,
                                                            }}
                                                        />
                                                    </div>

                                                    <span className="text-[10px] font-semibold text-slate-600">
                                                        {task.progress}%
                                                    </span>

                                                    <span className="text-[10px] text-slate-400">
                                                        {task.spentMinutes} mins
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {selectedTasks.length === 0 && (
                                            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 text-center">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                    <ListTodo size={20} />
                                                </div>

                                                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                                                    No tasks linked
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Create a task when this
                                                    issue requires tracked work.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {detailsTab === "files" && (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileSelection}
                                    />

                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                                                <Upload size={20} />
                                            </div>

                                            <p className="mt-3 text-xs font-semibold text-slate-800">
                                                Upload ticket attachment
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                Add screenshots, logs, reports
                                                or documents.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="mt-4 h-9 rounded-lg border border-slate-200 bg-white px-4 text-[10px] font-semibold text-slate-600"
                                            >
                                                Choose File
                                            </button>
                                        </div>
                                    </div>

                                    {selectedFile && (
                                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-violet-700">
                                                <File size={17} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-slate-900">
                                                    {selectedFile.name}
                                                </p>

                                                <p className="mt-1 text-[10px] text-slate-500">
                                                    {selectedFile.size}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={uploadFile}
                                                className="h-9 rounded-lg bg-violet-600 px-4 text-[10px] font-semibold text-white"
                                            >
                                                Upload
                                            </button>
                                        </div>
                                    )}

                                    <div className="mt-5 space-y-3">
                                        {selectedFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                    <Paperclip size={17} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-slate-900">
                                                        {file.name}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {file.type} ·{" "}
                                                        {file.size} · Uploaded
                                                        by {file.uploadedBy}
                                                    </p>

                                                    <p className="mt-1 text-[9px] text-slate-400">
                                                        {file.uploadedAt}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {detailsTab === "calls" && (
                                <div>
                                    <form
                                        onSubmit={addCallLog}
                                        className="rounded-2xl border border-slate-200 p-5"
                                    >
                                        <div className="flex items-center gap-2">
                                            <PhoneCall
                                                size={17}
                                                className="text-violet-600"
                                            />

                                            <h3 className="text-sm font-semibold text-slate-950">
                                                Add Support Call
                                            </h3>
                                        </div>

                                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Call Type
                                                </label>

                                                <select
                                                    name="callType"
                                                    value={callForm.callType}
                                                    onChange={
                                                        handleCallFormChange
                                                    }
                                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none"
                                                >
                                                    <option>Outgoing</option>
                                                    <option>Incoming</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Duration
                                                </label>

                                                <input
                                                    name="duration"
                                                    value={callForm.duration}
                                                    onChange={
                                                        handleCallFormChange
                                                    }
                                                    placeholder="Example: 20m"
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Contact Person
                                                </label>

                                                <input
                                                    name="contactPerson"
                                                    value={
                                                        callForm.contactPerson
                                                    }
                                                    onChange={
                                                        handleCallFormChange
                                                    }
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Mobile
                                                </label>

                                                <input
                                                    name="mobile"
                                                    value={callForm.mobile}
                                                    onChange={
                                                        handleCallFormChange
                                                    }
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Call Summary
                                            </label>

                                            <textarea
                                                name="summary"
                                                value={callForm.summary}
                                                onChange={
                                                    handleCallFormChange
                                                }
                                                rows={4}
                                                placeholder="What was discussed and what is the next action?"
                                                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none"
                                            />
                                        </div>

                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                            >
                                                <PhoneCall size={15} />
                                                Save Call Log
                                            </button>
                                        </div>
                                    </form>

                                    <div className="mt-5 space-y-3">
                                        {selectedCalls.map((call) => (
                                            <div
                                                key={call.id}
                                                className="rounded-2xl border border-slate-200 p-4"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {call.callType} call
                                                            with{" "}
                                                            {
                                                                call.contactPerson
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            {call.mobile} ·{" "}
                                                            {call.duration}
                                                        </p>
                                                    </div>

                                                    <span className="text-[9px] text-slate-400">
                                                        {call.startedAt}
                                                    </span>
                                                </div>

                                                <p className="mt-3 text-xs leading-5 text-slate-600">
                                                    {call.summary}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {detailsTab === "resolution" && (
                                <div>
                                    {selectedTicket.status === "Resolved" && (
                                        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle2
                                                    size={19}
                                                    className="mt-0.5 shrink-0 text-emerald-700"
                                                />

                                                <div>
                                                    <p className="text-sm font-semibold text-emerald-800">
                                                        Ticket Resolved
                                                    </p>

                                                    <p className="mt-2 text-xs leading-5 text-emerald-700">
                                                        {
                                                            selectedTicket.resolutionNote
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="rounded-2xl border border-slate-200 p-5">
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            Resolution Note
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Describe the root cause, solution
                                            and verification completed.
                                        </p>

                                        <textarea
                                            value={resolutionText}
                                            onChange={(event) =>
                                                setResolutionText(
                                                    event.target.value
                                                )
                                            }
                                            rows={7}
                                            placeholder="Example: The issue was caused by taxable-value rounding in the monthly GST report query..."
                                            className="mt-5 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs leading-5 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />

                                        <div className="mt-4 flex justify-end gap-3">
                                            {selectedTicket.status ===
                                                "Resolved" && (
                                                    <button
                                                        type="button"
                                                        onClick={reopenTicket}
                                                        className="flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-xs font-semibold text-amber-700"
                                                    >
                                                        <RotateCcw size={15} />
                                                        Reopen Ticket
                                                    </button>
                                                )}

                                            {selectedTicket.status !==
                                                "Resolved" && (
                                                    <button
                                                        type="button"
                                                        onClick={resolveTicket}
                                                        className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                                    >
                                                        <CheckCircle2 size={15} />
                                                        Mark Resolved
                                                    </button>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {detailsTab === "activity" && (
                                <div className="relative space-y-5 before:absolute before:bottom-4 before:left-5 before:top-4 before:w-px before:bg-slate-200">
                                    {selectedTimeline.map((item) => {
                                        const {
                                            icon: Icon,
                                            className,
                                        } = getTimelineIcon(item.type);

                                        return (
                                            <div
                                                key={item.id}
                                                className="relative flex gap-4"
                                            >
                                                <div
                                                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-4 ring-white ${className}`}
                                                >
                                                    <Icon size={16} />
                                                </div>

                                                <div className="pt-1">
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        {item.title}
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                                        {item.description}
                                                    </p>

                                                    <p className="mt-2 text-[9px] uppercase tracking-[0.08em] text-slate-400">
                                                        {item.createdAt}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </aside>
                </>
            )}

            {taskFormOpen && selectedTicket && (
                <>
                    <button
                        type="button"
                        aria-label="Close create task form"
                        onClick={() => setTaskFormOpen(false)}
                        className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                                <div>
                                    <p className="text-xs font-semibold text-violet-600">
                                        {selectedTicket.ticketNo}
                                    </p>

                                    <h2 className="mt-2 text-lg font-semibold text-slate-950">
                                        Create Linked Task
                                    </h2>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Assign a tracked work item from this
                                        support ticket.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setTaskFormOpen(false)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={createLinkedTask}>
                                <div className="space-y-4 p-6">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Task Title
                                        </label>

                                        <input
                                            name="title"
                                            value={taskForm.title}
                                            onChange={handleTaskFormChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Priority
                                            </label>

                                            <select
                                                name="priority"
                                                value={taskForm.priority}
                                                onChange={
                                                    handleTaskFormChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none"
                                            >
                                                {priorityOptions.map(
                                                    (priority) => (
                                                        <option key={priority}>
                                                            {priority}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                Due Date
                                            </label>

                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={taskForm.dueDate}
                                                onChange={
                                                    handleTaskFormChange
                                                }
                                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Estimated Time
                                        </label>

                                        <input
                                            name="estimatedTime"
                                            value={taskForm.estimatedTime}
                                            onChange={handleTaskFormChange}
                                            placeholder="Example: 2h 30m"
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Description
                                        </label>

                                        <textarea
                                            name="description"
                                            value={taskForm.description}
                                            onChange={handleTaskFormChange}
                                            rows={5}
                                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs leading-5 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTaskFormOpen(false)
                                        }
                                        className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                                    >
                                        <Link2 size={15} />
                                        Create & Link Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}