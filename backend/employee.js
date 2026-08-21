const express = require("express");

const mongoose = require("mongoose");


const bcrypt = require("bcryptjs");
require("./admin");
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
// console.log("AgentDailySummary model:", !!AgentDailySummary);
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

router.get("/employees", requireAdmin, async (req, res, next) => {
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

    const normalizedSearch = String(search).trim();

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

    const employees = await Employee.find(query).sort({
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees.map(employeeResponse),
    });
  } catch (error) {
    next(error);
  }
});

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

      return res.json({
        success: true,
        ticket,
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

      await ticket.save();

      res.json({
        success: true,
        ticket,
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
  tasks: tasks.map(withCurrentElapsed),
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
      { new: true }
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
// ADD this helper
const PRODUCTIVE_CATEGORIES = ["Development", "Database", "Design", "Documentation", "Office"];
const UNPRODUCTIVE_CATEGORIES = ["Entertainment", "Social Media", "Games"];

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
      data: logs.map((log) => ({
        id: log._id,
        capturedAt: log.lastSeen || log.firstSeen || null,
        application: log.application,
        windowTitle: log.lastWindowTitle || "",
        durationSeconds: Number(log.totalSeconds || 0),
        sessionCount: Number(log.sessionCount || 0),
        category: log.category,
        activity: log.activity,
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
      })),
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
data: logs.map((log) => ({
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
lastWindowTitle: log.lastWindowTitle || "",  
  // Timing
  startedAt: log.firstSeen,
  endedAt: log.lastSeen,
  durationSeconds: log.totalSeconds || 0,

  // Status
  status: "Completed",
}))
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

    // Load employee profile linked to the logged-in user
    const employeeProfile = await Employee.findOne({ userId: user._id });

    if (!employeeProfile) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const employeeCode = employeeProfile.employeeCode;

    const records = await AgentDailySummary.find({
      employeeCode,
      date: todayBucket,
    }).sort({ totalSeconds: -1 });

    const totalTrackedSeconds = records.reduce(
      (sum, r) => sum + Number(r.totalSeconds || 0),
      0
    );

    const totalSessions = records.reduce(
      (sum, r) => sum + Number(r.sessionCount || 0),
      0
    );

    const applications = records.map((r) => ({
      applicationName: r.application,
      category: r.category || "Other",
      totalSeconds: r.totalSeconds || 0,
      productivity: classifyProductivity(r.category),
      percentage:
        totalTrackedSeconds > 0
          ? Math.round((r.totalSeconds / totalTrackedSeconds) * 100)
          : 0,
      project: r.project || "",
      client: r.client || "",
      sessionCount: r.sessionCount || 0,
      lastWindowTitle: r.lastWindowTitle || "",
      lastSeen: r.lastSeen,
    }));

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
      },
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
module.exports = router;
