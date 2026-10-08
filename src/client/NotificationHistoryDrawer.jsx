import React, { useMemo } from "react";
import {
  X,
  Bell,
  CheckCheck,
  CreditCard,
  FileText,
  Headphones,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Inbox,
  Loader2,
  Clock3,
} from "lucide-react";

export function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function getNotificationMeta(type) {
  switch (type) {
    case "INVOICE_GENERATED":
      return {
        icon: FileText,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        badge: "Invoice",
        badgeColor: "bg-blue-100 text-blue-700",
        actionLabel: "View Invoice",
        target: "billing",
      };
    case "PAYMENT_RECEIVED":
      return {
        icon: CreditCard,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        badge: "Payment",
        badgeColor: "bg-emerald-100 text-emerald-700",
        actionLabel: "View Receipt",
        target: "billing",
      };
    case "TICKET_CREATED":
      return {
        icon: Headphones,
        color: "text-amber-600 bg-amber-50 border-amber-200",
        badge: "Ticket",
        badgeColor: "bg-amber-100 text-amber-700",
        actionLabel: "View Ticket",
        target: "tickets",
      };
    case "TICKET_UPDATED":
      return {
        icon: Headphones,
        color: "text-indigo-600 bg-indigo-50 border-indigo-200",
        badge: "Update",
        badgeColor: "bg-indigo-100 text-indigo-700",
        actionLabel: "View Ticket",
        target: "tickets",
      };
    case "TICKET_RESOLVED":
      return {
        icon: CheckCircle2,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        badge: "Resolved",
        badgeColor: "bg-emerald-100 text-emerald-700",
        actionLabel: "View Ticket",
        target: "tickets",
      };
    case "AMC_EXPIRING":
      return {
        icon: AlertTriangle,
        color: "text-rose-600 bg-rose-50 border-rose-200",
        badge: "Expiry",
        badgeColor: "bg-rose-100 text-rose-700",
        actionLabel: "View Renewals",
        target: "billing",
      };
    case "AMC_RENEWED":
      return {
        icon: ShieldCheck,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        badge: "Renewed",
        badgeColor: "bg-emerald-100 text-emerald-700",
        actionLabel: "View AMC",
        target: "billing",
      };
    case "AMC_REQUEST_SUBMITTED":
      return {
        icon: Clock3,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        badge: "Request",
        badgeColor: "bg-blue-100 text-blue-700",
        actionLabel: "View Request",
        target: "billing",
      };
    case "AMC_REQUEST_UPDATED":
      return {
        icon: ShieldCheck,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        badge: "Processed",
        badgeColor: "bg-emerald-100 text-emerald-700",
        actionLabel: "View Request",
        target: "billing",
      };
    case "AMC_QUOTATION_READY":
      return {
        icon: FileText,
        color: "text-purple-600 bg-purple-50 border-purple-200",
        badge: "Quotation",
        badgeColor: "bg-purple-100 text-purple-700",
        actionLabel: "View Quotation",
        target: "billing",
      };
    case "DOCUMENT_SHARED":
      return {
        icon: FileText,
        color: "text-teal-600 bg-teal-50 border-teal-200",
        badge: "Document",
        badgeColor: "bg-teal-100 text-teal-700",
        actionLabel: "View Agreements",
        target: "documents",
      };
    default:
      return {
        icon: Bell,
        color: "text-slate-600 bg-slate-50 border-slate-200",
        badge: "Notice",
        badgeColor: "bg-slate-100 text-slate-700",
        actionLabel: "View Details",
        target: "overview",
      };
  }
}

function getDateGroup(dateString) {
  if (!dateString) return "Earlier";
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const notifDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - notifDay) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return "Earlier";
}

export default function NotificationHistoryDrawer({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  filter = "all",
  onFilterChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
  onLoadMore,
  hasMore = false,
  loading = false,
}) {
  // Chronological grouping
  const groupedNotifications = useMemo(() => {
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    for (const notif of notifications) {
      const g = getDateGroup(notif.createdAt);
      if (groups[g]) {
        groups[g].push(notif);
      } else {
        groups.Earlier.push(notif);
      }
    }
    return groups;
  }, [notifications]);

  if (!isOpen) return null;

  const tabs = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "billing", label: "Billing & Payments" },
    { id: "tickets", label: "Support Tickets" },
    { id: "contracts", label: "Contracts & Docs" },
  ];

  const handleCardClick = async (notif) => {
    if (!notif.isRead && onMarkAsRead) {
      await onMarkAsRead(notif.id || notif._id);
    }
    if (onNavigate && notif.navigationTarget) {
      onNavigate(notif.navigationTarget);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1B59F8] border border-blue-100">
                <Bell size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    Notification History
                  </h2>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Important account updates & activities
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                  title="Mark all notifications as read"
                >
                  <CheckCheck size={14} className="text-[#1B59F8]" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                title="Close drawer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/70 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex items-center gap-1.5 min-w-max">
              {tabs.map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onFilterChange(tab.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      active
                        ? "bg-[#1B59F8] text-white shadow-xs"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {typeof tab.count === "number" && tab.count > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          active ? "bg-white text-[#1B59F8]" : "bg-rose-500 text-white"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification List Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 size={24} className="animate-spin text-[#1B59F8] mb-2" />
                <p className="text-xs text-slate-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                  <Inbox size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No notifications</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {filter === "unread"
                    ? "You're all caught up! There are no unread notifications right now."
                    : "No notifications match this category yet."}
                </p>
              </div>
            ) : (
              <>
                {["Today", "Yesterday", "Earlier"].map((groupName) => {
                  const list = groupedNotifications[groupName];
                  if (!list || list.length === 0) return null;

                  return (
                    <div key={groupName} className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[11px] font-bold tracking-wide uppercase text-slate-400">
                          {groupName}
                        </span>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>

                      <div className="space-y-2">
                        {list.map((notif) => {
                          const meta = getNotificationMeta(notif.type);
                          const Icon = meta.icon;

                          return (
                            <div
                              key={notif.id || notif._id}
                              onClick={() => handleCardClick(notif)}
                              className={`group relative rounded-xl border p-3 transition cursor-pointer ${
                                notif.isRead
                                  ? "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                  : "bg-blue-50/40 border-blue-200 hover:bg-blue-50/70 shadow-2xs"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon Badge */}
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}
                                >
                                  <Icon size={16} />
                                </div>

                                {/* Body */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p
                                        className={`text-xs font-semibold ${
                                          notif.isRead ? "text-slate-800" : "text-slate-900 font-bold"
                                        }`}
                                      >
                                        {notif.title}
                                      </p>
                                      <span
                                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${meta.badgeColor}`}
                                      >
                                        {meta.badge}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {formatRelativeTime(notif.createdAt)}
                                      </span>
                                      {!notif.isRead && (
                                        <span className="h-2 w-2 rounded-full bg-[#1B59F8]" />
                                      )}
                                    </div>
                                  </div>

                                  <p className="mt-1 text-xs text-slate-600 leading-relaxed break-words">
                                    {notif.message}
                                  </p>

                                  {/* Action CTA */}
                                  <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-100/80">
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {notif.entityCode || ""}
                                    </span>
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B59F8] hover:text-[#1548D1] group-hover:translate-x-0.5 transition-transform"
                                    >
                                      <span>{meta.actionLabel}</span>
                                      <ChevronRight size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Load More Button */}
                {hasMore && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={onLoadMore}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-[#1B59F8]" />
                          <span>Loading more...</span>
                        </>
                      ) : (
                        <span>Load More Notifications</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-center text-[11px] text-slate-400 shrink-0">
            Real-time self-service account history
          </div>
        </div>
      </div>
    </div>
  );
}

