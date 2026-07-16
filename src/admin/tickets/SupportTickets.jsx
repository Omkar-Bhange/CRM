import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Filter,
  Headphones,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  ArrowLeft,
  TicketCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

const initialTickets = [
  {
    id: "TKT-1042",
    title: "GST report mismatch in monthly summary",
    description:
      "The monthly GST summary is showing a different taxable amount compared with the sales register. The client has attached the report for verification.",
    client: "Shree Ganesh Industries",
    clientCode: "CL-1001",
    product: "NexERP",
    module: "GST Reports",
    assignedTo: "Akash Pawar",
    assignedInitials: "AP",
    priority: "High",
    status: "In Progress",
    source: "Client Portal",
    createdAt: "13 Jul 2026",
    updatedAt: "10 minutes ago",
    dueDate: "13 Jul 2026",
    timeSpent: "1h 45m",
    replies: 4,
    attachments: 2,
    timeline: [
  {
    id: 1,
    type: "created",
    title: "Ticket created",
    description: "Ticket was raised from the client portal.",
    user: "Shree Ganesh Industries",
    time: "13 Jul 2026, 10:10 AM",
  },
  {
    id: 2,
    type: "assigned",
    title: "Assigned to Akash Pawar",
    description: "The ticket was assigned for investigation.",
    user: "Mangesh Kondhare",
    time: "13 Jul 2026, 10:20 AM",
  },
  {
    id: 3,
    type: "status",
    title: "Status changed to In Progress",
    description: "Work was started on this ticket.",
    user: "Akash Pawar",
    time: "13 Jul 2026, 10:35 AM",
  },
],
  },
  {
    id: "TKT-1041",
    title: "Invoice print alignment issue",
    description:
      "Invoice totals and footer are moving to the next page while printing on A4 paper.",
    client: "Kavya Textiles Pvt Ltd",
    clientCode: "CL-1002",
    product: "BillFlow",
    module: "Invoice Printing",
    assignedTo: "Sneha Kale",
    assignedInitials: "SK",
    priority: "Medium",
    status: "Waiting for Client",
    source: "Phone Call",
    createdAt: "13 Jul 2026",
    updatedAt: "35 minutes ago",
    dueDate: "14 Jul 2026",
    timeSpent: "45m",
    replies: 2,
    attachments: 1,
  },
  {
    id: "TKT-1039",
    title: "Stock quantity not updating after purchase",
    description:
      "The purchase voucher saves successfully, but the updated batch quantity is not visible in the stock report.",
    client: "GreenLeaf Agro",
    clientCode: "CL-1005",
    product: "StockPro",
    module: "Purchase & Stock",
    assignedTo: "Rohit More",
    assignedInitials: "RM",
    priority: "Critical",
    status: "New",
    source: "WhatsApp",
    createdAt: "12 Jul 2026",
    updatedAt: "1 hour ago",
    dueDate: "13 Jul 2026",
    timeSpent: "0m",
    replies: 1,
    attachments: 3,
  },
  {
    id: "TKT-1038",
    title: "User permission access required",
    description:
      "The accounts manager requires permission for sales return and credit note entry.",
    client: "Precision Auto Parts",
    clientCode: "CL-1004",
    product: "NexERP",
    module: "User Permissions",
    assignedTo: "Pooja Shinde",
    assignedInitials: "PS",
    priority: "Low",
    status: "Resolved",
    source: "Admin",
    createdAt: "12 Jul 2026",
    updatedAt: "Yesterday",
    dueDate: "13 Jul 2026",
    timeSpent: "30m",
    replies: 3,
    attachments: 0,
  },
  {
    id: "TKT-1036",
    title: "Sales invoice total not matching",
    description:
      "The final invoice amount differs by one rupee after applying a cash discount.",
    client: "Shree Ganesh Industries",
    clientCode: "CL-1001",
    product: "NexERP",
    module: "Sales Billing",
    assignedTo: "Akash Pawar",
    assignedInitials: "AP",
    priority: "Medium",
    status: "Resolved",
    source: "Phone Call",
    createdAt: "09 Jul 2026",
    updatedAt: "10 Jul 2026",
    dueDate: "10 Jul 2026",
    timeSpent: "2h 10m",
    replies: 6,
    attachments: 1,
  },
  {
    id: "TKT-1034",
    title: "Backup process showing warning",
    description:
      "A warning appears when the scheduled backup process starts at the client location.",
    client: "Omkar Traders",
    clientCode: "CL-1003",
    product: "RetailPOS",
    module: "Backup",
    assignedTo: "Rohit More",
    assignedInitials: "RM",
    priority: "Low",
    status: "Closed",
    source: "Client Portal",
    createdAt: "05 Jul 2026",
    updatedAt: "06 Jul 2026",
    dueDate: "06 Jul 2026",
    timeSpent: "1h",
    replies: 2,
    attachments: 1,
  },
];

const employees = [
  {
    id: 1,
    name: "Akash Pawar",
    initials: "AP",
    role: "ERP Support",
    availability: "Busy",
    activeTasks: 3,
    currentTask: "GST report mismatch fix",
  },
  {
    id: 2,
    name: "Sneha Kale",
    initials: "SK",
    role: "Application Support",
    availability: "Busy",
    activeTasks: 2,
    currentTask: "StockPro V2 testing",
  },
  {
    id: 3,
    name: "Rohit More",
    initials: "RM",
    role: "Client Support",
    availability: "Available",
    activeTasks: 0,
    currentTask: "Available for assignment",
  },
  {
    id: 4,
    name: "Pooja Shinde",
    initials: "PS",
    role: "Support & Documentation",
    availability: "Available",
    activeTasks: 1,
    currentTask: "Documentation review",
  },
  {
    id: 5,
    name: "Nilesh Jadhav",
    initials: "NJ",
    role: "Developer",
    availability: "On Leave",
    activeTasks: 2,
    currentTask: "On leave",
  },
];

const clients = [
  "Shree Ganesh Industries",
  "Kavya Textiles Pvt Ltd",
  "Omkar Traders",
  "Precision Auto Parts",
  "GreenLeaf Agro",
];

const products = ["NexERP", "BillFlow", "RetailPOS", "StockPro", "PayrollIX"];

const statusOptions = [
  "New",
  "Assigned",
  "In Progress",
  "Waiting for Client",
  "Testing",
  "Resolved",
  "Closed",
];

const priorityOptions = ["Low", "Medium", "High", "Critical"];

const sourceOptions = [
  "Client Portal",
  "Phone Call",
  "WhatsApp",
  "Email",
  "Admin",
];

const emptyTicketForm = {
  client: "",
  product: "",
  module: "",
  title: "",
  description: "",
  priority: "Medium",
  assignedTo: "",
  source: "Admin",
  dueDate: "",
};

function StatusBadge({ status }) {
  const styles = {
    New: "bg-blue-50 text-blue-700 ring-blue-600/10",
    Assigned: "bg-cyan-50 text-cyan-700 ring-cyan-600/10",
    "In Progress": "bg-violet-50 text-violet-700 ring-violet-600/10",
    "Waiting for Client": "bg-amber-50 text-amber-700 ring-amber-600/10",
    Testing: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
    Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    Closed: "bg-slate-100 text-slate-600 ring-slate-500/10",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${styles[status] || styles.Closed
        }`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    Low: "bg-slate-100 text-slate-600 ring-slate-500/10",
    Medium: "bg-amber-50 text-amber-700 ring-amber-600/10",
    High: "bg-orange-50 text-orange-700 ring-orange-600/10",
    Critical: "bg-rose-50 text-rose-700 ring-rose-600/10",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${styles[priority] || styles.Low
        }`}
    >
      {priority}
    </span>
  );
}

function TicketIcon({ priority, status }) {
  if (status === "Resolved" || status === "Closed") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={18} />
      </div>
    );
  }

  if (priority === "Critical") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
        <AlertCircle size={18} />
      </div>
    );
  }

  if (status === "In Progress") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
        <CircleDot size={18} />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
      <MessageSquare size={18} />
    </div>
  );
}


function EmployeeAvailabilityPicker({
  selectedEmployee,
  onSelect,
  compact = false,
}) {
  const [open, setOpen] = useState(false);

  const selected = employees.find(
    (employee) => employee.name === selectedEmployee
  );

  const getAvailabilityStyle = (availability) => {
    if (availability === "Available") {
      return {
        dot: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        text: "text-emerald-600",
      };
    }

    if (availability === "Busy") {
      return {
        dot: "bg-amber-400",
        badge: "bg-amber-50 text-amber-700 ring-amber-600/10",
        text: "text-amber-600",
      };
    }

    if (availability === "Offline") {
      return {
        dot: "bg-slate-300",
        badge: "bg-slate-100 text-slate-600 ring-slate-500/10",
        text: "text-slate-500",
      };
    }

    return {
      dot: "bg-rose-400",
      badge: "bg-rose-50 text-rose-700 ring-rose-600/10",
      text: "text-rose-600",
    };
  };



  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left outline-none transition hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
      >
        {selected ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
                {selected.initials}
              </div>

              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${getAvailabilityStyle(selected.availability).dot
                  }`}
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {selected.name}
              </p>

              {!compact && (
                <p
                  className={`mt-0.5 text-[10px] font-medium ${getAvailabilityStyle(selected.availability).text
                    }`}
                >
                  {selected.availability} · {selected.activeTasks} active tasks
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <UserRound size={16} />
            </div>

            <span className="text-xs text-slate-500">
              Select employee
            </span>
          </div>
        )}

        <ChevronDown
          size={15}
          className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close employee selector"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[90] cursor-default"
          />

          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-900">
                Assign employee
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                Available employees are shown first.
              </p>
            </div>

            <div className="max-h-[340px] overflow-y-auto p-2">
              {[...employees]
                .sort((first, second) => {
                  const order = {
                    Available: 1,
                    Busy: 2,
                    Offline: 3,
                    "On Leave": 4,
                  };

                  return (
                    order[first.availability] -
                    order[second.availability]
                  );
                })
                .map((employee) => {
                  const availabilityStyle =
                    getAvailabilityStyle(employee.availability);

                  const isSelected =
                    selectedEmployee === employee.name;

                  const isUnavailable =
                    employee.availability === "On Leave" ||
                    employee.availability === "Offline";

                  return (
                    <button
                      key={employee.id}
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => {
                        onSelect(employee.name);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${isSelected
                        ? "bg-violet-50 ring-1 ring-inset ring-violet-200"
                        : isUnavailable
                          ? "cursor-not-allowed opacity-55"
                          : "hover:bg-slate-50"
                        }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${isSelected
                            ? "bg-violet-600 text-white"
                            : "bg-slate-900 text-white"
                            }`}
                        >
                          {employee.initials}
                        </div>

                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${availabilityStyle.dot}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-xs font-semibold text-slate-900">
                            {employee.name}
                          </p>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${availabilityStyle.badge}`}
                          >
                            {employee.availability}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-[10px] text-slate-500">
                          {employee.role}
                        </p>

                        <div className="mt-1.5 flex items-center justify-between gap-3">
                          <p className="truncate text-[10px] text-slate-400">
                            {employee.currentTask}
                          </p>

                          <span className="shrink-0 text-[9px] font-semibold text-slate-400">
                            {employee.activeTasks} tasks
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
function TimelineIcon({ type }) {
  const styles = {
    created: "bg-blue-100 text-blue-700",
    assigned: "bg-violet-100 text-violet-700",
    status: "bg-amber-100 text-amber-700",
    reply: "bg-cyan-100 text-cyan-700",
    attachment: "bg-orange-100 text-orange-700",
    resolved: "bg-emerald-100 text-emerald-700",
  };

  const icons = {
    created: TicketCheck,
    assigned: UserRound,
    status: CircleDot,
    reply: MessageSquare,
    attachment: Paperclip,
    resolved: CheckCircle2,
  };

  const Icon = icons[type] || Clock3;

  return (
    <div
      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-4 ring-white ${
        styles[type] || "bg-slate-100 text-slate-600"
      }`}
    >
      <Icon size={16} />
    </div>
  );
}
export default function SupportTickets() {
  const [ticketFormError, setTicketFormError] = useState("");
  const [tickets, setTickets] = useState(initialTickets);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [activeView, setActiveView] = useState("All");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [replyText, setReplyText] = useState("");
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");

  const stats = useMemo(() => {
    const openTickets = tickets.filter(
      (ticket) => !["Resolved", "Closed"].includes(ticket.status)
    ).length;

    const criticalTickets = tickets.filter(
      (ticket) =>
        ticket.priority === "Critical" &&
        !["Resolved", "Closed"].includes(ticket.status)
    ).length;

    const waitingTickets = tickets.filter(
      (ticket) => ticket.status === "Waiting for Client"
    ).length;

    const resolvedTickets = tickets.filter(
      (ticket) => ticket.status === "Resolved"
    ).length;

    return {
      openTickets,
      criticalTickets,
      waitingTickets,
      resolvedTickets,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const search = searchValue.trim().toLowerCase();

      const matchesSearch =
        !search ||
        [
          ticket.id,
          ticket.title,
          ticket.client,
          ticket.product,
          ticket.module,
          ticket.assignedTo,
          ticket.source,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search)
        );

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || ticket.priority === priorityFilter;

      const matchesEmployee =
        employeeFilter === "All" || ticket.assignedTo === employeeFilter;

      const matchesView =
        activeView === "All" ||
        (activeView === "Open" &&
          !["Resolved", "Closed"].includes(ticket.status)) ||
        (activeView === "Critical" && ticket.priority === "Critical") ||
        (activeView === "Waiting" &&
          ticket.status === "Waiting for Client") ||
        (activeView === "Resolved" &&
          ["Resolved", "Closed"].includes(ticket.status));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesEmployee &&
        matchesView
      );
    });
  }, [
    tickets,
    searchValue,
    statusFilter,
    priorityFilter,
    employeeFilter,
    activeView,
  ]);

  const handleTicketFormChange = (event) => {
    const { name, value } = event.target;

    setTicketForm((current) => ({
      ...current,
      [name]: value,
    }));
  };
  const createTimelineEvent = ({
  type,
  title,
  description,
  user = "Mangesh Kondhare",
}) => ({
  id: Date.now() + Math.random(),
  type,
  title,
  description,
  user,
  time: new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
});

const handleCreateTicket = (event) => {
  event.preventDefault();

  if (!ticketForm.client) {
    setTicketFormError("Please select a client.");
    return;
  }

  if (!ticketForm.product) {
    setTicketFormError("Please select a product.");
    return;
  }

  if (!ticketForm.title.trim()) {
    setTicketFormError("Please enter the issue title.");
    return;
  }

  if (!ticketForm.description.trim()) {
    setTicketFormError("Please enter the problem description.");
    return;
  }

  const nextNumber =
    Math.max(
      ...tickets.map((ticket) =>
        Number(String(ticket.id).replace("TKT-", ""))
      ),
      1000
    ) + 1;

  const assignedEmployee = employees.find(
    (employee) => employee.name === ticketForm.assignedTo
  );

  const newTicket = {
    id: `TKT-${nextNumber}`,
    title: ticketForm.title.trim(),
    description: ticketForm.description.trim(),
    client: ticketForm.client,
    clientCode: "New Client",
    product: ticketForm.product,
    module: ticketForm.module.trim() || "General",
    assignedTo: assignedEmployee?.name || "Unassigned",
    assignedInitials: assignedEmployee?.initials || "UA",
    priority: ticketForm.priority,
    status: assignedEmployee ? "Assigned" : "New",
    source: ticketForm.source,
    createdAt: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    updatedAt: "Just now",
    dueDate: ticketForm.dueDate
      ? new Date(`${ticketForm.dueDate}T00:00:00`).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        )
      : "Not scheduled",
   timeSpent: "0m",
replies: 0,
attachments: 0,
timeline: [
  createTimelineEvent({
    type: "created",
    title: "Ticket created",
    description: `Ticket was created from ${ticketForm.source}.`,
  }),
  ...(assignedEmployee
    ? [
        createTimelineEvent({
          type: "assigned",
          title: `Assigned to ${assignedEmployee.name}`,
          description: `Ticket was assigned to ${assignedEmployee.role}.`,
        }),
      ]
    : []),
],
  };

  setTickets((current) => [newTicket, ...current]);
  setTicketForm(emptyTicketForm);
  setTicketFormError("");
  setNewTicketOpen(false);
};

const handleTicketStatusChange = (ticketId, newStatus) => {
  const currentTicket =
    tickets.find((ticket) => ticket.id === ticketId) || selectedTicket;

  if (!currentTicket || currentTicket.status === newStatus) return;

  // Resolving must always require a resolution note.
  if (newStatus === "Resolved") {
    setResolveModalOpen(true);
    return;
  }

  const timelineEvent = createTimelineEvent({
    type: "status",
    title: `Status changed to ${newStatus}`,
    description: `Ticket status changed from ${currentTicket.status} to ${newStatus}.`,
  });

  setTickets((current) =>
    current.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            status: newStatus,
            updatedAt: "Just now",
            timeline: [...(ticket.timeline || []), timelineEvent],
          }
        : ticket
    )
  );

  setSelectedTicket((current) =>
    current?.id === ticketId
      ? {
          ...current,
          status: newStatus,
          updatedAt: "Just now",
          timeline: [...(current.timeline || []), timelineEvent],
        }
      : current
  );
};

const handleAssignmentChange = (ticketId, assignedTo) => {
  const employee = employees.find(
    (item) => item.name === assignedTo
  );

  if (!employee) return;

  const currentTicket =
    tickets.find((ticket) => ticket.id === ticketId) || selectedTicket;

  if (currentTicket?.assignedTo === assignedTo) return;

  const timelineEvent = createTimelineEvent({
    type: "assigned",
    title: `Assigned to ${employee.name}`,
    description: `${employee.role} was assigned to this ticket.`,
  });

  setTickets((current) =>
    current.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            assignedTo: employee.name,
            assignedInitials: employee.initials,
            status: ticket.status === "New" ? "Assigned" : ticket.status,
            updatedAt: "Just now",
            timeline: [...(ticket.timeline || []), timelineEvent],
          }
        : ticket
    )
  );

  setSelectedTicket((current) =>
    current?.id === ticketId
      ? {
          ...current,
          assignedTo: employee.name,
          assignedInitials: employee.initials,
          status: current.status === "New" ? "Assigned" : current.status,
          updatedAt: "Just now",
          timeline: [...(current.timeline || []), timelineEvent],
        }
      : current
  );
};

 const handleAddReply = () => {
  if (!replyText.trim() || !selectedTicket) return;

  const message = replyText.trim();

  const timelineEvent = createTimelineEvent({
    type: "reply",
    title: "Reply added",
    description: message,
  });

  setTickets((current) =>
    current.map((ticket) =>
      ticket.id === selectedTicket.id
        ? {
            ...ticket,
            replies: ticket.replies + 1,
            updatedAt: "Just now",
            timeline: [...(ticket.timeline || []), timelineEvent],
          }
        : ticket
    )
  );

  setSelectedTicket((current) => ({
    ...current,
    replies: current.replies + 1,
    updatedAt: "Just now",
    timeline: [...(current.timeline || []), timelineEvent],
  }));

  setReplyText("");
};

  const clearFilters = () => {
    setSearchValue("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setEmployeeFilter("All");
    setActiveView("All");
  };
  const openResolveModal = () => {
  if (!selectedTicket) return;

  if (
    selectedTicket.status === "Resolved" ||
    selectedTicket.status === "Closed"
  ) {
    return;
  }

  setResolutionNote("");
  setResolveModalOpen(true);
};

const closeResolveModal = () => {
  setResolveModalOpen(false);
  setResolutionNote("");
};
 const handleResolveTicket = () => {
  if (!selectedTicket) return;

  if (!resolutionNote.trim()) {
    alert("Please enter a resolution note before resolving the ticket.");
    return;
  }

  const note = resolutionNote.trim();

  const timelineEvent = createTimelineEvent({
    type: "resolved",
    title: "Ticket resolved",
    description: note,
  });

  setTickets((current) =>
    current.map((ticket) =>
      ticket.id === selectedTicket.id
        ? {
            ...ticket,
            status: "Resolved",
            resolutionNote: note,
            resolvedAt: "Just now",
            updatedAt: "Just now",
            timeline: [...(ticket.timeline || []), timelineEvent],
          }
        : ticket
    )
  );

  setSelectedTicket((current) =>
    current
      ? {
          ...current,
          status: "Resolved",
          resolutionNote: note,
          resolvedAt: "Just now",
          updatedAt: "Just now",
          timeline: [...(current.timeline || []), timelineEvent],
        }
      : current
  );

  setResolutionNote("");
  setResolveModalOpen(false);
};

  const closeCreateTicketDrawer = () => {
  setNewTicketOpen(false);
  setTicketForm(emptyTicketForm);
  setTicketFormError("");
};

 if (selectedTicket) {
  return (
    <>
      <div className="space-y-6">
        {/* Back button and header */}
        <section className="border-b border-slate-200 pb-6">
          <button
            type="button"
            onClick={() => setSelectedTicket(null)}
            className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
          >
            <ArrowLeft size={17} />
            Back to support tickets
          </button>

          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <TicketIcon
                priority={selectedTicket.priority}
                status={selectedTicket.status}
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-violet-600">
                    {selectedTicket.id}
                  </span>

                  <PriorityBadge priority={selectedTicket.priority} />
                  <StatusBadge status={selectedTicket.status} />
                </div>

                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  {selectedTicket.title}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedTicket.client} · {selectedTicket.product} ·{" "}
                  {selectedTicket.module}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Phone size={15} />
                Call Client
              </button>

              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Mail size={15} />
                Email
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedTicket.status !== "Resolved") {
                    setResolveModalOpen(true);
                  }
                }}
                disabled={selectedTicket.status === "Resolved"}
                className={`flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-white transition ${selectedTicket.status === "Resolved"
                  ? "cursor-not-allowed bg-emerald-500 opacity-70"
                  : "bg-violet-600 hover:bg-violet-700"
                  }`}
              >
                <CheckCircle2 size={15} />
                {selectedTicket.status === "Resolved"
                  ? "Ticket Resolved"
                  : "Resolve Ticket"}
              </button>
            </div>
          </div>
        </section>

        {/* Main ticket layout */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
          {/* Left content */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <h2 className="text-sm font-semibold text-slate-950">
                Problem Description
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {selectedTicket.description}
              </p>

              <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Client
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    {selectedTicket.client}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Product
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    {selectedTicket.product}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Module
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    {selectedTicket.module}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Source
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    {selectedTicket.source}
                  </p>
                </div>
              </div>
            </section>
            {selectedTicket.status === "Resolved" &&
              selectedTicket.resolutionNote && (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={19} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-emerald-900">
                        Resolution Summary
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-emerald-800">
                        {selectedTicket.resolutionNote}
                      </p>

                      <p className="mt-3 text-[10px] font-medium text-emerald-700">
                        Resolved {selectedTicket.resolvedAt || "recently"}
                      </p>
                    </div>
                  </div>
                </section>
              )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    Ticket Conversation
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Client communication and internal notes.
                  </p>
                </div>

                <span className="text-[10px] font-semibold text-slate-400">
                  {selectedTicket.replies} replies
                </span>
              </div>

              <div className="space-y-5 px-6 py-6">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-[10px] font-bold text-violet-700">
                    MK
                  </div>

                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-slate-100 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-800">
                        Mangesh Kondhare
                      </p>

                      <span className="text-[9px] text-slate-400">
                        Today, 10:35 AM
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      The issue has been reviewed and assigned to the appropriate
                      support employee.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-bold text-white">
                    {selectedTicket.assignedInitials}
                  </div>

                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-800">
                        {selectedTicket.assignedTo}
                      </p>

                      <span className="text-[9px] text-slate-400">
                        Today, 11:10 AM
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      I am checking the related module and will update the ticket
                      after completing the verification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-end gap-3">
                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                  >
                    <Paperclip size={18} />
                  </button>

                  <textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    rows={2}
                    placeholder="Write a reply or internal note..."
                    className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />

                  <button
                    type="button"
                    onClick={handleAddReply}
                    className="flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700"
                  >
                    <Send size={16} />
                    Send
                  </button>
                </div>
              </div>
                       </section>

            {/* Ticket Timeline */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-sm font-semibold text-slate-950">
                  Ticket Timeline
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Complete history of assignments, updates, replies and
                  resolution.
                </p>
              </div>

              <div className="relative px-6 py-2">
                {(selectedTicket.timeline || []).length > 0 && (
                  <div className="absolute bottom-7 left-[41px] top-7 w-px bg-slate-200" />
                )}

                {(selectedTicket.timeline || []).length === 0 ? (
                  <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                    <Clock3 size={24} className="text-slate-300" />

                    <p className="mt-3 text-xs font-semibold text-slate-700">
                      No timeline activity
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
                      New changes to this ticket will appear here.
                    </p>
                  </div>
                ) : (
                  [...(selectedTicket.timeline || [])]
                    .reverse()
                    .map((event) => (
                      <article
                        key={event.id}
                        className="relative flex gap-4 border-b border-slate-100 py-5 last:border-b-0"
                      >
                        <TimelineIcon type={event.type} />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold text-slate-900">
                                {event.title}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {event.description}
                              </p>

                              <p className="mt-2 text-[10px] text-slate-400">
                                By{" "}
                                <span className="font-semibold text-slate-600">
                                  {event.user}
                                </span>
                              </p>
                            </div>

                            <span className="shrink-0 text-[9px] font-medium text-slate-400">
                              {event.time}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))
                )}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <h2 className="text-sm font-semibold text-slate-950">
                Ticket Management
              </h2>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Ticket status
                  </label>

                  <select
                    value={selectedTicket.status}
                    onChange={(event) =>
                      handleTicketStatusChange(
                        selectedTicket.id,
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Assigned employee
                  </label>

                  <EmployeeAvailabilityPicker
                    selectedEmployee={selectedTicket.assignedTo}
                    onSelect={(employeeName) =>
                      handleAssignmentChange(
                        selectedTicket.id,
                        employeeName
                      )
                    }
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <Clock3 size={18} className="text-violet-600" />
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Time Spent
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {selectedTicket.timeSpent}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <CalendarDays size={18} className="text-rose-600" />
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Due Date
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {selectedTicket.dueDate}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <Paperclip size={18} className="text-amber-600" />
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Attachments
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {selectedTicket.attachments}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <MessageSquare size={18} className="text-blue-600" />
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Replies
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {selectedTicket.replies}
                </p>
              </div>
            </section>
          </div>
              </div>
      </div>

      {resolveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close resolution modal"
            onClick={() => {
              setResolveModalOpen(false);
              setResolutionNote("");
            }}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Resolve Ticket
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Add a clear explanation of what was fixed before resolving{" "}
                    {selectedTicket.id}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResolveModalOpen(false);
                  setResolutionNote("");
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Ticket
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedTicket.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedTicket.client} · {selectedTicket.product}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Resolution note <span className="text-rose-500">*</span>
                </label>

                <textarea
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  rows={6}
                  autoFocus
                  placeholder="Explain the root cause, changes made and final result..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setResolveModalOpen(false);
                  setResolutionNote("");
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleResolveTicket}
                disabled={!resolutionNote.trim()}
                className={`flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-semibold text-white transition ${
                  resolutionNote.trim()
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "cursor-not-allowed bg-emerald-300"
                }`}
              >
                <CheckCircle2 size={16} />
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



  return (
    <>
      <div className="space-y-6">
        {/* Page heading */}
        <section className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-600">
              <Headphones size={15} />
              Support Operations
            </div>

            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Support Tickets
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track client issues, assign employees, monitor progress and
              maintain complete resolution history.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNewTicketOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700"
          >
            <Plus size={18} />
            Create Ticket
          </button>
        </section>

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveView("Open")}
            className={`rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${activeView === "Open"
              ? "border-violet-300 ring-4 ring-violet-50"
              : "border-slate-200"
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Open Tickets
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {stats.openTickets}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Require team attention
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <TicketCheck size={20} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("Critical")}
            className={`rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${activeView === "Critical"
              ? "border-rose-300 ring-4 ring-rose-50"
              : "border-slate-200"
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Critical
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {stats.criticalTickets}
                </p>
                <p className="mt-1 text-xs text-rose-600">
                  Immediate action needed
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <AlertCircle size={20} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("Waiting")}
            className={`rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${activeView === "Waiting"
              ? "border-amber-300 ring-4 ring-amber-50"
              : "border-slate-200"
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Waiting
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {stats.waitingTickets}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Waiting for client reply
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock3 size={20} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("Resolved")}
            className={`rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${activeView === "Resolved"
              ? "border-emerald-300 ring-4 ring-emerald-50"
              : "border-slate-200"
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Resolved
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {stats.resolvedTickets}
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  Successfully completed
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </button>
        </section>

        {/* Ticket list */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-200 px-5 py-5 lg:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  All Support Tickets
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {filteredTickets.length} tickets found
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:w-[330px]">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search ticket, client, product..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setFiltersOpen((current) => !current)}
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${filtersOpen
                    ? "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>
              </div>
            </div>

            {filtersOpen && (
              <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Status
                  </label>

                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="All">All statuses</option>
                      {statusOptions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Priority
                  </label>

                  <select
                    value={priorityFilter}
                    onChange={(event) => setPriorityFilter(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="All">All priorities</option>
                    {priorityOptions.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Assigned Employee
                  </label>

                  <select
                    value={employeeFilter}
                    onChange={(event) => setEmployeeFilter(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="All">All employees</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name} — {employee.availability}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    <Filter size={15} />
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Ticket
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Client / Product
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex min-w-[320px] items-start gap-3">
                        <TicketIcon
                          priority={ticket.priority}
                          status={ticket.status}
                        />

                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(ticket)}
                            className="max-w-[340px] truncate text-left text-sm font-semibold text-slate-900 transition hover:text-violet-700"
                          >
                            {ticket.title}
                          </button>

                          <div className="mt-1 flex items-center gap-2 text-[10px]">
                            <span className="font-bold text-violet-600">
                              {ticket.id}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">
                              {ticket.source}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400">
                              {ticket.updatedAt}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="max-w-[220px] truncate text-xs font-semibold text-slate-800">
                        {ticket.client}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {ticket.product} · {ticket.module}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
                          {ticket.assignedInitials}
                        </div>

                        <span className="whitespace-nowrap text-xs font-medium text-slate-700">
                          {ticket.assignedTo}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-600">
                        <CalendarDays size={14} className="text-slate-400" />
                        {ticket.dueDate}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                        >
                          Open
                          <ArrowUpRight size={14} />
                        </button>

                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile and tablet ticket cards */}
          <div className="divide-y divide-slate-100 xl:hidden">
            {filteredTickets.map((ticket) => (
              <article key={ticket.id} className="p-5">
                <div className="flex items-start gap-3">
                  <TicketIcon
                    priority={ticket.priority}
                    status={ticket.status}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-violet-600">
                          {ticket.id}
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-slate-900">
                          {ticket.title}
                        </h3>
                      </div>

                      <PriorityBadge priority={ticket.priority} />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {ticket.client} · {ticket.product}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={ticket.status} />

                      <span className="text-[10px] text-slate-400">
                        Assigned to {ticket.assignedTo}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTicket(ticket)}
                      className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600"
                    >
                      View Ticket
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={24} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No tickets found
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                Try changing the search text or clearing the selected filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-xs font-semibold text-violet-600"
              >
                Clear all filters
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <p>
              Showing {filteredTickets.length} of {tickets.length} support
              tickets
            </p>

            <p>Updated a few seconds ago</p>
          </div>
        </section>
      </div>

      {/* Create ticket drawer */}
      {newTicketOpen && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close create ticket drawer"
              onClick={closeCreateTicketDrawer}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-[620px] flex-col bg-white shadow-2xl">
            <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Create Support Ticket
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Record a new client issue and assign it to your team.
                </p>
              </div>

              <button
                type="button"
             onClick={closeCreateTicketDrawer}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleCreateTicket}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                      Client <span className="text-rose-500">*</span>
                    </label>

                    <select
                      required
                      name="client"
                      value={ticketForm.client}
                      onChange={handleTicketFormChange}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="">Select client</option>
                      {clients.map((client) => (
                        <option key={client}>{client}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                      Product <span className="text-rose-500">*</span>
                    </label>

                    <select
                      required
                      name="product"
                      value={ticketForm.product}
                      onChange={handleTicketFormChange}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product}>{product}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Module
                  </label>

                  <input
                    name="module"
                    value={ticketForm.module}
                    onChange={handleTicketFormChange}
                    placeholder="Example: Sales Billing, GST Report, Stock"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Issue title <span className="text-rose-500">*</span>
                  </label>

                  <input
                    required
                    name="title"
                    value={ticketForm.title}
                    onChange={handleTicketFormChange}
                    placeholder="Enter a clear summary of the problem"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Problem description <span className="text-rose-500">*</span>
                  </label>

                  <textarea
                    required
                    name="description"
                    value={ticketForm.description}
                    onChange={handleTicketFormChange}
                    rows={5}
                    placeholder="Explain the issue, expected result and any error message..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                      Priority
                    </label>

                    <select
                      name="priority"
                      value={ticketForm.priority}
                      onChange={handleTicketFormChange}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                      {priorityOptions.map((priority) => (
                        <option key={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                      Source
                    </label>

                    <select
                      name="source"
                      value={ticketForm.source}
                      onChange={handleTicketFormChange}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                      {sourceOptions.map((source) => (
                        <option key={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                 <div>
  <label className="mb-2 block text-xs font-semibold text-slate-700">
    Assign employee
  </label>

  <EmployeeAvailabilityPicker
    selectedEmployee={ticketForm.assignedTo}
    onSelect={(employeeName) => {
      setTicketForm((current) => ({
        ...current,
        assignedTo: employeeName,
      }));

      setTicketFormError("");
    }}
  />

  {ticketForm.assignedTo ? (
    <button
      type="button"
      onClick={() => {
        setTicketForm((current) => ({
          ...current,
          assignedTo: "",
        }));
      }}
      className="mt-2 text-[10px] font-semibold text-slate-500 transition hover:text-rose-600"
    >
      Remove assignment and keep ticket unassigned
    </button>
  ) : (
    <p className="mt-2 text-[10px] leading-4 text-slate-400">
      The ticket will remain in New status until an employee is assigned.
    </p>
  )}
</div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                      Due date
                    </label>

                    <input
                      type="date"
                      name="dueDate"
                      value={ticketForm.dueDate}
                      onChange={handleTicketFormChange}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="flex min-h-[86px] w-full items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                >
                  <Paperclip size={18} />
                  Attach screenshots, documents or error files
                </button>
              </div>
              {ticketFormError && (
  <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
    <AlertCircle
      size={17}
      className="mt-0.5 shrink-0 text-rose-600"
    />

    <div>
      <p className="text-xs font-semibold text-rose-800">
        Unable to create ticket
      </p>

      <p className="mt-1 text-xs text-rose-700">
        {ticketFormError}
      </p>
    </div>
  </div>
)}

              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                <button
                  type="button"
                onClick={closeCreateTicketDrawer}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700"
                >
                  <TicketCheck size={16} />
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      


    </>
  );
}