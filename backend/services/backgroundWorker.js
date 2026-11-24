"use strict";

const AmcContract = require("../models/AmcContract");
const SupportTicket = require("../models/SupportTicket");
const Task = require("../models/Task");
const { notifyClient, notifyEmployee } = require("./notificationService");

/* =========================================================
   AUTONOMOUS ENTERPRISE BACKGROUND WORKER
   Evaluates SLA Breaches, AMC Renewals, and Overdue Tasks
========================================================= */

let isSweeping = false;

/**
 * Helper to calculate day difference between today and target date string (YYYY-MM-DD)
 */
function getDaysRemaining(endDateStr) {
  if (!endDateStr) return null;
  const target = new Date(`${endDateStr}T23:59:59`);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 1. Process Graduated AMC Renewals & Expiry Alerts (T-30, T-15, T-7, Expired)
 * Prevents alert spam by enforcing a 24-hour notification cooldown per contract.
 */
async function checkAmcExpiryAlerts() {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dateStr = thirtyDaysFromNow.toISOString().slice(0, 10);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const expiringContracts = await AmcContract.find({
      status: "Active",
      isDeleted: false,
      endDate: { $lte: dateStr },
      $or: [
        { lastRenewalAlertAt: { $exists: false } },
        { lastRenewalAlertAt: null },
        { lastRenewalAlertAt: { $lt: oneDayAgo } },
      ],
    })
      .populate("clientId", "companyName email mobile")
      .limit(50);

    let sentCount = 0;

    for (const contract of expiringContracts) {
      if (!contract.clientId?._id) continue;

      const daysLeft = getDaysRemaining(contract.endDate);
      let alertTitle = "AMC Renewal Due Soon";
      let alertMessage = `Your Annual Maintenance Contract (${contract.contractNo || "AMC"}) expires on ${contract.endDate}. Please renew early.`;

      if (daysLeft <= 0) {
        alertTitle = "🚨 AMC Expired - Service Interruption Risk";
        alertMessage = `Your Annual Maintenance Contract (${contract.contractNo}) for ${contract.product || "Software"} expired on ${contract.endDate}. Immediate renewal required to keep support active.`;
      } else if (daysLeft <= 7) {
        alertTitle = `⚠️ Urgent: AMC Expires in ${daysLeft} Day${daysLeft === 1 ? "" : "s"}`;
        alertMessage = `Your AMC contract (${contract.contractNo}) expires on ${contract.endDate}. Renew now to avoid support priority downgrade.`;
      } else if (daysLeft <= 15) {
        alertTitle = `AMC Renewal Notice (${daysLeft} Days Remaining)`;
        alertMessage = `Your AMC contract (${contract.contractNo}) for ${contract.product || "Software"} is due for renewal on ${contract.endDate}.`;
      }

      await notifyClient({
        clientId: contract.clientId._id,
        type: "AMC_EXPIRING",
        title: alertTitle,
        message: alertMessage,
        entityType: "amc",
        entityCode: contract.contractNo || "",
        actionUrl: "/billing",
      });

      contract.lastRenewalAlertAt = now;
      await contract.save();
      sentCount++;
    }

    return { processed: sentCount };
  } catch (err) {
    console.error("[Worker Error - AMC Expiry]:", err.message);
    return { error: err.message };
  }
}

/**
 * 2. Process Support Ticket SLA Alerts & Imminent Breach Warnings
 */
async function checkTicketSlaWarnings() {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // A. 1-Hour SLA Warning (Imminent Breach)
    const ticketsNearingBreach = await SupportTicket.find({
      status: { $nin: ["Resolved", "Closed"] },
      isDeleted: false,
      dueAt: { $gt: now, $lte: oneHourFromNow },
      slaWarningSent: { $ne: true },
    })
      .populate("assignedEmployeeId", "name employeeCode email userId")
      .limit(20);

    for (const ticket of ticketsNearingBreach) {
      if (ticket.assignedEmployeeId?._id) {
        await notifyEmployee({
          employeeId: ticket.assignedEmployeeId._id,
          userId: ticket.assignedEmployeeId.userId || null,
          type: "TICKET_SLA_WARNING",
          title: "Urgent: Ticket SLA Breach Imminent (1h Left)",
          message: `Ticket #${ticket.ticketNo || ticket.ticketCode} (${ticket.title}) is within 1 hour of SLA expiration. Immediate resolution required.`,
          entityType: "ticket",
          entityCode: ticket.ticketNo || "",
          actionUrl: `/tickets/${ticket._id}`,
        });
      }
      ticket.slaWarningSent = true;
      await ticket.save();
    }

    // B. SLA Already Breached Detection & Escalation
    const breachedTickets = await SupportTicket.find({
      status: { $nin: ["Resolved", "Closed"] },
      isDeleted: false,
      dueAt: { $lt: now },
      slaBreachedAlertSent: { $ne: true },
    })
      .populate("assignedEmployeeId", "name employeeCode email userId")
      .limit(20);

    for (const ticket of breachedTickets) {
      if (ticket.assignedEmployeeId?._id) {
        await notifyEmployee({
          employeeId: ticket.assignedEmployeeId._id,
          userId: ticket.assignedEmployeeId.userId || null,
          type: "TICKET_SLA_BREACHED",
          title: "🚨 Ticket SLA Breached",
          message: `Ticket #${ticket.ticketNo || ticket.ticketCode} (${ticket.title}) has exceeded its SLA deadline. Escalated for immediate manager review.`,
          entityType: "ticket",
          entityCode: ticket.ticketNo || "",
          actionUrl: `/tickets/${ticket._id}`,
        });
      }
      ticket.isSlaBreached = true;
      ticket.slaBreachedAlertSent = true;
      await ticket.save();
    }

    return { warned: ticketsNearingBreach.length, breached: breachedTickets.length };
  } catch (err) {
    console.error("[Worker Error - Ticket SLA]:", err.message);
    return { error: err.message };
  }
}

/**
 * 3. Process Overdue Tasks with Daily Escalation
 */
async function checkOverdueTasks() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const overdueTasks = await Task.find({
      status: { $nin: ["Completed", "Closed", "Cancelled"] },
      isDeleted: false,
      dueDate: { $lt: today },
      $or: [
        { overdueAlertSent: { $ne: true } },
        { lastOverdueAlertAt: { $exists: false } },
        { lastOverdueAlertAt: { $lt: oneDayAgo } },
      ],
    })
      .populate("assignedEmployeeId", "name employeeCode userId")
      .limit(30);

    for (const task of overdueTasks) {
      if (task.assignedEmployeeId?._id) {
        await notifyEmployee({
          employeeId: task.assignedEmployeeId._id,
          userId: task.assignedEmployeeId.userId || null,
          type: "TASK_OVERDUE",
          title: "Task Overdue Notice",
          message: `Task ${task.taskCode || task.taskNo}: "${task.title}" was due on ${task.dueDate} and is currently overdue.`,
          entityType: "task",
          entityCode: task.taskCode || "",
          actionUrl: `/tasks`,
        });
      }
      task.overdueAlertSent = true;
      task.lastOverdueAlertAt = new Date();
      await task.save();
    }

    return { overdueProcessed: overdueTasks.length };
  } catch (err) {
    console.error("[Worker Error - Overdue Tasks]:", err.message);
    return { error: err.message };
  }
}

/**
 * Run All Routine Maintenance Sweeps (Protected by concurrency lock)
 */
async function runAllMaintenanceTasksNow() {
  if (isSweeping) {
    console.log("[Background Worker] Sweep already in progress. Skipping overlapping execution.");
    return { skipped: true };
  }

  isSweeping = true;
  try {
    const [amc, sla, tasks] = await Promise.all([
      checkAmcExpiryAlerts(),
      checkTicketSlaWarnings(),
      checkOverdueTasks(),
    ]);
    return { amc, sla, tasks, timestamp: new Date() };
  } finally {
    isSweeping = false;
  }
}

let workerIntervalId = null;

/**
 * Initialize Background Autonomous Worker (Runs every 30 minutes)
 */
function startBackgroundWorker(intervalMs = 30 * 60 * 1000) {
  if (workerIntervalId) return;

  // Run initial lightweight pass after 10 seconds of startup
  setTimeout(() => {
    runAllMaintenanceTasksNow().catch((e) => console.error("[Worker Startup Pass Error]:", e.message));
  }, 10000);

  workerIntervalId = setInterval(() => {
    runAllMaintenanceTasksNow().catch((e) => console.error("[Worker Interval Error]:", e.message));
  }, intervalMs);

  console.log(`[Enterprise Background Worker] Running on a ${Math.round(intervalMs / 60000)}-minute cycle.`);
}

function stopBackgroundWorker() {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
  }
}

module.exports = {
  checkAmcExpiryAlerts,
  checkTicketSlaWarnings,
  checkOverdueTasks,
  runAllMaintenanceTasksNow,
  startBackgroundWorker,
  stopBackgroundWorker,
};
