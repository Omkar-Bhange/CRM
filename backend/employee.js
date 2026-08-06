const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const {
  authenticateUser,
  User,
} = require("./auth");

const router = express.Router();

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

router.get("/me", async (req, res, next) => {
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
        message:
          "Employee profile is not connected to this login account.",
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

    const Task = mongoose.models.Task;
    const SupportTicket = mongoose.models.SupportTicket;
    const Attendance = mongoose.models.Attendance;
    const ActivityLog = mongoose.models.ActivityLog;
    const today = new Date().toISOString().slice(0, 10);
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const assignmentQuery = { assignedEmployeeId: employee._id, isDeleted: false };

    const todayStart = new Date(`${today}T00:00:00`);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const [attendance, tasks, tickets, activeTask, activeTaskCount, dueTodayCount, ticketCount, solvedThisWeek, workActivity] = await Promise.all([
      Attendance ? Attendance.findOne({ employeeId: employee._id, date: today }).lean() : null,
      Task ? Task.find(assignmentQuery).sort({ dueDate: 1, createdAt: -1 }).limit(6).lean() : [],
      SupportTicket ? SupportTicket.find({ ...assignmentQuery, status: { $in: ["Assigned", "In Progress", "New"] } }).sort({ createdAt: -1 }).limit(6).lean() : [],
      Task ? Task.findOne({ ...assignmentQuery, status: { $in: ["In Progress", "Paused"] } }).sort({ updatedAt: -1 }).lean() : null,
      Task ? Task.countDocuments({ ...assignmentQuery, status: { $nin: ["Completed", "Closed", "Cancelled"] } }) : 0,
      Task ? Task.countDocuments({ ...assignmentQuery, status: { $nin: ["Completed", "Closed", "Cancelled"] }, dueDate: { $gte: todayStart, $lt: tomorrowStart } }) : 0,
      SupportTicket ? SupportTicket.countDocuments({ ...assignmentQuery, status: { $in: ["Assigned", "In Progress", "New"] } }) : 0,
      SupportTicket ? SupportTicket.countDocuments({ ...assignmentQuery, status: "Resolved", resolvedAt: { $gte: weekStart } }) : 0,
      ActivityLog ? ActivityLog.find({ employeeId: employee._id, createdAt: { $gte: new Date(`${today}T00:00:00`) }, isDeleted: false }).sort({ createdAt: -1 }).limit(8).lean() : [],
    ]);

    const workLog = [
      attendance?.loginTime && { id: `login-${attendance._id}`, type: "login", title: "Checked in", description: "Attendance login recorded", time: attendance.loginTime },
      ...workActivity.map((item) => ({ id: item._id, type: item.category === "Task" ? "task" : "activity", title: item.action, description: item.description, time: item.createdAt })),
      attendance?.logoutTime && { id: `logout-${attendance._id}`, type: "logout", title: "Checked out", description: "Attendance logout recorded", time: attendance.logoutTime },
    ].filter(Boolean).sort((a, b) => new Date(a.time) - new Date(b.time));

    return res.json({
      success: true,
      data: {
        employee: employeeResponse(employee),
        attendance: attendance || null,
        summary: { hoursToday: attendance?.workingMinutes || 0, activeTaskCount, dueTodayCount, ticketCount, solvedThisWeek },
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
   MY TASKS DASHBOARD AND TIMER
========================================================= */
router.get("/tasks/dashboard", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") return res.status(403).json({ success: false, message: "Employee account is required." });
    const employee = await Employee.findOne({ userId: req.user._id });
    const Task = mongoose.models.Task;
    if (!employee || !Task) return res.status(404).json({ success: false, message: "Employee task data is unavailable." });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const assigned = { assignedEmployeeId: employee._id, isDeleted: false };
    const [tasks, summary, activeTimer] = await Promise.all([
      Task.find(assigned).sort({ dueDate: 1, createdAt: -1 }).lean(),
      Task.aggregate([
        { $match: assigned },
        { $group: { _id: null,
          active: { $sum: { $cond: [{ $in: ["$status", ["Assigned", "In Progress", "Testing"]] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
          dueToday: { $sum: { $cond: [{ $and: [{ $gte: ["$dueDate", today] }, { $lt: ["$dueDate", tomorrow] }, { $ne: ["$status", "Completed"] }] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $and: [{ $lt: ["$dueDate", today] }, { $not: [{ $in: ["$status", ["Completed", "Cancelled"]] }] }] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
        } },
      ]),
      Task.findOne({ ...assigned, status: { $in: ["In Progress", "Paused"] } }).sort({ lastUpdated: -1 }).lean(),
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
    return res.json({ success: true, data: { summary: summary[0] || { active: 0, inProgress: 0, dueToday: 0, overdue: 0, completed: 0 }, activeTimer: withCurrentElapsed(activeTimer), tasks: tasks.map(withCurrentElapsed) } });
  } catch (error) { next(error); }
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
      addElapsed(task); task.status = "Completed"; task.progress = 100; task.completedAt = now; task.startedAt = null; task.pausedAt = null;
    } else return res.status(400).json({ success: false, message: "Invalid timer action." });
    task.spentMinutes = task.elapsedMinutes; task.lastUpdated = now; await task.save();
    if (action === "start" || action === "resume") {
      employee.status = "Working";
      employee.currentTask = task.title;
      employee.currentClient = task.clientName || "—";
    } else if (action === "pause" || action === "stop") {
      employee.status = "Break";
    } else if (action === "complete") {
      const remaining = await Task.exists({ assignedEmployeeId: employee._id, status: "In Progress", isDeleted: false });
      if (!remaining) {
        employee.status = "Free";
        employee.currentTask = "Available for assignment";
        employee.currentClient = "—";
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

module.exports = router;
