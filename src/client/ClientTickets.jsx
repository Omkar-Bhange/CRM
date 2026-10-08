import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Headphones,
  LifeBuoy,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  X,
  FileImage,
  Star,
} from "lucide-react";
import API_URL from "../config/api";

function formatDisplayDate(dateVal) {
  if (!dateVal) return "—";
  const date = new Date(dateVal);
  if (Number.isNaN(date.getTime())) return String(dateVal);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Client Status Mapping
// New -> Open, Assigned / In Progress / Testing -> In Progress, Resolved / Verified -> Resolved, Closed -> Closed
function mapClientTicketStatus(backendStatus) {
  const status = String(backendStatus || "New").trim();
  if (status === "New") {
    return {
      label: "Open",
      rawStatus: "New",
      badgeClass: "bg-blue-50 text-blue-700 ring-blue-600/20",
      dotClass: "bg-blue-500",
    };
  }
  if (["Assigned", "In Progress", "Testing", "Waiting for Client"].includes(status)) {
    return {
      label: "In Progress",
      rawStatus: status,
      badgeClass: "bg-violet-50 text-violet-700 ring-violet-600/20",
      dotClass: "bg-violet-500",
    };
  }
  if (["Resolved", "Verified"].includes(status)) {
    return {
      label: "Resolved",
      rawStatus: "Resolved",
      badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      dotClass: "bg-emerald-500",
    };
  }
  if (status === "Closed") {
    return {
      label: "Closed",
      rawStatus: "Closed",
      badgeClass: "bg-slate-100 text-slate-600 ring-slate-500/20",
      dotClass: "bg-slate-400",
    };
  }
  return {
    label: status,
    rawStatus: status,
    badgeClass: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dotClass: "bg-slate-400",
  };
}

function StatusBadge({ status }) {
  const info = mapClientTicketStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${info.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${info.dotClass}`} />
      {info.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const p = String(priority || "Medium").toLowerCase();
  const styles = {
    critical: "bg-rose-50 text-rose-700 ring-rose-600/20",
    high: "bg-orange-50 text-orange-700 ring-orange-600/20",
    medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
    low: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
        styles[p] || styles.medium
      }`}
    >
      {priority || "Medium"}
    </span>
  );
}

function formatDuration(minutes) {
  const total = Math.max(0, Math.round(Math.abs(minutes || 0)));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

function ClientSlaPill({ type, sla, status }) {
  if (!sla) return null;
  const isResolved = ["Resolved", "Verified", "Closed"].includes(status);

  if (type === "response") {
    // If ticket is already resolved, first response SLA is fulfilled (Met) or Breached, never Overdue
    if (isResolved) {
      if (sla.firstResponseStatus === "Met") {
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
            title={`First responded: ${sla.firstRespondedAt ? formatDisplayDate(sla.firstRespondedAt) : "At resolution"}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Resp in {sla.firstResponseDisplay || sla.resolutionDisplay || "time"} ✓
          </span>
        );
      }
      if (sla.firstResponseStatus === "Breached") {
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20"
            title={`First response breached target deadline: ${formatDisplayDate(sla.firstResponseDueAt)}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Resp: {sla.firstResponseDisplay || "Breached"}
          </span>
        );
      }
      // Defensive fallback: resolved ticket must never show Overdue
      return null;
    }

    if (sla.firstRespondedAt) {
      const isMet = sla.firstResponseStatus === "Met";
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${
            isMet
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-amber-50 text-amber-700 ring-amber-600/20"
          }`}
          title={`First responded: ${formatDisplayDate(sla.firstRespondedAt)}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isMet ? "bg-emerald-500" : "bg-amber-500"}`} />
          {isMet ? `Resp in ${sla.firstResponseDisplay} ✓` : `Resp: ${sla.firstResponseDisplay}`}
        </span>
      );
    }

    if (sla.firstResponseStatus === "Overdue") {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20"
          title={`Expected response by: ${formatDisplayDate(sla.firstResponseDueAt)}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          Resp Overdue ({formatDuration(-sla.firstResponseRemainingMinutes)})
        </span>
      );
    }

    if (sla.firstResponseStatus === "Due Soon") {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20"
          title={`Expected response by: ${formatDisplayDate(sla.firstResponseDueAt)}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Resp in {formatDuration(sla.firstResponseRemainingMinutes)}
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-400/20"
        title={`Expected response by: ${formatDisplayDate(sla.firstResponseDueAt)}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Resp in {formatDuration(sla.firstResponseRemainingMinutes)}
      </span>
    );
  }

  if (type === "resolution") {
    if (isResolved) {
      const isMet = sla.resolutionStatus === "Met";
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${
            isMet
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-amber-50 text-amber-700 ring-amber-600/20"
          }`}
          title={sla.resolvedAt ? `Resolved at: ${formatDisplayDate(sla.resolvedAt)}` : "Ticket resolved"}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isMet ? "bg-emerald-500" : "bg-amber-500"}`} />
          {isMet ? `Resolved in ${sla.resolutionDisplay || "time"} ✓` : `Resolved: ${sla.resolutionDisplay || "Breached"}`}
        </span>
      );
    }

    if (sla.resolutionStatus === "Overdue") {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20"
          title={`Expected resolution by: ${formatDisplayDate(sla.resolutionDueAt)}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          Res Overdue ({formatDuration(-sla.resolutionRemainingMinutes)})
        </span>
      );
    }

    if (sla.resolutionStatus === "Due Soon") {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20"
          title={`Expected resolution by: ${formatDisplayDate(sla.resolutionDueAt)}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Res in {formatDuration(sla.resolutionRemainingMinutes)}
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-400/20"
        title={`Expected resolution by: ${formatDisplayDate(sla.resolutionDueAt)}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Res in {formatDuration(sla.resolutionRemainingMinutes)}
      </span>
    );
  }

  return null;
}

function StarRatingDisplay({ rating = 0, max = 5, size = 13, className = "" }) {
  const safeRating = Math.max(0, Math.min(max, Math.round(Number(rating) || 0)));
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${safeRating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, idx) => {
        const starValue = idx + 1;
        const isFilled = starValue <= safeRating;
        return (
          <Star
            key={starValue}
            size={size}
            className={isFilled ? "fill-amber-400 text-amber-500" : "fill-slate-100 text-slate-300"}
          />
        );
      })}
    </div>
  );
}

function StarRatingInput({ value = 0, onChange, disabled = false }) {
  const [hoverValue, setHoverValue] = useState(0);
  const ratingLabels = {
    1: "Poor — Did not resolve well",
    2: "Fair — Slower than expected",
    3: "Average — Resolved adequately",
    4: "Good — Prompt and helpful",
    5: "Excellent — Outstanding support",
  };

  const activeRating = hoverValue || value;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Support experience rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className={`p-1 rounded-md transition transform active:scale-90 focus:outline-none focus:ring-2 focus:ring-[#1B59F8]/30 ${
              disabled ? "cursor-not-allowed opacity-60" : "hover:scale-110 cursor-pointer"
            }`}
          >
            <Star
              size={22}
              className={`transition-colors ${
                star <= activeRating
                  ? "fill-amber-400 text-amber-500"
                  : "fill-slate-100 text-slate-300 hover:text-amber-300"
              }`}
            />
          </button>
        ))}
      </div>
      <p className="text-[11px] font-medium text-slate-500 h-4">
        {activeRating ? ratingLabels[activeRating] : "Select 1 to 5 stars"}
      </p>
    </div>
  );
}

function TicketSlaSection({ ticket }) {
  const sla = ticket?.sla;
  if (!sla) return null;

  const isResolved = ["Resolved", "Verified", "Closed"].includes(ticket.status);

  let respBadge = { text: "On Track", color: "bg-blue-50 text-blue-700 ring-blue-600/20" };
  if (sla.firstRespondedAt) {
    respBadge =
      sla.firstResponseStatus === "Met"
        ? { text: "Responded Within Target", color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" }
        : { text: "Responded After Target", color: "bg-amber-50 text-amber-700 ring-amber-600/20" };
  } else if (isResolved) {
    respBadge =
      sla.firstResponseStatus === "Met"
        ? { text: "Responded Within Target", color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" }
        : { text: "Responded After Target", color: "bg-amber-50 text-amber-700 ring-amber-600/20" };
  } else if (sla.firstResponseStatus === "Overdue") {
    respBadge = { text: "Overdue", color: "bg-rose-50 text-rose-700 ring-rose-600/20" };
  } else if (sla.firstResponseStatus === "Due Soon") {
    respBadge = { text: "Due Soon", color: "bg-amber-50 text-amber-700 ring-amber-600/20" };
  }

  let resBadge = { text: "On Track", color: "bg-blue-50 text-blue-700 ring-blue-600/20" };
  if (isResolved) {
    resBadge =
      sla.resolutionStatus === "Met"
        ? { text: "Resolved Within Target", color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" }
        : { text: "Resolved After Target", color: "bg-amber-50 text-amber-700 ring-amber-600/20" };
  } else if (sla.resolutionStatus === "Overdue") {
    resBadge = { text: "Overdue", color: "bg-rose-50 text-rose-700 ring-rose-600/20" };
  } else if (sla.resolutionStatus === "Due Soon") {
    resBadge = { text: "Due Soon", color: "bg-amber-50 text-amber-700 ring-amber-600/20" };
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <Clock3 size={14} />
          </div>
          <h4 className="text-xs font-bold text-slate-900">Service Level Targets (SLA)</h4>
        </div>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          24x7 Calendar
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* First Response SLA Card */}
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              First Response
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${respBadge.color}`}>
              {respBadge.text}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Target:</span>
              <span className="font-semibold text-slate-900">{formatDuration(sla.firstResponseTargetMinutes)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Expected by:</span>
              <span className="font-medium text-slate-800">{formatDisplayDate(sla.firstResponseDueAt)}</span>
            </div>
            {sla.firstRespondedAt || isResolved ? (
              <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-1">
                <span>Responded in:</span>
                <span className={`font-bold ${sla.firstResponseStatus === "Met" ? "text-emerald-700" : "text-amber-700"}`}>
                  {sla.firstResponseDisplay || sla.resolutionDisplay || "N/A"}
                </span>
              </div>
            ) : (
              <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-1">
                <span>Remaining:</span>
                <span className={`font-bold ${sla.firstResponseStatus === "Overdue" ? "text-rose-600" : "text-blue-600"}`}>
                  {sla.firstResponseStatus === "Overdue"
                    ? `Overdue by ${formatDuration(-sla.firstResponseRemainingMinutes)}`
                    : formatDuration(sla.firstResponseRemainingMinutes)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Resolution SLA Card */}
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Resolution
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${resBadge.color}`}>
              {resBadge.text}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Target:</span>
              <span className="font-semibold text-slate-900">{formatDuration(sla.resolutionTargetMinutes)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Expected by:</span>
              <span className="font-medium text-slate-800">{formatDisplayDate(sla.resolutionDueAt)}</span>
            </div>
            {isResolved ? (
              <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-1">
                <span>Resolved in:</span>
                <span className={`font-bold ${sla.resolutionStatus === "Met" ? "text-emerald-700" : "text-amber-700"}`}>
                  {sla.resolutionDisplay || "N/A"}
                </span>
              </div>
            ) : (
              <div className="flex justify-between text-slate-600 border-t border-slate-200/60 pt-1">
                <span>Remaining:</span>
                <span className={`font-bold ${sla.resolutionStatus === "Overdue" ? "text-rose-600" : "text-blue-600"}`}>
                  {sla.resolutionStatus === "Overdue"
                    ? `Overdue by ${formatDuration(-sla.resolutionRemainingMinutes)}`
                    : formatDuration(sla.resolutionRemainingMinutes)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 italic">
        SLA targets are measured on a 24x7 calendar basis.
      </p>
    </div>
  );
}

function SummaryCard({ label, value, description, icon: Icon, iconClass, valueClass = "text-slate-900" }) {
  return (
    <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className={`mt-1 truncate text-xl font-bold tracking-tight ${valueClass}`}>
            {value}
          </p>
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-1.5 truncate text-[11px] text-slate-500">
        {description}
      </p>
    </article>
  );
}

const emptyTicketForm = {
  product: "",
  category: "Billing",
  priority: "Medium",
  title: "",
  description: "",
  attachment: null,
  attachmentName: "",
};

export default function ClientTickets({ client, navParams = {}, onNavigate }) {
  const [tickets, setTickets] = useState([]);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [raiseTicketOpen, setRaiseTicketOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccessNotice, setFeedbackSuccessNotice] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6);

  const getAuthToken = () => {
    return (
      localStorage.getItem("client-connect-token") ||
      sessionStorage.getItem("client-connect-token") ||
      ""
    );
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getAuthToken();

      const response = await fetch(`${API_URL}/api/client/tickets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load support tickets.");
      }

      setTickets(result.data || []);
    } catch (err) {
      console.error("Load tickets error:", err);
      setError(err.message || "Unable to fetch support tickets.");
    } finally {
      setLoading(false);
    }
  };

  // Load registered products for dropdown
  const loadClientProducts = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/client/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success && result.data?.products) {
        setProductList(result.data.products);
      }
    } catch (err) {
      console.error("Load products error:", err);
    }
  };

  useEffect(() => {
    loadTickets();
    loadClientProducts();
  }, []);

  // Handle navigation params from MyProducts or Overview
  useEffect(() => {
    if (navParams?.openCreateModal) {
      setRaiseTicketOpen(true);
    }
    if (navParams?.preselectedProduct) {
      setTicketForm((prev) => ({
        ...prev,
        product: navParams.preselectedProduct,
      }));
    }
  }, [navParams]);

  const selectedTicket = useMemo(() => {
    return tickets.find((t) => (t._id || t.id) === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  // Status Summary Counters
  const openCount = tickets.filter(
    (t) => ["New", "Waiting for Client"].includes(t.status)
  ).length;

  const inProgressCount = tickets.filter(
    (t) => ["Assigned", "In Progress", "Testing"].includes(t.status)
  ).length;

  const resolvedCount = tickets.filter(
    (t) => ["Resolved", "Closed", "Verified"].includes(t.status)
  ).length;

  // Filtered Tickets
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
        ].some((val) => String(val || "").toLowerCase().includes(search));

      const mappedStatus = mapClientTicketStatus(ticket.status).label;
      const matchesStatus =
        statusFilter === "All" ||
        mappedStatus === statusFilter ||
        ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchValue, statusFilter, priorityFilter]);

  // Paginated Tickets
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedTickets = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, safePage, pageSize]);

  // Form Handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTicketForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0] || null;
    setTicketForm((prev) => ({
      ...prev,
      attachment: file,
      attachmentName: file?.name || "",
    }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
      alert("Please provide both a ticket subject and description.");
      return;
    }

    const defaultProduct =
      ticketForm.product ||
      productList[0]?.productName ||
      productList[0]?.name ||
      "ERP S/W";

    try {
      setSubmitting(true);
      const token = getAuthToken();

      const formData = new FormData();
      formData.append("title", ticketForm.title.trim());
      formData.append("description", ticketForm.description.trim());
      formData.append("productName", defaultProduct);
      formData.append("category", ticketForm.category || "Billing");
      formData.append("priority", ticketForm.priority || "Medium");
      formData.append("module", "General");

      if (ticketForm.attachment) {
        formData.append("attachment", ticketForm.attachment);
      }

      const response = await fetch(`${API_URL}/api/client/tickets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create support ticket.");
      }

      await loadTickets();
      setRaiseTicketOpen(false);
      setTicketForm(emptyTicketForm);
      setSelectedTicketId(result.data?._id || result.data?.id || null);
    } catch (err) {
      console.error("Submit ticket error:", err);
      alert(err.message || "Unable to submit support ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reply Handler
  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const token = getAuthToken();
      const ticketId = selectedTicket._id || selectedTicket.id;

      const response = await fetch(`${API_URL}/api/client/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send reply.");
      }

      // Update in-memory ticket list
      setTickets((prev) =>
        prev.map((t) =>
          (t._id || t.id) === ticketId ? result.data : t
        )
      );
      setReplyText("");
    } catch (err) {
      console.error("Send reply error:", err);
      alert(err.message || "Failed to send message.");
    } finally {
      setSendingReply(false);
    }
  };

  // Confirm Resolution or Reopen Handler
  const handleStatusChange = async (newStatus, note) => {
    if (!selectedTicket) return;

    try {
      setUpdatingStatus(true);
      const token = getAuthToken();
      const ticketId = selectedTicket._id || selectedTicket.id;

      const response = await fetch(`${API_URL}/api/client/tickets/${ticketId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, note }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update ticket status.");
      }

      setTickets((prev) =>
        prev.map((t) =>
          (t._id || t.id) === ticketId ? result.data : t
        )
      );
    } catch (err) {
      console.error("Update status error:", err);
      alert(err.message || "Failed to update ticket.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    setFeedbackRating(0);
    setFeedbackComment("");
    setFeedbackError("");
    setFeedbackSuccessNotice(false);
  }, [selectedTicketId]);

  const handleSubmitFeedback = async () => {
    if (!selectedTicket) return;
    if (!feedbackRating || feedbackRating < 1 || feedbackRating > 5) {
      setFeedbackError("Please select a rating from 1 to 5 stars.");
      return;
    }

    try {
      setSubmittingFeedback(true);
      setFeedbackError("");
      const token = getAuthToken();
      const ticketId = selectedTicket._id || selectedTicket.id;

      const response = await fetch(`${API_URL}/api/client/tickets/${ticketId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to submit feedback.");
      }

      setTickets((prev) =>
        prev.map((t) => ((t._id || t.id) === ticketId ? result.data : t))
      );
      setFeedbackSuccessNotice(true);
    } catch (err) {
      console.error("Submit feedback error:", err);
      setFeedbackError(err.message || "Unable to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <section className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
              Helpdesk Desk
            </span>
            <span className="text-xs text-slate-400">Total Solution Portal</span>
          </div>
          <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Support Tickets
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 max-w-2xl">
            Raise technical issues, track resolution timeline, and communicate directly with assigned support engineers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRaiseTicketOpen(true)}
          className="inline-flex h-8.5 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 active:scale-98"
        >
          <Plus size={14} />
          Raise New Ticket
        </button>
      </section>

      {/* Top 3 Summary Counters (Open, In Progress, Resolved) */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label="Total Tickets"
          value={tickets.length}
          description="All submitted inquiries"
          icon={Headphones}
          iconClass="bg-blue-50 text-[#1B59F8]"
        />

        <SummaryCard
          label="Open Tickets"
          value={openCount}
          description="Awaiting assignment / review"
          icon={AlertTriangle}
          iconClass="bg-amber-50 text-amber-700"
          valueClass={openCount > 0 ? "text-amber-700 font-bold" : "text-slate-900"}
        />

        <SummaryCard
          label="In Progress"
          value={inProgressCount}
          description="Currently being investigated"
          icon={Clock3}
          iconClass="bg-violet-50 text-violet-700"
          valueClass={inProgressCount > 0 ? "text-violet-700 font-bold" : "text-slate-900"}
        />

        <SummaryCard
          label="Resolved"
          value={resolvedCount}
          description="Successfully resolved tickets"
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-700"
          valueClass="text-emerald-700 font-bold"
        />
      </section>

      {/* Tickets List Card */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200/90 p-3.5 sm:px-4 sm:py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Support Inquiries
            </h2>
            <p className="text-[11px] text-slate-400">
              Tickets raised for {client?.companyName || "your account"}
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
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ticket code or title..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B59F8] focus:bg-white focus:ring-1 focus:ring-[#1B59F8]/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/50 flex items-center justify-between"
              >
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-40 rounded bg-slate-200" />
                  <div className="h-2.5 w-64 rounded bg-slate-200" />
                </div>
                <div className="h-6 w-20 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-2">
              <AlertTriangle size={20} />
            </div>
            <p className="text-sm font-bold text-slate-900">Failed to load tickets</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
            <button
              type="button"
              onClick={loadTickets}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <RefreshCw size={12} />
              Try Again
            </button>
          </div>
        )}

        {/* Tickets List */}
        {!loading && !error && (
          <div className="divide-y divide-slate-100">
            {paginatedTickets.map((ticket) => {
              const ticketId = ticket._id || ticket.id;
              const isSelected = selectedTicketId === ticketId;
              const hasReplies = (ticket.replies || []).length > 0;

              return (
                <div
                  key={ticketId}
                  onClick={() => setSelectedTicketId(ticketId)}
                  className={`p-3.5 sm:p-4 transition cursor-pointer hover:bg-blue-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    isSelected ? "bg-blue-50/60" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1B59F8]">
                        {ticket.ticketCode}
                      </span>
                      <PriorityBadge priority={ticket.priority} />
                      <span className="text-[11px] font-medium text-slate-400">
                        · {ticket.productName}
                      </span>
                      {ticket.category && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                          {ticket.category}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1 text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                      {ticket.title}
                    </h3>

                    <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                      {ticket.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                      <span>Created {formatDisplayDate(ticket.createdAt)}</span>
                      <span>·</span>
                      <span>Engineer: {ticket.assignedEmployeeName || "Support Desk"}</span>
                      {hasReplies && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                            <MessageSquare size={11} />
                            {(ticket.replies || []).length} message
                            {(ticket.replies || []).length === 1 ? "" : "s"}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {ticket.sla && (
                        <>
                          <ClientSlaPill type="response" sla={ticket.sla} status={ticket.status} />
                          <ClientSlaPill type="resolution" sla={ticket.sla} status={ticket.status} />
                        </>
                      )}
                      {ticket.clientFeedback?.rating ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20"
                          title={`Feedback rating: ${ticket.clientFeedback.rating}/5 stars`}
                        >
                          <Star size={10} className="fill-amber-400 text-amber-500" />
                          <span>{ticket.clientFeedback.rating}/5 Feedback</span>
                        </span>
                      ) : ["Resolved", "Verified", "Closed"].includes(ticket.status) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-[#1B59F8] ring-1 ring-inset ring-blue-600/20">
                          <Star size={10} />
                          <span>Rate Support</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <StatusBadge status={ticket.status} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicketId(ticketId);
                      }}
                      className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-[#1B59F8]"
                    >
                      <span>View</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Reassuring Empty State */}
            {filteredTickets.length === 0 && (
              <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {searchValue || statusFilter !== "All"
                    ? "No tickets match your filter"
                    : "No Open Support Tickets"}
                </h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                  {searchValue || statusFilter !== "All"
                    ? "Try adjusting your search keywords or clear your status filter."
                    : "All systems are running smoothly! If you ever need help or encounter an issue, our support engineers are here to assist."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("");
                    setStatusFilter("All");
                    setRaiseTicketOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition"
                >
                  <Plus size={13} />
                  Raise New Ticket
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination Strip */}
        {filteredTickets.length > pageSize && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 bg-slate-50/50">
            <span>
              Showing {(safePage - 1) * pageSize + 1} to{" "}
              {Math.min(safePage * pageSize, filteredTickets.length)} of{" "}
              {filteredTickets.length} tickets
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2.5 rounded border border-slate-200 bg-white font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-700">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2.5 rounded border border-slate-200 bg-white font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Ticket Details & Conversation Drawer */}
      {selectedTicket && (
        <>
          <button
            type="button"
            aria-label="Close ticket drawer"
            onClick={() => setSelectedTicketId(null)}
            className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-xs"
          />

          <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[650px] flex-col bg-white shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-3.5 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#1B59F8]">
                    {selectedTicket.ticketCode}
                  </span>
                  <StatusBadge status={selectedTicket.status} />
                  <PriorityBadge priority={selectedTicket.priority} />
                </div>
                <h2 className="mt-1 truncate text-sm sm:text-base font-bold text-slate-900">
                  {selectedTicket.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body: Description + Timeline + Conversation */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Snapshot Card */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Product & Category
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {selectedTicket.productName} · {selectedTicket.category || "General"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">
                      Assigned Engineer
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 text-right">
                      {selectedTicket.assignedEmployeeName || "Support Desk"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Reported Issue
                  </p>
                  <p className="mt-1 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Attachments if any */}
                {selectedTicket.attachments?.length > 0 && (
                  <div className="border-t border-slate-200/60 pt-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Attachments ({selectedTicket.attachments.length})
                    </p>
                    <div className="space-y-1.5">
                      {selectedTicket.attachments.map((att, idx) => (
                        <div
                          key={att.url || att.filename || idx}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-blue-600 shrink-0" />
                            <span className="truncate font-medium text-slate-700">
                              {att.originalName || att.filename || "Attachment"}
                            </span>
                          </div>
                          {(att.url || att.fileUrl) && (
                            <a
                              href={att.url || att.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B59F8] hover:underline shrink-0"
                            >
                              <Download size={12} />
                              Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SLA Target & Milestone Section */}
              <TicketSlaSection ticket={selectedTicket} />

              {/* Status Action Banners (Confirm Resolution / Reopen) */}
              {["Resolved", "Verified"].includes(selectedTicket.status) && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-900">
                        Engineer marked this ticket as Resolved
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Please verify that the software issue is corrected. You can confirm resolution to close the ticket, or reopen if you still need assistance.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleStatusChange("Closed", "Client confirmed satisfactory resolution.")}
                          className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                        >
                          Confirm & Close Ticket
                        </button>
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleStatusChange("New", "Client requested further assistance.")}
                          className="h-7 px-3 rounded-lg border border-emerald-300 bg-white text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition"
                        >
                          Reopen Issue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Client Satisfaction Feedback Card (Resolved / Verified / Closed) */}
              {["Resolved", "Verified", "Closed"].includes(selectedTicket.status) && (
                <div>
                  {selectedTicket.clientFeedback?.rating ? (
                    <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 to-amber-50/30 p-4 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                            <Star size={15} className="fill-amber-400 text-amber-500" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-amber-950">
                              Your Support Feedback
                            </h4>
                            <p className="text-[10px] text-amber-700">
                              Submitted {formatDisplayDate(selectedTicket.clientFeedback.submittedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-lg border border-amber-200/70">
                          <StarRatingDisplay rating={selectedTicket.clientFeedback.rating} size={14} />
                          <span className="text-xs font-bold text-amber-800 ml-1">
                            {selectedTicket.clientFeedback.rating}/5
                          </span>
                        </div>
                      </div>

                      {selectedTicket.clientFeedback.comment && (
                        <div className="rounded-lg bg-white/90 p-3 border border-amber-200/50 text-xs italic text-slate-700 leading-relaxed">
                          "{selectedTicket.clientFeedback.comment}"
                        </div>
                      )}

                      <p className="text-[10px] text-amber-800/80 italic">
                        Thank you for your feedback! It helps our team deliver better service.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-white p-4 space-y-3 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#1B59F8] mt-0.5">
                          <Star size={15} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-900">
                            How was your support experience?
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Your rating helps our team evaluate response quality and enhance support.
                          </p>
                        </div>
                      </div>

                      {feedbackError && (
                        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs font-medium text-rose-700">
                          {feedbackError}
                        </div>
                      )}

                      {feedbackSuccessNotice && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs font-medium text-emerald-800">
                          ✓ Thank you! Your feedback has been recorded.
                        </div>
                      )}

                      <div className="space-y-2 bg-white/90 p-3 rounded-lg border border-slate-200/80">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Rating <span className="text-rose-500">*</span>
                        </label>
                        <StarRatingInput
                          value={feedbackRating}
                          onChange={setFeedbackRating}
                          disabled={submittingFeedback}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Comments / Feedback (Optional)
                          </label>
                          <span className="text-[10px] text-slate-400">
                            {feedbackComment.length}/1000
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={feedbackComment}
                          maxLength={1000}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          disabled={submittingFeedback}
                          placeholder="Share details about what went well or where we can improve..."
                          className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={submittingFeedback || !feedbackRating}
                          onClick={handleSubmitFeedback}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 disabled:opacity-40"
                        >
                          <Star size={13} className={feedbackRating > 0 ? "fill-white" : ""} />
                          <span>{submittingFeedback ? "Submitting..." : "Submit Feedback"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conversation Messages Thread */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <MessageSquare size={12} />
                  <span>Conversation History</span>
                </div>

                <div className="space-y-2.5">
                  {/* Initial report message */}
                  <div className="flex flex-col items-start">
                    <div className="max-w-[85%] rounded-xl rounded-tl-xs border border-slate-200 bg-white p-3 shadow-2xs">
                      <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-700">
                          {selectedTicket.contactPerson || client?.contactPerson || "You (Client)"}
                        </span>
                        <span>{formatDisplayDate(selectedTicket.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-800 whitespace-pre-wrap">
                        {selectedTicket.description}
                      </p>
                    </div>
                  </div>

                  {/* Public Replies */}
                  {(selectedTicket.replies || []).map((reply, idx) => {
                    const isClient =
                      reply.authorRole === "client" ||
                      reply.authorName?.toLowerCase() === "you" ||
                      reply.authorName === (selectedTicket.contactPerson || client?.contactPerson);

                    return (
                      <div
                        key={reply._id || reply.id || idx}
                        className={`flex flex-col ${isClient ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl p-3 shadow-2xs ${
                            isClient
                              ? "rounded-tl-xs border border-slate-200 bg-white"
                              : "rounded-tr-xs border border-blue-200 bg-blue-50/80 text-blue-950"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1">
                            <span
                              className={`font-bold ${
                                isClient ? "text-slate-700" : "text-[#1B59F8]"
                              }`}
                            >
                              {reply.authorName || (isClient ? "You" : "Support Engineer")}
                            </span>
                            <span>{formatDisplayDate(reply.createdAt)}</span>
                          </div>
                          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {reply.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reply Input Box at Bottom */}
            <div className="border-t border-slate-200/90 p-3.5 sm:px-6 bg-slate-50/50">
              {selectedTicket.status === "Closed" ? (
                <div className="flex items-center justify-between text-xs text-slate-500 py-1">
                  <span>This ticket is closed.</span>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("New", "Client reopened ticket with new inquiry.")}
                    className="font-bold text-[#1B59F8] hover:underline"
                  >
                    Reopen Ticket to reply
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a reply or question for your support engineer..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 pr-12 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20"
                    />
                    <button
                      type="button"
                      disabled={sendingReply || !replyText.trim()}
                      onClick={handleSendReply}
                      className="absolute right-2.5 bottom-3 flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B59F8] text-white transition hover:bg-blue-700 disabled:opacity-40"
                      title="Send message"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Replies are instantly visible to your assigned support engineer.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Raise New Ticket Modal */}
      {raiseTicketOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close modal"
            onClick={() => {
              setRaiseTicketOpen(false);
              setTicketForm(emptyTicketForm);
            }}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Raise Support Ticket
                </h2>
                <p className="text-[11px] text-slate-500">
                  Submit an issue directly to our dedicated helpdesk team
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRaiseTicketOpen(false);
                  setTicketForm(emptyTicketForm);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {/* Product Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Product / Software <span className="text-rose-500">*</span>
                </label>
                <select
                  name="product"
                  value={ticketForm.product}
                  onChange={handleFormChange}
                  required
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20"
                >
                  <option value="">Select affected software</option>
                  {productList.map((p) => (
                    <option key={p.productName || p.name} value={p.productName || p.name}>
                      {p.productName || p.name} ({p.version || "Active"})
                    </option>
                  ))}
                  {productList.length === 0 && (
                    <option value="ERP S/W">ERP S/W</option>
                  )}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Subject / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={ticketForm.title}
                  onChange={handleFormChange}
                  placeholder="e.g. GST calculation mismatch in monthly report"
                  required
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20"
                />
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={ticketForm.category}
                    onChange={handleFormChange}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20"
                  >
                    <option value="Billing">Billing</option>
                    <option value="GST">GST</option>
                    <option value="Reports">Reports</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Backup">Backup</option>
                    <option value="Login">Login</option>
                    <option value="Bug">Bug / Error</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Severity Priority
                  </label>
                  <select
                    name="priority"
                    value={ticketForm.priority}
                    onChange={handleFormChange}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20"
                  >
                    <option value="Low">Low - Minor question</option>
                    <option value="Medium">Medium - Normal request</option>
                    <option value="High">High - Impaired functionality</option>
                    <option value="Critical">Critical - System down</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  name="description"
                  value={ticketForm.description}
                  onChange={handleFormChange}
                  placeholder="Describe what occurred, any error messages displayed, and steps to reproduce..."
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-[#1B59F8] focus:ring-1 focus:ring-[#1B59F8]/20"
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Screenshot or Document (Optional)
                </label>
                <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 hover:bg-slate-100 transition">
                  <Paperclip size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-600 truncate">
                    {ticketForm.attachmentName || "Upload error screenshot, log or document"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAttachmentChange}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setRaiseTicketOpen(false);
                    setTicketForm(emptyTicketForm);
                  }}
                  className="h-8.5 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus size={14} />
                  <span>{submitting ? "Submitting..." : "Submit Ticket"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}