const express = require("express");
const mongoose = require("mongoose");

const {
  authenticateUser,
} = require("./auth");
const Employee =
  mongoose.models.Employee ||
  mongoose.model("Employee");
const router = express.Router();

/* =========================================================
   ATTENDANCE SCHEMA
========================================================= */

const attendanceSchema = new mongoose.Schema(
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
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
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

    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    breakStartedAt: {          // ← add this block
      type: Date,
      default: null,
    },

    workingMinutes: {
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
      enum: [
        "Present",
        "Late",
        "Absent",
        "Half Day",
        "On Leave",
      ],
      default: "Present",
    },

    workStatus: {
      type: String,
      enum: [
        "Working",
        "Free",
        "Break",
        "Logged Out",
        "On Leave",
      ],
      default: "Working",
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
  },
  {
    timestamps: true,
    collection: "attendance",
  }
);

const Attendance =
  mongoose.models.Attendance ||
  mongoose.model(
    "Attendance",
    attendanceSchema
  );

  function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function toAttendanceDateTime(value, date) {
  if (!value) return null;
  if (/^\d{2}:\d{2}$/.test(value)) {
    return new Date(`${date}T${value}:00`);
  }
  return value;
}
/* =========================================================
   LEAVE REQUEST SCHEMA
========================================================= */

const leaveSchema = new mongoose.Schema(
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
    },

    employeeName: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      default: "",
    },

    leaveType: {
      type: String,
      required: true,
    },

    fromDate: {
      type: String,
      required: true,
    },

    toDate: {
      type: String,
      required: true,
    },

    days: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],
      default: "Pending",
    },

    reviewedBy: {
      type: String,
      default: "",
    },

    reviewNote: {
      type: String,
      default: "",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "leaveRequests",
  }
);

const LeaveRequest =
  mongoose.models.LeaveRequest ||
  mongoose.model(
    "LeaveRequest",
    leaveSchema
  );
  router.use(authenticateUser);
  /* =========================================================
   TEST ROUTE
========================================================= */

router.get("/attendance/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Attendance API is working.",
    user: {
      id: req.user._id,
      role: req.user.role,
      name: req.user.name,
    },
  });
});

/* =========================================================
   EMPLOYEE CHECK IN
========================================================= */

router.post(
  "/attendance/check-in",
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

      const today = getTodayDate();

      const existingAttendance =
        await Attendance.findOne({
          employeeId: employee._id,
          date: today,
        });

      if (existingAttendance) {
        return res.status(200).json({
          success: true,
          message: "Already checked in today.",
          data: existingAttendance,
        });
      }

      const attendance =
        await Attendance.create({
          employeeId: employee._id,
          employeeCode:
            employee.employeeCode,
          employeeName:
            employee.name,
          department:
            employee.department,
          role:
            employee.role,

          date: today,

         loginTime: new Date(),

          logoutTime: null,

          workingMinutes: 0,

          breakMinutes: 0,

          overtimeMinutes: 0,

          status: "Present",

          workStatus: "Working",

          createdBy: req.user._id,

          updatedBy: req.user._id,
        });
        employee.status = "Working";

employee.loginTime = attendance.loginTime;

employee.logoutTime = null;

employee.activeMinutes = 0;

employee.lastActivityAt = new Date();

await employee.save();

      return res.status(201).json({
        success: true,
        message:
          "Checked in successfully.",
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   ADMIN TODAY ATTENDANCE
========================================================= */

router.get(
  "/attendance/today/all",
  async (req, res, next) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin account is required.",
        });
      }

      const today = getTodayDate();

      const employees = await Employee.find({
        isActive: true,
      }).sort({
        name: 1,
      });

      const attendanceList =
        await Attendance.find({
          date: today,
        });

      const approvedLeaves = await LeaveRequest.find({
        status: "Approved",
        fromDate: { $lte: today },
        toDate: { $gte: today },
      });
      const leaveEmployeeIds = new Set(
        approvedLeaves.map((leave) => String(leave.employeeId))
      );

      const attendanceMap = new Map();

      attendanceList.forEach((item) => {
        attendanceMap.set(
          String(item.employeeId),
          item
        );
      });

      const rows = [];
      for (const employee of employees) {
  const attendance =
    attendanceMap.get(
      String(employee._id)
    );

  if (attendance) {
    rows.push({
      employeeId: employee._id,

      employeeCode:
        employee.employeeCode,

      employeeName:
        employee.name,

      department:
        employee.department,

      role:
        employee.role,

      attendanceStatus:
        attendance.status,

      workStatus:
        attendance.workStatus,

      loginTime:
        attendance.loginTime,

      logoutTime:
        attendance.logoutTime,

     workingMinutes:
    attendance.workingMinutes ?? 0,

breakMinutes:
    attendance.breakMinutes ?? 0,

      attendanceId:
        attendance._id,
    });
  } else if (leaveEmployeeIds.has(String(employee._id))) {
    rows.push({
      employeeId: employee._id,
      employeeCode: employee.employeeCode,
      employeeName: employee.name,
      department: employee.department,
      role: employee.role,
      attendanceStatus: "On Leave",
      workStatus: "On Leave",
      loginTime: null,
      logoutTime: null,
      workingMinutes: 0,
      breakMinutes: 0,
      attendanceId: null,
    });
  } else {
    rows.push({
      employeeId: employee._id,

      employeeCode:
        employee.employeeCode,

      employeeName:
        employee.name,

      department:
        employee.department,

      role:
        employee.role,

      attendanceStatus:
        "Absent",

      workStatus:
        "Absent",

      loginTime: null,

      logoutTime: null,

      workingMinutes: 0,

      breakMinutes: 0,

      attendanceId: null,
    });
  }
}
const summary = {
  total: rows.length,

  present: rows.filter((x) =>
    ["Present", "Late", "Half Day"].includes(
      x.attendanceStatus
    )
  ).length,

  absent: rows.filter(
    (x) => x.attendanceStatus === "Absent"
  ).length,

  late: rows.filter(
    (x) => x.attendanceStatus === "Late"
  ).length,

  halfDay: rows.filter(
    (x) => x.attendanceStatus === "Half Day"
  ).length,

  leave: rows.filter(
    (x) => x.attendanceStatus === "On Leave"
  ).length,

  working: rows.filter(
    (x) => x.workStatus === "Working"
  ).length,

  break: rows.filter(
    (x) => x.workStatus === "Break"
  ).length,

  free: rows.filter(
    (x) => x.workStatus === "Free"
  ).length,

  loggedOut: rows.filter(
    (x) => x.workStatus === "Logged Out"
  ).length,
};
return res.json({
  success: true,
  message: "Today's attendance loaded successfully.",
  summary,
  data: rows,
});
  } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   EMPLOYEE CHECK OUT
========================================================= */

router.put(
  "/attendance/check-out",
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

      const today = getTodayDate();

      const attendance =
        await Attendance.findOne({
          employeeId: employee._id,
          date: today,
        });

      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: "You have not checked in today.",
        });
      }

      if (attendance.logoutTime) {
        return res.status(200).json({
          success: true,
          message: "Already checked out.",
          data: attendance,
        });
      }

     attendance.logoutTime = new Date();

const login = new Date(attendance.loginTime);
const logout = new Date();

attendance.logoutTime = logout;

attendance.workingMinutes = Math.max(
  0,
  Math.floor(
    (logout.getTime() - login.getTime()) / 60000
  )
);

attendance.workStatus = "Logged Out";
attendance.updatedBy = req.user._id;
employee.status = "Offline";

employee.logoutTime =
  attendance.logoutTime;

employee.activeMinutes =
  attendance.workingMinutes;

employee.lastActivityAt =
  new Date();

await employee.save();

      await attendance.save();

      return res.status(200).json({
        success: true,
        message: "Checked out successfully.",
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   START BREAK
========================================================= */

router.post("/attendance/break-start", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Employee account is required." });
    }

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }

    const attendance = await Attendance.findOne({ employeeId: employee._id, date: getTodayDate() });
    if (!attendance) {
      return res.status(404).json({ success: false, message: "You have not checked in today." });
    }

    if (attendance.workStatus !== "Working") {
      return res.status(400).json({ success: false, message: "You can only start a break while working." });
    }

    attendance.workStatus = "Break";
    attendance.breakStartedAt = new Date();
    await attendance.save();

    employee.status = "Break";
    await employee.save();

    return res.status(200).json({ success: true, message: "Break started.", data: attendance });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   END BREAK
========================================================= */

router.put("/attendance/break-end", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Employee account is required." });
    }

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }

    const attendance = await Attendance.findOne({ employeeId: employee._id, date: getTodayDate() });
    if (!attendance || attendance.workStatus !== "Break" || !attendance.breakStartedAt) {
      return res.status(400).json({ success: false, message: "No active break to end." });
    }

    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(attendance.breakStartedAt).getTime()) / 60000));
    attendance.breakMinutes = Number(attendance.breakMinutes || 0) + elapsedMinutes;
    attendance.breakStartedAt = null;
    attendance.workStatus = "Working";
    await attendance.save();

    employee.status = "Working";
    await employee.save();

    return res.status(200).json({ success: true, message: "Break ended.", data: attendance });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   GET TODAY'S ATTENDANCE
========================================================= */

router.get(
  "/attendance/today",
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

      const attendance = await Attendance.findOne({
        employeeId: employee._id,
        date: getTodayDate(),
      });

      if (!attendance) {
        return res.status(200).json({
          success: true,
          data: null,
        });
      }

      return res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   EMPLOYEE ATTENDANCE HISTORY
========================================================= */
router.get("/attendance/me", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Employee account is required." });
    }

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }

    const data = await Attendance.find({ employeeId: employee._id })
      .sort({ date: -1, createdAt: -1 });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   LEAVE REQUESTS
========================================================= */
router.post("/leave", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Employee account is required." });
    }
    const { leaveType, fromDate, toDate, days, reason } = req.body;
    if (!leaveType || !fromDate || !toDate || !days || !reason?.trim()) {
      return res.status(400).json({ success: false, message: "Leave type, dates, days and reason are required." });
    }
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }
    const leave = await LeaveRequest.create({
      employeeId: employee._id,
      employeeCode: employee.employeeCode,
      employeeName: employee.name,
      department: employee.department,
      leaveType,
      fromDate,
      toDate,
      days: Number(days),
      reason: reason.trim(),
    });
    return res.status(201).json({ success: true, message: "Leave request submitted successfully.", data: leave });
  } catch (error) {
    next(error);
  }
});

router.get("/leave/my", async (req, res, next) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ success: false, message: "Employee account is required." });
    }
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }
    const data = await LeaveRequest.find({ employeeId: employee._id }).sort({ appliedAt: -1 });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/leave", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin account is required." });
    }
    const data = await LeaveRequest.find().sort({ appliedAt: -1 });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.put("/leave/:id/review", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin account is required." });
    }
    const { status, reviewNote } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Leave status must be Approved or Rejected." });
    }
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }
    leave.status = status;
    leave.reviewedBy = req.user.name || "Administrator";
    leave.reviewNote = reviewNote?.trim() || "";
    leave.approvedAt = status === "Approved" ? new Date() : null;
    await leave.save();
    return res.json({ success: true, message: `Leave request ${status.toLowerCase()}.`, data: leave });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   GET ALL ATTENDANCE
========================================================= */

router.get("/attendance", async (req, res, next) => {
  try {
    const attendance = await Attendance.find()
      .sort({
        date: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   CREATE ATTENDANCE
========================================================= */

router.post("/attendance", async (req, res, next) => {
  try {
    const {
      employeeId,
      employeeCode,
      employeeName,
      department,
      role,
      date,
      loginTime,
      logoutTime,
      breakMinutes,
      workingMinutes,
      overtimeMinutes,
      status,
      workStatus,
      note,
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee is required.",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Attendance date is required.",
      });
    }

    const existingAttendance =
      await Attendance.findOne({
        employeeId,
        date,
      });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message:
          "Attendance already exists for this employee.",
      });
    }

    const attendance =
      await Attendance.create({
        employeeId,

        employeeCode,

        employeeName,

        department,

        role,

        date,

        loginTime:
          loginTime || "",

        logoutTime:
          logoutTime || "",

        breakMinutes:
          Number(
            breakMinutes || 0
          ),

        workingMinutes:
          Number(
            workingMinutes || 0
          ),

        overtimeMinutes:
          Number(
            overtimeMinutes || 0
          ),

        status:
          status || "Present",

        workStatus:
          workStatus ||
          "Working",

        note:
          note || "",

        createdBy:
          req.user._id,

        updatedBy:
          req.user._id,
      });

    return res.status(201).json({
      success: true,
      message:
        "Attendance saved successfully.",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   UPDATE ATTENDANCE
========================================================= */

router.put("/attendance/:id", async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    Object.assign(attendance, {
      employeeCode: req.body.employeeCode ?? attendance.employeeCode,
      employeeName: req.body.employeeName ?? attendance.employeeName,
      department: req.body.department ?? attendance.department,
      role: req.body.role ?? attendance.role,
      loginTime: req.body.loginTime !== undefined
        ? toAttendanceDateTime(req.body.loginTime, attendance.date)
        : attendance.loginTime,
      logoutTime: req.body.logoutTime !== undefined
        ? toAttendanceDateTime(req.body.logoutTime, attendance.date)
        : attendance.logoutTime,
      breakMinutes:
        req.body.breakMinutes ?? attendance.breakMinutes,
      workingMinutes:
        req.body.workingMinutes ?? attendance.workingMinutes,
      overtimeMinutes:
        req.body.overtimeMinutes ?? attendance.overtimeMinutes,
      status: req.body.status ?? attendance.status,
      workStatus:
        req.body.workStatus ?? attendance.workStatus,
      note: req.body.note ?? attendance.note,
      updatedBy: req.user._id,
    });

    await attendance.save();

    return res.json({
      success: true,
      message: "Attendance updated successfully.",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   DELETE ATTENDANCE
========================================================= */

router.delete("/attendance/:id", async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    await attendance.deleteOne();

    return res.json({
      success: true,
      message: "Attendance deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});
/* =========================================================
   ATTENDANCE SUMMARY
========================================================= */

router.get("/attendance-summary", async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const attendance = await Attendance.find({
      date: today,
    });

    const summary = {
      total: attendance.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      leave: 0,
      working: 0,
      break: 0,
      free: 0,
      loggedOut: 0,
    };

    attendance.forEach((item) => {
      switch (item.status) {
        case "Present":
          summary.present++;
          break;
        case "Absent":
          summary.absent++;
          break;
        case "Late":
          summary.late++;
          break;
        case "Half Day":
          summary.halfDay++;
          break;
        case "On Leave":
          summary.leave++;
          break;
      }

      switch (item.workStatus) {
        case "Working":
          summary.working++;
          break;
        case "Break":
          summary.break++;
          break;
        case "Free":
          summary.free++;
          break;
        case "Logged Out":
          summary.loggedOut++;
          break;
      }
    });

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});
    /* =========================================================
   MONTHLY ATTENDANCE
========================================================= */

router.get(
  "/monthly-attendance/:employeeId",
  async (req, res, next) => {
    try {
      const { employeeId } = req.params;

      const month =
        req.query.month ||
        new Date().toISOString().slice(0, 7);

      const attendance = await Attendance.find({
        employeeId,
        date: {
          $regex: `^${month}`,
        },
      }).sort({ date: 1 });

      return res.json({
        success: true,
        count: attendance.length,
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }
);
  module.exports = router;
