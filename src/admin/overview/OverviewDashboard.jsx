import { useMemo } from "react";
import {
  Building2,
  IndianRupee,
  CreditCard,
  TicketCheck,
  CalendarDays,
  Plus,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Download,
  FileText,
  MoreHorizontal,
  Circle,
  UserPlus,
  CheckCircle2,
  MessageSquare,
  PlayCircle,
  CircleDot,
  Flag,
  Timer,
  Activity,
  ClipboardList,
  BriefcaseBusiness,
  Users,
} from "lucide-react";

export default function OverviewDashboard({
  user,
  dashboardStats = [],
  dashboardLoading = false,
  dashboardError = null,
  onRetryDashboard,
  amcRenewals = [],
  teamMembers = [],
  recentTickets = [],
  activeTasks = [],
  clientActivities = [],
  onOpenAddClient,
  onNavigate,
}) {
  // Dynamic time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = user?.name || user?.fullName || "Administrator";

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const getStatusClasses = (status) => {
    if (status === "Paid") return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    if (status === "Pending") return "bg-amber-50 text-amber-700 ring-amber-600/10";
    if (status === "Overdue") return "bg-rose-50 text-rose-700 ring-rose-600/10";
    return "bg-slate-100 text-slate-700 ring-slate-600/10";
  };

  const getPriorityClasses = (priority) => {
    if (priority === "Critical") return "bg-rose-50 text-rose-700 ring-rose-600/10";
    if (priority === "High") return "bg-orange-50 text-orange-700 ring-orange-600/10";
    if (priority === "Medium") return "bg-amber-50 text-amber-700 ring-amber-600/10";
    return "bg-slate-100 text-slate-600 ring-slate-500/10";
  };

  const getTicketStatusClasses = (status) => {
    if (status === "Resolved" || status === "Verified" || status === "Closed") {
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    }
    if (status === "In Progress" || status === "Testing") {
      return "bg-violet-50 text-violet-700 ring-violet-600/10";
    }
    if (status === "Waiting for Client") {
      return "bg-amber-50 text-amber-700 ring-amber-600/10";
    }
    return "bg-slate-100 text-slate-700 ring-slate-600/10";
  };

  const getTaskStatusClasses = (status) => {
    if (status === "Completed") return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
    if (status === "In Progress") return "bg-violet-50 text-violet-700 ring-violet-600/10";
    if (status === "Testing") return "bg-blue-50 text-blue-700 ring-blue-600/10";
    if (status === "Waiting") return "bg-rose-50 text-rose-700 ring-rose-600/10";
    return "bg-slate-100 text-slate-600 ring-slate-500/10";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Greeting - Clean Linear Production Standard */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            Executive CRM Workspace
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {greeting}, {userName}
          </h1>

          <p className="mt-0.5 text-xs text-slate-500">
            Live operational overview of clients, sales pipeline, AMC collections, and support status.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 shadow-2xs">
            <CalendarDays size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800 text-xs">
              {todayFormatted}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenAddClient}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1548D1] active:bg-[#0F3DB8] transition"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Client</span>
          </button>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <section
        aria-busy={dashboardLoading}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {dashboardLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 space-y-3"
            >
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-7 w-28 bg-slate-300 rounded" />
              <div className="h-3 w-36 bg-slate-100 rounded mt-4" />
            </div>
          ))
        ) : dashboardError ? (
          <div className="col-span-full flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-600" />
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Dashboard metrics unavailable
                </p>
                <p className="text-[11px] text-slate-500">{dashboardError}</p>
              </div>
            </div>
            {onRetryDashboard && (
              <button
                type="button"
                onClick={onRetryDashboard}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <RefreshCw size={13} />
                Retry
              </button>
            )}
          </div>
        ) : (
          dashboardStats.map((stat) => {
            const Icon = stat.icon || Building2;
            const isPositive = stat.trend === "up";

            return (
              <article
                key={stat.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg ${
                      stat.iconStyle || "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Icon size={17} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                  <span
                    className={`flex items-center gap-1 font-semibold ${
                      isPositive ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {stat.change}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (stat.label.includes("Client")) onNavigate?.("clients");
                      else if (stat.label.includes("AMC")) onNavigate?.("billing");
                      else if (stat.label.includes("Ticket")) onNavigate?.("tickets");
                      else if (stat.label.includes("Lead") || stat.label.includes("Pipeline")) onNavigate?.("requirements");
                    }}
                    className="text-slate-400 hover:text-slate-800 transition"
                    title="View details"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Row 1: AMC Renewals Due & Team Status */}
      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
        {/* AMC Renewals Due & Overdue */}
        <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                AMC Renewals — Due & Overdue
              </h2>
              <p className="text-[11px] text-slate-500">
                Monitor upcoming renewals and pending annual maintenance payments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("billing")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>View All Contracts</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Client</th>
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Due Date</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {amcRenewals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No pending or overdue renewals
                    </td>
                  </tr>
                ) : (
                  amcRenewals.slice(0, 5).map((renewal) => (
                    <tr
                      key={renewal.id}
                      className="hover:bg-slate-50/70 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[11px] font-bold text-blue-700">
                            {(renewal.client || "CL")
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {renewal.client}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {renewal.contact || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {renewal.product}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {renewal.amount}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {renewal.dueDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${getStatusClasses(
                            renewal.status
                          )}`}
                        >
                          {renewal.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Team Live Status */}
        <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Team Workload Status
              </h2>
              <p className="text-[11px] text-slate-500">
                Staff availability & live activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("team")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Full Team
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 p-2">
            {teamMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active team data available
              </div>
            ) : (
              teamMembers.slice(0, 4).map((member) => {
                const isFree = member.status === "Free";
                const isLeave = member.status === "Leave";

                return (
                  <div
                    key={member.id}
                    className="p-2.5 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                          {member.initials}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${
                            isFree
                              ? "bg-emerald-500"
                              : isLeave
                              ? "bg-slate-300"
                              : "bg-amber-400"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {member.name}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {member.workingTime || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] mt-0.5">
                          <span className="text-slate-500 truncate">
                            {member.currentTask || "Available"}
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                              isFree
                                ? "bg-emerald-50 text-emerald-700"
                                : isLeave
                                ? "bg-slate-100 text-slate-500"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {member.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Row 2: Recent Support Tickets & Active Tasks */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Recent Tickets */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Recent Support Tickets
              </h2>
              <p className="text-[11px] text-slate-500">
                Client issues requiring immediate action.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("tickets")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              All Tickets →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTickets.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No tickets to display
              </div>
            ) : (
              recentTickets.slice(0, 4).map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onNavigate?.("tickets")}
                  className="p-3.5 hover:bg-slate-50/70 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                          {ticket.id}
                        </span>
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {ticket.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {ticket.client} • {ticket.product}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${getPriorityClasses(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${getTicketStatusClasses(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Active Tasks */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Active Tasks & Workload
              </h2>
              <p className="text-[11px] text-slate-500">
                Assigned team development and client tasks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("tasks")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              All Tasks →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activeTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active tasks to display
              </div>
            ) : (
              activeTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onNavigate?.("tasks")}
                  className="p-3.5 hover:bg-slate-50/70 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                          {task.id}
                        </span>
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {task.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {task.client} • Assigned to {task.assignedTo || "Unassigned"}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-600"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {task.progress || 0}%
                        </span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${getTaskStatusClasses(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Row 3: Recent Activity Feed */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/50">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Recent CRM Activity Log
            </h2>
            <p className="text-[11px] text-slate-500">
              Audit trail of ticket, billing, and client updates.
            </p>
          </div>
          <Activity size={16} className="text-slate-400" />
        </div>

        <div className="p-4 divide-y divide-slate-100">
          {clientActivities.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No recent activity recorded
            </div>
          ) : (
            clientActivities.slice(0, 5).map((act) => {
              const ActIcon = act.icon || Activity;
              return (
                <div key={act.id} className="py-3 flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      act.iconStyle || "bg-violet-50 text-violet-600"
                    }`}
                  >
                    <ActIcon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {act.description}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    {act.time}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

