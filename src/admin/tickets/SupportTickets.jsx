import {
  useEffect,
  useMemo,
  useState,
} from "react";
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
  FileText,
  Activity,
  Clock,
  User,
  Building,
  Package,
  Hash,
  Calendar,
  Tag,
  Edit,
  UserPlus,
  Trash2,
  Download,
  Eye,
} from "lucide-react";

import API_URL from "../../config/api";

const getAuthToken = () =>
  localStorage.getItem(
    "client-connect-token"
  ) ||
  sessionStorage.getItem(
    "client-connect-token"
  ) ||
  "";

const statusOptions = [
  "New",
  "Assigned",
  "In Progress",
  "Waiting for Client",
  "Testing",
  "Resolved",
  "Verified",
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
  clientId: "",
  client: "",
  productId: "",
  product: "",
  module: "",
  category: "Other",
  title: "",
  description: "",
  priority: "Medium",
  assignedEmployeeId: "",
  assignedEmployeeCode: "",
  assignedEmployeeName: "",
  source: "Admin",
  dueDate: "",
};

const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("") || "NA";

const formatApiDate = (
  value,
  fallback = "Not scheduled"
) => {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatApiDateTime = (
  value,
  fallback = "—"
) => {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const minutesToDisplay = (
  minutes = 0
) => {
  const total = Math.max(
    Number(minutes || 0),
    0
  );
  const hours = Math.floor(
    total / 60
  );
  const remainingMinutes =
    total % 60;
  if (hours && remainingMinutes) {
    return `${hours}h ${remainingMinutes}m`;
  }
  if (hours) {
    return `${hours}h`;
  }
  return `${remainingMinutes}m`;
};

const normalizeTicketFromApi = (
  ticket
) => ({
  _id: ticket._id || ticket.id,
  mongoId: ticket._id || ticket.id,
  id:
    ticket.ticketCode ||
    ticket.id ||
    "",
  ticketCode:
    ticket.ticketCode || "",
  title:
    ticket.title || "",
  description:
    ticket.description || "",
  clientId:
    ticket.clientId
      ? String(ticket.clientId)
      : "",
  client:
    ticket.clientName ||
    "Unknown Client",
  clientCode:
    ticket.clientCode || "",
  contactPerson:
    ticket.contactPerson || "",
  contactMobile:
    ticket.contactMobile || "",
  contactEmail:
    ticket.contactEmail || "",
  productId:
    ticket.productId
      ? String(ticket.productId)
      : "",
  product:
    ticket.productName || "",
  productVersion:
    ticket.productVersion || "",
  module:
    ticket.module || "General",
  category:
    ticket.category || "Other",
  assignedEmployeeId:
    ticket.assignedEmployeeId
      ? String(
        ticket.assignedEmployeeId
      )
      : "",
  assignedEmployeeName:
    ticket.assignedEmployeeName ||
    "",
  assignedEmployeeCode:
    ticket.assignedEmployeeCode ||
    "",
  assignedTo:
    ticket.assignedEmployeeName ||
    "Unassigned",
  assignedInitials:
    getInitials(
      ticket.assignedEmployeeName ||
      "Unassigned"
    ),
  priority:
    ticket.priority || "Medium",
  status:
    ticket.status || "New",
  source:
    ticket.source || "Admin",
  createdAt:
    formatApiDate(
      ticket.createdAt,
      "—"
    ),
  createdAtValue:
    ticket.createdAt || null,
  updatedAt:
    formatApiDateTime(
      ticket.updatedAt,
      "—"
    ),
  updatedAtValue:
    ticket.updatedAt || null,
  dueDate:
    formatApiDate(
      ticket.dueDate
    ),
  dueDateValue:
    ticket.dueDate
      ? String(ticket.dueDate).slice(
        0,
        10
      )
      : "",
  timeSpent:
    minutesToDisplay(
      ticket.spentMinutes
    ),
  replies:
    Number(
      ticket.replyCount ??
      ticket.replies?.length ??
      0
    ),
  replyItems:
    Array.isArray(ticket.replies)
      ? ticket.replies
      : [],
  attachments:
    Number(
      ticket.attachmentCount ??
      ticket.attachments?.length ??
      0
    ),
  attachmentItems:
    Array.isArray(
      ticket.attachments
    )
      ? ticket.attachments
      : [],
  timeline:
    Array.isArray(ticket.timeline)
      ? ticket.timeline.map(
        (event) => ({
          id:
            event._id ||
            event.id ||
            `${event.title}-${event.createdAt}`,
          type:
            event.type || "updated",
          title:
            event.title ||
            "Ticket updated",
          description:
            event.description || "",
          user:
            event.performedByName ||
            "System",
          time:
            formatApiDateTime(
              event.createdAt
            ),
          createdAt:
            event.createdAt,
        })
      )
      : [],
  resolutionNote:
    ticket.resolutionNote || "",
  resolvedAt:
    ticket.resolvedAt
      ? formatApiDateTime(
        ticket.resolvedAt
      )
      : "",
  linkedTaskId:
    ticket.linkedTaskId
      ? String(ticket.linkedTaskId)
      : "",
  linkedTaskCode:
    ticket.linkedTaskCode || "",
});

const normalizeClientFromApi = (
  client
) => ({
  id: String(
    client._id || client.id || ""
  ),
  clientCode:
    client.clientCode || "",
  companyName:
    client.companyName || "",
  contactPerson:
    client.contactPerson || "",
  email:
    client.email || "",
  mobile:
    client.mobile || "",
  products: Array.isArray(
    client.products
  )
    ? client.products.map(
      (product) => ({
        id: String(
          product._id ||
          product.id ||
          ""
        ),
        productName:
          typeof product === "string"
            ? product
            : product.productName ||
            "",
        version:
          typeof product === "string"
            ? ""
            : product.version || "",
      })
    )
    : [],
});

const normalizeEmployeeFromApi = (
  employee
) => {
  const name =
    employee.name ||
    employee.employeeName ||
    "";
  const status =
    employee.status || "Free";
  return {
    id: String(
      employee._id ||
      employee.id ||
      ""
    ),
    name,
    initials:
      employee.initials ||
      getInitials(name),
    employeeCode:
      employee.employeeCode || "",
    role:
      employee.role ||
      employee.designation ||
      "Employee",
    availability:
      status === "Free"
        ? "Available"
        : status === "Working"
          ? "Busy"
          : status === "Leave"
            ? "On Leave"
            : status,
    activeTasks: Number(
      employee.openTasks || 0
    ),
    currentTask:
      employee.currentTask ||
      "Available for assignment",
    status,
  };
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
    Verified:
      "bg-teal-50 text-teal-700 ring-teal-600/10",
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
  employees = [],
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
      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-4 ring-white ${styles[type] || "bg-slate-100 text-slate-600"
        }`}
    >
      <Icon size={16} />
    </div>
  );
}
function SummaryCard({
  icon: Icon,
  label,
  value,
  subtext,
  iconColor = "text-violet-600",
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-violet-50 transition group-hover:bg-violet-100/70" />

      <div className="relative flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 ${iconColor}`}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p className="mt-1.5 truncate text-sm font-bold text-slate-900">
            {value}
          </p>

          {subtext && (
            <p className="mt-1 text-[10px] text-slate-500">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50">
      {Icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 transition group-hover:border-violet-100 group-hover:bg-violet-50 group-hover:text-violet-600">
          <Icon size={15} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 truncate text-xs font-semibold text-slate-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-3 text-xs font-semibold transition ${active
        ? "text-violet-700"
        : "text-slate-500 hover:text-slate-700"
        }`}
    >
      <Icon size={16} />
      {label}
      {count !== undefined && count > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${active
          ? "bg-violet-100 text-violet-700"
          : "bg-slate-100 text-slate-500"
          }`}>
          {count}
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />
      )}
    </button>
  );
}

function AttachmentFile({ attachment }) {
  const fileUrl = attachment.fileUrl?.startsWith("http")
    ? attachment.fileUrl
    : `${API_URL}${attachment.fileUrl}`;

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <Paperclip size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800">
          {attachment.fileName}
        </p>
        <p className="mt-1 text-[10px] text-slate-400">
          {attachment.fileType || "File"} · Uploaded by {attachment.uploadedByName || "Admin"}
        </p>
        <p className="mt-0.5 text-[9px] text-slate-400">
          {formatApiDateTime(attachment.uploadedAt)}
        </p>
      </div>
      <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
        >
          <Eye size={14} />
        </a>
        <a
          href={fileUrl}
          download
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
        >
          <Download size={14} />
        </a>
      </div>
    </div>
  );
}

export default function SupportTickets() {
  const [ticketFormError, setTicketFormError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState("");
  const [backendStats, setBackendStats] = useState({
    openTickets: 0,
    criticalTickets: 0,
    waitingTickets: 0,
    resolvedTickets: 0,
  });
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
  const [editTicketMode, setEditTicketMode] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [deleteTicketOpen, setDeleteTicketOpen] = useState(false);
  const [ticketActionLoading, setTicketActionLoading] = useState(false);
  const [replyType, setReplyType] = useState("Public");
  const [savingTicket, setSavingTicket] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedAttachmentFile, setSelectedAttachmentFile] = useState(null);
  const [createTicketAttachment, setCreateTicketAttachment] = useState(null);
  const [attachmentSaving, setAttachmentSaving] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");

  const loadTickets = async () => {
    try {
      setTicketsLoading(true);
      setTicketsError("");
      const response = await fetch(
        `${API_URL}/api/admin/tickets?limit=200`,
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
          result.message ||
          "Unable to load support tickets."
        );
      }
      setTickets(
        Array.isArray(result.data)
          ? result.data.map(normalizeTicketFromApi)
          : []
      );
      setBackendStats({
        openTickets: Number(result.stats?.openTickets || 0),
        criticalTickets: Number(result.stats?.criticalTickets || 0),
        waitingTickets: Number(result.stats?.waitingTickets || 0),
        resolvedTickets: Number(result.stats?.resolvedTickets || 0),
      });
    } catch (error) {
      console.error("Load support tickets error:", error);
      setTickets([]);
      setTicketsError(
        error.message ||
        "Unable to load support tickets."
      );
    } finally {
      setTicketsLoading(false);
    }
  };

  const loadClients = async () => {
    const response = await fetch(
      `${API_URL}/api/admin/clients`,
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
        result.message ||
        "Unable to load clients."
      );
    }
    setClients(
      Array.isArray(result.data)
        ? result.data.map(normalizeClientFromApi)
        : []
    );
  };

  const loadEmployees = async () => {
    const response = await fetch(
      `${API_URL}/api/employee/employees`,
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
        result.message ||
        "Unable to load employees."
      );
    }
    setEmployees(
      Array.isArray(result.data)
        ? result.data.map(normalizeEmployeeFromApi)
        : []
    );
  };

  const loadMasters = async () => {
    try {
      setMastersLoading(true);
      await Promise.all([loadClients(), loadEmployees()]);
    } catch (error) {
      console.error("Load ticket masters error:", error);
      setTicketFormError(
        error.message ||
        "Unable to load client or employee data."
      );
    } finally {
      setMastersLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    loadMasters();
  }, []);

  const stats = backendStats;
  const selectedCreateClient = clients.find(
    (client) =>
      String(client.id) === String(ticketForm.clientId)
  ) || null;
  const selectedCreateClientProducts = selectedCreateClient?.products || [];

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
          ticket.assignedEmployeeName,
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
        employeeFilter === "All" || ticket.assignedEmployeeName === employeeFilter;
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

  const openTicketDetails = async (ticket) => {
    const ticketId = ticket.mongoId || ticket._id;
    if (!ticketId) {
      alert("Ticket ID is missing.");
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/api/admin/ticket/${ticketId}`,
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
          result.message ||
          "Unable to load ticket details."
        );
      }
      const freshTicket = normalizeTicketFromApi(result.data);
      setSelectedTicket(freshTicket);
      setActiveTab("overview");
      setTickets((current) =>
        current.map((item) =>
          String(item.mongoId) === String(ticketId)
            ? freshTicket
            : item
        )
      );
    } catch (error) {
      console.error("Open ticket error:", error);
      alert(error.message || "Unable to open ticket.");
    }
  };

  const openEditTicketDrawer = () => {
    if (!selectedTicket) return;
    setEditingTicketId(selectedTicket.mongoId);
    setEditTicketMode(true);
    setTicketForm({
      clientId: selectedTicket.clientId,
      client: selectedTicket.client,
      productId: selectedTicket.productId,
      product: selectedTicket.product,
      module: selectedTicket.module,
      category: selectedTicket.category,
      title: selectedTicket.title,
      description: selectedTicket.description,
      priority: selectedTicket.priority,
      assignedEmployeeId: selectedTicket.assignedEmployeeId,
      assignedEmployeeCode: selectedTicket.assignedEmployeeCode,
      assignedEmployeeName: selectedTicket.assignedEmployeeName,
      source: selectedTicket.source,
      dueDate: selectedTicket.dueDateValue,
    });
    setNewTicketOpen(true);
  };

  const applyUpdatedTicket = (apiTicket) => {
    const updatedTicket = normalizeTicketFromApi(apiTicket);
    setTickets((current) =>
      current.map((ticket) =>
        String(ticket.mongoId) === String(updatedTicket.mongoId)
          ? updatedTicket
          : ticket
      )
    );
    setSelectedTicket(updatedTicket);
    return updatedTicket;
  };

  const handleTicketFormChange = (event) => {
    const { name, value } = event.target;
    setTicketForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const uploadAttachmentForTicket = async (ticketId, file) => {
    if (!ticketId || !file) {
      return null;
    }
    const formData = new FormData();
    formData.append("attachment", file);
    const response = await fetch(
      `${API_URL}/api/admin/ticket/${ticketId}/attachment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      }
    );
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
        "Ticket was created, but attachment upload failed."
      );
    }
    return result.data;
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    if (editTicketMode) {
      await handleUpdateTicket();
      return;
    }
    if (!ticketForm.clientId) {
      setTicketFormError("Please select a client.");
      return;
    }
    if (!ticketForm.productId) {
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
    try {
      setSavingTicket(true);
      setTicketFormError("");
      const response = await fetch(
        `${API_URL}/api/admin/ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            title: ticketForm.title.trim(),
            description: ticketForm.description.trim(),
            clientId: ticketForm.clientId,
            productId: ticketForm.productId,
            productName: ticketForm.product,
            module: ticketForm.module.trim() || "General",
            category: ticketForm.category || "Other",
            source: ticketForm.source,
            priority: ticketForm.priority,
            assignedEmployeeId: ticketForm.assignedEmployeeId || "",
            dueDate: ticketForm.dueDate || null,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to create support ticket."
        );
      }
      let createdTicket = normalizeTicketFromApi(result.data);
      const createdTicketMongoId = createdTicket.mongoId || createdTicket._id;
      const hadAttachment = Boolean(createTicketAttachment);
      if (createTicketAttachment && createdTicketMongoId) {
        const ticketAfterUpload = await uploadAttachmentForTicket(
          createdTicketMongoId,
          createTicketAttachment
        );
        if (ticketAfterUpload) {
          createdTicket = normalizeTicketFromApi(ticketAfterUpload);
        }
      }
      setTickets((current) => [createdTicket, ...current]);
      setBackendStats((current) => ({
        ...current,
        openTickets: current.openTickets + 1,
        criticalTickets:
          createdTicket.priority === "Critical"
            ? current.criticalTickets + 1
            : current.criticalTickets,
      }));
      setTicketForm(emptyTicketForm);
      setCreateTicketAttachment(null);
      setTicketFormError("");
      setNewTicketOpen(false);
      await loadTickets();
      alert(
        hadAttachment
          ? "Support ticket and attachment created successfully."
          : "Support ticket created successfully."
      );
    } catch (error) {
      console.error("Create support ticket error:", error);
      setTicketFormError(
        error.message ||
        "Unable to create support ticket."
      );
    } finally {
      setSavingTicket(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!editingTicketId) {
      setTicketFormError("Ticket ID is missing.");
      return;
    }
    if (!ticketForm.clientId) {
      setTicketFormError("Please select a client.");
      return;
    }
    if (!ticketForm.productId) {
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
    try {
      setSavingTicket(true);
      setTicketFormError("");
      const response = await fetch(
        `${API_URL}/api/admin/ticket/${editingTicketId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            title: ticketForm.title.trim(),
            description: ticketForm.description.trim(),
            clientId: ticketForm.clientId,
            productId: ticketForm.productId,
            productName: ticketForm.product,
            module: ticketForm.module.trim() || "General",
            category: ticketForm.category || "Other",
            source: ticketForm.source || "Admin",
            priority: ticketForm.priority || "Medium",
            assignedEmployeeId: ticketForm.assignedEmployeeId || "",
            dueDate: ticketForm.dueDate || null,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to update support ticket."
        );
      }
      const updatedTicket = applyUpdatedTicket(result.data);
      setTickets((current) =>
        current.map((ticket) =>
          String(ticket.mongoId) === String(updatedTicket.mongoId)
            ? updatedTicket
            : ticket
        )
      );
      setEditTicketMode(false);
      setEditingTicketId(null);
      setTicketForm(emptyTicketForm);
      setTicketFormError("");
      setNewTicketOpen(false);
      await loadTickets();
      alert("Support ticket updated successfully.");
    } catch (error) {
      console.error("Update support ticket error:", error);
      setTicketFormError(
        error.message ||
        "Unable to update support ticket."
      );
    } finally {
      setSavingTicket(false);
    }
  };

  const handleTicketStatusChange = async (ticketId, newStatus) => {
    if (!selectedTicket || selectedTicket.status === newStatus) {
      return;
    }
    if (newStatus === "Resolved") {
      setResolveModalOpen(true);
      return;
    }
    const mongoId = selectedTicket.mongoId || selectedTicket._id;
    if (!mongoId) {
      alert("Ticket ID is missing.");
      return;
    }
    const previousStatus = selectedTicket.status;
    try {
      setTicketActionLoading(true);
      const response = await fetch(
        `${API_URL}/api/admin/ticket/${mongoId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to update ticket status."
        );
      }
      applyUpdatedTicket(result.data);
      await loadTickets();
    } catch (error) {
      console.error("Update ticket status error:", error);
      alert(error.message || "Unable to update ticket status.");
      setSelectedTicket((current) =>
        current
          ? {
            ...current,
            status: previousStatus,
          }
          : current
      );
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleAssignmentChange = async (ticketId, assignedTo) => {
    if (!selectedTicket) {
      return;
    }
    const employee = employees.find(
      (item) => item.name === assignedTo
    );
    if (!employee) {
      alert("Selected employee was not found.");
      return;
    }
    if (selectedTicket.assignedEmployeeId === employee.id) {
      return;
    }
    const mongoId = selectedTicket.mongoId || selectedTicket._id;
    if (!mongoId) {
      alert("Ticket ID is missing.");
      return;
    }
    try {
      setTicketActionLoading(true);
      const response = await fetch(
        `${API_URL}/api/admin/ticket/${mongoId}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            assignedEmployeeId: employee.id,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to assign ticket."
        );
      }
      applyUpdatedTicket(result.data);
      await loadTickets();
    } catch (error) {
      console.error("Assign ticket error:", error);
      alert(error.message || "Unable to assign ticket.");
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim() || !selectedTicket) {
      return;
    }
    const mongoId = selectedTicket.mongoId || selectedTicket._id;
    if (!mongoId) {
      alert("Ticket ID is missing.");
      return;
    }
    try {
      setTicketActionLoading(true);
      const response = await fetch(
        `${API_URL}/api/admin/ticket/${mongoId}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            message: replyText.trim(),
            replyType,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to add ticket reply."
        );
      }
      applyUpdatedTicket(result.data);
      setReplyText("");
      setReplyType("Public");
      await loadTickets();
    } catch (error) {
      console.error("Add ticket reply error:", error);
      alert(error.message || "Unable to add ticket reply.");
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleAddAttachment = async (event) => {
    event.preventDefault();
    if (!selectedTicket) {
      return;
    }
    if (!selectedAttachmentFile) {
      setAttachmentError("Please select a file.");
      return;
    }
    const mongoId = selectedTicket.mongoId || selectedTicket._id;
    if (!mongoId) {
      setAttachmentError("Ticket ID is missing.");
      return;
    }
    try {
      setAttachmentSaving(true);
      setAttachmentError("");
      const formData = new FormData();
      formData.append("attachment", selectedAttachmentFile);
      const response = await fetch(
        `${API_URL}/api/admin/ticket/${mongoId}/attachment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: formData,
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to upload attachment."
        );
      }
      applyUpdatedTicket(result.data);
      setSelectedAttachmentFile(null);
      setAttachmentModalOpen(false);
      await loadTickets();
    } catch (error) {
      console.error("Upload attachment error:", error);
      setAttachmentError(
        error.message ||
        "Unable to upload attachment."
      );
    } finally {
      setAttachmentSaving(false);
    }
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
    if (selectedTicket.status === "Resolved" || selectedTicket.status === "Closed") {
      return;
    }
    setResolutionNote("");
    setResolveModalOpen(true);
  };

  const closeResolveModal = () => {
    setResolveModalOpen(false);
    setResolutionNote("");
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) {
      return;
    }
    const note = resolutionNote.trim();
    if (!note) {
      alert(
        "Please enter a resolution note before resolving the ticket."
      );
      return;
    }
    const mongoId = selectedTicket.mongoId || selectedTicket._id;
    if (!mongoId) {
      alert("Ticket ID is missing.");
      return;
    }
    try {
      setTicketActionLoading(true);
      const response = await fetch(
        `${API_URL}/api/admin/ticket/${mongoId}/resolve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            resolutionNote: note,
            rootCause: "",
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to resolve support ticket."
        );
      }
      applyUpdatedTicket(result.data);
      setResolutionNote("");
      setResolveModalOpen(false);
      await loadTickets();
    } catch (error) {
      console.error("Resolve support ticket error:", error);
      alert(error.message || "Unable to resolve support ticket.");
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) {
      return;
    }
    const mongoId = selectedTicket.mongoId || selectedTicket._id;
    if (!mongoId) {
      alert("Ticket ID is missing.");
      return;
    }
    if (!["Resolved", "Verified", "Closed"].includes(selectedTicket.status)) {
      alert(
        "Only a resolved, verified or closed ticket can be reopened."
      );
      return;
    }
    const confirmed = window.confirm(
      `Reopen ${selectedTicket.id} and move it to In Progress?`
    );
    if (!confirmed) {
      return;
    }
    try {
      setTicketActionLoading(true);
      const response = await fetch(
        `${API_URL}/api/admin/ticket/${mongoId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            status: "In Progress",
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to reopen ticket."
        );
      }
      applyUpdatedTicket(result.data);
      await loadTickets();
      alert("Support ticket reopened successfully.");
    } catch (error) {
      console.error("Reopen ticket error:", error);
      alert(error.message || "Unable to reopen ticket.");
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) {
      return;
    }
    const mongoId = selectedTicket.mongoId || selectedTicket._id;
    if (!mongoId) {
      alert("Ticket ID is missing.");
      return;
    }
    if (!["Resolved", "Verified"].includes(selectedTicket.status)) {
      alert("Resolve the ticket before closing it.");
      return;
    }
    const confirmed = window.confirm(
      `Close ${selectedTicket.id}? The ticket will be marked as completed.`
    );
    if (!confirmed) {
      return;
    }
    try {
      setTicketActionLoading(true);
      const response = await fetch(
        `${API_URL}/api/admin/ticket/${mongoId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            status: "Closed",
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to close ticket."
        );
      }
      applyUpdatedTicket(result.data);
      await loadTickets();
      alert("Support ticket closed successfully.");
    } catch (error) {
      console.error("Close ticket error:", error);
      alert(error.message || "Unable to close ticket.");
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) {
      return;
    }
    const mongoId = selectedTicket.mongoId || selectedTicket._id;
    if (!mongoId) {
      alert("Ticket ID is missing.");
      return;
    }
    try {
      setTicketActionLoading(true);
      const response = await fetch(
        `${API_URL}/api/admin/ticket/${mongoId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "Unable to delete support ticket."
        );
      }
      setTickets((current) =>
        current.filter(
          (ticket) =>
            String(ticket.mongoId) !== String(mongoId)
        )
      );
      setDeleteTicketOpen(false);
      setSelectedTicket(null);
      await loadTickets();
      alert("Support ticket deleted successfully.");
    } catch (error) {
      console.error("Delete support ticket error:", error);
      alert(error.message || "Unable to delete support ticket.");
    } finally {
      setTicketActionLoading(false);
    }
  };

  const closeCreateTicketDrawer = () => {
    setNewTicketOpen(false);
    setTicketForm(emptyTicketForm);
    setTicketFormError("");
    setEditTicketMode(false);
    setEditingTicketId(null);
    setCreateTicketAttachment(null);
  };

  // Ticket Detail View
  if (selectedTicket) {
    const renderOverview = () => (
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Problem Description */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
            <h3 className="text-sm font-semibold text-slate-900">
              Problem Description
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {selectedTicket.description}
            </p>
          </section>

          {/* Client & Product Info */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
            <h3 className="text-sm font-semibold text-slate-900">
              Client Information
            </h3>
            <div className="mt-4 space-y-0 divide-y divide-slate-100">
              <InfoRow
                label="Client"
                value={selectedTicket.client}
                icon={Building}
              />
              <InfoRow
                label="Product"
                value={selectedTicket.product}
                icon={Package}
              />
              <InfoRow
                label="Module"
                value={selectedTicket.module}
                icon={Tag}
              />
              <InfoRow
                label="Source"
                value={selectedTicket.source}
                icon={Hash}
              />
              <InfoRow
                label="Created"
                value={selectedTicket.createdAt}
                icon={Calendar}
              />
              <InfoRow
                label="Last Updated"
                value={selectedTicket.updatedAt}
                icon={Clock}
              />
            </div>
          </section>

          {/* Resolution Summary - only show if resolved */}
          {selectedTicket.status === "Resolved" && selectedTicket.resolutionNote && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={19} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-emerald-900">
                    Resolution Summary
                  </h3>
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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Ticket Management */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
            <h3 className="text-sm font-semibold text-slate-900">
              Ticket Management
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Status
                </label>
                <select
                  value={selectedTicket.status}
                  disabled={ticketActionLoading}
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
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Priority
                </label>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={selectedTicket.priority} />
                  <span className="text-xs text-slate-500">
                    Priority level
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Assigned Employee
                </label>
                <EmployeeAvailabilityPicker
                  employees={employees}
                  selectedEmployee={selectedTicket.assignedEmployeeName || ""}
                  onSelect={(employeeName) => {
                    const employee = employees.find(
                      (item) => item.name === employeeName
                    );
                    if (employee) {
                      handleAssignmentChange(selectedTicket.id, employeeName);
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Due Date
                  </label>
                  <p className="text-sm font-medium text-slate-800">
                    {selectedTicket.dueDate}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Time Spent
                  </label>
                  <p className="text-sm font-medium text-slate-800">
                    {selectedTicket.timeSpent}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Stats */}
          <section className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
              <MessageSquare size={16} className="text-blue-600" />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Replies
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {selectedTicket.replies}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
              <Paperclip size={16} className="text-amber-600" />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Attachments
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {selectedTicket.attachments}
              </p>
            </div>
          </section>
        </div>
      </div>
    );

    const renderConversation = () => (
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Ticket Conversation
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Client communication and internal notes.
            </p>
          </div>

          <div className="space-y-5 px-6 py-6">
            {selectedTicket.replyItems.length === 0 ? (
              <div className="flex min-h-[150px] flex-col items-center justify-center text-center">
                <MessageSquare size={24} className="text-slate-300" />
                <p className="mt-3 text-xs font-semibold text-slate-700">
                  No replies yet
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Replies and internal notes will appear here.
                </p>
              </div>
            ) : (
              selectedTicket.replyItems.map((reply) => {
                const isInternal = reply.replyType === "Internal";
                return (
                  <div
                    key={reply._id || `${reply.authorName}-${reply.createdAt}`}
                    className="flex gap-3"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${isInternal
                        ? "bg-amber-100 text-amber-700"
                        : "bg-violet-100 text-violet-700"
                        }`}
                    >
                      {getInitials(reply.authorName || "Admin")}
                    </div>
                    <div
                      className={`min-w-0 flex-1 rounded-2xl rounded-tl-md px-4 py-4 ${isInternal
                        ? "border border-amber-200 bg-amber-50"
                        : "bg-slate-100"
                        }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-800">
                            {reply.authorName || "Admin"}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${isInternal
                              ? "bg-amber-200 text-amber-800"
                              : "bg-violet-200 text-violet-800"
                              }`}
                          >
                            {reply.replyType || "Public"}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400">
                          {formatApiDateTime(reply.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                        {reply.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                disabled={ticketActionLoading}
                onClick={() => setReplyType("Public")}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${replyType === "Public"
                  ? "bg-violet-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600"
                  }`}
              >
                Public Reply
              </button>
              <button
                type="button"
                disabled={ticketActionLoading}
                onClick={() => setReplyType("Internal")}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${replyType === "Internal"
                  ? "bg-amber-500 text-white"
                  : "border border-slate-200 bg-white text-slate-600"
                  }`}
              >
                Internal Note
              </button>
            </div>
            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAttachmentError("");
                  setAttachmentModalOpen(true);
                }}
                disabled={ticketActionLoading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Paperclip size={18} />
              </button>
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                rows={2}
                placeholder={
                  replyType === "Internal"
                    ? "Write an internal note..."
                    : "Write a reply to the client..."
                }
                className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
              <button
                type="button"
                onClick={handleAddReply}
                disabled={ticketActionLoading || !replyText.trim()}
                className="flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {ticketActionLoading
                  ? "Saving..."
                  : replyType === "Internal"
                    ? "Add Note"
                    : "Send"}
              </button>
            </div>
          </div>
        </section>
      </div>
    );

    const renderTimeline = () => (
      <section className="rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Ticket Timeline
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Complete history of assignments, updates, replies and resolution.
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
    );

    const renderAttachments = () => (
      <section className="rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Attachments
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Files and supporting references.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAttachmentError("");
              setAttachmentModalOpen(true);
            }}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          >
            <Plus size={14} />
            Add Attachment
          </button>
        </div>

        <div className="p-6">
          {selectedTicket.attachmentItems.length === 0 ? (
            <div className="flex min-h-[150px] flex-col items-center justify-center text-center">
              <Paperclip size={24} className="text-slate-300" />
              <p className="mt-3 text-xs font-semibold text-slate-700">
                No attachments
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Upload files to share with the team.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {selectedTicket.attachmentItems.map((attachment) => (
                <AttachmentFile key={attachment._id || attachment.fileName} attachment={attachment} />
              ))}
            </div>
          )}
        </div>
      </section>
    );

    const renderActivity = () => (
      <section className="rounded-xl border border-slate-200 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Activity Log
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Complete audit trail of all actions on this ticket.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {selectedTicket.timeline && selectedTicket.timeline.length > 0 ? (
            selectedTicket.timeline.map((event) => (
              <div key={event.id} className="flex items-start gap-4 px-6 py-4">
                <div className="mt-0.5 shrink-0">
                  <Activity size={16} className="text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {event.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                    <span>By {event.user}</span>
                    <span>·</span>
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex min-h-[120px] items-center justify-center text-center text-xs text-slate-400">
              No activity recorded
            </div>
          )}
        </div>
      </section>
    );

    return (
      <div className="enterprise-page mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="border-b border-slate-200 pb-6">
          <button
            type="button"
            onClick={() => {
              setDeleteTicketOpen(false);
              setSelectedTicket(null);
            }}
            className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
          >
            <ArrowLeft size={17} />
            Back to support tickets
          </button>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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
                <h1 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-2xl">
                  {selectedTicket.title}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Building size={14} className="text-slate-400" />
                    {selectedTicket.client}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package size={14} className="text-slate-400" />
                    {selectedTicket.product}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag size={14} className="text-slate-400" />
                    {selectedTicket.module}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} className="text-slate-400" />
                    Created {selectedTicket.createdAt}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openEditTicketDrawer}
                disabled={ticketActionLoading}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Edit size={14} />
                Edit
              </button>

              {!["Resolved", "Verified", "Closed"].includes(selectedTicket.status) && (
                <button
                  type="button"
                  onClick={openResolveModal}
                  disabled={ticketActionLoading}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 size={14} />
                  Resolve
                </button>
              )}

              {["Resolved", "Verified"].includes(selectedTicket.status) && (
                <>
                  <button
                    type="button"
                    onClick={handleReopenTicket}
                    disabled={ticketActionLoading}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ArrowLeft size={14} />
                    Reopen
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseTicket}
                    disabled={ticketActionLoading}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} />
                    Close
                  </button>
                </>
              )}

              {selectedTicket.status === "Closed" && (
                <button
                  type="button"
                  onClick={handleReopenTicket}
                  disabled={ticketActionLoading}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowLeft size={14} />
                  Reopen
                </button>
              )}

              <button
                type="button"
                onClick={() => setDeleteTicketOpen(true)}
                disabled={ticketActionLoading}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </section>

        {/* Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={CircleDot}
            label="Status"
            value={selectedTicket.status}
            iconColor="text-violet-600"
          />
          <SummaryCard
            icon={UserRound}
            label="Assigned To"
            value={selectedTicket.assignedTo}
            subtext={selectedTicket.assignedEmployeeId ? "Employee assigned" : "Unassigned"}
            iconColor="text-blue-600"
          />
          <SummaryCard
            icon={CalendarDays}
            label="Due Date"
            value={selectedTicket.dueDate}
            iconColor="text-rose-600"
          />
          <SummaryCard
            icon={Clock3}
            label="Time Spent"
            value={selectedTicket.timeSpent}
            iconColor="text-amber-600"
          />
        </section>

        {/* Tabs */}
        <section className="border-b border-slate-200">
          <div className="flex gap-1 overflow-x-auto">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={FileText}
              label="Overview"
            />
            <TabButton
              active={activeTab === "conversation"}
              onClick={() => setActiveTab("conversation")}
              icon={MessageSquare}
              label="Conversation"
              count={selectedTicket.replies}
            />
            <TabButton
              active={activeTab === "timeline"}
              onClick={() => setActiveTab("timeline")}
              icon={Clock}
              label="Timeline"
              count={selectedTicket.timeline?.length || 0}
            />
            <TabButton
              active={activeTab === "attachments"}
              onClick={() => setActiveTab("attachments")}
              icon={Paperclip}
              label="Attachments"
              count={selectedTicket.attachments}
            />
            <TabButton
              active={activeTab === "activity"}
              onClick={() => setActiveTab("activity")}
              icon={Activity}
              label="Activity"
            />
          </div>
        </section>

        {/* Tab Content */}
        <section className="pb-10">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "conversation" && renderConversation()}
          {activeTab === "timeline" && renderTimeline()}
          {activeTab === "attachments" && renderAttachments()}
          {activeTab === "activity" && renderActivity()}
        </section>

        {/* Modals */}
        {resolveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close resolution modal"
              onClick={closeResolveModal}
              className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            <div className="enterprise-modal relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
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
                  onClick={closeResolveModal}
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
                  onClick={closeResolveModal}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveTicket}
                  disabled={ticketActionLoading || !resolutionNote.trim()}
                  className={`flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-semibold text-white transition ${resolutionNote.trim()
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "cursor-not-allowed bg-emerald-300"
                    }`}
                >
                  <CheckCircle2 size={16} />
                  {ticketActionLoading ? "Resolving..." : "Confirm Resolution"}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteTicketOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close delete confirmation"
              onClick={() => !ticketActionLoading && setDeleteTicketOpen(false)}
              className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            <div className="enterprise-modal relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.30)]">
              <div className="flex items-start gap-4 border-b border-slate-200 px-6 py-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <AlertCircle size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-950">
                    Delete Support Ticket?
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    This ticket will be removed from the active ticket list.
                  </p>
                </div>
              </div>
              <div className="px-6 py-6">
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-500">
                    Ticket
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedTicket.id}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {selectedTicket.title}
                  </p>
                  <p className="mt-2 text-[10px] text-slate-500">
                    {selectedTicket.client} · {selectedTicket.product}
                  </p>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  This is a soft delete. The document will remain in MongoDB with:
                </p>
                <code className="mt-2 block rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-100">
                  isDeleted: true
                </code>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                <button
                  type="button"
                  disabled={ticketActionLoading}
                  onClick={() => setDeleteTicketOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={ticketActionLoading}
                  onClick={handleDeleteTicket}
                  className="flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <AlertCircle size={16} />
                  {ticketActionLoading ? "Deleting..." : "Delete Ticket"}
                </button>
              </div>
            </div>
          </div>
        )}

        {attachmentModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close attachment modal"
              onClick={() => !attachmentSaving && setAttachmentModalOpen(false)}
              className="enterprise-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            <form
              onSubmit={handleAddAttachment}
              className="enterprise-modal relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.3)]"
            >
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Paperclip size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      Add Attachment
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Add a file URL or document reference.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={attachmentSaving}
                  onClick={() => setAttachmentModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="space-y-5 px-6 py-6">
                {attachmentError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                    {attachmentError}
                  </div>
                )}
                <label className="group flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-violet-400 hover:bg-violet-50">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setAttachmentError("");
                      if (file && file.size > 10 * 1024 * 1024) {
                        setSelectedAttachmentFile(null);
                        setAttachmentError("File size must not exceed 10 MB.");
                        event.target.value = "";
                        return;
                      }
                      setSelectedAttachmentFile(file);
                    }}
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <Paperclip size={21} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-900">
                    Choose attachment
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Images, PDF, Word, Excel, text, CSV or ZIP
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    Maximum size: 10 MB
                  </p>
                </label>
                {selectedAttachmentFile && (
                  <div className="flex items-center gap-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                      <Paperclip size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {selectedAttachmentFile.name}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {selectedAttachmentFile.type || "Unknown file type"} ·{" "}
                        {(selectedAttachmentFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={attachmentSaving}
                      onClick={() => setSelectedAttachmentFile(null)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                <button
                  type="button"
                  disabled={attachmentSaving}
                  onClick={() => setAttachmentModalOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={attachmentSaving || !selectedAttachmentFile}
                  className="h-10 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {attachmentSaving ? "Uploading..." : "Upload Attachment"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Main list view
 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
    <div className="enterprise-page mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page heading */}
  {/* Premium Page Header */}
<section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:px-7 lg:px-8">
  <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-100/60 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl" />

  <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20">
        <Headphones size={21} />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
            Service Management
          </span>

          <span className="h-1 w-1 rounded-full bg-slate-300" />

          <span className="text-[10px] font-semibold text-slate-400">
            Support Operations
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[28px]">
          Support Tickets
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Manage client issues, employee assignments, SLA progress,
          conversations and complete resolution history from one workspace.
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right xl:block">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Total Tickets
        </p>

        <p className="mt-0.5 text-lg font-bold text-slate-900">
          {tickets.length}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setEditTicketMode(false);
          setEditingTicketId(null);
          setTicketForm(emptyTicketForm);
          setTicketFormError("");
          setCreateTicketAttachment(null);
          setNewTicketOpen(true);
        }}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
      >
        <Plus size={17} />
        Create Ticket
      </button>
    </div>
  </div>
</section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => setActiveView("Open")}
          className={`enterprise-surface--interactive rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${activeView === "Open"
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
          className={`enterprise-surface--interactive rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${activeView === "Critical"
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
          className={`enterprise-surface--interactive rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${activeView === "Waiting"
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
          className={`enterprise-surface--interactive rounded-2xl border bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${activeView === "Resolved"
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
      <section className="enterprise-surface overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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

        {/* Loading State */}
        {ticketsLoading && (
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />
              <p className="mt-3 text-xs font-semibold text-slate-600">
                Loading support tickets...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!ticketsLoading && ticketsError && (
          <div className="enterprise-empty-state m-5 flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
            <AlertCircle size={26} className="text-rose-500" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Unable to load tickets
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {ticketsError}
            </p>
            <button
              type="button"
              onClick={loadTickets}
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Ticket Table */}
        {!ticketsLoading && !ticketsError && (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="enterprise-table min-w-full">
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
                              onClick={() => openTicketDetails(ticket)}
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
                            onClick={() => openTicketDetails(ticket)}
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
                        onClick={() => openTicketDetails(ticket)}
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
              <div className="enterprise-empty-state m-5 flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
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
          </>
        )}
      </section>

      {/* Create ticket drawer */}
      {/* =========================================================
    PREMIUM CREATE / EDIT SUPPORT TICKET DRAWER
      ========================================================= */}
      {newTicketOpen && (
        <div className="fixed inset-0 z-[80]">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close create ticket drawer"
            onClick={closeCreateTicketDrawer}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px]"
          />

          {/* Drawer */}
          <div className="absolute inset-y-0 right-0 flex w-full max-w-[900px] flex-col overflow-hidden border-l border-slate-200 bg-[#f8fafc] shadow-[-30px_0_80px_rgba(15,23,42,0.18)]">

            {/* ================= HEADER ================= */}
            <div className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-white">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500" />

              <div className="flex min-h-[96px] items-center justify-between gap-6 px-6 py-5 lg:px-8">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20">
                    {editTicketMode ? (
                      <Edit size={20} />
                    ) : (
                      <TicketCheck size={20} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                        Support Operations
                      </span>

                      <span className="h-1 w-1 rounded-full bg-slate-300" />

                      <span className="text-[10px] font-medium text-slate-400">
                        {editTicketMode ? "Edit Ticket" : "New Ticket"}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold tracking-[-0.025em] text-slate-950">
                      {editTicketMode
                        ? "Update Support Ticket"
                        : "Create Support Ticket"}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {editTicketMode
                        ? "Update issue details, responsibility and service information."
                        : "Record the client issue with complete support and assignment information."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCreateTicketDrawer}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleCreateTicket}
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* ================= SCROLLABLE CONTENT ================= */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-6 p-5 sm:p-6 lg:p-8">

                  {/* =====================================================
                SECTION 1 - CLIENT INFORMATION
            ===================================================== */}
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Building size={17} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Client Information
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Select the client and affected software product.
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid gap-5 md:grid-cols-2">

                        {/* Client */}
                        <div>
                          <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Client
                            <span className="text-rose-500">*</span>
                          </label>

                          <div className="relative">
                            <Building
                              size={16}
                              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <select
                              required
                              value={ticketForm.clientId}
                              disabled={mastersLoading}
                              onChange={(event) => {
                                const clientId = event.target.value;

                                const selectedClient = clients.find(
                                  (client) =>
                                    String(client.id) === String(clientId)
                                );

                                setTicketForm((current) => ({
                                  ...current,
                                  clientId,
                                  client: selectedClient?.companyName || "",
                                  productId: "",
                                  product: "",
                                }));

                                setTicketFormError("");
                              }}
                              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50 disabled:opacity-60"
                            >
                              <option value="">
                                {mastersLoading
                                  ? "Loading clients..."
                                  : "Select client"}
                              </option>

                              {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                  {client.companyName}
                                  {client.clientCode
                                    ? ` (${client.clientCode})`
                                    : ""}
                                </option>
                              ))}
                            </select>

                            <ChevronDown
                              size={15}
                              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>
                        </div>

                        {/* Product */}
                        <div>
                          <label className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Product
                            <span className="text-rose-500">*</span>
                          </label>

                          <div className="relative">
                            <Package
                              size={16}
                              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <select
                              required
                              value={ticketForm.productId}
                              disabled={!ticketForm.clientId || mastersLoading}
                              onChange={(event) => {
                                const productId = event.target.value;

                                const selectedProduct =
                                  selectedCreateClientProducts.find(
                                    (product) =>
                                      String(product.id) ===
                                      String(productId)
                                  );

                                setTicketForm((current) => ({
                                  ...current,
                                  productId,
                                  product:
                                    selectedProduct?.productName || "",
                                }));

                                setTicketFormError("");
                              }}
                              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                            >
                              <option value="">
                                {!ticketForm.clientId
                                  ? "Select client first"
                                  : selectedCreateClientProducts.length === 0
                                    ? "No products assigned"
                                    : "Select product"}
                              </option>

                              {selectedCreateClientProducts.map((product) => (
                                <option
                                  key={product.id || product.productName}
                                  value={product.id}
                                >
                                  {product.productName}
                                  {product.version
                                    ? ` - ${product.version}`
                                    : ""}
                                </option>
                              ))}
                            </select>

                            <ChevronDown
                              size={15}
                              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Selected client information */}
                      {selectedCreateClient && (
                        <div className="mt-5 grid gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:grid-cols-3">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-500">
                              Contact Person
                            </p>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-800">
                              {selectedCreateClient.contactPerson || "Not available"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-500">
                              Mobile
                            </p>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-800">
                              {selectedCreateClient.mobile || "Not available"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-500">
                              Email
                            </p>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-800">
                              {selectedCreateClient.email || "Not available"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* =====================================================
                SECTION 2 - ISSUE INFORMATION
            ===================================================== */}
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <FileText size={17} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Issue Information
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Describe exactly where the problem occurred and what happened.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5 p-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        {/* Module */}
                        <div>
                          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Module
                          </label>

                          <div className="relative">
                            <Tag
                              size={16}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                              name="module"
                              value={ticketForm.module}
                              onChange={handleTicketFormChange}
                              placeholder="Sales Billing, GST, Stock..."
                              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                          </div>
                        </div>

                        {/* Category */}
                        <div>
                          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Category
                          </label>

                          <div className="relative">
                            <Hash
                              size={16}
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <select
                              name="category"
                              value={ticketForm.category}
                              onChange={handleTicketFormChange}
                              className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            >
                              <option value="Other">Other</option>
                              <option value="Bug">Bug</option>
                              <option value="Configuration">
                                Configuration
                              </option>
                              <option value="Data Issue">Data Issue</option>
                              <option value="Performance">
                                Performance
                              </option>
                              <option value="Training">Training</option>
                              <option value="Feature Request">
                                Feature Request
                              </option>
                            </select>

                            <ChevronDown
                              size={15}
                              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Issue title */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Issue Title
                            <span className="ml-1 text-rose-500">*</span>
                          </label>

                          <span className="text-[10px] text-slate-400">
                            Keep the title short and specific
                          </span>
                        </div>

                        <input
                          required
                          name="title"
                          value={ticketForm.title}
                          onChange={handleTicketFormChange}
                          placeholder="Example: Invoice print shows incorrect GST amount"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Problem Description
                            <span className="ml-1 text-rose-500">*</span>
                          </label>

                          <span className="text-[10px] text-slate-400">
                            Include error, expected result and steps
                          </span>
                        </div>

                        <textarea
                          required
                          name="description"
                          value={ticketForm.description}
                          onChange={handleTicketFormChange}
                          rows={6}
                          placeholder="Describe the issue in detail. Include what the client was doing, expected result, actual result and any error message..."
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                      </div>
                    </div>
                  </section>

                  {/* =====================================================
                SECTION 3 - PRIORITY / ASSIGNMENT / SLA
            ===================================================== */}
                  <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Users size={17} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Assignment & Service Control
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Set urgency, issue source, responsible employee and due date.
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid gap-5 md:grid-cols-2">

                        {/* Priority */}
                        <div>
                          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Priority
                          </label>

                          <select
                            name="priority"
                            value={ticketForm.priority}
                            onChange={handleTicketFormChange}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                          >
                            {priorityOptions.map((priority) => (
                              <option key={priority}>
                                {priority}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Source */}
                        <div>
                          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Ticket Source
                          </label>

                          <select
                            name="source"
                            value={ticketForm.source}
                            onChange={handleTicketFormChange}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                          >
                            {sourceOptions.map((source) => (
                              <option key={source}>
                                {source}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Employee */}
                        <div>
                          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Assigned Employee
                          </label>

                          <EmployeeAvailabilityPicker
                            employees={employees}
                            selectedEmployee={
                              ticketForm.assignedEmployeeName || ""
                            }
                            onSelect={(employeeName) => {
                              const employee = employees.find(
                                (item) =>
                                  item.name === employeeName
                              );

                              setTicketForm((current) => ({
                                ...current,
                                assignedEmployeeId:
                                  employee?.id || "",
                                assignedEmployeeName:
                                  employee?.name || "",
                                assignedEmployeeCode:
                                  employee?.employeeCode || "",
                              }));

                              setTicketFormError("");
                            }}
                          />

                          {ticketForm.assignedEmployeeId ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTicketForm((current) => ({
                                  ...current,
                                  assignedEmployeeId: "",
                                  assignedEmployeeName: "",
                                  assignedEmployeeCode: "",
                                }));
                              }}
                              className="mt-2 text-[10px] font-semibold text-slate-500 transition hover:text-rose-600"
                            >
                              Remove assignment
                            </button>
                          ) : (
                            <p className="mt-2 text-[10px] text-slate-400">
                              Leave blank if the issue is not assigned yet.
                            </p>
                          )}
                        </div>

                        {/* Due date */}
                        <div>
                          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                            Due Date
                          </label>

                          <div className="relative">
                            <CalendarDays
                              size={16}
                              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                              type="date"
                              name="dueDate"
                              value={ticketForm.dueDate}
                              onChange={handleTicketFormChange}
                              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* =====================================================
                SECTION 4 - ATTACHMENT
            ===================================================== */}
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Paperclip size={17} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            Supporting Attachment
                          </h3>

                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                            OPTIONAL
                          </span>
                        </div>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Add screenshots, reports, logs or documents that help diagnose the issue.
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center transition-all hover:border-violet-300 hover:bg-violet-50/40">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                          onChange={(event) => {
                            const file =
                              event.target.files?.[0] || null;

                            setTicketFormError("");

                            if (
                              file &&
                              file.size > 10 * 1024 * 1024
                            ) {
                              setCreateTicketAttachment(null);

                              setTicketFormError(
                                "Attachment size must not exceed 10 MB."
                              );

                              event.target.value = "";
                              return;
                            }

                            setCreateTicketAttachment(file);
                          }}
                        />

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-100 bg-white text-violet-600 shadow-sm transition group-hover:-translate-y-0.5">
                          <Paperclip size={20} />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-800">
                          {createTicketAttachment
                            ? createTicketAttachment.name
                            : "Click to attach supporting file"}
                        </p>

                        <p className="mt-1 max-w-md text-[10px] leading-5 text-slate-500">
                          {createTicketAttachment
                            ? `${(
                              createTicketAttachment.size / 1024
                            ).toFixed(1)} KB selected`
                            : "PNG, JPG, PDF, Word, Excel, TXT, CSV or ZIP · Maximum file size 10 MB"}
                        </p>

                        {!createTicketAttachment && (
                          <span className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm">
                            Browse File
                          </span>
                        )}
                      </label>

                      {createTicketAttachment && (
                        <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <CheckCircle2
                              size={16}
                              className="shrink-0 text-emerald-600"
                            />

                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-emerald-900">
                                {createTicketAttachment.name}
                              </p>

                              <p className="mt-0.5 text-[9px] text-emerald-700">
                                Ready to upload
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setCreateTicketAttachment(null)
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm transition hover:text-rose-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* ================= ERROR ================= */}
                  {ticketFormError && (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                        <AlertCircle size={17} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-rose-900">
                          {editTicketMode
                            ? "Unable to update ticket"
                            : "Unable to create ticket"}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-rose-700">
                          {ticketFormError}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ================= STICKY FOOTER ================= */}
              <div className="shrink-0 border-t border-slate-200 bg-white/95 px-5 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-semibold text-slate-500">
                      <span className="text-rose-500">*</span> Required information
                    </p>

                    <p className="mt-0.5 text-[9px] text-slate-400">
                      Ticket activity will be recorded in the audit timeline.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeCreateTicketDrawer}
                      className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={savingTicket || mastersLoading}
                      className="flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {savingTicket ? (
                        <>
                          <Clock3 size={15} />
                          {editTicketMode
                            ? "Updating..."
                            : "Creating..."}
                        </>
                      ) : editTicketMode ? (
                        <>
                          <Edit size={15} />
                          Update Ticket
                        </>
                      ) : (
                        <>
                          <Plus size={15} />
                          Create Ticket
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
       </div>
  </div>
);
}
