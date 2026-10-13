const express = require("express");

const mongoose = require("mongoose");


const bcrypt = require("bcryptjs");
require("./admin");
const { calculateTicketSla } = require("./slaConfig");
const authenticateUser = require("./authMiddleware");

const User =
  mongoose.models.User ||
  mongoose.model("User");

const Task =
  mongoose.models.Task ||
  mongoose.model("Task");
const { getISTDateBucket, getISTDateString } = require("./utils/dateUtils");
const Project =
  mongoose.models.Project ||
  mongoose.model("Project");

/* =========================================================
   SYNC PROJECT PROGRESS FROM PROJECT TASKS
========================================================= */

async function syncProjectTaskProgress(projectId) {
  if (
    !projectId ||
    !mongoose.Types.ObjectId.isValid(projectId)
  ) {
    return null;
  }

  const project = await Project.findOne({
    _id: projectId,
    isDeleted: false,
  });

  if (!project) {
    return null;
  }

  const projectTasks = await Task.find({
    projectId: project._id,
    taskFor: "Project",
    isDeleted: false,
  })
    .select("status progress dueDate")
    .lean();

  const totalTasks =
    projectTasks.length;

  const completedTasks =
    projectTasks.filter(
      (task) =>
        task.status === "Completed" ||
        Number(task.progress || 0) >= 100
    ).length;

  const activeTasks =
    projectTasks.filter(
      (task) =>
        ![
          "Completed",
          "Closed",
          "Cancelled",
        ].includes(task.status)
    ).length;

  const now = new Date();

  /*
   * A task becomes overdue only AFTER
   * the end of its due date.
   *
   * Example:
   * Due Date = 20 Aug
   * It remains valid throughout 20 Aug.
   * It becomes overdue on 21 Aug.
   */
  const overdueTasks =
    projectTasks.filter((task) => {
      if (!task.dueDate) {
        return false;
      }

      if (
        [
          "Completed",
          "Closed",
          "Cancelled",
        ].includes(task.status)
      ) {
        return false;
      }

      const dueDate =
        new Date(task.dueDate);

      dueDate.setHours(
        23,
        59,
        59,
        999
      );

      return dueDate < now;
    }).length;

  const progress =
    totalTasks > 0
      ? Math.round(
        projectTasks.reduce(
          (sum, task) =>
            sum +
            Math.min(
              100,
              Math.max(
                0,
                Number(
                  task.progress || 0
                )
              )
            ),
          0
        ) / totalTasks
      )
      : 0;

  if (
    Number(project.progress || 0) !==
    progress
  ) {
    project.progress =
      progress;

    await project.save();
  }

  return {
    totalTasks,
    completedTasks,
    activeTasks,
    overdueTasks,
    progress,
  };
}
const router = express.Router();
require("./agentSession"); // register models

const AgentDailySummary =
  mongoose.models.AgentDailySummary ||
  mongoose.model("AgentDailySummary");

/* =========================================================
   EMPLOYEE NOTIFICATION MODEL
========================================================= */
const EmployeeNotification = require("./models/EmployeeNotification");
/* =========================================================
   EMPLOYEE SCHEMA
========================================================= */

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    employeeCode: {
      type: String,
      required: [true, "Employee code is required."],
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: [true, "Employee name is required."],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Employee email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      required: [true, "Employee role is required."],
      trim: true,
    },

    department: {
      type: String,
      enum: [
        "Support",
        "Development",
        "Operations",
        "Accounts",
        "Management",
        "Sales",
        "Other",
      ],
      default: "Support",
    },

    joiningDate: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Free",
        "Working",
        "Break",
        "Leave",
        "Offline",
        "Inactive",
      ],
      default: "Free",
    },




    currentTask: {
      type: String,
      default: "Available for assignment",
      trim: true,
    },

    // NEW: Active task reference
    currentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    currentTicketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      default: null,
    },

    currentTaskCode: {
      type: String,
      default: "",
      trim: true,
    },

    currentTaskTitle: {
      type: String,
      default: "",
      trim: true,
    },

    currentClient: {
      type: String,
      default: "—",
      trim: true,
    },

    currentProject: {
      type: String,
      default: "—",
      trim: true,
    },

    // NEW: When the employee started the active task
    currentTaskStartedAt: {
      type: Date,
      default: null,
    },


    loginTime: {
      type: Date,
      default: null,
    },

    logoutTime: {
      type: Date,
      default: null,
    },

    activeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    openTasks: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedToday: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastActivityAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "employees",
  }
);

const Employee =
  mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema);

/* =========================================================
   EMPLOYEE DAILY NOTE MODEL
========================================================= */
const EmployeeDailyNote = require("./models/EmployeeDailyNote");

const SupportTicket =
  mongoose.models.SupportTicket;

/* =========================================================
   HELPERS
========================================================= */

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizeEmployeeCode(employeeCode) {
  return String(employeeCode || "")
    .trim()
    .toUpperCase();
}

function employeeResponse(employee) {
  return {
    id: employee._id,
    _id: employee._id,
    userId: employee.userId,
    employeeCode: employee.employeeCode,
    name: employee.name,
    initials: employee.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join(""),
    email: employee.email,
    mobile: employee.mobile,
    role: employee.role,
    department: employee.department,
    joiningDate: employee.joiningDate,
    status: employee.status,
    currentTask: employee.currentTask,
    client: employee.currentClient,
    project: employee.currentProject,
    loginTime: employee.loginTime,
    logoutTime: employee.logoutTime,
    activeMinutes: employee.activeMinutes,
    openTasks: employee.openTasks,
    completedToday: employee.completedToday,
    lastActivityAt: employee.lastActivityAt,
    isActive: employee.isActive,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}
async function resolveLinkedTicket(task) {
  if (!task.ticketId) return;
  const SupportTicket = mongoose.models.SupportTicket;
  const ticket = await SupportTicket.findById(task.ticketId);
  if (!ticket) return;
  if (["Resolved", "Closed"].includes(ticket.status)) return;

  ticket.status = "Resolved";
  ticket.resolvedAt = new Date();
  if (!ticket.firstResolvedAt) {
    ticket.firstResolvedAt = ticket.resolvedAt;
  }
  if (!ticket.firstResponseAt) {
    ticket.firstResponseAt = ticket.resolvedAt;
  }
  ticket.resolutionNote = `Resolved by completing linked task ${task.taskCode} – ${task.title}.`;
  ticket.timeline.push({
    type: "resolved",
    title: "Ticket Resolved Automatically",
    description: `Resolved after linked task ${task.taskCode} was completed.`,
    performedBy: task.assignedBy || null,
    performedByName: "System",
    performedByRole: "system",
  });
  await ticket.save();

  const Client = mongoose.models.Client;
  if (Client) {
    const openCount = await SupportTicket.countDocuments({
      clientId: ticket.clientId,
      isDeleted: false,
      status: { $nin: ["Resolved", "Verified", "Closed", "Cancelled"] },
    });
    await Client.updateOne(
      { _id: ticket.clientId },
      { $set: { openTickets: openCount } }
    );
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access is required.",
    });
  }

  next();
}

/* =========================================================
   AUTHENTICATION
========================================================= */

router.use(authenticateUser);

/* =========================================================
   TEST ROUTE
   GET /api/employee/test
========================================================= */

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Employee API is working.",
    authenticatedUser: {
      id: req.user._id,
      role: req.user.role,
    },
  });
});

/* =========================================================
   GET ALL EMPLOYEES
   Admin only

   GET /api/employee/employees
========================================================= */

router.get(
  "/employees",
  requireAdmin,
  async (req, res, next) => {
    try {
      const {
        search = "",
        status = "All",
        department = "All",
      } = req.query;

      const query = {};

      if (status !== "All") {
        query.status = status;
      }

      if (department !== "All") {
        query.department = department;
      }

      const normalizedSearch =
        String(search || "").trim();

      if (normalizedSearch) {
        query.$or = [
          {
            employeeCode: {
              $regex: normalizedSearch,
              $options: "i",
            },
          },
          {
            name: {
              $regex: normalizedSearch,
              $options: "i",
            },
          },
          {
            email: {
              $regex: normalizedSearch,
              $options: "i",
            },
          },
          {
            mobile: {
              $regex: normalizedSearch,
              $options: "i",
            },
          },
          {
            role: {
              $regex: normalizedSearch,
              $options: "i",
            },
          },
          {
            department: {
              $regex: normalizedSearch,
              $options: "i",
            },
          },
        ];
      }

      const employees =
        await Employee.find(query)
          .sort({
            name: 1,
          })
          .lean();

      /*
       * ---------------------------------------------------------
       * TODAY IST
       * ---------------------------------------------------------
       */
      const todayBucket =
        getISTDateBucket(
          new Date()
        );

      const enrichedEmployees =
        await Promise.all(
          employees.map(
            async (employee) => {
              /*
               * -------------------------------------------------
               * OPEN TASK COUNT
               *
               * Always calculate from Task collection.
               * Never trust Employee.openTasks.
               * -------------------------------------------------
               */
              const openTasks =
                await Task.countDocuments({
                  assignedEmployeeId:
                    employee._id,

                  isDeleted: false,

                  status: {
                    $nin: [
                      "Completed",
                      "Closed",
                      "Cancelled",
                    ],
                  },
                });

              /*
               * -------------------------------------------------
               * TOTAL COMPLETED TASKS
               * -------------------------------------------------
               */
              const completedTasks =
                await Task.countDocuments({
                  assignedEmployeeId:
                    employee._id,

                  isDeleted: false,

                  status: {
                    $in: [
                      "Completed",
                      "Closed",
                    ],
                  },
                });

              /*
               * -------------------------------------------------
               * CURRENT ACTIVE TASK
               * -------------------------------------------------
               */
              const currentTask =
                await Task.findOne({
                  assignedEmployeeId:
                    employee._id,

                  isDeleted: false,

                  status: {
                    $in: [
                      "In Progress",
                      "Paused",
                      "Testing",
                    ],
                  },
                })
                  .sort({
                    updatedAt: -1,
                    lastUpdated: -1,
                  })
                  .lean();

              /*
               * -------------------------------------------------
               * CURRENT / LATEST WINDOWS AGENT ACTIVITY
               * -------------------------------------------------
               */
              let currentAgentActivity =
                null;

              let todayAgentRecords =
                [];

              if (AgentDailySummary) {
                todayAgentRecords =
                  await AgentDailySummary.find({
                    employeeCode:
                      employee.employeeCode,

                    date:
                      todayBucket,
                  })
                    .sort({
                      lastSeen: -1,
                    })
                    .lean();

                if (
                  todayAgentRecords.length >
                  0
                ) {
                  currentAgentActivity =
                    todayAgentRecords.reduce(
                      (
                        latest,
                        item
                      ) => {
                        if (!latest) {
                          return item;
                        }

                        const latestTime =
                          new Date(
                            latest.lastSeen ||
                            latest.firstSeen ||
                            0
                          ).getTime();

                        const itemTime =
                          new Date(
                            item.lastSeen ||
                            item.firstSeen ||
                            0
                          ).getTime();

                        return itemTime >
                          latestTime
                          ? item
                          : latest;
                      },
                      null
                    );
                }
              }

              /*
               * -------------------------------------------------
               * ACTIVE TIME TODAY
               *
               * Calculated from actual AgentDailySummary.
               * -------------------------------------------------
               */
              const totalTrackedSeconds =
                todayAgentRecords.reduce(
                  (
                    total,
                    record
                  ) =>
                    total +
                    Number(
                      record.totalSeconds ||
                      0
                    ),
                  0
                );

              const activeMinutes =
                Math.floor(
                  totalTrackedSeconds /
                  60
                );

              /*
               * Agent should only be considered online/live
               * when last sync is reasonably recent.
               */
              let agentConnected =
                false;

              if (
                currentAgentActivity
                  ?.lastSeen
              ) {
                const lastSeenTime =
                  new Date(
                    currentAgentActivity.lastSeen
                  ).getTime();

                const difference =
                  Date.now() -
                  lastSeenTime;

                /*
                 * 5 minute tolerance.
                 */
                agentConnected =
                  difference >= 0 &&
                  difference <=
                  5 * 60 * 1000;
              }

              /*
               * -------------------------------------------------
               * LIVE EMPLOYEE STATUS
               * -------------------------------------------------
               */
              let liveStatus =
                employee.status;

              if (
                employee.status !==
                "Leave" &&
                employee.status !==
                "Inactive"
              ) {
                if (currentTask) {
                  liveStatus =
                    currentTask.status ===
                      "Paused"
                      ? "Break"
                      : "Working";
                } else if (
                  agentConnected
                ) {
                  liveStatus =
                    "Free";
                } else {
                  liveStatus =
                    "Offline";
                }
              }

              /*
               * -------------------------------------------------
               * CURRENT WORK
               * -------------------------------------------------
               */
              const currentTaskTitle =
                currentTask?.title ||
                (
                  openTasks === 0
                    ? "Available for assignment"
                    : employee.currentTask ||
                    "Tasks assigned"
                );

              const currentClient =
                currentTask?.clientName ||
                employee.currentClient ||
                "—";

              const currentProject =
                currentTask
                  ?.projectName ||
                currentTask?.project ||
                employee.currentProject ||
                "—";

              return {
                id:
                  employee._id,

                _id:
                  employee._id,

                userId:
                  employee.userId,

                employeeCode:
                  employee.employeeCode,

                name:
                  employee.name,

                initials:
                  String(
                    employee.name ||
                    ""
                  )
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((word) =>
                      word
                        .charAt(0)
                        .toUpperCase()
                    )
                    .join("") ||
                  "NA",

                email:
                  employee.email,

                mobile:
                  employee.mobile,

                role:
                  employee.role,

                department:
                  employee.department,

                joiningDate:
                  employee.joiningDate,

                /*
                 * LIVE STATUS
                 */
                status:
                  liveStatus,

                /*
                 * CURRENT WORK
                 */
                currentTask:
                  currentTaskTitle,

                currentTaskId:
                  currentTask?._id ||
                  null,

                currentTaskCode:
                  currentTask
                    ?.taskCode ||
                  "",

                client:
                  currentClient,

                project:
                  currentProject,

                /*
                 * LOGIN
                 */
                loginTime:
                  employee.loginTime,

                logoutTime:
                  employee.logoutTime,

                /*
                 * REAL CALCULATED COUNTS
                 */
                openTasks,

                completedToday:
                  completedTasks,

                completedTasks,

                /*
                 * REAL TRACKED ACTIVE TIME
                 */
                activeMinutes,

                /*
                 * PC / AGENT INFORMATION
                 */
                agentConnected,

                currentApplication:
                  currentAgentActivity
                    ?.application ||
                  "",

                currentWindowTitle:
                  currentAgentActivity
                    ?.lastWindowTitle ||
                  "",

                pcName:
                  currentAgentActivity
                    ?.pcName ||
                  "",

                agentLastSeen:
                  currentAgentActivity
                    ?.lastSeen ||
                  null,

                currentActivityStartedAt:
                  currentAgentActivity
                    ?.firstSeen ||
                  null,

                /*
                 * LAST ACTIVITY
                 */
                lastActivityAt:
                  currentAgentActivity
                    ?.lastSeen ||
                  employee.lastActivityAt ||
                  null,

                isActive:
                  employee.isActive,

                createdAt:
                  employee.createdAt,

                updatedAt:
                  employee.updatedAt,
              };
            }
          )
        );

      return res.status(200).json({
        success: true,
        count:
          enrichedEmployees.length,

        data:
          enrichedEmployees,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   GET ONE EMPLOYEE

   Admin can view anyone.
   Employee can view only their own record.

   GET /api/employee/employees/:id
========================================================= */

router.get("/employees/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const isAdmin = req.user.role === "admin";

    const isOwnEmployeeRecord =
      req.user.role === "employee" &&
      String(employee.userId) === String(req.user._id);

    if (!isAdmin && !isOwnEmployeeRecord) {
      return res.status(403).json({
        success: false,
        message: "You cannot view this employee.",
      });
    }

    return res.status(200).json({
      success: true,
      data: employeeResponse(employee),
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET CURRENT EMPLOYEE PROFILE

   GET /api/employee/me
========================================================= */
router.get("/me", authenticateUser, async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Employee account is required.",
      });
    }

    const employee = await Employee.findOne({
      userId: req.user._id,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile is not connected to this login account.",
      });
    }

    return res.status(200).json({
      success: true,
      data: employeeResponse(employee),
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   EMPLOYEE DASHBOARD
   GET /api/employee/dashboard
========================================================= */
router.get("/dashboard", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Employee account is required." });
    }

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile is not connected to this login account." });
    }

    //const Task = mongoose.models.Task;
    const SupportTicket = mongoose.models.SupportTicket;
    const Attendance = mongoose.models.Attendance;
    //  const ActivityLog =
    // mongoose.models.ActivityLog || mongoose.model("ActivityLog");
    // ----- IST day bucket (matches agent_daily_summary) -----
    const now = new Date();
    const bucketDate = getISTDateBucket(now);
    const todayStart = bucketDate;
    const tomorrowStart = new Date(bucketDate);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
    const today = getISTDateString(now);

    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));

    const assignmentQuery = {
      assignedEmployeeId: employee._id,
      isDeleted: false,
    };



    const [attendance, tasks, tickets, activeTask, activeTaskCount, dueTodayCount, ticketCount, solvedThisWeek, agentSummary] = await Promise.all([
      Attendance ? Attendance.findOne({ employeeId: employee._id, date: today }).lean() : null,
      Task ? Task.find(assignmentQuery).sort({ dueDate: 1, createdAt: -1 }).limit(6).lean() : [],
      SupportTicket ? SupportTicket.find({ ...assignmentQuery, status: { $in: ["Assigned", "In Progress", "New"] } }).sort({ createdAt: -1 }).limit(6).lean() : [],
      Task ? Task.findOne({ ...assignmentQuery, status: { $in: ["In Progress", "Paused"] } }).sort({ updatedAt: -1 }).lean() : null,
      Task ? Task.countDocuments({ ...assignmentQuery, status: { $nin: ["Completed", "Closed", "Cancelled"] } }) : 0,
      Task ? Task.countDocuments({ ...assignmentQuery, status: { $nin: ["Completed", "Closed", "Cancelled"] }, dueDate: { $gte: todayStart, $lt: tomorrowStart } }) : 0,
      SupportTicket ? SupportTicket.countDocuments({ ...assignmentQuery, status: { $in: ["Assigned", "In Progress", "New"] } }) : 0,
      SupportTicket ? SupportTicket.countDocuments({ ...assignmentQuery, status: "Resolved", resolvedAt: { $gte: weekStart } }) : 0,
      AgentDailySummary
        ? AgentDailySummary.find({
          employeeCode: employee.employeeCode,
          date: bucketDate,
        })
          .sort({ totalSeconds: -1 })
          .lean()
        : [],
    ]);


    const workLog = [
      attendance?.loginTime && {
        id: `login-${attendance._id}`,
        type: "login",
        title: "Checked in",
        description: "Attendance login recorded",
        time: attendance.loginTime,
      },

      ...agentSummary.map((item) => ({
        id: item._id,
        type: "task",
        title: item.application,
        description: `${item.lastWindowTitle || item.application} • ${Math.round(item.totalSeconds / 60)} min`,
        time: item.lastSeen || item.firstSeen,
      })),

      attendance?.logoutTime && {
        id: `logout-${attendance._id}`,
        type: "logout",
        title: "Checked out",
        description: "Attendance logout recorded",
        time: attendance.logoutTime,
      },
    ]
      .filter(Boolean)
      .sort((a, b) => new Date(a.time) - new Date(b.time));
    const totalAgentSeconds = agentSummary.reduce(
      (sum, item) => sum + (item.totalSeconds || 0),
      0
    );

    const hoursToday = Math.round(totalAgentSeconds / 60);
    // Calculate live work status
    let workStatus = "Offline";

    if (attendance && !attendance.logoutTime) {
      const hasActiveTask = tasks.some((t) =>
        ["Assigned", "In Progress", "Paused", "Testing"].includes(t.status)
      );

      const hasActiveTicket = tickets.some((t) =>
        ["New", "Assigned", "In Progress"].includes(t.status)
      );

      if (attendance.breakStartedAt && !attendance.breakEndedAt) {
        workStatus = "Break";
      } else if (hasActiveTask || hasActiveTicket) {
        workStatus = "Working";
      } else {
        workStatus = "Free";
      }
    }
    // console.log("Agent summary count:", agentSummary.length);
    // console.log("Total agent seconds:", totalAgentSeconds);
    // console.log("Hours today:", hoursToday);
    // console.log("Work log:", workLog);
    return res.json({
      success: true,
      data: {
        employee: employeeResponse(employee),
        attendance: attendance
          ? {
            ...attendance,
            workStatus: employee.status,
          }
          : {
            workStatus: employee.status,
          },
        summary: {
          hoursToday,
          activeTaskCount,
          dueTodayCount,
          ticketCount,
          solvedThisWeek,
        },
        activeTask,
        tasks,
        tickets,
        notifications: [],
        workLog,
      },
    });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   MY TICKETS
   GET /api/employee/my-tickets
========================================================= */

router.get("/my-tickets", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Employee account is required.",
      });
    }

    const employee = await Employee.findOne({
      userId: req.user._id,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found.",
      });
    }

    const tickets = await SupportTicket.find({
      assignedEmployeeId: employee._id,
      isDeleted: false,
    })
      .sort({ updatedAt: -1 })
      .lean();
    for (const ticket of tickets) {
      // Ticket time is always independent
      ticket.timeSpentMinutes = Number(ticket.spentMinutes || 0);
      ticket.sla = calculateTicketSla(ticket);

      if (ticket.linkedTaskId) {
        const linkedTask = await Task.findById(ticket.linkedTaskId).lean();

        if (linkedTask) {
          // Remove timing fields so they cannot be mistaken for ticket time
          const {
            spentMinutes,
            elapsedMinutes,
            elapsedSeconds,
            startedAt,
            pausedAt,
            totalPausedMinutes,
            lastUpdated,
            ...safeTask
          } = linkedTask;

          ticket.linkedTask = safeTask;
        } else {
          ticket.linkedTask = null;
        }
      } else {
        ticket.linkedTask = null;
      }
    }

    return res.json({
      success: true,
      tickets,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   EMPLOYEE CLIENTS BRIEF (FOR QUICK TICKET CREATION)
   GET /api/employee/clients-brief
========================================================= */
router.get("/clients-brief", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Employee account is required." });
    }
    const Client = mongoose.models.Client;
    if (!Client) {
      return res.json({ success: true, clients: [] });
    }
    const clients = await Client.find({ isDeleted: { $ne: true } }, {
      _id: 1,
      companyName: 1,
      clientCode: 1,
      contactPerson: 1,
      mobile: 1,
      email: 1,
      products: 1,
      amcStatus: 1,
      amcValidUntil: 1,
    }).sort({ companyName: 1 }).lean();

    return res.json({
      success: true,
      clients: clients.map((c) => ({
        id: c._id,
        _id: c._id,
        companyName: c.companyName || "Unknown Client",
        clientCode: c.clientCode || "",
        contactPerson: c.contactPerson || "",
        mobile: c.mobile || "",
        email: c.email || "",
        products: (c.products || []).map((p) => ({
          id: p._id,
          productName: p.productName,
          status: p.status,
        })),
        amcStatus: c.amcStatus || "Active",
      })),
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   CREATE QUICK TICKET BY EMPLOYEE
   POST /api/employee/my-tickets
========================================================= */
router.post("/my-tickets", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Employee account is required." });
    }
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }

    const {
      title,
      description,
      clientId,
      clientName,
      contactPerson,
      contactMobile,
      contactEmail,
      productName,
      module,
      priority = "Medium",
      source = "Phone Call",
      dueDate,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: "Ticket title is required." });
    }

    const SupportTicket = mongoose.models.SupportTicket;
    const Client = mongoose.models.Client;

    let resolvedClientName = clientName || "General Client";
    let resolvedClientId = clientId;

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      const clientDoc = await Client.findById(clientId).lean();
      if (clientDoc) {
        resolvedClientName = clientDoc.companyName || resolvedClientName;
      }
    }

    const count = await SupportTicket.countDocuments();
    const ticketNo = `TKT-${1000 + count + 1}`;
    const ticketCode = ticketNo;

    const now = new Date();
    const createdTicket = await SupportTicket.create({
      ticketNo,
      ticketCode,
      title: String(title).trim(),
      description: String(description || title).trim(),
      clientId: resolvedClientId || null,
      client: resolvedClientName,
      companyName: resolvedClientName,
      contactPerson: contactPerson || "",
      contactMobile: contactMobile || "",
      contactEmail: contactEmail || "",
      product: productName || "General Support",
      productName: productName || "General Support",
      module: module || "General",
      priority,
      status: "Assigned",
      source: source || "Phone Call",
      assignedEmployeeId: employee._id,
      assignedEmployeeName: employee.name,
      reportedBy: contactPerson || employee.name,
      dueDate: dueDate || null,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          type: "created",
          title: "Ticket logged by employee",
          description: `Ticket created via ${source || "Employee Workspace"}.`,
          createdAt: now,
        },
      ],
      replies: [],
      internalNotes: [],
      attachments: [],
      callLogs: [],
    });

    if (resolvedClientId && mongoose.Types.ObjectId.isValid(resolvedClientId)) {
      const openCount = await SupportTicket.countDocuments({
        clientId: resolvedClientId,
        isDeleted: false,
        status: { $nin: ["Resolved", "Closed"] },
      });
      await Client.updateOne({ _id: resolvedClientId }, { $set: { openTickets: openCount } });
    }

    const ticketObj = createdTicket.toObject();
    ticketObj.sla = calculateTicketSla(ticketObj);

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully.",
      ticket: ticketObj,
    });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   UPDATE TICKET STATUS
   PATCH /api/employee/my-tickets/:id/status
========================================================= */

router.patch(
  "/my-tickets/:id/status",
  async (req, res, next) => {
    try {
      if (req.user.role !== "employee") {
        return res.status(403).json({
          success: false,
          message: "Employee account is required.",
        });
      }

      const employee =
        await Employee.findOne({
          userId: req.user._id,
        });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            "Employee profile not found.",
        });
      }

      const { status, resolutionNote } = req.body;

      const ticket =
        await SupportTicket.findOne({
          _id: req.params.id,
          assignedEmployeeId:
            employee._id,
          isDeleted: false,
        });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Ticket not found.",
        });
      }

      ticket.status = status;

      if (status === "Resolved") {
        ticket.resolvedAt = new Date();
        if (!ticket.firstResolvedAt) {
          ticket.firstResolvedAt = ticket.resolvedAt;
        }
        if (!ticket.firstResponseAt) {
          ticket.firstResponseAt = ticket.resolvedAt;
        }
      } else if (ticket.resolvedAt) {
        ticket.resolvedAt = null;
      }

      if (typeof resolutionNote === "string") {
        ticket.resolutionNote = resolutionNote.trim();
      }

      ticket.timeline.push({
        type:
          status === "Resolved"
            ? "resolved"
            : "status",

        title:
          "Ticket Status Updated",

        description:
          `Status changed to ${status}`,

        createdAt:
          new Date(),
      });

      await ticket.save();
      const Client = mongoose.models.Client;
      if (Client) {
        const openCount = await SupportTicket.countDocuments({
          clientId: ticket.clientId,
          isDeleted: false,
          status: { $nin: ["Resolved", "Verified", "Closed", "Cancelled"] },
        });

        await Client.updateOne(
          { _id: ticket.clientId },
          { $set: { openTickets: openCount } }
        );
      }

      const ticketObj = ticket.toObject();
      ticketObj.sla = calculateTicketSla(ticketObj);

      return res.json({
        success: true,
        ticket: ticketObj,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   ADD TICKET REPLY
========================================================= */

router.post(
  "/my-tickets/:id/reply",
  async (req, res, next) => {
    try {
      if (req.user.role !== "employee") {
        return res.status(403).json({
          success: false,
          message: "Employee account is required.",
        });
      }

      const employee = await Employee.findOne({
        userId: req.user._id,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      const { message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Reply is required.",
        });
      }

      const ticket = await SupportTicket.findOne({
        _id: req.params.id,
        assignedEmployeeId: employee._id,
        isDeleted: false,
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      ticket.replies.push({
        message: message.trim(),

        replyType: "Public",

        authorId: req.user._id,

        authorName:
          employee.employeeName,

        authorRole: "employee",

        createdAt: new Date(),
      });
      ticket.timeline.push({
        type: "reply",
        title: "Employee Reply",
        description: message.trim(),

        performedBy: req.user._id,
        performedByName: employee.employeeName,
        performedByRole: "employee",

        createdAt: new Date(),
      });

      if (!ticket.firstResponseAt) {
        ticket.firstResponseAt = new Date();
      }

      await ticket.save();

      const ticketObj = ticket.toObject();
      ticketObj.sla = calculateTicketSla(ticketObj);

      res.json({
        success: true,
        ticket: ticketObj,
      });
    } catch (err) {
      next(err);
    }
  }
);
/* =========================================================
   ADD INTERNAL NOTE
========================================================= */

router.post(
  "/my-tickets/:id/internal-note",
  async (req, res, next) => {
    try {
      if (req.user.role !== "employee") {
        return res.status(403).json({
          success: false,
          message: "Employee account is required.",
        });
      }

      const employee = await Employee.findOne({
        userId: req.user._id,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      const { note } = req.body;

      if (!note || !note.trim()) {
        return res.status(400).json({
          success: false,
          message: "Internal note is required.",
        });
      }

      const ticket = await SupportTicket.findOne({
        _id: req.params.id,
        assignedEmployeeId: employee._id,
        isDeleted: false,
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      ticket.internalNotes.push({
        note: note.trim(),

        authorId: req.user._id,

        authorName: employee.employeeName,

        authorRole: "employee",

        createdAt: new Date(),
      });

      ticket.timeline.push({
        type: "updated",

        title: "Internal Note Added",

        description: note.trim(),

        performedBy: req.user._id,

        performedByName: employee.employeeName,

        performedByRole: "employee",

        createdAt: new Date(),
      });

      await ticket.save();

      return res.json({
        success: true,
        ticket,
      });

    } catch (error) {
      next(error);
    }
  }
);
router.post("/my-tickets/:id/call-log", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Employee account is required." });
    }
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    const { callType, contactPerson, mobile, duration, summary } = req.body;
    if (!contactPerson?.trim() || !duration?.trim() || !summary?.trim()) {
      return res.status(400).json({ success: false, message: "Contact person, duration and summary are required." });
    }
    const ticket = await SupportTicket.findOne({ _id: req.params.id, assignedEmployeeId: employee._id, isDeleted: false });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }
    ticket.callLogs.push({
      callType: callType === "Incoming" ? "Incoming" : "Outgoing",
      contactPerson: contactPerson.trim(),
      mobile: (mobile || "").trim(),
      duration: duration.trim(),
      summary: summary.trim(),
      loggedBy: req.user._id,
      loggedByName: employee.name,
      loggedByRole: "employee",
    });
    ticket.timeline.push({
      type: "call",
      title: "Support Call Logged",
      description: `${duration.trim()} call with ${contactPerson.trim()}.`,
      performedBy: req.user._id,
      performedByName: employee.name,
      performedByRole: "employee",
    });
    await ticket.save();
    return res.json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
});
function generateTaskCode() {
  const year = new Date().getFullYear();

  const uniquePart = `${Date.now()}${Math.floor(
    Math.random() * 1000
  )
    .toString()
    .padStart(3, "0")}`.slice(-8);

  return `TSK-${year}-${uniquePart}`;
}
/* =========================================================
   CREATE LINKED TASK
========================================================= */

router.post(
  "/my-tickets/:id/create-task",
  async (req, res, next) => {
    try {
      if (req.user.role !== "employee") {
        return res.status(403).json({
          success: false,
          message: "Employee account is required.",
        });
      }

      const employee = await Employee.findOne({
        userId: req.user._id,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee profile not found.",
        });
      }

      const ticket = await SupportTicket.findOne({
        _id: req.params.id,
        assignedEmployeeId: employee._id,
        isDeleted: false,
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      // Prevent duplicate linked tasks
      if (ticket.linkedTaskId) {
        const existingTask = await Task.findById(
          ticket.linkedTaskId
        );

        return res.json({
          success: true,
          alreadyExists: true,
          task: existingTask,
        });
      }
      const {
        title,
        description,
        priority,
        dueDate,
        estimatedMinutes,
      } = req.body;

      const task = await Task.create({
        taskCode: generateTaskCode(),

        title:
          title?.trim() ||
          ticket.title,

        description:
          description?.trim() ||
          ticket.description,

        workType: "Client Support",

        taskFor: "Product",

        clientId: ticket.clientId,
        clientName: ticket.clientName,

        productId: ticket.productId,
        productName: ticket.productName,

        ticketId: ticket._id,
        ticketCode: ticket.ticketCode,

        assignedEmployeeId:
          ticket.assignedEmployeeId,

        assignedEmployeeName:
          ticket.assignedEmployeeName,

        assignedEmployeeCode:
          ticket.assignedEmployeeCode,

        assignedBy: ticket.assignedBy || req.user._id,

        assignedByName:
          ticket.assignedByName || employee.name || "",

        priority:
          priority ||
          ticket.priority,

        dueDate:
          dueDate ||
          ticket.dueDate ||
          new Date(
            Date.now() +
            3 * 24 * 60 * 60 * 1000
          ),

        estimatedMinutes:
          Number(estimatedMinutes) || 0,

        timeline: [
          {
            action: "Task Created",

            description: `Task created from ticket ${ticket.ticketCode}`,

            performedBy: req.user._id,

            performedByName: employee.name,

            performedByRole: "employee",

            createdAt: new Date(),
          },
        ],
      });
      ticket.linkedTaskId = task._id;
      ticket.linkedTaskCode =
        task.taskCode;

      if (ticket.status === "New") {
        ticket.status = "Assigned";
      }
      ticket.timeline.push({
        type: "task",
        title: "Linked Task Created",
        description: `${task.taskCode} - ${task.title}`,
        performedBy: req.user._id,
        performedByName:
          employee.name,
        performedByRole:
          "employee",
      });

      await ticket.save();

      res.json({
        success: true,
        task,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   MY TASKS DASHBOARD AND TIMER
========================================================= */
router.get("/tasks/dashboard", async (req, res, next) => {
  try {
    const SupportTicket = mongoose.models.SupportTicket;
    const Attendance = mongoose.models.Attendance;
    if (req.user.role !== "employee") return res.status(403).json({ success: false, message: "Employee account is required." });
    const employee = await Employee.findOne({ userId: req.user._id });
    const Task = mongoose.models.Task;
    if (!employee || !Task) return res.status(404).json({ success: false, message: "Employee task data is unavailable." });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const assigned = { assignedEmployeeId: employee._id, isDeleted: false };
    const todayString = getISTDateString(new Date());

    const [
      tasks,
      summary,
      activeTimer,
      ticketsSolved,
      attendance,
    ] = await Promise.all([
      Task.find(assigned).sort({ dueDate: 1, createdAt: -1 }).lean(),

      Task.aggregate([
        { $match: assigned },
        {
          $group: {
            _id: null,
            active: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["Assigned", "In Progress", "Testing"]] },
                  1,
                  0,
                ],
              },
            },
            inProgress: {
              $sum: {
                $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0],
              },
            },
            dueToday: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$dueDate", today] },
                      { $lt: ["$dueDate", tomorrow] },
                      { $ne: ["$status", "Completed"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ["$dueDate", today] },
                      { $not: [{ $in: ["$status", ["Completed", "Cancelled"]] }] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            completed: {
              $sum: {
                $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
              },
            },
          },
        },
      ]),

      Task.findOne({
        ...assigned,
        status: { $in: ["In Progress", "Paused"] },
      })
        .sort({ lastUpdated: -1 })
        .lean(),

      SupportTicket
        ? SupportTicket.countDocuments({
          ...assigned,
          status: "Resolved",
        })
        : 0,

      Attendance
        ? Attendance.findOne({
          employeeId: employee._id,
          date: todayString,
        }).lean()
        : null,
    ]);
    const now = Date.now();
    const withCurrentElapsed = (task) => {
      if (!task) return null;
      const runningSeconds = task.status === "In Progress" && task.startedAt
        ? Math.max(0, Math.floor((now - new Date(task.startedAt).getTime()) / 1000))
        : 0;
      const savedSeconds = Number(task.elapsedSeconds || 0) || Number(task.elapsedMinutes || task.spentMinutes || 0) * 60;
      return { ...task, elapsedSeconds: savedSeconds + runningSeconds, elapsedMinutes: Math.floor((savedSeconds + runningSeconds) / 60) };
    };
    const currentTask = withCurrentElapsed(activeTimer);

    const statusPriority = {
      "In Progress": 1,
      "Paused": 2,
      "Assigned": 3,
      "Open": 4,
      "Testing": 5,
      "Under Review": 6,
      "Pending": 7,
      "Completed": 8,
      "Cancelled": 9,
      "Closed": 10,
    };

    const sortedTasks = (tasks || []).slice().sort((a, b) => {
      const pA = statusPriority[a.status] || 5;
      const pB = statusPriority[b.status] || 5;
      if (pA !== pB) return pA - pB;
      if (pA < 8) {
        if (a.dueDate && b.dueDate) {
          const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          if (diff !== 0) return diff;
        } else if (a.dueDate) return -1;
        else if (b.dueDate) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      const timeA = new Date(a.completedAt || a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.completedAt || b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return res.json({
      success: true,
      data: {
        summary: summary[0] || {
          active: 0,
          inProgress: 0,
          dueToday: 0,
          overdue: 0,
          completed: 0,
        },

        tasksCompleted: summary[0]?.completed || 0,
        ticketsSolved,
        supportCalls: 0,
        attendanceStatus: attendance
          ? attendance.logoutTime
            ? "Present"
            : "Checked In"
          : "Absent",

        activeTask: currentTask,
        activeTimer: currentTask,
        tasks: sortedTasks.map(withCurrentElapsed),
      },
    });
  } catch (error) { next(error); }
});
// START TASK
router.post("/tasks/:id/start", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    const Task = mongoose.models.Task;

    if (!employee || !Task) {
      return res.status(404).json({
        success: false,
        message: "Employee or Task model not found",
      });
    }

    // Pause any currently running task
    const now = new Date();

    const runningTasks = await Task.find({
      assignedEmployeeId: employee._id,
      status: "In Progress",
      _id: { $ne: req.params.id },
      isDeleted: false,
    });

    for (const runningTask of runningTasks) {
      if (runningTask.startedAt) {
        const elapsed = Math.max(
          0,
          Math.floor(
            (
              now.getTime() -
              new Date(
                runningTask.startedAt
              ).getTime()
            ) / 1000
          )
        );

        runningTask.elapsedSeconds =
          Number(
            runningTask.elapsedSeconds ||
            0
          ) + elapsed;
      }

      runningTask.status = "Paused";
      runningTask.pausedAt = now;
      runningTask.startedAt = null;
      runningTask.lastUpdated = now;

      await runningTask.save();
    }

    const task = await Task.findOne({
      _id: req.params.id,
      assignedEmployeeId: employee._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // If the task is already running, keep the original startedAt
    if (task.status !== "In Progress") {
      task.status = "In Progress";
      task.startedAt = now;
      task.pausedAt = null;
    }

    task.lastUpdated = now;

    await task.save();

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }
    employee.currentTask =
      task.title;

    employee.currentTaskId =
      task._id;

    employee.currentTaskCode =
      task.taskCode || "";

    employee.currentTaskTitle =
      task.title || "";

    employee.currentTicketId =
      task.ticketId || null;

    employee.currentClient =
      task.clientName || "—";

    employee.currentProject =
      task.projectName ||
      task.project ||
      "—";

    employee.currentTaskStartedAt =
      task.startedAt;

    employee.status =
      "Working";

    employee.lastActivityAt =
      new Date();

    await employee.save();
    // Store active task on employee profile
    employee.currentTaskId = task._id;
    employee.currentTaskCode = task.taskCode;
    employee.currentTaskTitle = task.title;
    employee.currentProject = task.project || "General";
    employee.currentClient = task.clientName || "Internal";

    await employee.save();
    res.json({
      success: true,
      message: "Task started",
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// PAUSE TASK
router.post("/tasks/:id/pause", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    const Task = mongoose.models.Task;

    const task = await Task.findOne({
      _id: req.params.id,
      assignedEmployeeId: employee._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.startedAt) {
      const elapsed = Math.floor(
        (Date.now() - new Date(task.startedAt).getTime()) / 1000
      );

      task.elapsedSeconds = (task.elapsedSeconds || 0) + elapsed;
    }

    task.status = "Paused";
    task.startedAt = null;
    task.lastUpdated = new Date();

    await task.save();

    res.json({
      success: true,
      message: "Task paused",
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// RESUME TASK
router.post("/tasks/:id/resume", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    const Task = mongoose.models.Task;

    await Task.updateMany(
      {
        assignedEmployeeId: employee._id,
        status: "In Progress",
      },
      {
        $set: {
          status: "Paused",
          pausedAt: new Date(),
        },
      }
    );

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        assignedEmployeeId: employee._id,
      },
      {
        $set: {
          status: "In Progress",
          startedAt: new Date(),
          lastUpdated: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task resumed",
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// END TASK SESSION
router.post("/tasks/:id/end", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    const Task = mongoose.models.Task;

    const task = await Task.findOne({
      _id: req.params.id,
      assignedEmployeeId: employee._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.startedAt) {
      const elapsed = Math.floor(
        (Date.now() - new Date(task.startedAt).getTime()) / 1000
      );

      task.elapsedSeconds = (task.elapsedSeconds || 0) + elapsed;
    }

    task.status = "Completed";
    task.progress = 100; // IMPORTANT
    task.startedAt = null;
    task.completedAt = new Date();
    task.lastUpdated = new Date();

    await task.save();

    /* Update linked project progress */
    if (
      task.taskFor === "Project" &&
      task.projectId
    ) {
      await syncProjectTaskProgress(
        task.projectId
      );
    }

    res.json({
      success: true,
      message: "Task completed",
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/tasks/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") return res.status(403).json({ success: false, message: "Employee account is required." });
    const employee = await Employee.findOne({ userId: req.user._id });
    const Task = mongoose.models.Task;
    const task = await Task.findOne({ _id: req.params.id, assignedEmployeeId: employee?._id, isDeleted: false }).lean();
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    return res.json({ success: true, data: task });
  } catch (error) { next(error); }
});

router.patch("/tasks/:id/timer", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") return res.status(403).json({ success: false, message: "Employee account is required." });
    const employee = await Employee.findOne({ userId: req.user._id });
    const Task = mongoose.models.Task;
    const task = await Task.findOne({ _id: req.params.id, assignedEmployeeId: employee?._id, isDeleted: false });
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    const action = req.body.action;
    const now = new Date();
    const addElapsed = (item) => {
      if (!item.startedAt) return;
      item.elapsedSeconds = (Number(item.elapsedSeconds || 0) || Number(item.elapsedMinutes || item.spentMinutes || 0) * 60) + Math.max(0, Math.floor((now - item.startedAt) / 1000));
      item.elapsedMinutes = Math.floor(item.elapsedSeconds / 60);
    };
    if (action === "start" || action === "resume") {
      const running = await Task.findOne({ assignedEmployeeId: employee._id, _id: { $ne: task._id }, status: "In Progress", isDeleted: false });
      if (running) { addElapsed(running); running.status = "Paused"; running.pausedAt = now; running.startedAt = null; running.lastUpdated = now; await running.save(); }
      if (task.pausedAt) task.totalPausedMinutes = Number(task.totalPausedMinutes || 0) + Math.floor((now - task.pausedAt) / 60000);
      task.status = "In Progress"; task.startedAt = now; task.pausedAt = null; task.progress = Math.max(Number(task.progress || 0), 10);
    } else if (action === "pause" || action === "stop") {
      addElapsed(task); task.status = "Paused"; task.pausedAt = now; task.startedAt = null;
    } else if (action === "complete") {
      addElapsed(task);

      task.status = "Completed";
      task.progress = 100;
      task.completedAt = now;
      task.startedAt = null;
      task.pausedAt = null;
      task.lastUpdated = now;

      // Save the completed task first
      await task.save();
      /* Update linked project progress */
      if (
        task.taskFor === "Project" &&
        task.projectId
      ) {
        await syncProjectTaskProgress(
          task.projectId
        );
      }
      // Then resolve the linked ticket
      await resolveLinkedTicket(task);
      // Recalculate employee status after task completion
      const hasActiveTask = await Task.exists({
        assignedEmployeeId: employee._id,
        isDeleted: false,
        status: { $in: ["Assigned", "In Progress", "Paused", "Testing"] },
      });

      const hasActiveTicket = await SupportTicket.exists({
        assignedEmployeeId: employee._id,
        isDeleted: false,
        status: { $in: ["New", "Assigned", "In Progress"] },
      });

      employee.status = hasActiveTask || hasActiveTicket ? "Working" : "Free";
      employee.lastActivityAt = new Date();
      await employee.save();
    } else return res.status(400).json({ success: false, message: "Invalid timer action." });
    task.spentMinutes = task.elapsedMinutes; task.lastUpdated = now; await task.save();
    if (action === "start" || action === "resume") {
      employee.status = "Working";

      // Dashboard
      employee.currentTask = task.title;

      // Windows Agent fields
      employee.currentTaskId = task._id;
      employee.currentTaskCode = task.taskCode || "";
      employee.currentTaskTitle = task.title || "";
      employee.currentTicketId = task.ticketId || null;
      employee.currentClient = task.clientName || "—";
      employee.currentProject = task.projectName || "—";
      employee.currentTaskStartedAt = now;

      console.log("TASK STARTED FOR AGENT", {
        employee: employee.employeeCode,
        taskId: task._id,
        taskCode: task.taskCode,
        title: task.title,
        client: task.clientName,
        project: task.projectName,
      });

    } else if (action === "pause" || action === "stop") {
      employee.status = "Break";

    } else if (action === "complete") {
      // Check for ANY remaining active tasks
      const remainingTasks = await Task.exists({
        assignedEmployeeId: employee._id,
        isDeleted: false,
        status: { $in: ["Assigned", "In Progress", "Paused", "Testing"] },
      });

      // Check for ANY remaining active tickets
      const remainingTickets = await SupportTicket.exists({
        assignedEmployeeId: employee._id,
        isDeleted: false,
        status: { $in: ["New", "Assigned", "In Progress"] },
      });

      if (!remainingTasks && !remainingTickets) {
        employee.status = "Free";
        employee.currentTask = "Available for assignment";
        employee.currentTaskId = null;
        employee.currentTaskCode = "";
        employee.currentTaskTitle = "";
        employee.currentTicketId = null;
        employee.currentClient = "—";
        employee.currentProject = "—";
        employee.currentTaskStartedAt = null;
      } else {
        employee.status = "Working";
      }
    }
    employee.lastActivityAt = now;
    await employee.save();
    return res.json({ success: true, data: task });
  } catch (error) { next(error); }
});

/* =========================================================
   CREATE EMPLOYEE AND LOGIN ACCOUNT
   Admin only

   POST /api/employee/employees
========================================================= */

router.post("/employees", requireAdmin, async (req, res, next) => {
  try {
    const {
      employeeCode,
      name,
      email,
      mobile,
      role,
      department,
      joiningDate,
      status,
      password,
    } = req.body;

    const normalizedCode =
      normalizeEmployeeCode(employeeCode);

    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedCode) {
      return res.status(400).json({
        success: false,
        message: "Employee code is required.",
      });
    }

    if (!String(name || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee name is required.",
      });
    }

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Employee email is required.",
      });
    }

    if (!String(role || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee role is required.",
      });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Login password must contain at least 6 characters.",
      });
    }

    const existingCode = await Employee.findOne({
      employeeCode: normalizedCode,
    });

    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: "Employee code already exists.",
      });
    }

    const existingEmployeeEmail = await Employee.findOne({
      email: normalizedEmail,
    });

    if (existingEmployeeEmail) {
      return res.status(409).json({
        success: false,
        message:
          "An employee with this email already exists.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A login account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      String(password),
      12
    );

    let user = null;
    let employee = null;

    try {
      user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "employee",
        status: "Active",
      });

      employee = await Employee.create({
        userId: user._id,
        employeeCode: normalizedCode,
        name: String(name).trim(),
        email: normalizedEmail,
        mobile: String(mobile || "").trim(),
        role: String(role).trim(),
        department: department || "Support",
        joiningDate: joiningDate || "",
        status: status || "Free",

        currentTask:
          status === "Leave"
            ? "On leave"
            : "Available for assignment",

        currentClient: "—",
        currentProject: "—",
        loginTime: null,
        logoutTime: null,
        activeMinutes: 0,
        openTasks: 0,
        completedToday: 0,
        lastActivityAt: null,
        isActive: true,
      });
    } catch (creationError) {
      if (employee?._id) {
        await Employee.findByIdAndDelete(employee._id);
      }

      if (user?._id) {
        await User.findByIdAndDelete(user._id);
      }

      throw creationError;
    }

    return res.status(201).json({
      success: true,
      message:
        "Employee and login account created successfully.",
      data: employeeResponse(employee),
      login: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField =
        Object.keys(error.keyPattern || {})[0] ||
        "employee information";

      return res.status(409).json({
        success: false,
        message: `${duplicateField} already exists.`,
      });
    }

    next(error);
  }
});

/* =========================================================
   UPDATE EMPLOYEE
   Admin only

   PUT /api/employee/employees/:id
========================================================= */

router.put("/employees/:id", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const {
      employeeCode,
      name,
      email,
      mobile,
      role,
      department,
      joiningDate,
      status,
      isActive,
      password,
    } = req.body;

    const normalizedCode =
      normalizeEmployeeCode(
        employeeCode || employee.employeeCode
      );

    const normalizedEmail =
      normalizeEmail(email || employee.email);

    const duplicateCode = await Employee.findOne({
      employeeCode: normalizedCode,
      _id: {
        $ne: employee._id,
      },
    });

    if (duplicateCode) {
      return res.status(409).json({
        success: false,
        message:
          "Another employee already uses this employee code.",
      });
    }

    const duplicateEmployeeEmail =
      await Employee.findOne({
        email: normalizedEmail,
        _id: {
          $ne: employee._id,
        },
      });

    if (duplicateEmployeeEmail) {
      return res.status(409).json({
        success: false,
        message:
          "Another employee already uses this email.",
      });
    }

    const duplicateUser = await User.findOne({
      email: normalizedEmail,
      _id: {
        $ne: employee.userId,
      },
    });

    if (duplicateUser) {
      return res.status(409).json({
        success: false,
        message:
          "Another login account already uses this email.",
      });
    }

    employee.employeeCode = normalizedCode;
    employee.name =
      String(name || employee.name).trim();
    employee.email = normalizedEmail;
    employee.mobile =
      String(mobile ?? employee.mobile).trim();
    employee.role =
      String(role || employee.role).trim();
    employee.department =
      department || employee.department;
    employee.joiningDate =
      joiningDate ?? employee.joiningDate;
    employee.status =
      status || employee.status;

    if (typeof isActive === "boolean") {
      employee.isActive = isActive;
    }

    if (employee.status === "Leave") {
      employee.currentTask = "On leave";
      employee.currentClient = "—";
      employee.currentProject = "—";
    } else if (
      employee.status === "Free" &&
      employee.openTasks === 0
    ) {
      employee.currentTask =
        "Available for assignment";
      employee.currentClient = "—";
      employee.currentProject = "—";
    }

    await employee.save();

    if (employee.userId) {
      const user = await User.findById(employee.userId).select(
        "+password"
      );

      if (user) {
        user.name = employee.name;
        user.email = employee.email;
        user.status = employee.isActive
          ? "Active"
          : "Inactive";

        if (password) {
          if (String(password).length < 6) {
            return res.status(400).json({
              success: false,
              message:
                "New password must contain at least 6 characters.",
            });
          }

          user.password = await bcrypt.hash(
            String(password),
            12
          );
        }

        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
      data: employeeResponse(employee),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Employee code or email already exists.",
      });
    }

    next(error);
  }
});

/* =========================================================
   DELETE EMPLOYEE
   Admin only

   This removes both employee profile and login account.

   DELETE /api/employee/employees/:id
========================================================= */

router.delete(
  "/employees/:id",
  requireAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID.",
        });
      }

      const employee = await Employee.findById(id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      const deletedEmployee = {
        id: employee._id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
      };

      const linkedUserId = employee.userId;

      await Employee.findByIdAndDelete(employee._id);

      if (linkedUserId) {
        await User.findByIdAndDelete(linkedUserId);
      }

      return res.status(200).json({
        success: true,
        message:
          "Employee and login account deleted successfully.",
        data: deletedEmployee,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   ACTIVATE / DEACTIVATE EMPLOYEE
   Admin only

   PATCH /api/employee/employees/:id/status
========================================================= */

router.patch(
  "/employees/:id/status",
  requireAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID.",
        });
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message:
            "isActive must be true or false.",
        });
      }

      const employee = await Employee.findById(id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      employee.isActive = isActive;

      if (!isActive) {
        employee.status = "Inactive";
      } else if (employee.status === "Inactive") {
        employee.status = "Free";
      }

      await employee.save();

      if (employee.userId) {
        await User.findByIdAndUpdate(
          employee.userId,
          {
            status: isActive
              ? "Active"
              : "Inactive",
          },
          {
            runValidators: true,
          }
        );
      }

      return res.status(200).json({
        success: true,
        message: isActive
          ? "Employee activated successfully."
          : "Employee deactivated successfully.",
        data: employeeResponse(employee),
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
CURRENT ACTIVE TASK FOR WINDOWS AGENT
GET /api/employee/agent/current-task/:employeeCode
========================================================= */

router.get("/agent/current-task/:employeeCode", async (req, res) => {
  try {
    const employee = await Employee.findOne({
      employeeCode: String(req.params.employeeCode).toUpperCase(),
    });


    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    return res.json({
      success: true,
      data: {
        employeeCode: employee.employeeCode,
        taskId: employee.currentTaskId,
        taskCode: employee.currentTaskCode,
        taskTitle: employee.currentTaskTitle,
        client: employee.currentClient,
        project: employee.currentProject,
        status: employee.status,
        startedAt: employee.currentTaskStartedAt,
      },
    });


  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});
// ADD productivity classifier helper
const PRODUCTIVE_CATEGORIES = [
  "Development",
  "Database",
  "Remote Support",
  "Design",
  "Documentation",
  "Office",
  "File Management",
  "Communication",
  "Utility",
];

const UNPRODUCTIVE_CATEGORIES = [
  "Entertainment",
  "Social Media",
  "Games",
];

function resolveApplicationCategoryAndProductivity(appInput, windowTitleInput, explicitCategory) {
  const app = String(appInput || "").trim().toLowerCase();
  const title = String(windowTitleInput || "").trim().toLowerCase();
  const cat = String(explicitCategory || "").trim();

  // 1. Remote Support tools (UltraViewer, AnyDesk, TeamViewer, RustDesk, RDP, etc.)
  if (
    app.includes("ultraviewer") ||
    app.includes("anydesk") ||
    app.includes("teamviewer") ||
    app.includes("rustdesk") ||
    app.includes("mstsc") ||
    app.includes("remote desktop") ||
    app.includes("zoho assist") ||
    app.includes("supremo") ||
    app.includes("ammyy") ||
    app.includes("vnc") ||
    title.includes("ultraviewer") ||
    title.includes("anydesk") ||
    title.includes("teamviewer") ||
    title.includes("rustdesk")
  ) {
    return { category: "Remote Support", productivity: "Productive" };
  }

  // 2. Database tools (SSMS, SQL Server Management Studio, DBeaver, pgAdmin, MySQL Workbench, etc.)
  if (
    app.includes("ssms") ||
    app.includes("sql server management studio") ||
    app.includes("dbeaver") ||
    app.includes("pgadmin") ||
    app.includes("mysql") ||
    app.includes("navicat") ||
    app.includes("datagrip") ||
    app.includes("heidisql") ||
    app.includes("tableplus") ||
    app.includes("compass") ||
    app.includes("studio 3t") ||
    app.includes("robo 3t") ||
    app.includes("redis") ||
    app.includes("sql") ||
    title.includes("management studio") ||
    title.includes("ssms") ||
    title.includes(".sql") ||
    title.includes("database")
  ) {
    return { category: "Database", productivity: "Productive" };
  }

  // 3. File Explorer / Windows Explorer / File Managers
  if (
    app === "explorer" ||
    app === "explorer.exe" ||
    app.includes("file explorer") ||
    app.includes("windows explorer") ||
    app.includes("total commander") ||
    app.includes("7-zip") ||
    app.includes("winrar") ||
    app.includes("everything") ||
    title.includes("file explorer")
  ) {
    return { category: "File Management", productivity: "Productive" };
  }

  // 4. Code Editors, IDEs & Developer Terminals
  if (
    app.includes("code") ||
    app.includes("visual studio") ||
    app.includes("devenv") ||
    app.includes("cursor") ||
    app.includes("sublime") ||
    app.includes("notepad++") ||
    app.includes("idea") ||
    app.includes("webstorm") ||
    app.includes("pycharm") ||
    app.includes("phpstorm") ||
    app.includes("android studio") ||
    app.includes("eclipse") ||
    app.includes("terminal") ||
    app.includes("powershell") ||
    app.includes("cmd") ||
    app.includes("git") ||
    app.includes("postman") ||
    app.includes("insomnia") ||
    app.includes("docker") ||
    title.includes("visual studio code") ||
    title.includes("cursor")
  ) {
    return { category: "Development", productivity: "Productive" };
  }

  // 5. Office, Documents & Design
  if (
    app.includes("winword") ||
    app.includes("word") ||
    app.includes("excel") ||
    app.includes("powerpnt") ||
    app.includes("powerpoint") ||
    app.includes("onenote") ||
    app.includes("acrobat") ||
    app.includes("pdf") ||
    app.includes("figma") ||
    app.includes("photoshop") ||
    app.includes("illustrator") ||
    app.includes("canva")
  ) {
    return { category: "Office", productivity: "Productive" };
  }

  // 6. Collaboration & Communication
  if (
    app.includes("teams") ||
    app.includes("slack") ||
    app.includes("zoom") ||
    app.includes("skype") ||
    app.includes("meet")
  ) {
    return { category: "Communication", productivity: "Productive" };
  }

  // 7. Entertainment, Social Media & Games (Unproductive)
  if (
    app.includes("netflix") ||
    app.includes("spotify") ||
    app.includes("steam") ||
    app.includes("game") ||
    title.includes("youtube") ||
    title.includes("facebook") ||
    title.includes("instagram") ||
    title.includes("twitter") ||
    title.includes("tiktok") ||
    title.includes("netflix")
  ) {
    return { category: "Entertainment", productivity: "Unproductive" };
  }

  // 8. Explicit category fallback
  if (cat && cat !== "Other" && cat !== "General") {
    const isProd = PRODUCTIVE_CATEGORIES.includes(cat);
    const isUnprod = UNPRODUCTIVE_CATEGORIES.includes(cat);
    return {
      category: cat,
      productivity: isProd ? "Productive" : isUnprod ? "Unproductive" : "Neutral",
    };
  }

  // Default fallback for general work apps
  return { category: "Office", productivity: "Productive" };
}

function classifyProductivity(category) {
  if (PRODUCTIVE_CATEGORIES.includes(category)) return "Productive";
  if (UNPRODUCTIVE_CATEGORIES.includes(category)) return "Unproductive";
  return "Neutral";
}
router.get("/time-log/activity", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const todayBucket = getISTDateBucket(new Date());

    const logs = await AgentDailySummary.find({
      employeeId: employee._id,
      employeeCode: employee.employeeCode,
      date: todayBucket,
    })
      .sort({ lastSeen: -1 })
      .lean();

    res.json({
      success: true,
      data: logs.map((log) => {
        const resolved = resolveApplicationCategoryAndProductivity(
          log.application,
          log.lastWindowTitle,
          log.category
        );
        return {
          id: log._id,
          capturedAt: log.lastSeen || log.firstSeen || null,
          application: log.application,
          windowTitle: log.lastWindowTitle || "",
          durationSeconds: Number(log.totalSeconds || 0),
          sessionCount: Number(log.sessionCount || 0),
          category: resolved.category,
          productivity: resolved.productivity,
          activity: log.activity || (resolved.productivity === "Unproductive" ? "Idle" : "Active"),
          project: log.project,
          client: log.client,
          taskId: log.taskId || null,
          taskCode: log.taskCode || "",
          taskTitle: log.taskTitle || "",
          taskStatus: log.taskStatus || "",
          ticketId: log.ticketId || null,
          ticketCode: log.ticketCode || "",
          firstSeen: log.firstSeen || null,
          lastSeen: log.lastSeen || null,
          pcName: log.pcName || "",
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/time-log/sessions", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const today = getISTDateBucket(new Date());

    const logs = await AgentDailySummary.find({
      employeeCode: employee.employeeCode,
      date: today,
    })
      .sort({ lastSeen: -1 })
      .lean();
    res.json({
      success: true,
      data: logs.map((log) => {
        const resolved = resolveApplicationCategoryAndProductivity(
          log.application,
          log.lastWindowTitle,
          log.category
        );
        return {
          id: log._id,

          // Main session title
          sessionTitle: log.taskTitle || log.application,

          // Task information
          taskTitle: log.taskTitle || "No task assigned",
          taskCode: log.taskCode || "",

          // Additional info
          project: log.project || "",
          client: log.client || "",
          applicationName: log.application,
          category: resolved.category,
          productivity: resolved.productivity,
          lastWindowTitle: log.lastWindowTitle || "",
          // Timing
          startedAt: log.firstSeen,
          endedAt: log.lastSeen,
          durationSeconds: log.totalSeconds || 0,

          // Status
          status: "Completed",
        };
      })
    });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   EMPLOYEE TIME LOG (TODAY)
   GET /api/employee/time-log/today
   ========================================================= */


router.get("/time-log/today", authenticateUser, async (req, res, next) => {
  try {
    const user = req.user;
    const todayBucket = getISTDateBucket(new Date());
    const todayDateString = getISTDateString(new Date());

    // Load employee profile linked to the logged-in user
    const employeeProfile = await Employee.findOne({ userId: user._id });

    if (!employeeProfile) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const employeeCode = employeeProfile.employeeCode;

    const [records, dailyNotes] = await Promise.all([
      AgentDailySummary.find({
        employeeCode,
        date: todayBucket,
      }).sort({ totalSeconds: -1 }),
      EmployeeDailyNote.find({
        employeeId: employeeProfile._id,
        date: todayDateString,
      }).sort({ createdAt: 1 }),
    ]);

    const totalTrackedSeconds = records.reduce(
      (sum, r) => sum + Number(r.totalSeconds || 0),
      0
    );

    const totalSessions = records.reduce(
      (sum, r) => sum + Number(r.sessionCount || 0),
      0
    );

    const applications = records.map((r) => {
      const resolved = resolveApplicationCategoryAndProductivity(
        r.application,
        r.lastWindowTitle,
        r.category
      );
      return {
        applicationName: r.application,
        category: resolved.category,
        totalSeconds: r.totalSeconds || 0,
        productivity: resolved.productivity,
        percentage:
          totalTrackedSeconds > 0
            ? Math.round((r.totalSeconds / totalTrackedSeconds) * 100)
            : 0,
        project: r.project || "",
        client: r.client || "",
        sessionCount: r.sessionCount || 0,
        lastWindowTitle: r.lastWindowTitle || "",
        lastSeen: r.lastSeen,
      };
    });

    const latest =
      records.length > 0
        ? records.reduce((a, b) =>
          new Date(a.lastSeen || 0) > new Date(b.lastSeen || 0)
            ? a
            : b
        )
        : null;

    res.json({
      success: true,
      data: {
        employee: {
          employeeCode,
          name: employeeProfile.name || user.name,
          deviceId: latest?.pcName || "",
        },
        summary: {
          totalTrackedSeconds,
          totalSessions,
          applicationCount: applications.length,
          lastSyncAt: latest?.lastSeen || null,
        },
        applications,
        notes: dailyNotes.map((n) => ({
          id: n._id,
          _id: n._id,
          text: n.text,
          completed: !!n.completed,
          date: n.date,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   EMPLOYEE TIME LOG DAILY NOTES CRUD API
   GET    /api/employee/time-log/notes
   POST   /api/employee/time-log/notes
   PATCH  /api/employee/time-log/notes/:id
   PUT    /api/employee/time-log/notes/:id
   DELETE /api/employee/time-log/notes/:id
   ========================================================= */

router.get("/time-log/notes", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const queryDate = String(req.query.date || "").trim() || getISTDateString(new Date());
    const notes = await EmployeeDailyNote.find({
      employeeId: employee._id,
      date: queryDate,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: notes.map((n) => ({
        id: n._id,
        _id: n._id,
        text: n.text,
        completed: !!n.completed,
        date: n.date,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/time-log/notes", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Note text is required.",
      });
    }

    const date = String(req.body?.date || "").trim() || getISTDateString(new Date());

    const newNote = new EmployeeDailyNote({
      employeeId: employee._id,
      employeeCode: employee.employeeCode,
      userId: req.user._id,
      date,
      text,
      completed: false,
    });

    await newNote.save();

    res.status(201).json({
      success: true,
      message: "Note added successfully",
      data: {
        id: newNote._id,
        _id: newNote._id,
        text: newNote.text,
        completed: newNote.completed,
        date: newNote.date,
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/time-log/notes/:id", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID format.",
      });
    }

    const note = await EmployeeDailyNote.findOne({
      _id: req.params.id,
      employeeId: employee._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    if (typeof req.body?.completed === "boolean") {
      note.completed = req.body.completed;
    }
    if (typeof req.body?.text === "string" && req.body.text.trim()) {
      note.text = req.body.text.trim();
    }
    note.updatedAt = new Date();

    await note.save();

    res.json({
      success: true,
      message: "Note updated successfully",
      data: {
        id: note._id,
        _id: note._id,
        text: note.text,
        completed: note.completed,
        date: note.date,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put("/time-log/notes/:id", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID format.",
      });
    }

    const note = await EmployeeDailyNote.findOne({
      _id: req.params.id,
      employeeId: employee._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    if (typeof req.body?.completed === "boolean") {
      note.completed = req.body.completed;
    }
    if (typeof req.body?.text === "string" && req.body.text.trim()) {
      note.text = req.body.text.trim();
    }
    note.updatedAt = new Date();

    await note.save();

    res.json({
      success: true,
      message: "Note updated successfully",
      data: {
        id: note._id,
        _id: note._id,
        text: note.text,
        completed: note.completed,
        date: note.date,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/time-log/notes/:id", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID format.",
      });
    }

    const note = await EmployeeDailyNote.findOneAndDelete({
      _id: req.params.id,
      employeeId: employee._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});
router.get("/tasks/current", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    const Task = mongoose.models.Task;

    if (!employee || !Task) {
      return res.status(404).json({
        success: false,
        message: "Employee or Task model not found",
      });
    }

    const activeTask = await Task.findOne({
      assignedEmployeeId: employee._id,
      status: { $in: ["In Progress", "Paused"] },
    })
      .sort({ lastUpdated: -1 })
      .lean();

    if (!activeTask) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: {
        _id: activeTask._id,
        taskCode: activeTask.taskCode,
        title: activeTask.title,
        status: activeTask.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   EMPLOYEE NOTIFICATIONS SYNC & HELPERS
========================================================= */

async function syncEmployeeNotifications(employeeId, userId) {
  try {
    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) return;

    const todayStr = getISTDateString ? getISTDateString(new Date()) : new Date().toISOString().slice(0, 10);
    const existing = await EmployeeNotification.find({ employeeId }).select("dedupKey").lean();
    const existingKeys = new Set(existing.map((n) => n.dedupKey).filter(Boolean));

    const toInsert = [];

    // 1. Sync Assigned Tasks
    const TaskModel = mongoose.models.Task;
    if (TaskModel) {
      const activeTasks = await TaskModel.find({
        assignedEmployeeId: employeeId,
        isDeleted: false,
      }).sort({ createdAt: -1 }).limit(30).lean();

      for (const t of activeTasks) {
        // Task Assigned
        const assignKey = `task-assigned-${t._id}`;
        if (!existingKeys.has(assignKey)) {
          toInsert.push({
            employeeId,
            userId,
            type: "TASK_ASSIGNED",
            title: `Task Assigned: ${t.taskCode || "New Task"}`,
            message: `You were assigned "${t.title || "Untitled"}" (${t.priority || "Medium"} priority).`,
            priority: t.priority === "Critical" || t.priority === "High" ? "high" : "normal",
            entityType: "task",
            entityId: t._id,
            entityCode: t.taskCode || "",
            navigationTarget: "tasks",
            isRead: false,
            dedupKey: assignKey,
            createdAt: t.createdAt || new Date(),
          });
          existingKeys.add(assignKey);
        }

        // Overdue check
        if (t.dueDate && !["Completed", "Closed", "Cancelled"].includes(t.status)) {
          const dueStr = typeof t.dueDate === "string" ? t.dueDate.slice(0, 10) : new Date(t.dueDate).toISOString().slice(0, 10);
          if (dueStr < todayStr) {
            const overdueKey = `task-overdue-${t._id}-${dueStr}`;
            if (!existingKeys.has(overdueKey)) {
              toInsert.push({
                employeeId,
                userId,
                type: "TASK_OVERDUE",
                title: `Task Overdue: ${t.taskCode || "Task"}`,
                message: `Task "${t.title}" was due on ${dueStr} and requires urgent action.`,
                priority: "urgent",
                entityType: "task",
                entityId: t._id,
                entityCode: t.taskCode || "",
                navigationTarget: "tasks",
                isRead: false,
                dedupKey: overdueKey,
                createdAt: new Date(),
              });
              existingKeys.add(overdueKey);
            }
          } else if (dueStr === todayStr) {
            const dueTodayKey = `task-due-today-${t._id}-${dueStr}`;
            if (!existingKeys.has(dueTodayKey)) {
              toInsert.push({
                employeeId,
                userId,
                type: "TASK_DUE_SOON",
                title: `Task Due Today: ${t.taskCode || "Task"}`,
                message: `Task "${t.title}" is due today.`,
                priority: "high",
                entityType: "task",
                entityId: t._id,
                entityCode: t.taskCode || "",
                navigationTarget: "tasks",
                isRead: false,
                dedupKey: dueTodayKey,
                createdAt: new Date(),
              });
              existingKeys.add(dueTodayKey);
            }
          }
        }
      }
    }

    // 2. Sync Assigned Support Tickets
    const SupportTicketModel = mongoose.models.SupportTicket;
    if (SupportTicketModel) {
      const tickets = await SupportTicketModel.find({
        assignedEmployeeId: employeeId,
        isDeleted: false,
      }).sort({ createdAt: -1 }).limit(30).lean();

      for (const tkt of tickets) {
        // Ticket assigned
        const tktAssignKey = `ticket-assigned-${tkt._id}`;
        if (!existingKeys.has(tktAssignKey)) {
          toInsert.push({
            employeeId,
            userId,
            type: "TICKET_ASSIGNED",
            title: `Ticket Assigned: ${tkt.ticketNo || "Support Ticket"}`,
            message: `New support ticket for "${tkt.client || "Client"}": ${tkt.title}`,
            priority: tkt.priority === "Critical" ? "urgent" : "normal",
            entityType: "ticket",
            entityId: tkt._id,
            entityCode: tkt.ticketNo || "",
            navigationTarget: "tickets",
            isRead: false,
            dedupKey: tktAssignKey,
            createdAt: tkt.createdAt || new Date(),
          });
          existingKeys.add(tktAssignKey);
        }

        // SLA Check
        if (typeof calculateTicketSla === "function") {
          const sla = calculateTicketSla(tkt);
          if (sla && !["Resolved", "Verified", "Closed"].includes(tkt.status)) {
            if (sla.firstResponseStatus === "Overdue") {
              const slaKey = `ticket-sla-resp-${tkt._id}-overdue`;
              if (!existingKeys.has(slaKey)) {
                toInsert.push({
                  employeeId,
                  userId,
                  type: "TICKET_SLA_WARNING",
                  title: `SLA Alert: ${tkt.ticketNo}`,
                  message: `First Response SLA has breached for "${tkt.title}". Please reply immediately.`,
                  priority: "urgent",
                  entityType: "ticket",
                  entityId: tkt._id,
                  entityCode: tkt.ticketNo || "",
                  navigationTarget: "tickets",
                  isRead: false,
                  dedupKey: slaKey,
                  createdAt: new Date(),
                });
                existingKeys.add(slaKey);
              }
            } else if (sla.resolutionStatus === "Overdue") {
              const slaResKey = `ticket-sla-res-${tkt._id}-overdue`;
              if (!existingKeys.has(slaResKey)) {
                toInsert.push({
                  employeeId,
                  userId,
                  type: "TICKET_SLA_WARNING",
                  title: `SLA Alert: ${tkt.ticketNo}`,
                  message: `Resolution SLA has breached for "${tkt.title}".`,
                  priority: "urgent",
                  entityType: "ticket",
                  entityId: tkt._id,
                  entityCode: tkt.ticketNo || "",
                  navigationTarget: "tickets",
                  isRead: false,
                  dedupKey: slaResKey,
                  createdAt: new Date(),
                });
                existingKeys.add(slaResKey);
              }
            }
          }
        }

        // Replies from client
        if (Array.isArray(tkt.replies) && tkt.replies.length > 0) {
          const clientReplies = tkt.replies.filter((r) => r.authorRole === "client");
          if (clientReplies.length > 0) {
            const lastReply = clientReplies[clientReplies.length - 1];
            const replyKey = `ticket-reply-${tkt._id}-${lastReply._id || new Date(lastReply.createdAt).getTime()}`;
            if (!existingKeys.has(replyKey)) {
              toInsert.push({
                employeeId,
                userId,
                type: "TICKET_REPLY",
                title: `Client Reply: ${tkt.ticketNo}`,
                message: `Client ${lastReply.authorName || "Customer"} replied: "${tkt.title}"`,
                priority: "high",
                entityType: "ticket",
                entityId: tkt._id,
                entityCode: tkt.ticketNo || "",
                navigationTarget: "tickets",
                isRead: false,
                dedupKey: replyKey,
                createdAt: lastReply.createdAt || new Date(),
              });
              existingKeys.add(replyKey);
            }
          }
        }
      }
    }

    if (toInsert.length > 0) {
      await EmployeeNotification.insertMany(toInsert, { ordered: false }).catch(() => {});
    }
  } catch (err) {
    console.error("Error in syncEmployeeNotifications:", err.message);
  }
}

function formatEmployeeNotification(n) {
  return {
    _id: n._id,
    id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    priority: n.priority || "normal",
    entityType: n.entityType || "other",
    entityId: n.entityId,
    entityCode: n.entityCode || "",
    navigationTarget: n.navigationTarget || "dashboard",
    isRead: Boolean(n.isRead),
    readAt: n.readAt,
    createdAt: n.createdAt,
    metadata: n.metadata || {},
  };
}

/* =========================================================
   EMPLOYEE NOTIFICATIONS ENDPOINTS
   GET /api/employee/notifications
   PATCH /api/employee/notifications/:id/read
   PATCH /api/employee/notifications/read-all
   DELETE /api/employee/notifications/:id
   DELETE /api/employee/notifications/clear-all
========================================================= */

router.get("/notifications", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    await syncEmployeeNotifications(employee._id, req.user._id);

    const filter = String(req.query.filter || "all").toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { employeeId: employee._id };
    if (filter === "unread") {
      query.isRead = false;
    } else if (filter === "tasks") {
      query.entityType = "task";
    } else if (filter === "tickets") {
      query.entityType = "ticket";
    } else if (filter === "attendance") {
      query.entityType = "attendance";
    }

    const [total, unreadCount, notifs] = await Promise.all([
      EmployeeNotification.countDocuments(query),
      EmployeeNotification.countDocuments({ employeeId: employee._id, isRead: false }),
      EmployeeNotification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    res.json({
      success: true,
      notifications: notifs.map(formatEmployeeNotification),
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/:id/read", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    const notif = await EmployeeNotification.findOneAndUpdate(
      { _id: req.params.id, employeeId: employee._id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    const unreadCount = await EmployeeNotification.countDocuments({ employeeId: employee._id, isRead: false });

    res.json({
      success: true,
      notification: formatEmployeeNotification(notif),
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/notifications/read-all", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    await EmployeeNotification.updateMany(
      { employeeId: employee._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({
      success: true,
      message: "All notifications marked as read.",
      unreadCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/notifications/:id", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID." });
    }

    await EmployeeNotification.findOneAndDelete({ _id: req.params.id, employeeId: employee._id });
    const unreadCount = await EmployeeNotification.countDocuments({ employeeId: employee._id, isRead: false });

    res.json({
      success: true,
      message: "Notification deleted.",
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/notifications/clear-all", authenticateUser, async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    await EmployeeNotification.deleteMany({ employeeId: employee._id, isRead: true });
    const unreadCount = await EmployeeNotification.countDocuments({ employeeId: employee._id, isRead: false });

    res.json({
      success: true,
      message: "Read notifications cleared.",
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
