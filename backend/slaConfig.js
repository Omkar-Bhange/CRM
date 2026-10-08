/**
 * SLA Policy & Calculation Engine
 * Single Source of Truth for Support Ticket Service Level Agreements.
 *
 * All SLA targets are measured on a continuous 24x7 calendar elapsed time basis.
 */

const DEFAULT_SLA_POLICY = {
  Critical: {
    firstResponseMinutes: 60,    // 1 hour
    resolutionMinutes: 240,     // 4 hours
  },
  High: {
    firstResponseMinutes: 120,   // 2 hours
    resolutionMinutes: 480,     // 8 hours
  },
  Medium: {
    firstResponseMinutes: 240,   // 4 hours
    resolutionMinutes: 1440,    // 24 hours (1 day)
  },
  Low: {
    firstResponseMinutes: 480,   // 8 hours
    resolutionMinutes: 2880,    // 48 hours (2 days)
  },
};

const SLA_POLICY_VERSION = "default-v1";

/**
 * Returns the SLA policy targets for a given priority.
 * Fallbacks to "Medium" if priority is undefined or unknown.
 */
function getTicketSlaPolicy(priority) {
  const normalized = String(priority || "Medium").trim();
  const titleCase =
    normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  return DEFAULT_SLA_POLICY[titleCase] || DEFAULT_SLA_POLICY.Medium;
}

/**
 * Calculates a due timestamp from an anchor Date plus duration in minutes.
 */
function calculateDueAt(createdAt, minutes) {
  const base = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (isNaN(base.getTime())) {
    return new Date(Date.now() + minutes * 60000);
  }
  return new Date(base.getTime() + minutes * 60000);
}

/**
 * Formats duration in minutes to human-readable string (e.g. 45m, 1h 20m, 1d 4h).
 */
function formatDurationMinutes(minutes) {
  const total = Math.max(0, Math.round(Math.abs(minutes || 0)));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * Calculates comprehensive SLA state for a ticket.
 *
 * @param {Object} ticket - Mongoose doc or plain object representing SupportTicket
 * @param {Date} now - Current time reference (defaults to new Date())
 * @returns {Object} Structured SLA calculations
 */
function calculateTicketSla(ticket, now = new Date()) {
  if (!ticket) return null;

  const refNow = now instanceof Date ? now : new Date(now);
  const created = ticket.createdAt ? new Date(ticket.createdAt) : refNow;

  // 1. Determine targets (snapshot preferred, derived for legacy tickets)
  const isSnapshot = Boolean(
    ticket.slaFirstResponseMinutes && ticket.slaResolutionMinutes
  );
  const source = isSnapshot ? "snapshot" : "derived";

  const policy = getTicketSlaPolicy(ticket.priority);
  const firstResponseTargetMinutes =
    Number(ticket.slaFirstResponseMinutes) || policy.firstResponseMinutes;
  const resolutionTargetMinutes =
    Number(ticket.slaResolutionMinutes) || policy.resolutionMinutes;

  // 2. Determine due timestamps
  const firstResponseDueAt = ticket.firstResponseDueAt
    ? new Date(ticket.firstResponseDueAt)
    : calculateDueAt(created, firstResponseTargetMinutes);

  const resolutionDueAt = ticket.resolutionDueAt
    ? new Date(ticket.resolutionDueAt)
    : calculateDueAt(created, resolutionTargetMinutes);

  // 3. Resolution State & Timestamps
  const isResolvedState = ["Resolved", "Verified", "Closed"].includes(
    ticket.status
  );
  const resolvedTimestamp = ticket.resolvedAt
    ? new Date(ticket.resolvedAt)
    : ticket.firstResolvedAt
    ? new Date(ticket.firstResolvedAt)
    : ticket.closedAt && isResolvedState
    ? new Date(ticket.closedAt)
    : isResolvedState && ticket.updatedAt
    ? new Date(ticket.updatedAt)
    : null;

  // 4. First Response SLA Calculation
  let firstRespondedAt = ticket.firstResponseAt
    ? new Date(ticket.firstResponseAt)
    : null;

  // Production-level rule:
  // If the ticket was resolved/closed and no prior separate reply was logged,
  // the resolution itself provided the response to the client.
  if (!firstRespondedAt && isResolvedState && resolvedTimestamp) {
    firstRespondedAt = resolvedTimestamp;
  }

  let firstResponseStatus = "On Track";
  let firstResponseRemainingMinutes = 0;
  let firstResponseElapsedMinutes = 0;

  if (firstRespondedAt) {
    firstResponseElapsedMinutes = Math.max(
      0,
      Math.round((firstRespondedAt.getTime() - created.getTime()) / 60000)
    );
    firstResponseRemainingMinutes = 0;
    firstResponseStatus =
      firstRespondedAt.getTime() <= firstResponseDueAt.getTime()
        ? "Met"
        : "Breached";
  } else if (isResolvedState) {
    // Ticket is completed; it can never be "Overdue" or "Due Soon"
    firstResponseElapsedMinutes = Math.max(
      0,
      Math.round((refNow.getTime() - created.getTime()) / 60000)
    );
    firstResponseRemainingMinutes = 0;
    firstResponseStatus = "Met";
  } else {
    // Active, in-progress tickets awaiting response:
    firstResponseElapsedMinutes = Math.max(
      0,
      Math.round((refNow.getTime() - created.getTime()) / 60000)
    );
    const diffMs = firstResponseDueAt.getTime() - refNow.getTime();
    firstResponseRemainingMinutes = Math.round(diffMs / 60000);

    if (refNow.getTime() > firstResponseDueAt.getTime()) {
      firstResponseStatus = "Overdue";
    } else if (
      firstResponseRemainingMinutes <= 0.25 * firstResponseTargetMinutes
    ) {
      firstResponseStatus = "Due Soon";
    } else {
      firstResponseStatus = "On Track";
    }
  }

  // 5. Resolution SLA Calculation
  let resolutionStatus = "On Track";
  let resolutionRemainingMinutes = 0;
  let resolutionElapsedMinutes = 0;

  if (isResolvedState) {
    const effectiveResolutionTime = resolvedTimestamp || refNow;
    resolutionElapsedMinutes = Math.max(
      0,
      Math.round((effectiveResolutionTime.getTime() - created.getTime()) / 60000)
    );
    resolutionRemainingMinutes = 0;
    resolutionStatus =
      effectiveResolutionTime.getTime() <= resolutionDueAt.getTime()
        ? "Met"
        : "Breached";
  } else {
    // Active, unresolved tickets:
    resolutionElapsedMinutes = Math.max(
      0,
      Math.round((refNow.getTime() - created.getTime()) / 60000)
    );
    const diffResMs = resolutionDueAt.getTime() - refNow.getTime();
    resolutionRemainingMinutes = Math.round(diffResMs / 60000);

    if (refNow.getTime() > resolutionDueAt.getTime()) {
      resolutionStatus = "Overdue";
    } else if (
      resolutionRemainingMinutes <= 0.25 * resolutionTargetMinutes
    ) {
      resolutionStatus = "Due Soon";
    } else {
      resolutionStatus = "On Track";
    }
  }

  return {
    source,
    policyVersion: ticket.slaPolicyVersion || SLA_POLICY_VERSION,
    calendarPolicy: "24x7",

    // First Response SLA
    firstResponseTargetMinutes,
    firstResponseDueAt: firstResponseDueAt.toISOString(),
    firstRespondedAt: firstRespondedAt ? firstRespondedAt.toISOString() : null,
    firstResponseStatus,
    firstResponseRemainingMinutes,
    firstResponseElapsedMinutes,
    firstResponseDisplay: formatDurationMinutes(firstResponseElapsedMinutes),

    // Resolution SLA
    resolutionTargetMinutes,
    resolutionDueAt: resolutionDueAt.toISOString(),
    resolvedAt: resolvedTimestamp ? resolvedTimestamp.toISOString() : null,
    resolutionStatus,
    resolutionRemainingMinutes,
    resolutionElapsedMinutes,
    resolutionDisplay: formatDurationMinutes(resolutionElapsedMinutes),
  };
}

module.exports = {
  DEFAULT_SLA_POLICY,
  SLA_POLICY_VERSION,
  getTicketSlaPolicy,
  calculateDueAt,
  formatDurationMinutes,
  calculateTicketSla,
};

