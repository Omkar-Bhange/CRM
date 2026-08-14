const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const authenticateUser = require("./authMiddleware");

const Attendance =
  mongoose.models.AttendanceV2 ||
  mongoose.model(
    "AttendanceV2",
    new mongoose.Schema(
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
          index: true,
        },
        employeeCode: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
          index: true,
        },
        employeeName: {
          type: String,
          required: true,
          trim: true,
          index: true,
        },
        department: {
          type: String,
          default: "",
          trim: true,
        },
        role: {
          type: String,
          default: "",
          trim: true,
        },
        date: {
          type: String,
          required: true,
          index: true,
        },
        loginTime: {
          type: Date,
          default: null,
        },
        logoutTime: {
          type: Date,
          default: null,
        },
        breakStartedAt: {
          type: Date,
          default: null,
        },
        breakMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalBreakMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        workingMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalWorkedMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        shiftStart: {
          type: String,
          default: "09:00",
          trim: true,
        },
        shiftEnd: {
          type: String,
          default: "18:00",
          trim: true,
        },
        lateMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        earlyLogoutMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        overtimeMinutes: {
          type: Number,
          default: 0,
          min: 0,
        },
        status: {
          type: String,
          enum: ["Present", "Late", "Absent", "Half Day", "On Leave"],
          default: "Present",
          index: true,
        },
        workStatus: {
          type: String,
          enum: ["Working", "Break", "Logged Out", "On Leave"],
          default: "Working",
          index: true,
        },
        isAutoClosed: {
          type: Boolean,
          default: false,
        },
        autoClosedReason: {
          type: String,
          default: "",
          trim: true,
        },
        note: {
          type: String,
          default: "",
          trim: true,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        isDeleted: {
          type: Boolean,
          default: false,
          index: true,
        },
      },
      {
        timestamps: true,
        collection: "attendance",
      }
    )
  );

const AttendanceEvent =
  mongoose.models.AttendanceEvent ||
  mongoose.model(
    "AttendanceEvent",
    new mongoose.Schema(
      {
        attendanceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Attendance",
          required: true,
          index: true,
        },
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
          index: true,
        },
        type: {
          type: String,
          enum: ["LOGIN", "LOGOUT", "BREAK_START", "BREAK_END", "AUTO_CLOSE"],
          required: true,
          uppercase: true,
          trim: true,
        },
        timestamp: {
          type: Date,
          required: true,
          default: Date.now,
        },
        source: {
          type: String,
          default: "web",
          trim: true,
        },
        notes: {
          type: String,
          default: "",
          trim: true,
        },
      },
      {
        timestamps: true,
        collection: "attendanceevents",
      }
    )
  );

const Employee = mongoose.models.Employee;
const LeaveRequest = mongoose.models.LeaveRequest;

const router = express.Router();
router.use(authenticateUser);

const DEFAULT_SHIFT_START = "09:00";
const DEFAULT_SHIFT_END = "18:00";
const GRACE_MINUTES = 10;
const FULL_DAY_MINUTES = 480;
const HALF_DAY_THRESHOLD_MINUTES = 240;

const { getISTDateString } = require("./utils/dateUtils");

function getLocalDateString(date = new Date()) {
  return getISTDateString(date);
}

function parseShiftDate(dateString, timeString) {
  if (!dateString || !timeString) return null;
  return new Date(`${dateString}T${timeString}:00`);
}

function createAttendanceEvent(attendanceId, employeeId, type, source = "web", notes = "") {
  return AttendanceEvent.create({
    attendanceId,
    employeeId,
    type,
    source,
    notes,
  });
}

function formatAttendance(attendance) {
  if (!attendance) return null;
  const data = attendance.toObject ? attendance.toObject() : { ...attendance };

  return {
    id: String(data._id || data.id || ""),
    employeeId: String(data.employeeId || ""),
    employeeCode: data.employeeCode || "",
    employeeName: data.employeeName || "",
    department: data.department || "",
    role: data.role || "",
    date: data.date || "",
    loginTime: data.loginTime || null,
    logoutTime: data.logoutTime || null,
    breakStartedAt: data.breakStartedAt || null,
    breakMinutes: Number(data.breakMinutes || 0),
    totalBreakMinutes: Number(data.totalBreakMinutes || data.breakMinutes || 0),
    workingMinutes: Number(data.workingMinutes || 0),
    totalWorkedMinutes: Number(data.totalWorkedMinutes || data.workingMinutes || 0),
    shiftStart: data.shiftStart || DEFAULT_SHIFT_START,
    shiftEnd: data.shiftEnd || DEFAULT_SHIFT_END,
    lateMinutes: Number(data.lateMinutes || 0),
    earlyLogoutMinutes: Number(data.earlyLogoutMinutes || 0),
    overtimeMinutes: Number(data.overtimeMinutes || 0),
    status: data.status || getAttendanceStatus(data),
    workStatus: data.workStatus || resolveWorkStatus(data),
    isAutoClosed: Boolean(data.isAutoClosed),
    autoClosedReason: data.autoClosedReason || "",
    note: data.note || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function getAttendanceStatus(attendance) {
  if (!attendance || !attendance.loginTime) {
    return "Absent";
  }

  if (attendance.status === "On Leave") {
    return "On Leave";
  }

  if (attendance.totalWorkedMinutes < HALF_DAY_THRESHOLD_MINUTES) {
    return "Half Day";
  }

  if (attendance.lateMinutes > 0) {
    return "Late";
  }

  return "Present";
}

function resolveWorkStatus(attendance) {
  if (!attendance) return "Logged Out";
  if (attendance.status === "On Leave") return "On Leave";
  if (attendance.logoutTime) return "Logged Out";
  if (attendance.breakStartedAt) return "Break";
  if (attendance.loginTime) return "Working";
  return "Logged Out";
}

async function endActiveBreak(attendance, employee, now = new Date(), source = "system") {
  if (!attendance.breakStartedAt) return attendance;

  const breakEnd = now;
  const breakDuration = Math.max(0, Math.floor((breakEnd.getTime() - new Date(attendance.breakStartedAt).getTime()) / 60000));
  attendance.breakMinutes = Number(attendance.breakMinutes || 0) + breakDuration;
  attendance.totalBreakMinutes = Number(attendance.totalBreakMinutes || 0) + breakDuration;
  attendance.breakStartedAt = null;
  attendance.workStatus = "Working";
  attendance.updatedBy = attendance.updatedBy || employee._id;

  await attendance.save();
  await createAttendanceEvent(attendance._id, attendance.employeeId, "BREAK_END", source, "Auto ended break before logout.");

  return attendance;
}

function calculateAttendanceMetrics(attendance) {
  const result = {
    totalWorkedMinutes: 0,
    totalBreakMinutes: Number(attendance.totalBreakMinutes || 0),
    lateMinutes: 0,
    earlyLogoutMinutes: 0,
    overtimeMinutes: 0,
  };

  if (!attendance.loginTime) return result;

  const loginTime = new Date(attendance.loginTime);
  const logoutTime = attendance.logoutTime ? new Date(attendance.logoutTime) : new Date();

  const grossMinutes = Math.max(0, Math.floor((logoutTime.getTime() - loginTime.getTime()) / 60000));
  result.totalWorkedMinutes = Math.max(0, grossMinutes - result.totalBreakMinutes);

  const shiftStartAt = parseShiftDate(attendance.date, attendance.shiftStart || DEFAULT_SHIFT_START);
  if (shiftStartAt) {
    const lateBy = Math.floor((loginTime.getTime() - shiftStartAt.getTime()) / 60000);
    result.lateMinutes = lateBy > GRACE_MINUTES ? lateBy : 0;
  }

  const shiftEndAt = parseShiftDate(attendance.date, attendance.shiftEnd || DEFAULT_SHIFT_END);
  if (shiftEndAt && logoutTime.getTime() < shiftEndAt.getTime()) {
    result.earlyLogoutMinutes = Math.floor((shiftEndAt.getTime() - logoutTime.getTime()) / 60000);
  }

  if (result.totalWorkedMinutes > FULL_DAY_MINUTES) {
    result.overtimeMinutes = result.totalWorkedMinutes - FULL_DAY_MINUTES;
  }

  return result;
}
async function closeAttendanceRecord(attendance, options = {}) {
  if (!attendance || attendance.logoutTime) {
    return attendance;
  }

  const endAt = options.logoutAt || parseShiftDate(attendance.date, attendance.shiftEnd || DEFAULT_SHIFT_END) || new Date();

  if (attendance.breakStartedAt) {
    const breakEndAt = endAt;
    const breakDuration = Math.max(0, Math.floor((breakEndAt.getTime() - new Date(attendance.breakStartedAt).getTime()) / 60000));
    attendance.breakMinutes = Number(attendance.breakMinutes || 0) + breakDuration;
    attendance.totalBreakMinutes = Number(attendance.totalBreakMinutes || 0) + breakDuration;
    attendance.breakStartedAt = null;
    attendance.workStatus = "Working";
    await attendance.save();
    await createAttendanceEvent(attendance._id, attendance.employeeId, "BREAK_END", "system", "Auto closed break before logout.");
  }

  attendance.logoutTime = endAt;
  const metrics = calculateAttendanceMetrics(attendance);
  attendance.workingMinutes = metrics.totalWorkedMinutes;
  attendance.totalWorkedMinutes = metrics.totalWorkedMinutes;
  attendance.totalBreakMinutes = metrics.totalBreakMinutes;
  attendance.lateMinutes = metrics.lateMinutes;
  attendance.earlyLogoutMinutes = metrics.earlyLogoutMinutes;
  attendance.overtimeMinutes = metrics.overtimeMinutes;
  attendance.workStatus = "Logged Out";
  attendance.isAutoClosed = true;
  attendance.autoClosedReason = options.reason || "Logout missed";
  attendance.status = getAttendanceStatus(attendance);
  attendance.updatedBy = attendance.updatedBy || attendance.employeeId;

  await attendance.save();
  await createAttendanceEvent(attendance._id, attendance.employeeId, "LOGOUT", "system", attendance.autoClosedReason);

  return attendance;
}

async function closeOpenAttendanceForEmployee(employeeId, options = {}) {
  const today = getLocalDateString();
  const query = {
    employeeId,
    logoutTime: null,
    date: { $lt: today },
  };

  if (options.includeToday) {
    query.date = { $lte: today };
  }

  const openAttendance = await Attendance.find(query);
  const closed = [];

  for (const record of openAttendance) {
    const closedRecord = await closeAttendanceRecord(record, {
      logoutAt: parseShiftDate(record.date, record.shiftEnd || DEFAULT_SHIFT_END) || new Date(),
      reason: record.breakStartedAt ? "Logout missed after break" : "Logout missed",
    });
    closed.push(closedRecord);
  }

  return closed;
}

async function findEmployee(req, res) {
  if (req.user.role !== "employee") {
    res.status(403).json({ success: false, message: "Employee account is required." });
    return null;
  }

  const employee = await Employee.findOne({ userId: req.user._id });
  if (!employee) {
    res.status(404).json({ success: false, message: "Employee profile not found." });
    return null;
  }

  return employee;
}

async function getApprovedLeave(employeeId, date) {
  if (!LeaveRequest) return null;

  return LeaveRequest.findOne({
    employeeId,
    status: "Approved",
    fromDate: { $lte: date },
    toDate: { $gte: date },
  });
}

async function updateEmployeeStatus(employee, workStatus) {
  if (!employee) return;

  const Task = mongoose.models.Task;
  const SupportTicket = mongoose.models.SupportTicket;

  let status = "Offline";

  if (workStatus === "Offline") {
    status = "Offline";
  } else if (workStatus === "Break") {
    status = "Break";
  } else {
    const hasActiveTask = Task
      ? await Task.exists({
          assignedEmployeeId: employee._id,
          isDeleted: false,
          status: { $in: ["Assigned", "In Progress", "Paused", "Testing"] },
        })
      : false;

    const hasActiveTicket = SupportTicket
      ? await SupportTicket.exists({
          assignedEmployeeId: employee._id,
          isDeleted: false,
          status: { $in: ["New", "Assigned", "In Progress"] },
        })
      : false;

    status = hasActiveTask || hasActiveTicket ? "Working" : "Free";
  }

  employee.status = status;
  employee.lastActivityAt = new Date();
  await employee.save();
}

router.post("/login", async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    if (!employee) return;

    await closeOpenAttendanceForEmployee(employee._id);

    const today = getLocalDateString();
    const currentAttendance = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (currentAttendance) {
      if (!currentAttendance.logoutTime) {
        return res.status(200).json({ success: true, message: "You are already logged in.", data: formatAttendance(currentAttendance) });
      }
      return res.status(200).json({ success: true, message: "Today attendance is already completed.", data: formatAttendance(currentAttendance) });
    }

    const leave = await getApprovedLeave(employee._id, today);
    if (leave) {
      return res.status(400).json({ success: false, message: "Today is already marked as approved leave." });
    }

    const loginTime = new Date();
    const attendance = await Attendance.create({
      employeeId: employee._id,
      employeeCode: employee.employeeCode,
      employeeName: employee.name,
      department: employee.department,
      role: employee.role,
      date: today,
      loginTime,
      logoutTime: null,
      breakStartedAt: null,
      breakMinutes: 0,
      totalBreakMinutes: 0,
      workingMinutes: 0,
      totalWorkedMinutes: 0,
      shiftStart: DEFAULT_SHIFT_START,
      shiftEnd: DEFAULT_SHIFT_END,
      lateMinutes: 0,
      earlyLogoutMinutes: 0,
      overtimeMinutes: 0,
      status: "Present",
      workStatus: "Working",
      isAutoClosed: false,
      autoClosedReason: "",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await createAttendanceEvent(attendance._id, employee._id, "LOGIN", req.body.source || "web", req.body.notes || "");
    await updateEmployeeStatus(employee, "Working");

    return res.status(201).json({ success: true, message: "Login recorded successfully.", data: formatAttendance(attendance) });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    if (!employee) return;

    const today = getLocalDateString();
    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });

    if (!attendance) {
      return res.status(400).json({ success: false, message: "Please login first." });
    }

    if (attendance.logoutTime) {
      return res.status(200).json({ success: true, message: "You are already logged out.", data: formatAttendance(attendance) });
    }

    // End any active break
    if (attendance.breakStartedAt) {
      await endActiveBreak(attendance, employee, new Date(), "web");
    }

    const logoutTime = new Date();
    attendance.logoutTime = logoutTime;
    const metrics = calculateAttendanceMetrics(attendance);
    attendance.workingMinutes = metrics.totalWorkedMinutes;
    attendance.totalWorkedMinutes = metrics.totalWorkedMinutes;
    attendance.totalBreakMinutes = metrics.totalBreakMinutes;
    attendance.lateMinutes = metrics.lateMinutes;
    attendance.earlyLogoutMinutes = metrics.earlyLogoutMinutes;
    attendance.overtimeMinutes = metrics.overtimeMinutes;
    attendance.workStatus = "Logged Out";
    attendance.status = getAttendanceStatus(attendance);
    attendance.updatedBy = req.user._id;
    await attendance.save();

    await createAttendanceEvent(attendance._id, employee._id, "LOGOUT", req.body.source || "web", req.body.notes || "");

    // Update employee status to Offline
    await updateEmployeeStatus(employee, "Offline");
    try {
  const agentHost = process.env.AGENT_API_HOST || "127.0.0.1";
  const agentPort = process.env.AGENT_API_PORT || 4500;
  const agentBaseUrl = `http://${agentHost}:${agentPort}`;

  await axios.post(`${agentBaseUrl}/logout`, {
    employeeCode: employee.employeeCode,
  });

  console.log(`Agent stopped for ${employee.employeeCode}`);
} catch (err) {
  console.warn("Agent logout API failed:", err.message);
}

    // Pause any active task
    const Task = mongoose.models.Task;
    if (Task) {
      const activeTask = await Task.findOne({
        assignedEmployeeId: employee._id,
        status: "In Progress",
        isDeleted: false,
      });
      if (activeTask) {
        if (activeTask.startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(activeTask.startedAt).getTime()) / 1000);
          activeTask.elapsedSeconds = (activeTask.elapsedSeconds || 0) + elapsed;
        }
        activeTask.status = "Paused";
        activeTask.pausedAt = new Date();
        activeTask.startedAt = null;
        activeTask.lastUpdated = new Date();
        await activeTask.save();
        // Clear employee's current task fields
        employee.currentTaskId = null;
        employee.currentTaskCode = "";
        employee.currentTaskTitle = "";
        employee.currentClient = "—";
        employee.currentProject = "—";
        employee.currentTaskStartedAt = null;
        await employee.save();
      }
    }

    return res.status(200).json({ success: true, message: "Logout recorded successfully.", data: formatAttendance(attendance) });
  } catch (error) {
    next(error);
  }
});

router.post("/break/start", async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    if (!employee) return;

    const today = getLocalDateString();
    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (!attendance || !attendance.loginTime) {
      return res.status(400).json({ success: false, message: "Please login before starting a break." });
    }

    if (attendance.logoutTime) {
      return res.status(400).json({ success: false, message: "Today attendance is already completed." });
    }

    if (attendance.breakStartedAt) {
      return res.status(400).json({ success: false, message: "A break is already active." });
    }

    attendance.breakStartedAt = new Date();
    attendance.workStatus = "Break";
    attendance.updatedBy = req.user._id;
    await attendance.save();

    await createAttendanceEvent(attendance._id, employee._id, "BREAK_START", req.body.source || "web", req.body.notes || "");
    await updateEmployeeStatus(employee, "Break");

    return res.status(200).json({ success: true, message: "Break started.", data: formatAttendance(attendance) });
  } catch (error) {
    next(error);
  }
});

router.post("/break/end", async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    if (!employee) return;

    const today = getLocalDateString();
    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (!attendance || !attendance.loginTime) {
      return res.status(400).json({ success: false, message: "No active attendance to end break." });
    }

    if (!attendance.breakStartedAt) {
      return res.status(400).json({ success: false, message: "No active break to end." });
    }

    const breakEnd = new Date();
    const breakDuration = Math.max(0, Math.floor((breakEnd.getTime() - new Date(attendance.breakStartedAt).getTime()) / 60000));
    attendance.breakMinutes = Number(attendance.breakMinutes || 0) + breakDuration;
    attendance.totalBreakMinutes = Number(attendance.totalBreakMinutes || 0) + breakDuration;
    attendance.breakStartedAt = null;
    attendance.workStatus = "Working";
    attendance.updatedBy = req.user._id;
    await attendance.save();

    await createAttendanceEvent(attendance._id, employee._id, "BREAK_END", req.body.source || "web", req.body.notes || "");
    await updateEmployeeStatus(employee, "Working");

    return res.status(200).json({ success: true, message: "Break ended.", data: formatAttendance(attendance) });
  } catch (error) {
    next(error);
  }
});

router.get("/today", async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    if (!employee) return;

    await closeOpenAttendanceForEmployee(employee._id);

    const today = getLocalDateString();
    const attendance = await Attendance.findOne({ employeeId: employee._id, date: today });
    if (attendance) {
      return res.status(200).json({ success: true, data: formatAttendance(attendance) });
    }

    const leave = await getApprovedLeave(employee._id, today);
    if (leave) {
      return res.status(200).json({
        success: true,
        data: {
          id: null,
          employeeId: String(employee._id),
          employeeCode: employee.employeeCode,
          employeeName: employee.name,
          date: today,
          loginTime: null,
          logoutTime: null,
          breakStartedAt: null,
          breakMinutes: 0,
          totalBreakMinutes: 0,
          workingMinutes: 0,
          totalWorkedMinutes: 0,
          shiftStart: DEFAULT_SHIFT_START,
          shiftEnd: DEFAULT_SHIFT_END,
          lateMinutes: 0,
          earlyLogoutMinutes: 0,
          overtimeMinutes: 0,
          status: "On Leave",
          workStatus: "On Leave",
          isAutoClosed: false,
          autoClosedReason: "",
          note: "Approved leave day.",
        },
      });
    }

    return res.status(200).json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    if (!employee) return;

    const data = await Attendance.find({ employeeId: employee._id })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: data.map(formatAttendance) });
  } catch (error) {
    next(error);
  }
});

router.get("/month", async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    if (!employee) return;

    const month = req.query.month || getLocalDateString().slice(0, 7);
    const attendance = await Attendance.find({
      employeeId: employee._id,
      date: { $regex: `^${month}` },
    })
      .sort({ date: 1 })
      .lean();

    let leaveDays = [];
    if (LeaveRequest) {
      const leaves = await LeaveRequest.find({
        employeeId: employee._id,
        status: "Approved",
        fromDate: { $lte: `${month}-31` },
        toDate: { $gte: `${month}-01` },
      });

      const days = new Set();
      for (const leave of leaves) {
        const start = new Date(`${leave.fromDate}T00:00:00`);
        const end = new Date(`${leave.toDate}T00:00:00`);
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          const dateString = date.toISOString().slice(0, 10);
          if (dateString.startsWith(month)) {
            days.add(dateString);
          }
        }
      }
      leaveDays = Array.from(days).sort();
    }

    return res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance.map(formatAttendance),
      leaveDays,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const employee = await findEmployee(req, res);
    if (!employee) return;

    const allAttendance = await Attendance.find({ employeeId: employee._id })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const completed = allAttendance.filter((item) => item.logoutTime);
    const last30 = completed.slice(0, 30);
    const averageWorkedMinutes = last30.length
      ? Math.round(
          last30.reduce((sum, record) => sum + Number(record.totalWorkedMinutes || record.workingMinutes || 0), 0) / last30.length
        )
      : 0;

    const summary = {
      totalDays: allAttendance.length,
      present: allAttendance.filter((item) => item.status === "Present").length,
      late: allAttendance.filter((item) => item.status === "Late").length,
      halfDay: allAttendance.filter((item) => item.status === "Half Day").length,
      absent: allAttendance.filter((item) => item.status === "Absent").length,
      leave: allAttendance.filter((item) => item.status === "On Leave").length,
      working: allAttendance.filter((item) => item.workStatus === "Working").length,
      break: allAttendance.filter((item) => item.workStatus === "Break").length,
      loggedOut: allAttendance.filter((item) => item.workStatus === "Logged Out").length,
      autoClosed: allAttendance.filter((item) => item.isAutoClosed).length,
      averageWorkedMinutes,
    };

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

router.post("/auto-close", async (req, res, next) => {
  try {
    let employee = null;
    let closed = [];

    if (req.user.role === "admin") {
      if (req.body.employeeId) {
        employee = await Employee.findById(req.body.employeeId);
        if (!employee) {
          return res.status(404).json({ success: false, message: "Employee not found." });
        }
        closed = await closeOpenAttendanceForEmployee(employee._id, { includeToday: req.body.includeToday === true });
      } else {
        const today = getLocalDateString();
        const openRecords = await Attendance.find({ logoutTime: null, date: { $lt: today } });
        for (const record of openRecords) {
          closed.push(await closeAttendanceRecord(record, { logoutAt: parseShiftDate(record.date, record.shiftEnd || DEFAULT_SHIFT_END), reason: "Logout missed" }));
        }
      }
    } else {
      employee = await findEmployee(req, res);
      if (!employee) return;
      closed = await closeOpenAttendanceForEmployee(employee._id, { includeToday: req.body.includeToday === true });
    }

    return res.status(200).json({ success: true, message: "Open attendance records closed.", count: closed.length, data: closed.map(formatAttendance) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
