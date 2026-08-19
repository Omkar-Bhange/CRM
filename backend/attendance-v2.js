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
  default: "10:00",
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

  /* =========================================================
   ATTENDANCE DATABASE INDEXES
========================================================= */

/*
  One employee must have only one attendance document
  for a particular calendar date.

  Example:
  EMP001 + 2026-08-17 = only one attendance record.
*/
Attendance.schema.index(
  {
    employeeId: 1,
    date: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: { $ne: true },
    },
  }
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

/* =========================================================
   ADVANCED LEAVE REQUEST MODEL
   Uses the same MongoDB leaveRequests collection.
========================================================= */

const LeaveRequest =
  mongoose.models.LeaveRequestV2 ||
  mongoose.model(
    "LeaveRequestV2",
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

        leaveType: {
          type: String,
          required: true,
          trim: true,
        },

        fromDate: {
          type: String,
          required: true,
          index: true,
        },

        toDate: {
          type: String,
          required: true,
          index: true,
        },

        days: {
          type: Number,
          required: true,
          min: 0.5,
        },

        duration: {
          type: String,
          enum: [
            "Full Day",
            "First Half",
            "Second Half",
          ],
          default: "Full Day",
        },

        reason: {
          type: String,
          default: "",
          trim: true,
        },

        contactDuringLeave: {
          type: String,
          default: "",
          trim: true,
        },

        status: {
          type: String,
          enum: [
            "Pending",
            "Approved",
            "Rejected",
            "Cancelled",
          ],
          default: "Pending",
          index: true,
        },

        reviewedBy: {
          type: String,
          default: "",
          trim: true,
        },

        reviewNote: {
          type: String,
          default: "",
          trim: true,
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
    )
  );

/* =========================================================
   HOLIDAY MASTER
========================================================= */

const Holiday =
  mongoose.models.Holiday ||
  mongoose.model(
    "Holiday",
    new mongoose.Schema(
      {
        date: {
          type: String,
          required: true,
          unique: true,
          index: true,
        },

        name: {
          type: String,
          required: true,
          trim: true,
        },

        type: {
          type: String,
          enum: [
            "National",
            "Company",
            "Optional",
          ],
          default: "Company",
        },

        note: {
          type: String,
          default: "",
          trim: true,
        },

        isActive: {
          type: Boolean,
          default: true,
          index: true,
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
        collection: "holidays",
      }
    )
  );

/* =========================================================
   LEAVE BALANCE
========================================================= */

const LeaveBalance =
  mongoose.models.LeaveBalance ||
  mongoose.model(
    "LeaveBalance",
    new mongoose.Schema(
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
          index: true,
        },

        year: {
          type: Number,
          required: true,
          index: true,
        },

        leaveType: {
          type: String,
          required: true,
          trim: true,
        },

        code: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
        },

        total: {
          type: Number,
          default: 0,
          min: 0,
        },

        carriedForward: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      {
        timestamps: true,
        collection: "leaveBalances",
      }
    )
  );

LeaveBalance.schema.index(
  {
    employeeId: 1,
    year: 1,
    leaveType: 1,
  },
  {
    unique: true,
  }
);

/* =========================================================
   ATTENDANCE REGULARIZATION
========================================================= */

const AttendanceRegularization =
  mongoose.models.AttendanceRegularization ||
  mongoose.model(
    "AttendanceRegularization",
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
        },

        employeeName: {
          type: String,
          required: true,
        },

        date: {
          type: String,
          required: true,
          index: true,
        },

        requestType: {
          type: String,
          enum: [
            "Missing Login",
            "Missing Logout",
            "Incorrect Time",
            "Absent Correction",
            "Work From Home",
            "Client Site",
          ],
          required: true,
        },

        requestedLoginTime: {
          type: String,
          default: "",
        },

        requestedLogoutTime: {
          type: String,
          default: "",
        },

        reason: {
          type: String,
          required: true,
          trim: true,
        },

        status: {
          type: String,
          enum: [
            "Pending",
            "Approved",
            "Rejected",
          ],
          default: "Pending",
          index: true,
        },

        reviewedBy: {
          type: String,
          default: "",
        },

        reviewNote: {
          type: String,
          default: "",
        },

        reviewedAt: {
          type: Date,
          default: null,
        },
        attendanceId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "AttendanceV2",
  default: null,
},

appliedAt: {
  type: Date,
  default: null,
},
      },
      
      {
        timestamps: true,
        collection: "attendanceRegularizations",
      }
    )
  );

const router = express.Router();
router.use(authenticateUser);
const DEFAULT_SHIFT_START = "10:00";
const DEFAULT_SHIFT_END = "18:00";
const GRACE_MINUTES = 15;
const FULL_DAY_MINUTES = 480;
const HALF_DAY_THRESHOLD_MINUTES = 240;
const REGULARIZATION_TYPES = [
  "Missing Login",
  "Missing Logout",
  "Incorrect Time",
  "Absent Correction",
  "Work From Home",
  "Client Site",
];

function isValidRegularizationType(value) {
  return REGULARIZATION_TYPES.includes(
    String(value || "").trim()
  );
}
/* =========================================================
   COMPANY ATTENDANCE POLICY
========================================================= */

// 0 = Sunday
// 1 = Monday
// 2 = Tuesday
// 3 = Wednesday
// 4 = Thursday
// 5 = Friday
// 6 = Saturday

const WEEKLY_OFF_DAYS = [0];

// Change false if all Saturdays are working.
const ALTERNATE_SATURDAY_OFF = false;

/*
  When true:
  2nd Saturday = Weekly Off
  4th Saturday = Weekly Off
*/

const DEFAULT_LEAVE_TYPES = [
  {
    leaveType: "Casual Leave",
    code: "CL",
    total: 12,
  },
  {
    leaveType: "Sick Leave",
    code: "SL",
    total: 8,
  },
  {
    leaveType: "Earned Leave",
    code: "EL",
    total: 15,
  },
];

const { getISTDateString } = require("./utils/dateUtils");

function getLocalDateString(date = new Date()) {
  return getISTDateString(date);
}
/* =========================================================
   DATE / HOLIDAY / WEEKLY OFF HELPERS
========================================================= */

function parseDateOnly(dateString) {
  if (!dateString) {
    return null;
  }

  const date = new Date(
    `${dateString}T00:00:00+05:30`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}
function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return false;
  }

  const parsed = parseDateOnly(value);

  return Boolean(parsed);
}

function isValidTimeString(value) {
  if (!value) {
    return true;
  }

  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function normalizeString(value) {
  return String(value || "").trim();
}
function isValidHolidayType(value) {
  return [
    "National",
    "Company",
    "Optional",
  ].includes(value);
}
function getMonthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month || "")) {
    return null;
  }

  const [year, monthNumber] =
    month.split("-").map(Number);

  const daysInMonth =
    new Date(
      year,
      monthNumber,
      0
    ).getDate();

  return {
    start: `${month}-01`,

    end:
      `${month}-${String(
        daysInMonth
      ).padStart(2, "0")}`,

    year,

    monthNumber,

    daysInMonth,
  };
}

function eachDate(
  fromDate,
  toDate
) {
  const start =
    parseDateOnly(fromDate);

  const end =
    parseDateOnly(toDate);

  if (
    !start ||
    !end ||
    end < start
  ) {
    return [];
  }

  const result = [];

  const cursor =
    new Date(start);

  while (cursor <= end) {
    result.push(
      getLocalDateString(cursor)
    );

    cursor.setDate(
      cursor.getDate() + 1
    );
  }

  return result;
}

/* =========================================================
   WEEKLY OFF
========================================================= */

function isAlternateSaturdayOff(
  dateString
) {
  if (!ALTERNATE_SATURDAY_OFF) {
    return false;
  }

  const date =
    parseDateOnly(dateString);

  if (!date) {
    return false;
  }

  if (date.getDay() !== 6) {
    return false;
  }

  const occurrence =
    Math.ceil(
      date.getDate() / 7
    );

  return (
    occurrence === 2 ||
    occurrence === 4
  );
}

function isWeeklyOff(
  dateString
) {
  const date =
    parseDateOnly(dateString);

  if (!date) {
    return false;
  }

  if (
    WEEKLY_OFF_DAYS.includes(
      date.getDay()
    )
  ) {
    return true;
  }

  return isAlternateSaturdayOff(
    dateString
  );
}

async function findHolidayByDate(
  date,
  excludeHolidayId = null
) {
  const query = {
    date,
  };

  if (excludeHolidayId) {
    query._id = {
      $ne: excludeHolidayId,
    };
  }

  return Holiday.findOne(query).lean();
}
/* =========================================================
   ADMIN - HOLIDAY LIST
========================================================= */

router.get(
  "/admin/holidays",
  async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) {
        return;
      }

      const {
        fromDate,
        toDate,
        type,
        active,
      } = req.query;

      const query = {};

      if (fromDate || toDate) {
        query.date = {};

        if (fromDate) {
          if (!isValidDateString(fromDate)) {
            return res.status(400).json({
              success: false,
              message:
                "fromDate must use YYYY-MM-DD format.",
            });
          }

          query.date.$gte =
            fromDate;
        }

        if (toDate) {
          if (!isValidDateString(toDate)) {
            return res.status(400).json({
              success: false,
              message:
                "toDate must use YYYY-MM-DD format.",
            });
          }

          query.date.$lte =
            toDate;
        }
      }

      if (
        type &&
        type !== "All"
      ) {
        if (!isValidHolidayType(type)) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid holiday type.",
          });
        }

        query.type =
          type;
      }

      if (
        active === "true"
      ) {
        query.isActive =
          true;
      }

      if (
        active === "false"
      ) {
        query.isActive =
          false;
      }

      const data =
        await Holiday.find(query)
          .sort({
            date: 1,
            name: 1,
          })
          .lean();

      return res.json({
        success: true,
        count:
          data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   ADMIN - CREATE HOLIDAY
========================================================= */

router.post(
  "/admin/holidays",
  async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) {
        return;
      }

      const {
        date,
        name,
        type = "Company",
        note = "",
      } = req.body;

      if (
        !date ||
        !String(name || "").trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Holiday date and name are required.",
        });
      }

      if (!isValidDateString(date)) {
        return res.status(400).json({
          success: false,
          message:
            "Holiday date must use YYYY-MM-DD format.",
        });
      }

      if (!isValidHolidayType(type)) {
        return res.status(400).json({
          success: false,
          message:
            "Holiday type must be National, Company or Optional.",
        });
      }

      const existing =
        await findHolidayByDate(
          date
        );

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            `A holiday already exists on ${date}: ${existing.name}.`,
        });
      }

      const holiday =
        await Holiday.create({
          date,

          name:
            String(name).trim(),

          type,

          note:
            String(note || "").trim(),

          isActive:
            true,

          createdBy:
            req.user._id,

          updatedBy:
            req.user._id,
        });

      return res.status(201).json({
        success: true,
        message:
          "Holiday created successfully.",
        data:
          holiday,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   ADMIN - UPDATE HOLIDAY
========================================================= */

router.put(
  "/admin/holidays/:id",
  async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) {
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid holiday ID.",
        });
      }

      const holiday =
        await Holiday.findById(
          req.params.id
        );

      if (!holiday) {
        return res.status(404).json({
          success: false,
          message:
            "Holiday not found.",
        });
      }

      const {
        date,
        name,
        type,
        note,
        isActive,
      } = req.body;

      if (
        date !== undefined
      ) {
        if (!isValidDateString(date)) {
          return res.status(400).json({
            success: false,
            message:
              "Holiday date must use YYYY-MM-DD format.",
          });
        }

        const duplicate =
          await findHolidayByDate(
            date,
            holiday._id
          );

        if (duplicate) {
          return res.status(409).json({
            success: false,
            message:
              `Another holiday already exists on ${date}: ${duplicate.name}.`,
          });
        }

        holiday.date =
          date;
      }

      if (
        name !== undefined
      ) {
        const cleanName =
          String(name || "").trim();

        if (!cleanName) {
          return res.status(400).json({
            success: false,
            message:
              "Holiday name cannot be empty.",
          });
        }

        holiday.name =
          cleanName;
      }

      if (
        type !== undefined
      ) {
        if (!isValidHolidayType(type)) {
          return res.status(400).json({
            success: false,
            message:
              "Holiday type must be National, Company or Optional.",
          });
        }

        holiday.type =
          type;
      }

      if (
        note !== undefined
      ) {
        holiday.note =
          String(note || "").trim();
      }

      if (
        isActive !== undefined
      ) {
        holiday.isActive =
          Boolean(isActive);
      }

      holiday.updatedBy =
        req.user._id;

      await holiday.save();

      return res.json({
        success: true,
        message:
          "Holiday updated successfully.",
        data:
          holiday,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   ADMIN - DEACTIVATE HOLIDAY
========================================================= */

router.patch(
  "/admin/holidays/:id/deactivate",
  async (req, res, next) => {
    try {
      if (!requireAdmin(req, res)) {
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid holiday ID.",
        });
      }

      const holiday =
        await Holiday.findById(
          req.params.id
        );

      if (!holiday) {
        return res.status(404).json({
          success: false,
          message:
            "Holiday not found.",
        });
      }

      holiday.isActive =
        false;

      holiday.updatedBy =
        req.user._id;

      await holiday.save();

      return res.json({
        success: true,
        message:
          "Holiday deactivated successfully.",
        data:
          holiday,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   HOLIDAY CALENDAR
========================================================= */

router.get(
  "/holidays",
  async (req, res, next) => {
    try {
      const {
        month,
        year,
      } = req.query;

      const query = {
        isActive: true,
      };

      if (month) {
        if (
          !/^\d{4}-\d{2}$/.test(
            month
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "month must use YYYY-MM format.",
          });
        }

        query.date = {
          $regex:
            `^${month}`,
        };
      } else if (year) {
        if (
          !/^\d{4}$/.test(
            String(year)
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "year must use YYYY format.",
          });
        }

        query.date = {
          $regex:
            `^${year}-`,
        };
      }

      const data =
        await Holiday.find(query)
          .sort({
            date: 1,
          })
          .lean();

      return res.json({
        success: true,
        count:
          data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   HOLIDAY MAP
========================================================= */

async function getHolidayMap(
  fromDate,
  toDate
) {
  const holidays =
    await Holiday.find({
      isActive: true,

      date: {
        $gte: fromDate,
        $lte: toDate,
      },
    }).lean();

  return new Map(
    holidays.map(
      (holiday) => [
        holiday.date,
        holiday,
      ]
    )
  );
}

/* =========================================================
   SMART LEAVE DAY CALCULATION

   Excludes:
   - Holidays
   - Weekly Off
   - 2nd / 4th Saturday
========================================================= */

async function calculateChargeableLeaveDays(
  fromDate,
  toDate,
  duration = "Full Day"
) {
  if (
    !fromDate ||
    !toDate ||
    toDate < fromDate
  ) {
    return {
      days: 0,
      dates: [],
    };
  }

  const holidayMap =
    await getHolidayMap(
      fromDate,
      toDate
    );

  const chargeableDates =
    eachDate(
      fromDate,
      toDate
    ).filter((date) => {
      if (isWeeklyOff(date)) {
        return false;
      }

 const holiday =
  holidayMap.get(date);

if (
  holiday &&
  holiday.type !== "Optional"
) {
  return false;
}

      return true;
    });

  let days =
    chargeableDates.length;

  if (
    fromDate === toDate &&
    duration !== "Full Day" &&
    days > 0
  ) {
    days = 0.5;
  }

  return {
    days,
    dates: chargeableDates,
  };
}
/* =========================================================
   LEAVE BALANCE HELPERS
========================================================= */

async function ensureLeaveBalances(
  employeeId,
  year
) {
  const existing =
    await LeaveBalance.find({
      employeeId,
      year,
    }).lean();

  const existingNames =
    new Set(
      existing.map(
        (item) =>
          item.leaveType
      )
    );

  const missing =
    DEFAULT_LEAVE_TYPES.filter(
      (item) =>
        !existingNames.has(
          item.leaveType
        )
    );

  if (missing.length > 0) {
    try {
      await LeaveBalance.insertMany(
        missing.map(
          (item) => ({
            employeeId,

            year,

            leaveType:
              item.leaveType,

            code:
              item.code,

            total:
              item.total,

            carriedForward: 0,
          })
        ),
        {
          ordered: false,
        }
      );
    } catch (error) {
      // Duplicate balance records are safe to ignore.
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }

  return LeaveBalance.find({
    employeeId,
    year,
  })
    .sort({
      leaveType: 1,
    })
    .lean();
}

async function getLeaveBalanceSummary(
  employeeId,
  year
) {
  const balances =
    await ensureLeaveBalances(
      employeeId,
      year
    );

  const yearStart =
    `${year}-01-01`;

  const yearEnd =
    `${year}-12-31`;

  const requests =
    await LeaveRequest.find({
      employeeId,

      fromDate: {
        $lte: yearEnd,
      },

      toDate: {
        $gte: yearStart,
      },

      status: {
        $in: [
          "Pending",
          "Approved",
        ],
      },
    }).lean();

  return balances.map(
    (balance) => {
      const matching =
        requests.filter(
          (request) =>
            request.leaveType ===
            balance.leaveType
        );

      const used =
        matching
          .filter(
            (request) =>
              request.status ===
              "Approved"
          )
          .reduce(
            (sum, request) =>
              sum +
              Number(
                request.days || 0
              ),
            0
          );

      const pending =
        matching
          .filter(
            (request) =>
              request.status ===
              "Pending"
          )
          .reduce(
            (sum, request) =>
              sum +
              Number(
                request.days || 0
              ),
            0
          );

      const total =
        Number(
          balance.total || 0
        ) +
        Number(
          balance.carriedForward ||
            0
        );

      return {
        id:
          String(
            balance._id
          ),

        leaveType:
          balance.leaveType,

        name:
          balance.leaveType,

        code:
          balance.code,

        total,

        used,

        pending,

        remaining:
          Math.max(
            0,
            total - used
          ),

        availableAfterPending:
          Math.max(
            0,
            total -
              used -
              pending
          ),
      };
    }
  );
} 

function parseShiftDate(dateString, timeString) {
  if (!dateString || !timeString) return null;
  return new Date(`${dateString}T${timeString}:00`);
}
function parseRequestedAttendanceTime(
  date,
  value
) {
  if (!value) {
    return null;
  }

  if (!isValidTimeString(value)) {
    return null;
  }

  return parseShiftDate(
    date,
    value
  );
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
  if (!attendance) {
    return "Absent";
  }

  if (attendance.status === "On Leave") {
    return "On Leave";
  }

  if (!attendance.loginTime) {
    return "Absent";
  }

  /*
    Do not classify an active workday as Half Day
    before the employee has logged out.
  */
  if (!attendance.logoutTime) {
    if (Number(attendance.lateMinutes || 0) > 0) {
      return "Late";
    }

    return "Present";
  }

  const workedMinutes =
    Number(
      attendance.totalWorkedMinutes ??
        attendance.workingMinutes ??
        0
    );

  if (
    workedMinutes <
    HALF_DAY_THRESHOLD_MINUTES
  ) {
    return "Half Day";
  }

  if (
    Number(
      attendance.lateMinutes ||
        0
    ) > 0
  ) {
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

const shiftEndAt =
  parseShiftDate(
    attendance.date,
    attendance.shiftEnd ||
      DEFAULT_SHIFT_END
  );

if (
  attendance.logoutTime &&
  shiftEndAt &&
  logoutTime.getTime() <
    shiftEndAt.getTime()
) {
  result.earlyLogoutMinutes =
    Math.max(
      0,
      Math.floor(
        (
          shiftEndAt.getTime() -
          logoutTime.getTime()
        ) /
          60000
      )
    );
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
/* =========================================================
   AUTHORIZATION HELPERS
========================================================= */

function requireAdmin(req, res) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin account is required.",
    });

    return false;
  }

  return true;
}

function requireEmployee(req, res) {
  if (!req.user || req.user.role !== "employee") {
    res.status(403).json({
      success: false,
      message: "Employee account is required.",
    });

    return false;
  }

  return true;
}

async function findEmployee(req, res) {
  if (!requireEmployee(req, res)) {
    return null;
  }

  const employee = await Employee.findOne({
    userId: req.user._id,
  });

  if (!employee) {
    res.status(404).json({
      success: false,
      message: "Employee profile not found.",
    });

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
/* =========================================================
   LEAVE OVERLAP CHECK
========================================================= */

async function findOverlappingLeave(
  employeeId,
  fromDate,
  toDate,
  excludeLeaveId = null
) {
  const query = {
    employeeId,

    status: {
      $in: ["Pending", "Approved"],
    },

    fromDate: {
      $lte: toDate,
    },

    toDate: {
      $gte: fromDate,
    },
  };

  if (excludeLeaveId) {
    query._id = {
      $ne: excludeLeaveId,
    };
  }

  return LeaveRequest.findOne(query).lean();
}




function getLeaveTypeConfig(leaveType) {
  return DEFAULT_LEAVE_TYPES.find(
    (item) =>
      item.leaveType ===
      String(leaveType || "").trim()
  );
}
async function validateLeaveAvailability({
  employeeId,
  leaveType,
  fromDate,
  toDate,
  duration = "Full Day",
}) {
  const calculation =
    await calculateChargeableLeaveDays(
      fromDate,
      toDate,
      duration
    );

  if (calculation.days <= 0) {
    return {
      valid: false,

      message:
        "The selected leave period contains no chargeable working days.",

      days: 0,

      dates: [],
    };
  }

  const year =
    Number(
      String(fromDate).slice(
        0,
        4
      )
    );

  const balanceSummary =
    await getLeaveBalanceSummary(
      employeeId,
      year
    );

  const balance =
    balanceSummary.find(
      (item) =>
        item.leaveType ===
        leaveType
    );

  if (!balance) {
    return {
      valid: false,

      message:
        `Leave balance configuration was not found for ${leaveType}.`,

      days:
        calculation.days,

      dates:
        calculation.dates,
    };
  }

  if (
    calculation.days >
    Number(
      balance.availableAfterPending ||
        0
    )
  ) {
    return {
      valid: false,

      message:
        `Only ${balance.availableAfterPending} day(s) are available for ${leaveType}.`,

      days:
        calculation.days,

      dates:
        calculation.dates,

      balance,
    };
  }

  return {
    valid: true,

    days:
      calculation.days,

    dates:
      calculation.dates,

    balance,
  };
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

const leave =
  await getApprovedLeave(
    employee._id,
    today
  );

if (leave) {
  return res.status(400).json({
    success: false,
    message:
      "Today is already marked as approved leave.",
  });
}

/* =========================
   HOLIDAY CHECK
========================= */

const holiday =
  await Holiday.findOne({
    date: today,
    isActive: true,
  }).lean();

if (
  holiday &&
  holiday.type !== "Optional"
) {
  return res.status(400).json({
    success: false,

    message:
      `Today is a holiday: ${holiday.name}. ` +
      `Contact admin if you are required to work.`,
  });
}

/* =========================
   WEEKLY OFF CHECK
========================= */

if (isWeeklyOff(today)) {
  return res.status(400).json({
    success: false,

    message:
      "Today is configured as a weekly off. " +
      "Contact admin if you are required to work.",
  });
}

const loginTime =
  new Date();

const shiftStartAt =
  parseShiftDate(
    today,
    DEFAULT_SHIFT_START
  );

let lateMinutes = 0;

if (shiftStartAt) {
  const difference =
    Math.floor(
      (
        loginTime.getTime() -
        shiftStartAt.getTime()
      ) /
        60000
    );

  lateMinutes =
    difference >
    GRACE_MINUTES
      ? difference
      : 0;
}

const attendance =
  await Attendance.create({
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
     lateMinutes,
      earlyLogoutMinutes: 0,
      overtimeMinutes: 0,
     status:
  lateMinutes > 0
    ? "Late"
    : "Present",
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

/* =========================================================
   TODAY ATTENDANCE
========================================================= */

router.get(
  "/today",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      await closeOpenAttendanceForEmployee(
        employee._id
      );

      const today =
        getLocalDateString();

      /* =========================
         REAL ATTENDANCE
      ========================= */

      const attendance =
        await Attendance.findOne({
          employeeId:
            employee._id,

          date: today,

          isDeleted: {
            $ne: true,
          },
        });

      if (attendance) {
        return res
          .status(200)
          .json({
            success: true,

            data:
              formatAttendance(
                attendance
              ),
          });
      }

      /* =========================
         APPROVED LEAVE
      ========================= */

      const leave =
        await getApprovedLeave(
          employee._id,
          today
        );

      if (leave) {
        return res
          .status(200)
          .json({
            success: true,

            data: {
              id: null,

              employeeId:
                String(
                  employee._id
                ),

              employeeCode:
                employee.employeeCode,

              employeeName:
                employee.name,

              date:
                today,

              loginTime:
                null,

              logoutTime:
                null,

              breakMinutes:
                0,

              workingMinutes:
                0,

              totalWorkedMinutes:
                0,

              overtimeMinutes:
                0,

              lateMinutes:
                0,

              earlyLogoutMinutes:
                0,

              status:
                "On Leave",

              workStatus:
                "On Leave",

              dayType:
                "LEAVE",

              leaveType:
                leave.leaveType,

              leaveDuration:
                leave.duration ||
                "Full Day",

              note:
                "Approved leave day.",
            },
          });
      }

      /* =========================
         HOLIDAY
      ========================= */

      const holiday =
        await Holiday.findOne({
          date: today,
          isActive: true,
        }).lean();

    if (
  holiday &&
  holiday.type !== "Optional"
) {
        return res
          .status(200)
          .json({
            success: true,

            data: {
              id: null,

              employeeId:
                String(
                  employee._id
                ),

              employeeCode:
                employee.employeeCode,

              employeeName:
                employee.name,

              date:
                today,

              status:
                "Holiday",

              workStatus:
                "Holiday",

              dayType:
                "HOLIDAY",

              holidayName:
                holiday.name,

              holidayType:
                holiday.type,

              note:
                holiday.note || "",
            },
          });
      }

      /* =========================
         WEEKLY OFF
      ========================= */

      if (
        isWeeklyOff(today)
      ) {
        return res
          .status(200)
          .json({
            success: true,

            data: {
              id: null,

              employeeId:
                String(
                  employee._id
                ),

              employeeCode:
                employee.employeeCode,

              employeeName:
                employee.name,

              date:
                today,

              status:
                "Weekly Off",

              workStatus:
                "Weekly Off",

              dayType:
                "WEEKLY_OFF",

              note:
                "Configured weekly off.",
            },
          });
      }

      /* =========================
         NO RECORD TODAY

         Do NOT mark today absent
         while the workday is still
         in progress.
      ========================= */

      return res
        .status(200)
        .json({
          success: true,

          data: null,
        });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   ATTENDANCE HISTORY

   Automatically includes:
   - Attendance
   - Leave
   - Holidays
   - Weekly Off
   - Absent
========================================================= */

router.get(
  "/history",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      const limit =
        Math.min(
          Math.max(
            Number(
              req.query.limit ||
                60
            ),
            1
          ),
          180
        );

      const today =
        getLocalDateString();

      const todayDate =
        parseDateOnly(today);

      const startDate =
        new Date(todayDate);

      startDate.setDate(
        startDate.getDate() -
          (limit - 1)
      );

      const fromDate =
        getLocalDateString(
          startDate
        );

      const [
        attendance,
        holidays,
        leaves,
      ] =
        await Promise.all([
          Attendance.find({
            employeeId:
              employee._id,

            date: {
              $gte: fromDate,
              $lte: today,
            },

            isDeleted: {
              $ne: true,
            },
          }).lean(),

          Holiday.find({
            isActive: true,

            date: {
              $gte: fromDate,
              $lte: today,
            },
          }).lean(),

          LeaveRequest.find({
            employeeId:
              employee._id,

            status:
              "Approved",

            fromDate: {
              $lte: today,
            },

            toDate: {
              $gte: fromDate,
            },
          }).lean(),
        ]);

      const attendanceMap =
        new Map(
          attendance.map(
            (item) => [
              item.date,
              item,
            ]
          )
        );

      const holidayMap =
        new Map(
          holidays.map(
            (item) => [
              item.date,
              item,
            ]
          )
        );

      const leaveMap =
        new Map();

      for (
        const leave of leaves
      ) {
        const start =
          leave.fromDate <
          fromDate
            ? fromDate
            : leave.fromDate;

        const end =
          leave.toDate >
          today
            ? today
            : leave.toDate;

       for (
  const date of eachDate(
    start,
    end
  )
) {
  /*
    Do not convert company/national holidays
    or weekly offs into leave days.
  */

  if (
    isWeeklyOff(date)
  ) {
    continue;
  }

  const leaveDateHoliday =
    holidayMap.get(date);

  if (
    leaveDateHoliday &&
    leaveDateHoliday.type !==
      "Optional"
  ) {
    continue;
  }

  leaveMap.set(
    date,
    leave
  );
}
      }

      const rows = [];

      for (
        const date of eachDate(
          fromDate,
          today
        ).reverse()
      ) {
        /* =========================
           EMPLOYEE NOT YET JOINED
        ========================= */

        if (
          employee.joiningDate &&
          date <
            employee.joiningDate
        ) {
          continue;
        }

        /* =========================
           ATTENDANCE EXISTS
        ========================= */

        const record =
          attendanceMap.get(
            date
          );

        if (record) {
          const formatted =
            formatAttendance(
              record
            );

          const missedPunch =
            date < today &&
            formatted.loginTime &&
            !formatted.logoutTime;

          rows.push({
            ...formatted,

            status:
              missedPunch
                ? "Missed Punch"
                : formatted.status,

            missedPunch:
              Boolean(
                missedPunch
              ),

            dayType:
              "ATTENDANCE",
          });

          continue;
        }

        /* =========================
           APPROVED LEAVE
        ========================= */

        const leave =
          leaveMap.get(date);

        if (leave) {
          rows.push({
            id:
              `leave-${date}`,

            employeeId:
              String(
                employee._id
              ),

            date,

            status:
              "On Leave",

            workStatus:
              "On Leave",

            dayType:
              "LEAVE",

            leaveType:
              leave.leaveType,

            leaveDuration:
              leave.duration ||
              "Full Day",

            workedMinutes:
              0,

            totalWorkedMinutes:
              0,

            breakMinutes:
              0,

            lateMinutes:
              0,

            earlyLogoutMinutes:
              0,

            overtimeMinutes:
              0,
          });

          continue;
        }

        /* =========================
           HOLIDAY
        ========================= */
const holiday =
  holidayMap.get(date);

if (
  holiday &&
  holiday.type !== "Optional"
) {
          rows.push({
            id:
              `holiday-${date}`,

            employeeId:
              String(
                employee._id
              ),

            date,

            status:
              "Holiday",

            workStatus:
              "Holiday",

            dayType:
              "HOLIDAY",

            holidayName:
              holiday.name,

            holidayType:
              holiday.type,

            workedMinutes:
              0,

            totalWorkedMinutes:
              0,

            breakMinutes:
              0,

            lateMinutes:
              0,

            earlyLogoutMinutes:
              0,

            overtimeMinutes:
              0,
          });

          continue;
        }

        /* =========================
           WEEKLY OFF
        ========================= */

        if (
          isWeeklyOff(date)
        ) {
          rows.push({
            id:
              `weekly-off-${date}`,

            employeeId:
              String(
                employee._id
              ),

            date,

            status:
              "Weekly Off",

            workStatus:
              "Weekly Off",

            dayType:
              "WEEKLY_OFF",

            workedMinutes:
              0,

            totalWorkedMinutes:
              0,

            breakMinutes:
              0,

            lateMinutes:
              0,

            earlyLogoutMinutes:
              0,

            overtimeMinutes:
              0,
          });

          continue;
        }

        /* =========================
           ABSENT

           Only PREVIOUS dates.
           Today is never marked
           absent before day closes.
        ========================= */

        if (date < today) {
          rows.push({
            id:
              `absent-${date}`,

            employeeId:
              String(
                employee._id
              ),

            date,

            status:
              "Absent",

            workStatus:
              "Absent",

            dayType:
              "WORKING_DAY",

            workedMinutes:
              0,

            totalWorkedMinutes:
              0,

            breakMinutes:
              0,

            lateMinutes:
              0,

            earlyLogoutMinutes:
              0,

            overtimeMinutes:
              0,
          });
        }
      }

      return res
        .status(200)
        .json({
          success: true,

          count:
            rows.length,

          data:
            rows,
        });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   COMPLETE MONTHLY ATTENDANCE CALENDAR
========================================================= */

router.get(
  "/month",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      const month =
        req.query.month ||
        getLocalDateString()
          .slice(0, 7);

      const range =
        getMonthRange(month);

      if (!range) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "month must use YYYY-MM format.",
          });
      }

      const today =
        getLocalDateString();

      const [
        attendance,
        holidays,
        leaves,
      ] =
        await Promise.all([
          Attendance.find({
            employeeId:
              employee._id,

            date: {
              $gte:
                range.start,

              $lte:
                range.end,
            },

            isDeleted: {
              $ne: true,
            },
          })
            .sort({
              date: 1,
            })
            .lean(),

          Holiday.find({
            isActive: true,

            date: {
              $gte:
                range.start,

              $lte:
                range.end,
            },
          })
            .sort({
              date: 1,
            })
            .lean(),

          LeaveRequest.find({
            employeeId:
              employee._id,

            status:
              "Approved",

            fromDate: {
              $lte:
                range.end,
            },

            toDate: {
              $gte:
                range.start,
            },
          }).lean(),
        ]);

      const attendanceMap =
        new Map(
          attendance.map(
            (item) => [
              item.date,
              item,
            ]
          )
        );

      const holidayMap =
        new Map(
          holidays.map(
            (item) => [
              item.date,
              item,
            ]
          )
        );

      const leaveMap =
        new Map();

      for (
        const leave of leaves
      ) {
        const start =
          leave.fromDate <
          range.start
            ? range.start
            : leave.fromDate;

        const end =
          leave.toDate >
          range.end
            ? range.end
            : leave.toDate;

        for (
  const date of eachDate(
    start,
    end
  )
) {
  /*
    Do not convert company/national holidays
    or weekly offs into leave days.
  */

  if (
    isWeeklyOff(date)
  ) {
    continue;
  }

  const leaveDateHoliday =
    holidayMap.get(date);

  if (
    leaveDateHoliday &&
    leaveDateHoliday.type !==
      "Optional"
  ) {
    continue;
  }

  leaveMap.set(
    date,
    leave
  );
}
      }

      const calendar = [];

      const summary = {
        workingDays: 0,

        present: 0,

        late: 0,

        halfDay: 0,

        absent: 0,

        leave: 0,

        holidays: 0,

        weeklyOff: 0,

        missedPunch: 0,

        totalWorkedMinutes:
          0,

        overtimeMinutes:
          0,

        lateMinutes:
          0,

        earlyLogoutMinutes:
          0,

        attendanceRate:
          0,
      };

      for (
        let day = 1;
        day <=
        range.daysInMonth;
        day += 1
      ) {
        const date =
          `${month}-${String(
            day
          ).padStart(2, "0")}`;

        const isFuture =
          date > today;

        const beforeJoining =
          employee.joiningDate &&
          date <
            employee.joiningDate;

        const record =
          attendanceMap.get(
            date
          );

        const leave =
          leaveMap.get(date);

        const holiday =
          holidayMap.get(date);

        let entry;

        /* =========================
           BEFORE JOINING
        ========================= */

        if (beforeJoining) {
          entry = {
            date,

            status:
              "Not Joined",

            dayType:
              "NOT_JOINED",

            isFuture,
          };
        }

        /* =========================
           ATTENDANCE
        ========================= */

        else if (record) {
          const formatted =
            formatAttendance(
              record
            );

          const missedPunch =
            date < today &&
            formatted.loginTime &&
            !formatted.logoutTime;

          entry = {
            ...formatted,

            status:
              missedPunch
                ? "Missed Punch"
                : formatted.status,

            dayType:
              "ATTENDANCE",

            missedPunch:
              Boolean(
                missedPunch
              ),

            isFuture,
          };

          summary.workingDays +=
            1;

          summary.totalWorkedMinutes +=
            Number(
              formatted.totalWorkedMinutes ||
                formatted.workingMinutes ||
                0
            );

          summary.overtimeMinutes +=
            Number(
              formatted.overtimeMinutes ||
                0
            );

          summary.lateMinutes +=
            Number(
              formatted.lateMinutes ||
                0
            );

          summary.earlyLogoutMinutes +=
            Number(
              formatted.earlyLogoutMinutes ||
                0
            );

          if (missedPunch) {
            summary.missedPunch +=
              1;
          } else if (
            formatted.status ===
            "Present"
          ) {
            summary.present += 1;
          } else if (
            formatted.status ===
            "Late"
          ) {
            summary.late += 1;
          } else if (
            formatted.status ===
            "Half Day"
          ) {
            summary.halfDay +=
              1;
          }
        }

        /* =========================
           APPROVED LEAVE
        ========================= */

        else if (leave) {
          entry = {
            date,

            status:
              "On Leave",

            workStatus:
              "On Leave",

            dayType:
              "LEAVE",

            leaveType:
              leave.leaveType,

            leaveDuration:
              leave.duration ||
              "Full Day",

            reason:
              leave.reason || "",

            isFuture,
          };

          if (!isFuture) {
            summary.leave += 1;
          }
        }

        /* =========================
           HOLIDAY
        ========================= */

       else if (
  holiday &&
  holiday.type !== "Optional"
) {
          entry = {
            date,

            status:
              "Holiday",

            workStatus:
              "Holiday",

            dayType:
              "HOLIDAY",

            holidayName:
              holiday.name,

            holidayType:
              holiday.type,

            note:
              holiday.note || "",

            isFuture,
          };

          summary.holidays +=
            1;
        }

        /* =========================
           WEEKLY OFF
        ========================= */

        else if (
          isWeeklyOff(date)
        ) {
          entry = {
            date,

            status:
              "Weekly Off",

            workStatus:
              "Weekly Off",

            dayType:
              "WEEKLY_OFF",

            isFuture,
          };

          summary.weeklyOff +=
            1;
        }

        /* =========================
           FUTURE WORKING DAY
        ========================= */

        else if (isFuture) {
          entry = {
            date,

            status: "",

            workStatus: "",

            dayType:
              "WORKING_DAY",

            isFuture: true,
          };
        }

        /* =========================
           AUTOMATIC ABSENT
        ========================= */

        else {
          entry = {
            date,

            status:
              "Absent",

            workStatus:
              "Absent",

            dayType:
              "WORKING_DAY",

            isFuture: false,
          };

          summary.workingDays +=
            1;

          summary.absent +=
            1;
        }

        calendar.push(entry);
      }

      /* =========================
         ATTENDANCE %
      ========================= */

      const attendedEquivalent =
        summary.present +
        summary.late +
        summary.halfDay * 0.5;

      summary.attendanceRate =
        summary.workingDays > 0
          ? Math.round(
              (attendedEquivalent /
                summary.workingDays) *
                1000
            ) / 10
          : 0;

      return res
        .status(200)
        .json({
          success: true,

          month,

          policy: {
            shiftStart:
              DEFAULT_SHIFT_START,

            shiftEnd:
              DEFAULT_SHIFT_END,

            graceMinutes:
              GRACE_MINUTES,

            fullDayMinutes:
              FULL_DAY_MINUTES,

            halfDayThresholdMinutes:
              HALF_DAY_THRESHOLD_MINUTES,

            weeklyOffDays:
              WEEKLY_OFF_DAYS,

            alternateSaturdayOff:
              ALTERNATE_SATURDAY_OFF,
          },

          summary,

          calendar,

          holidays,
        });
    } catch (error) {
      next(error);
    }
  }
);/* =========================================================
   LEAVE BALANCES
========================================================= */

router.get(
  "/leave/balances",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      const year =
        Number(
          req.query.year ||
            getLocalDateString()
              .slice(0, 4)
        );

      const data =
        await getLeaveBalanceSummary(
          employee._id,
          year
        );

      return res.json({
        success: true,

        year,

        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   MY LEAVE REQUESTS
========================================================= */

router.get(
  "/leave/my",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      const data =
        await LeaveRequest.find({
          employeeId:
            employee._id,
        })
          .sort({
            appliedAt: -1,
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   ADMIN - ALL LEAVE REQUESTS
========================================================= */

router.get(
  "/admin/leaves",
  async (req, res, next) => {
    try {
      if (
        !requireAdmin(
          req,
          res
        )
      ) {
        return;
      }

      const {
        status,
        employeeId,
        fromDate,
        toDate,
      } = req.query;

      const query = {};

      if (
        status &&
        status !== "All"
      ) {
        query.status =
          status;
      }

      if (employeeId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            employeeId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid employee ID.",
          });
        }

        query.employeeId =
          employeeId;
      }

      if (
        fromDate &&
        toDate
      ) {
        query.fromDate = {
          $lte:
            toDate,
        };

        query.toDate = {
          $gte:
            fromDate,
        };
      }

      const data =
        await LeaveRequest.find(
          query
        )
          .sort({
            appliedAt: -1,
            createdAt: -1,
          })
          .lean();

      const summary = {
        total:
          data.length,

        pending:
          data.filter(
            (item) =>
              item.status ===
              "Pending"
          ).length,

        approved:
          data.filter(
            (item) =>
              item.status ===
              "Approved"
          ).length,

        rejected:
          data.filter(
            (item) =>
              item.status ===
              "Rejected"
          ).length,

        cancelled:
          data.filter(
            (item) =>
              item.status ===
              "Cancelled"
          ).length,
      };

      return res.json({
        success: true,
        summary,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   ADMIN - REVIEW LEAVE REQUEST
========================================================= */

router.put(
  "/admin/leaves/:id/review",
  async (req, res, next) => {
    try {
      if (
        !requireAdmin(
          req,
          res
        )
      ) {
        return;
      }

      const {
        status,
        reviewNote = "",
      } = req.body;

      if (
        ![
          "Approved",
          "Rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Leave status must be Approved or Rejected.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid leave request ID.",
        });
      }

      const leave =
        await LeaveRequest.findById(
          req.params.id
        );

      if (!leave) {
        return res.status(404).json({
          success: false,
          message:
            "Leave request not found.",
        });
      }

      if (
        leave.status ===
        "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cancelled leave requests cannot be reviewed.",
        });
      }

      if (
        leave.status !==
        "Pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `This leave request is already ${leave.status.toLowerCase()}.`,
        });
      }

      /*
        Recalculate balance before approval.
        Another leave may have been approved
        after this request was submitted.
      */

      if (
        status ===
        "Approved"
      ) {
        const year =
          Number(
            leave.fromDate.slice(
              0,
              4
            )
          );

        const balances =
          await getLeaveBalanceSummary(
            leave.employeeId,
            year
          );

        const balance =
          balances.find(
            (item) =>
              item.leaveType ===
              leave.leaveType
          );

        if (!balance) {
          return res.status(400).json({
            success: false,
            message:
              "Leave balance configuration was not found.",
          });
        }

        /*
          getLeaveBalanceSummary includes this
          pending request inside pending balance.

          Add this request's days back before
          determining approval availability.
        */

        const approvalAvailable =
          Number(
            balance.availableAfterPending ||
              0
          ) +
          Number(
            leave.days ||
              0
          );

        if (
          Number(
            leave.days ||
              0
          ) >
          approvalAvailable
        ) {
          return res.status(400).json({
            success: false,

            message:
              `Insufficient ${leave.leaveType} balance to approve this request.`,

            balance,
          });
        }
      }

      leave.status =
        status;

      leave.reviewedBy =
        req.user.name ||
        req.user.username ||
        "Administrator";

      leave.reviewNote =
        String(
          reviewNote ||
            ""
        ).trim();

      leave.approvedAt =
        status ===
        "Approved"
          ? new Date()
          : null;

      await leave.save();

      return res.json({
        success: true,

        message:
          `Leave request ${status.toLowerCase()} successfully.`,

        data:
          leave,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   CANCEL MY LEAVE REQUEST
========================================================= */

router.patch(
  "/leave/:id/cancel",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid leave request ID.",
        });
      }

      const leave =
        await LeaveRequest.findOne({
          _id:
            req.params.id,

          employeeId:
            employee._id,
        });

      if (!leave) {
        return res.status(404).json({
          success: false,
          message:
            "Leave request not found.",
        });
      }

      if (
        leave.status ===
        "Cancelled"
      ) {
        return res.json({
          success: true,
          message:
            "Leave request is already cancelled.",
          data:
            leave,
        });
      }

      if (
        leave.status !==
        "Pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only pending leave requests can be cancelled by the employee.",
        });
      }

      leave.status =
        "Cancelled";

      leave.reviewNote =
        "Cancelled by employee.";

      await leave.save();

      return res.json({
        success: true,
        message:
          "Leave request cancelled successfully.",
        data:
          leave,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   CALCULATE LEAVE DAYS
========================================================= */

/* =========================================================
   CALCULATE LEAVE DAYS
========================================================= */

router.post(
  "/leave/calculate",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      const {
        leaveType,
        fromDate,
        toDate,
        duration = "Full Day",
      } = req.body;

      if (
        !fromDate ||
        !toDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "From date and to date are required.",
        });
      }

      if (
        !isValidDateString(fromDate) ||
        !isValidDateString(toDate)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Leave dates must use YYYY-MM-DD format.",
        });
      }

      if (toDate < fromDate) {
        return res.status(400).json({
          success: false,
          message:
            "To date cannot be before from date.",
        });
      }

      if (
        ![
          "Full Day",
          "First Half",
          "Second Half",
        ].includes(duration)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid leave duration.",
        });
      }

      if (
        duration !== "Full Day" &&
        fromDate !== toDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Half-day leave can only be requested for one date.",
        });
      }

      const calculation =
        await calculateChargeableLeaveDays(
          fromDate,
          toDate,
          duration
        );

      let balance = null;

      if (leaveType) {
        const configuredType =
          getLeaveTypeConfig(
            leaveType
          );

        if (!configuredType) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid leave type.",
          });
        }

        const year =
          Number(
            fromDate.slice(
              0,
              4
            )
          );

        const balances =
          await getLeaveBalanceSummary(
            employee._id,
            year
          );

        balance =
          balances.find(
            (item) =>
              item.leaveType ===
              leaveType
          ) || null;
      }

      return res.json({
        success: true,

        data: {
          ...calculation,

          duration,

          balance,

          sufficientBalance:
            !balance ||
            calculation.days <=
              Number(
                balance.availableAfterPending ||
                  0
              ),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   SUBMIT LEAVE REQUEST
========================================================= */

/* =========================================================
   SUBMIT LEAVE REQUEST
========================================================= */

router.post(
  "/leave/request",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      const {
        leaveType,
        fromDate,
        toDate,
        duration = "Full Day",
        reason,
        contactDuringLeave = "",
      } = req.body;

      /* =========================
         REQUIRED VALUES
      ========================= */

      if (
        !leaveType ||
        !fromDate ||
        !toDate ||
        !String(reason || "").trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Leave type, dates and reason are required.",
        });
      }

      /* =========================
         LEAVE TYPE
      ========================= */

      const configuredType =
        getLeaveTypeConfig(
          leaveType
        );

      if (!configuredType) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid leave type.",
        });
      }

      /* =========================
         DATE VALIDATION
      ========================= */

      if (
        !isValidDateString(fromDate) ||
        !isValidDateString(toDate)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Leave dates must use YYYY-MM-DD format.",
        });
      }

      if (toDate < fromDate) {
        return res.status(400).json({
          success: false,
          message:
            "To date cannot be before from date.",
        });
      }

      /* =========================
         DURATION VALIDATION
      ========================= */

      if (
        ![
          "Full Day",
          "First Half",
          "Second Half",
        ].includes(duration)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid leave duration.",
        });
      }

      if (
        duration !== "Full Day" &&
        fromDate !== toDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Half-day leave can only be requested for one date.",
        });
      }

      /* =========================
         JOINING DATE
      ========================= */

      if (
        employee.joiningDate &&
        fromDate <
          employee.joiningDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Leave cannot be requested before the employee joining date.",
        });
      }

      /* =========================
         OVERLAPPING LEAVE
      ========================= */

      const overlappingLeave =
        await findOverlappingLeave(
          employee._id,
          fromDate,
          toDate
        );

      if (overlappingLeave) {
        return res.status(409).json({
          success: false,

          message:
            `An existing ${overlappingLeave.status.toLowerCase()} leave request overlaps the selected period.`,

          conflictingLeave: {
            id:
              String(
                overlappingLeave._id
              ),

            leaveType:
              overlappingLeave.leaveType,

            fromDate:
              overlappingLeave.fromDate,

            toDate:
              overlappingLeave.toDate,

            status:
              overlappingLeave.status,
          },
        });
      }

      /* =========================
         CHARGEABLE DAYS
      ========================= */

      const calculation =
        await calculateChargeableLeaveDays(
          fromDate,
          toDate,
          duration
        );

      if (
        Number(
          calculation.days ||
            0
        ) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The selected period contains no chargeable working days.",
        });
      }

      /* =========================
         LEAVE BALANCE
      ========================= */

      const year =
        Number(
          fromDate.slice(
            0,
            4
          )
        );

      const balances =
        await getLeaveBalanceSummary(
          employee._id,
          year
        );

      const balance =
        balances.find(
          (item) =>
            item.leaveType ===
            leaveType
        );

      if (!balance) {
        return res.status(400).json({
          success: false,
          message:
            `Leave balance is not configured for ${leaveType}.`,
        });
      }

      if (
        Number(
          calculation.days
        ) >
        Number(
          balance.availableAfterPending ||
            0
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            `Only ${balance.availableAfterPending} day(s) are available for ${leaveType}.`,

          balance,
        });
      }

      /* =========================
         CREATE REQUEST
      ========================= */

      const leave =
        await LeaveRequest.create({
          employeeId:
            employee._id,

          employeeCode:
            employee.employeeCode,

          employeeName:
            employee.name,

          department:
            employee.department ||
            "",

          leaveType,

          fromDate,

          toDate,

          days:
            calculation.days,

          duration,

          reason:
            String(
              reason
            ).trim(),

          contactDuringLeave:
            String(
              contactDuringLeave ||
                ""
            ).trim(),

          status:
            "Pending",

          appliedAt:
            new Date(),
        });

      return res.status(201).json({
        success: true,

        message:
          "Leave request submitted successfully.",

        data:
          leave,

        calculation: {
          days:
            calculation.days,

          chargeableDates:
            calculation.dates,
        },

        balance: {
          ...balance,

          availableAfterRequest:
            Math.max(
              0,
              Number(
                balance.availableAfterPending ||
                  0
              ) -
                Number(
                  calculation.days ||
                    0
                )
            ),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);




/* =========================================================
   DELETE HOLIDAY
========================================================= */

  
/* =========================================================
   APPLY REGULARIZATION TO ATTENDANCE
========================================================= */

async function applyAttendanceRegularization(
  regularization,
  reviewerUser
) {
  const employee =
    await Employee.findById(
      regularization.employeeId
    );

  if (!employee) {
    throw new Error(
      "Employee profile not found."
    );
  }

  let attendance =
    await Attendance.findOne({
      employeeId:
        employee._id,

      date:
        regularization.date,

      isDeleted: {
        $ne: true,
      },
    });

  const requestedLogin =
    regularization.requestedLoginTime
      ? parseRequestedAttendanceTime(
          regularization.date,
          regularization.requestedLoginTime
        )
      : null;

  const requestedLogout =
    regularization.requestedLogoutTime
      ? parseRequestedAttendanceTime(
          regularization.date,
          regularization.requestedLogoutTime
        )
      : null;

  /* =====================================================
     CREATE ATTENDANCE WHEN RECORD DOES NOT EXIST
  ===================================================== */

  if (!attendance) {
    if (
      ![
        "Missing Login",
        "Absent Correction",
        "Work From Home",
        "Client Site",
      ].includes(
        regularization.requestType
      )
    ) {
      throw new Error(
        "Attendance record does not exist for the requested correction."
      );
    }

    if (!requestedLogin) {
      throw new Error(
        "A login time is required to create attendance."
      );
    }

    attendance =
      await Attendance.create({
        employeeId:
          employee._id,

        employeeCode:
          employee.employeeCode,

        employeeName:
          employee.name,

        department:
          employee.department ||
          "",

        role:
          employee.role ||
          "",

        date:
          regularization.date,

        loginTime:
          requestedLogin,

        logoutTime:
          requestedLogout,

        breakStartedAt:
          null,

        breakMinutes:
          0,

        totalBreakMinutes:
          0,

        workingMinutes:
          0,

        totalWorkedMinutes:
          0,

        shiftStart:
          DEFAULT_SHIFT_START,

        shiftEnd:
          DEFAULT_SHIFT_END,

        lateMinutes:
          0,

        earlyLogoutMinutes:
          0,

        overtimeMinutes:
          0,

        status:
          "Present",

        workStatus:
          requestedLogout
            ? "Logged Out"
            : "Working",

        note:
          `[Regularized: ${regularization.requestType}] ${regularization.reason}`,

        createdBy:
          reviewerUser._id,

        updatedBy:
          reviewerUser._id,
      });
  }

  /* =====================================================
     APPLY REQUEST TYPE
  ===================================================== */

  switch (
    regularization.requestType
  ) {
    case "Missing Login":
      if (!requestedLogin) {
        throw new Error(
          "Requested login time is required."
        );
      }

      attendance.loginTime =
        requestedLogin;

      break;

    case "Missing Logout":
      if (!requestedLogout) {
        throw new Error(
          "Requested logout time is required."
        );
      }

      if (!attendance.loginTime) {
        throw new Error(
          "Login time is missing. Correct login first."
        );
      }

      attendance.logoutTime =
        requestedLogout;

      break;

    case "Incorrect Time":
      if (requestedLogin) {
        attendance.loginTime =
          requestedLogin;
      }

      if (requestedLogout) {
        attendance.logoutTime =
          requestedLogout;
      }

      break;

    case "Absent Correction":
    case "Work From Home":
    case "Client Site":
      if (!requestedLogin) {
        throw new Error(
          "Requested login time is required."
        );
      }

      attendance.loginTime =
        requestedLogin;

      if (requestedLogout) {
        attendance.logoutTime =
          requestedLogout;
      }

      break;

    default:
      throw new Error(
        "Unsupported regularization request type."
      );
  }

  /* =====================================================
     VALIDATE TIMES
  ===================================================== */

  if (
    attendance.loginTime &&
    attendance.logoutTime &&
    new Date(
      attendance.logoutTime
    ) <=
      new Date(
        attendance.loginTime
      )
  ) {
    throw new Error(
      "Logout time must be after login time."
    );
  }

  /* =====================================================
     RECALCULATE METRICS
  ===================================================== */

  if (
    attendance.loginTime
  ) {
    const shiftStartAt =
      parseShiftDate(
        attendance.date,
        attendance.shiftStart ||
          DEFAULT_SHIFT_START
      );

    let lateMinutes = 0;

    if (shiftStartAt) {
      const difference =
        Math.floor(
          (
            new Date(
              attendance.loginTime
            ).getTime() -
            shiftStartAt.getTime()
          ) /
            60000
        );

      lateMinutes =
        difference >
        GRACE_MINUTES
          ? difference
          : 0;
    }

    attendance.lateMinutes =
      lateMinutes;
  }

  const metrics =
    calculateAttendanceMetrics(
      attendance
    );

  attendance.workingMinutes =
    metrics.totalWorkedMinutes;

  attendance.totalWorkedMinutes =
    metrics.totalWorkedMinutes;

  attendance.totalBreakMinutes =
    metrics.totalBreakMinutes;

  attendance.lateMinutes =
    metrics.lateMinutes;

  attendance.earlyLogoutMinutes =
    metrics.earlyLogoutMinutes;

  attendance.overtimeMinutes =
    metrics.overtimeMinutes;

  attendance.workStatus =
    attendance.logoutTime
      ? "Logged Out"
      : "Working";

  attendance.status =
    getAttendanceStatus(
      attendance
    );

  const regularizationLabel =
    regularization.requestType ===
    "Work From Home"
      ? "Work From Home"
      : regularization.requestType ===
          "Client Site"
        ? "Client Site"
        : regularization.requestType;

  attendance.note = [
    attendance.note,
    `Regularization approved: ${regularizationLabel}`,
    regularization.reason
      ? `Reason: ${regularization.reason}`
      : "",
  ]
    .filter(Boolean)
    .join(" | ");

  attendance.updatedBy =
    reviewerUser._id;

  await attendance.save();

  return attendance;
}
/* =========================================================
   MY ATTENDANCE CORRECTIONS
========================================================= */

router.get(
  "/regularization/my",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      const data =
        await AttendanceRegularization.find({
          employeeId:
            employee._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);
  /* =========================================================
   CANCEL MY REGULARIZATION
========================================================= */

router.patch(
  "/regularization/:id/cancel",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid correction request ID.",
        });
      }

      const request =
        await AttendanceRegularization.findOne({
          _id:
            req.params.id,

          employeeId:
            employee._id,
        });

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            "Attendance correction request not found.",
        });
      }

      if (
        request.status !==
        "Pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only pending correction requests can be cancelled.",
        });
      }

      await request.deleteOne();

      return res.json({
        success: true,
        message:
          "Attendance correction request cancelled successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   ADMIN - REGULARIZATION LIST
========================================================= */

router.get(
  "/admin/regularizations",
  async (req, res, next) => {
    try {
      if (
        !requireAdmin(
          req,
          res
        )
      ) {
        return;
      }

      const {
        status,
        employeeId,
        requestType,
        fromDate,
        toDate,
      } = req.query;

      const query = {};

      if (
        status &&
        status !== "All"
      ) {
        if (
          ![
            "Pending",
            "Approved",
            "Rejected",
          ].includes(status)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid regularization status.",
          });
        }

        query.status =
          status;
      }

      if (employeeId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            employeeId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid employee ID.",
          });
        }

        query.employeeId =
          employeeId;
      }

      if (
        requestType &&
        requestType !== "All"
      ) {
        if (
          !isValidRegularizationType(
            requestType
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid correction type.",
          });
        }

        query.requestType =
          requestType;
      }

      if (fromDate || toDate) {
        query.date = {};

        if (fromDate) {
          query.date.$gte =
            fromDate;
        }

        if (toDate) {
          query.date.$lte =
            toDate;
        }
      }

      const data =
        await AttendanceRegularization.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .lean();

      const summary = {
        total:
          data.length,

        pending:
          data.filter(
            (item) =>
              item.status ===
              "Pending"
          ).length,

        approved:
          data.filter(
            (item) =>
              item.status ===
              "Approved"
          ).length,

        rejected:
          data.filter(
            (item) =>
              item.status ===
              "Rejected"
          ).length,
      };

      return res.json({
        success: true,
        summary,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   REQUEST ATTENDANCE CORRECTION
========================================================= */

/* =========================================================
   REQUEST ATTENDANCE CORRECTION
========================================================= */

router.post(
  "/regularization",
  async (req, res, next) => {
    try {
      const employee =
        await findEmployee(
          req,
          res
        );

      if (!employee) {
        return;
      }

      const {
        date,
        requestType,
        requestedLoginTime = "",
        requestedLogoutTime = "",
        reason,
      } = req.body;

      /* =========================
         BASIC VALIDATION
      ========================= */

      if (
        !date ||
        !requestType ||
        !String(reason || "").trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Date, correction type and reason are required.",
        });
      }

      if (!isValidDateString(date)) {
        return res.status(400).json({
          success: false,
          message:
            "Attendance date must use YYYY-MM-DD format.",
        });
      }

      if (
        !isValidRegularizationType(
          requestType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid attendance correction type.",
        });
      }

      const today =
        getLocalDateString();

      if (date > today) {
        return res.status(400).json({
          success: false,
          message:
            "Future attendance cannot be corrected.",
        });
      }

      if (
        employee.joiningDate &&
        date <
          employee.joiningDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Attendance before the employee joining date cannot be corrected.",
        });
      }

      /* =========================
         TIME VALIDATION
      ========================= */

      if (
        requestedLoginTime &&
        !isValidTimeString(
          requestedLoginTime
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Requested login time must use HH:mm format.",
        });
      }

      if (
        requestedLogoutTime &&
        !isValidTimeString(
          requestedLogoutTime
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Requested logout time must use HH:mm format.",
        });
      }

      if (
        [
          "Missing Login",
          "Absent Correction",
          "Work From Home",
          "Client Site",
        ].includes(
          requestType
        ) &&
        !requestedLoginTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Requested login time is required for this correction type.",
        });
      }

      if (
        [
          "Missing Logout",
          "Absent Correction",
          "Work From Home",
          "Client Site",
        ].includes(
          requestType
        ) &&
        !requestedLogoutTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Requested logout time is required for this correction type.",
        });
      }

      if (
        requestType ===
          "Incorrect Time" &&
        !requestedLoginTime &&
        !requestedLogoutTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter at least one corrected login or logout time.",
        });
      }

      /* =========================
         LOGIN < LOGOUT CHECK
      ========================= */

      if (
        requestedLoginTime &&
        requestedLogoutTime
      ) {
        const requestedLogin =
          parseRequestedAttendanceTime(
            date,
            requestedLoginTime
          );

        const requestedLogout =
          parseRequestedAttendanceTime(
            date,
            requestedLogoutTime
          );

        if (
          !requestedLogin ||
          !requestedLogout ||
          requestedLogout <=
            requestedLogin
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Requested logout time must be after requested login time.",
          });
        }
      }

      /* =========================
         DAY VALIDATION
      ========================= */

      const holiday =
        await Holiday.findOne({
          date,
          isActive: true,
        }).lean();

      if (
        holiday &&
        holiday.type !== "Optional"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Attendance regularization is not required because ${date} is a holiday: ${holiday.name}.`,
        });
      }

      if (isWeeklyOff(date)) {
        return res.status(400).json({
          success: false,
          message:
            "Attendance regularization is not required on a weekly off.",
        });
      }

      const leave =
        await getApprovedLeave(
          employee._id,
          date
        );

      if (leave) {
        return res.status(400).json({
          success: false,
          message:
            "Attendance regularization cannot be requested for an approved leave day.",
        });
      }

      /* =========================
         EXISTING ATTENDANCE
      ========================= */

      const attendance =
        await Attendance.findOne({
          employeeId:
            employee._id,
          date,
          isDeleted: {
            $ne: true,
          },
        }).lean();

      if (
        requestType ===
          "Missing Login" &&
        attendance?.loginTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This attendance record already contains a login time.",
        });
      }

      if (
        requestType ===
          "Missing Logout" &&
        !attendance?.loginTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A missing logout correction requires an existing login record.",
        });
      }

      if (
        requestType ===
          "Missing Logout" &&
        attendance?.logoutTime
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This attendance record already contains a logout time.",
        });
      }

      if (
        requestType ===
          "Incorrect Time" &&
        !attendance
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No attendance record exists for this date. Use Absent Correction instead.",
        });
      }

      /* =========================
         EXISTING PENDING REQUEST
      ========================= */

      const existing =
        await AttendanceRegularization.findOne({
          employeeId:
            employee._id,

          date,

          status:
            "Pending",
        }).lean();

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "A pending correction already exists for this date.",
        });
      }

      /* =========================
         CREATE REQUEST
      ========================= */

      const request =
        await AttendanceRegularization.create({
          employeeId:
            employee._id,

          employeeCode:
            employee.employeeCode,

          employeeName:
            employee.name,

          date,

          requestType,

          requestedLoginTime:
            String(
              requestedLoginTime ||
                ""
            ).trim(),

          requestedLogoutTime:
            String(
              requestedLogoutTime ||
                ""
            ).trim(),

          reason:
            String(
              reason
            ).trim(),

          status:
            "Pending",
        });

      return res.status(201).json({
        success: true,

        message:
          "Attendance correction request submitted.",

        data:
          request,
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   ADMIN - REVIEW REGULARIZATION
========================================================= */

router.put(
  "/admin/regularizations/:id/review",
  async (req, res, next) => {
    try {
      if (
        !requireAdmin(
          req,
          res
        )
      ) {
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid regularization ID.",
        });
      }

      const {
        status,
        reviewNote = "",
      } = req.body;

      if (
        ![
          "Approved",
          "Rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be Approved or Rejected.",
        });
      }

      const request =
        await AttendanceRegularization.findById(
          req.params.id
        );

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            "Attendance correction request not found.",
        });
      }

      if (
        request.status !==
        "Pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `This request is already ${request.status.toLowerCase()}.`,
        });
      }

      let attendance =
        null;

      /* =========================
         APPROVE
      ========================= */

      if (
        status ===
        "Approved"
      ) {
        attendance =
          await applyAttendanceRegularization(
            request,
            req.user
          );

        request.attendanceId =
          attendance._id;

        request.appliedAt =
          new Date();
      }

      /* =========================
         UPDATE REQUEST
      ========================= */

      request.status =
        status;

      request.reviewedBy =
        req.user.name ||
        req.user.username ||
        "Administrator";

      request.reviewNote =
        String(
          reviewNote ||
            ""
        ).trim();

      request.reviewedAt =
        new Date();

      await request.save();

      return res.json({
        success: true,

        message:
          status === "Approved"
            ? "Attendance correction approved and attendance updated successfully."
            : "Attendance correction rejected.",

        data:
          request,

        attendance:
          attendance
            ? formatAttendance(
                attendance
              )
            : null,
      });
    } catch (error) {
      next(error);
    }
  }
);



/* =========================================================
   ADMIN - TODAY ATTENDANCE
========================================================= */

router.get(
  "/admin/today",
  async (req, res, next) => {
    try {
      if (
        !requireAdmin(
          req,
          res
        )
      ) {
        return;
      }

      const today =
        String(
          req.query.date ||
            getLocalDateString()
        );

      if (
        !isValidDateString(
          today
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "date must use YYYY-MM-DD format.",
        });
      }

      const employees =
        await Employee.find({
          isActive: {
            $ne: false,
          },
        })
          .sort({
            name: 1,
          })
          .lean();

      const employeeIds =
        employees.map(
          (employee) =>
            employee._id
        );

      const [
        attendanceRecords,
        approvedLeaves,
        holiday,
      ] =
        await Promise.all([
          Attendance.find({
            employeeId: {
              $in: employeeIds,
            },

            date: today,

            isDeleted: {
              $ne: true,
            },
          }).lean(),

          LeaveRequest.find({
            employeeId: {
              $in: employeeIds,
            },

            status:
              "Approved",

            fromDate: {
              $lte: today,
            },

            toDate: {
              $gte: today,
            },
          }).lean(),

          Holiday.findOne({
            date: today,
            isActive: true,
          }).lean(),
        ]);

      const attendanceMap =
        new Map(
          attendanceRecords.map(
            (record) => [
              String(
                record.employeeId
              ),
              record,
            ]
          )
        );

      const leaveMap =
        new Map(
          approvedLeaves.map(
            (leave) => [
              String(
                leave.employeeId
              ),
              leave,
            ]
          )
        );

      const isCompanyHoliday =
        Boolean(
          holiday &&
            holiday.type !==
              "Optional"
        );

      const weeklyOff =
        isWeeklyOff(today);

      const currentToday =
        getLocalDateString();

      const rows = [];

      for (
        const employee of employees
      ) {
        /*
          Ignore dates before joining.
        */
        if (
          employee.joiningDate &&
          today <
            employee.joiningDate
        ) {
          continue;
        }

        const employeeId =
          String(employee._id);

        const attendance =
          attendanceMap.get(
            employeeId
          );

        /*
          REAL ATTENDANCE HAS
          HIGHEST PRIORITY
        */
        if (attendance) {
          const formatted =
            formatAttendance(
              attendance
            );

          const missedPunch =
            today <
              currentToday &&
            formatted.loginTime &&
            !formatted.logoutTime;

          rows.push({
            ...formatted,

            attendanceId:
              String(
                attendance._id
              ),

            attendanceStatus:
              missedPunch
                ? "Missed Punch"
                : formatted.status,

            status:
              missedPunch
                ? "Missed Punch"
                : formatted.status,

            workStatus:
              formatted.workStatus,

            missedPunch:
              Boolean(
                missedPunch
              ),

            dayType:
              "ATTENDANCE",
          });

          continue;
        }

        /*
          HOLIDAY
        */
        if (isCompanyHoliday) {
          rows.push({
            employeeId,

            employeeCode:
              employee.employeeCode,

            employeeName:
              employee.name,

            department:
              employee.department ||
              "",

            role:
              employee.role ||
              "",

            attendanceId:
              null,

            attendanceStatus:
              "Holiday",

            status:
              "Holiday",

            workStatus:
              "Holiday",

            dayType:
              "HOLIDAY",

            holidayName:
              holiday.name,

            holidayType:
              holiday.type,

            loginTime:
              null,

            logoutTime:
              null,

            workingMinutes:
              0,

            totalWorkedMinutes:
              0,

            breakMinutes:
              0,
          });

          continue;
        }

        /*
          WEEKLY OFF
        */
        if (weeklyOff) {
          rows.push({
            employeeId,

            employeeCode:
              employee.employeeCode,

            employeeName:
              employee.name,

            department:
              employee.department ||
              "",

            role:
              employee.role ||
              "",

            attendanceId:
              null,

            attendanceStatus:
              "Weekly Off",

            status:
              "Weekly Off",

            workStatus:
              "Weekly Off",

            dayType:
              "WEEKLY_OFF",

            loginTime:
              null,

            logoutTime:
              null,

            workingMinutes:
              0,

            totalWorkedMinutes:
              0,

            breakMinutes:
              0,
          });

          continue;
        }

        /*
          APPROVED LEAVE
        */
        const leave =
          leaveMap.get(
            employeeId
          );

        if (leave) {
          rows.push({
            employeeId,

            employeeCode:
              employee.employeeCode,

            employeeName:
              employee.name,

            department:
              employee.department ||
              "",

            role:
              employee.role ||
              "",

            attendanceId:
              null,

            attendanceStatus:
              "On Leave",

            status:
              "On Leave",

            workStatus:
              "On Leave",

            dayType:
              "LEAVE",

            leaveType:
              leave.leaveType,

            leaveDuration:
              leave.duration ||
              "Full Day",

            loginTime:
              null,

            logoutTime:
              null,

            workingMinutes:
              0,

            totalWorkedMinutes:
              0,

            breakMinutes:
              0,
          });

          continue;
        }

        /*
          TODAY IS NOT ABSENT
          UNTIL DAY PASSES.
        */
        const status =
          today <
          currentToday
            ? "Absent"
            : "Not Checked In";

        rows.push({
          employeeId,

          employeeCode:
            employee.employeeCode,

          employeeName:
            employee.name,

          department:
            employee.department ||
            "",

          role:
            employee.role ||
            "",

          attendanceId:
            null,

          attendanceStatus:
            status,

          status,

          workStatus:
            status ===
            "Absent"
              ? "Absent"
              : "Not Started",

          dayType:
            "WORKING_DAY",

          loginTime:
            null,

          logoutTime:
            null,

          workingMinutes:
            0,

          totalWorkedMinutes:
            0,

          breakMinutes:
            0,
        });
      }

      const summary = {
        totalEmployees:
          rows.length,

        present:
          rows.filter(
            (x) =>
              x.attendanceStatus ===
              "Present"
          ).length,

        late:
          rows.filter(
            (x) =>
              x.attendanceStatus ===
              "Late"
          ).length,

        halfDay:
          rows.filter(
            (x) =>
              x.attendanceStatus ===
              "Half Day"
          ).length,

        absent:
          rows.filter(
            (x) =>
              x.attendanceStatus ===
              "Absent"
          ).length,

        leave:
          rows.filter(
            (x) =>
              x.attendanceStatus ===
              "On Leave"
          ).length,

        holiday:
          rows.filter(
            (x) =>
              x.attendanceStatus ===
              "Holiday"
          ).length,

        weeklyOff:
          rows.filter(
            (x) =>
              x.attendanceStatus ===
              "Weekly Off"
          ).length,

        missedPunch:
          rows.filter(
            (x) =>
              x.attendanceStatus ===
              "Missed Punch"
          ).length,

        notCheckedIn:
          rows.filter(
            (x) =>
              x.attendanceStatus ===
              "Not Checked In"
          ).length,

        working:
          rows.filter(
            (x) =>
              x.workStatus ===
              "Working"
          ).length,

        break:
          rows.filter(
            (x) =>
              x.workStatus ===
              "Break"
          ).length,

        loggedOut:
          rows.filter(
            (x) =>
              x.workStatus ===
              "Logged Out"
          ).length,
      };

      return res.json({
        success: true,

        date:
          today,

        holiday:
          isCompanyHoliday
            ? holiday
            : null,

        weeklyOff,

        summary,

        data:
          rows,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   ADMIN - ABSENCE ANALYSIS
========================================================= */

router.get(
  "/admin/absence-analysis",
  async (req, res, next) => {
    try {
      if (
        !requireAdmin(
          req,
          res
        )
      ) {
        return;
      }

      const days =
        Math.min(
          Math.max(
            Number(
              req.query.days ||
                30
            ),
            7
          ),
          180
        );

      const today =
        getLocalDateString();

      const endDateObj =
        parseDateOnly(
          today
        );

      const startDateObj =
        new Date(
          endDateObj
        );

      startDateObj.setDate(
        startDateObj.getDate() -
          (days - 1)
      );

      const fromDate =
        getLocalDateString(
          startDateObj
        );

      const employees =
        await Employee.find({
          isActive: {
            $ne: false,
          },
        })
          .sort({
            name: 1,
          })
          .lean();

      const employeeIds =
        employees.map(
          (item) =>
            item._id
        );

      const [
        attendance,
        holidays,
        leaves,
      ] =
        await Promise.all([
          Attendance.find({
            employeeId: {
              $in: employeeIds,
            },

            date: {
              $gte:
                fromDate,

              $lt:
                today,
            },

            isDeleted: {
              $ne: true,
            },
          }).lean(),

          Holiday.find({
            isActive: true,

            date: {
              $gte:
                fromDate,

              $lt:
                today,
            },
          }).lean(),

          LeaveRequest.find({
            employeeId: {
              $in: employeeIds,
            },

            status:
              "Approved",

            fromDate: {
              $lt: today,
            },

            toDate: {
              $gte:
                fromDate,
            },
          }).lean(),
        ]);

      const holidayMap =
        new Map(
          holidays.map(
            (holiday) => [
              holiday.date,
              holiday,
            ]
          )
        );

      const attendanceSet =
        new Set(
          attendance.map(
            (record) =>
              `${String(
                record.employeeId
              )}|${record.date}`
          )
        );

      const leaveSet =
        new Set();

      for (
        const leave of leaves
      ) {
        const start =
          leave.fromDate <
          fromDate
            ? fromDate
            : leave.fromDate;

        const end =
          leave.toDate >=
          today
            ? getLocalDateString(
                new Date(
                  parseDateOnly(
                    today
                  ).getTime() -
                    86400000
                )
              )
            : leave.toDate;

        for (
          const date of eachDate(
            start,
            end
          )
        ) {
          if (
            isWeeklyOff(
              date
            )
          ) {
            continue;
          }

          const holiday =
            holidayMap.get(
              date
            );

          if (
            holiday &&
            holiday.type !==
              "Optional"
          ) {
            continue;
          }

          leaveSet.add(
            `${String(
              leave.employeeId
            )}|${date}`
          );
        }
      }

      const results =
        [];

      for (
        const employee of
        employees
      ) {
        const employeeId =
          String(
            employee._id
          );

        const absentDates =
          [];

        for (
          const date of eachDate(
            fromDate,
            getLocalDateString(
              new Date(
                parseDateOnly(
                  today
                ).getTime() -
                  86400000
              )
            )
          )
        ) {
          if (
            employee.joiningDate &&
            date <
              employee.joiningDate
          ) {
            continue;
          }

          const holiday =
            holidayMap.get(
              date
            );

          if (
            holiday &&
            holiday.type !==
              "Optional"
          ) {
            continue;
          }

          if (
            isWeeklyOff(date)
          ) {
            continue;
          }

          const key =
            `${employeeId}|${date}`;

          if (
            attendanceSet.has(
              key
            )
          ) {
            continue;
          }

          if (
            leaveSet.has(key)
          ) {
            continue;
          }

          absentDates.push(
            date
          );
        }

        let longestStreak =
          0;

        let currentStreak =
          0;

        let previousDate =
          null;

        const streaks =
          [];

        let streakStart =
          null;

        for (
          const date of
          absentDates
        ) {
          if (!streakStart) {
            streakStart =
              date;

            currentStreak =
              1;
          } else {
            /*
              Determine whether there was
              another scheduled working day
              between the two absences.
            */

            const previous =
              parseDateOnly(
                previousDate
              );

            const current =
              parseDateOnly(
                date
              );

            const cursor =
              new Date(
                previous
              );

            cursor.setDate(
              cursor.getDate() +
                1
            );

            let broken =
              false;

            while (
              cursor < current
            ) {
              const middleDate =
                getLocalDateString(
                  cursor
                );

              const middleHoliday =
                holidayMap.get(
                  middleDate
                );

              if (
                !isWeeklyOff(
                  middleDate
                ) &&
                !(
                  middleHoliday &&
                  middleHoliday.type !==
                    "Optional"
                )
              ) {
                broken =
                  true;
                break;
              }

              cursor.setDate(
                cursor.getDate() +
                  1
              );
            }

            if (broken) {
              streaks.push({
                fromDate:
                  streakStart,

                toDate:
                  previousDate,

                days:
                  currentStreak,
              });

              streakStart =
                date;

              currentStreak =
                1;
            } else {
              currentStreak++;
            }
          }

          longestStreak =
            Math.max(
              longestStreak,
              currentStreak
            );

          previousDate =
            date;
        }

        if (streakStart) {
          streaks.push({
            fromDate:
              streakStart,

            toDate:
              previousDate,

            days:
              currentStreak,
          });
        }

        if (
          absentDates.length >
          0
        ) {
          results.push({
            employeeId,

            employeeCode:
              employee.employeeCode,

            employeeName:
              employee.name,

            department:
              employee.department ||
              "",

            totalAbsentDays:
              absentDates.length,

            longestStreak,

            absentDates,

            streaks,

            warningLevel:
              longestStreak >=
              3
                ? "High"
                : absentDates.length >=
                    3
                  ? "Medium"
                  : "Low",
          });
        }
      }

      results.sort(
        (a, b) =>
          b.longestStreak -
            a.longestStreak ||
          b.totalAbsentDays -
            a.totalAbsentDays
      );

      return res.json({
        success: true,

        fromDate,

        toDate:
          today,

        summary: {
          employeesWithAbsence:
            results.length,

          employeesWith3DayStreak:
            results.filter(
              (item) =>
                item.longestStreak >=
                3
            ).length,

          totalAbsentDays:
            results.reduce(
              (
                total,
                item
              ) =>
                total +
                item.totalAbsentDays,
              0
            ),
        },

        data:
          results,
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   ADMIN - UPDATE ATTENDANCE
========================================================= */

router.put(
  "/admin/attendance/:id",
  async (req, res, next) => {
    try {
      if (
        !requireAdmin(
          req,
          res
        )
      ) {
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid attendance ID.",
        });
      }

      const attendance =
        await Attendance.findOne({
          _id:
            req.params.id,

          isDeleted: {
            $ne: true,
          },
        });

      if (!attendance) {
        return res.status(404).json({
          success: false,
          message:
            "Attendance record not found.",
        });
      }

      const {
        loginTime,
        logoutTime,
        breakMinutes,
        note,
      } = req.body;

      if (
        loginTime !==
        undefined
      ) {
        if (
          loginTime &&
          !isValidTimeString(
            loginTime
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Login time must use HH:mm format.",
          });
        }

        attendance.loginTime =
          loginTime
            ? parseShiftDate(
                attendance.date,
                loginTime
              )
            : null;
      }

      if (
        logoutTime !==
        undefined
      ) {
        if (
          logoutTime &&
          !isValidTimeString(
            logoutTime
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Logout time must use HH:mm format.",
          });
        }

        attendance.logoutTime =
          logoutTime
            ? parseShiftDate(
                attendance.date,
                logoutTime
              )
            : null;
      }

      if (
        attendance.loginTime &&
        attendance.logoutTime &&
        new Date(
          attendance.logoutTime
        ) <=
          new Date(
            attendance.loginTime
          )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Logout time must be after login time.",
        });
      }

      if (
        breakMinutes !==
        undefined
      ) {
        const minutes =
          Number(
            breakMinutes
          );

        if (
          !Number.isFinite(
            minutes
          ) ||
          minutes < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Break minutes must be zero or greater.",
          });
        }

        attendance.breakMinutes =
          minutes;

        attendance.totalBreakMinutes =
          minutes;

        attendance.breakStartedAt =
          null;
      }

      if (
        note !== undefined
      ) {
        attendance.note =
          String(
            note || ""
          ).trim();
      }

      const metrics =
        calculateAttendanceMetrics(
          attendance
        );

      attendance.workingMinutes =
        metrics.totalWorkedMinutes;

      attendance.totalWorkedMinutes =
        metrics.totalWorkedMinutes;

      attendance.totalBreakMinutes =
        metrics.totalBreakMinutes;

      attendance.lateMinutes =
        metrics.lateMinutes;

      attendance.earlyLogoutMinutes =
        metrics.earlyLogoutMinutes;

      attendance.overtimeMinutes =
        metrics.overtimeMinutes;

      attendance.workStatus =
        attendance.logoutTime
          ? "Logged Out"
          : attendance.loginTime
            ? "Working"
            : "Logged Out";

      attendance.status =
        getAttendanceStatus(
          attendance
        );

      attendance.updatedBy =
        req.user._id;

      await attendance.save();

      return res.json({
        success: true,

        message:
          "Attendance updated successfully.",

        data:
          formatAttendance(
            attendance
          ),
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   ADMIN - ATTENDANCE OVERVIEW
========================================================= */

router.get(
  "/admin/overview",
  async (req, res, next) => {
    try {
      if (
        !requireAdmin(
          req,
          res
        )
      ) {
        return;
      }

      const today =
        getLocalDateString();

      const month =
        today.slice(
          0,
          7
        );

      const monthRange =
        getMonthRange(
          month
        );

      const [
        activeEmployees,
        pendingLeaves,
        pendingRegularizations,
        currentMonthAttendance,
        holidays,
      ] =
        await Promise.all([
          Employee.countDocuments({
            isActive: {
              $ne: false,
            },
          }),

          LeaveRequest.countDocuments({
            status:
              "Pending",
          }),

          AttendanceRegularization.countDocuments({
            status:
              "Pending",
          }),

          Attendance.find({
            date: {
              $gte:
                monthRange.start,

              $lte:
                today,
            },

            isDeleted: {
              $ne: true,
            },
          }).lean(),

          Holiday.find({
            isActive: true,

            date: {
              $gte:
                today,
            },
          })
            .sort({
              date: 1,
            })
            .limit(5)
            .lean(),
        ]);

      const completed =
        currentMonthAttendance.filter(
          (item) =>
            item.logoutTime
        );

      const totalWorkedMinutes =
        completed.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.totalWorkedMinutes ||
                item.workingMinutes ||
                0
            ),
          0
        );

      const totalOvertimeMinutes =
        completed.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.overtimeMinutes ||
                0
            ),
          0
        );

      const lateOccurrences =
        currentMonthAttendance.filter(
          (item) =>
            Number(
              item.lateMinutes ||
                0
            ) > 0
        ).length;

      const halfDayOccurrences =
        currentMonthAttendance.filter(
          (item) =>
            item.status ===
            "Half Day"
        ).length;

      return res.json({
        success: true,

        data: {
          activeEmployees,

          pendingLeaves,

          pendingRegularizations,

          currentMonth: {
            month,

            attendanceRecords:
              currentMonthAttendance.length,

            completedAttendance:
              completed.length,

            totalWorkedMinutes,

            totalOvertimeMinutes,

            lateOccurrences,

            halfDayOccurrences,

            averageWorkedMinutes:
              completed.length >
              0
                ? Math.round(
                    totalWorkedMinutes /
                      completed.length
                  )
                : 0,
          },

          upcomingHolidays:
            holidays,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
/* =========================================================
   ADMIN - MONTHLY ATTENDANCE REGISTER
========================================================= */

router.get(
  "/admin/month",
  async (req, res, next) => {
    try {
      if (
        !requireAdmin(
          req,
          res
        )
      ) {
        return;
      }

      const month =
        String(
          req.query.month ||
            getLocalDateString()
              .slice(0, 7)
        );

      const range =
        getMonthRange(month);

      if (!range) {
        return res.status(400).json({
          success: false,
          message:
            "month must use YYYY-MM format.",
        });
      }

      const today =
        getLocalDateString();

      const employees =
        await Employee.find({
          isActive: {
            $ne: false,
          },
        })
          .sort({
            name: 1,
          })
          .lean();

      const employeeIds =
        employees.map(
          (item) =>
            item._id
        );

      const [
        attendanceRecords,
        holidays,
        leaves,
      ] =
        await Promise.all([
          Attendance.find({
            employeeId: {
              $in: employeeIds,
            },

            date: {
              $gte:
                range.start,

              $lte:
                range.end,
            },

            isDeleted: {
              $ne: true,
            },
          }).lean(),

          Holiday.find({
            isActive: true,

            date: {
              $gte:
                range.start,

              $lte:
                range.end,
            },
          }).lean(),

          LeaveRequest.find({
            employeeId: {
              $in: employeeIds,
            },

            status:
              "Approved",

            fromDate: {
              $lte:
                range.end,
            },

            toDate: {
              $gte:
                range.start,
            },
          }).lean(),
        ]);

      const holidayMap =
        new Map(
          holidays.map(
            (holiday) => [
              holiday.date,
              holiday,
            ]
          )
        );

      const attendanceByEmployee =
        new Map();

      for (
        const record of
        attendanceRecords
      ) {
        const key =
          String(
            record.employeeId
          );

        if (
          !attendanceByEmployee.has(
            key
          )
        ) {
          attendanceByEmployee.set(
            key,
            new Map()
          );
        }

        attendanceByEmployee
          .get(key)
          .set(
            record.date,
            record
          );
      }

      const leavesByEmployee =
        new Map();

      for (
        const leave of leaves
      ) {
        const key =
          String(
            leave.employeeId
          );

        if (
          !leavesByEmployee.has(
            key
          )
        ) {
          leavesByEmployee.set(
            key,
            []
          );
        }

        leavesByEmployee
          .get(key)
          .push(leave);
      }

      const employeeRows =
        [];

      for (
        const employee of
        employees
      ) {
        const employeeId =
          String(
            employee._id
          );

        const attendanceMap =
          attendanceByEmployee.get(
            employeeId
          ) ||
          new Map();

        const employeeLeaves =
          leavesByEmployee.get(
            employeeId
          ) || [];

        const leaveMap =
          new Map();

        for (
          const leave of
          employeeLeaves
        ) {
          const start =
            leave.fromDate <
            range.start
              ? range.start
              : leave.fromDate;

          const end =
            leave.toDate >
            range.end
              ? range.end
              : leave.toDate;

          for (
            const date of eachDate(
              start,
              end
            )
          ) {
            if (
              isWeeklyOff(date)
            ) {
              continue;
            }

            const holiday =
              holidayMap.get(
                date
              );

            if (
              holiday &&
              holiday.type !==
                "Optional"
            ) {
              continue;
            }

            leaveMap.set(
              date,
              leave
            );
          }
        }

        const calendar =
          [];

        const summary = {
          workingDays: 0,
          present: 0,
          late: 0,
          halfDay: 0,
          absent: 0,
          leave: 0,
          holiday: 0,
          weeklyOff: 0,
          missedPunch: 0,
          totalWorkedMinutes: 0,
          overtimeMinutes: 0,
          lateMinutes: 0,
          earlyLogoutMinutes: 0,
          attendanceRate: 0,
        };

        for (
          let day = 1;
          day <=
          range.daysInMonth;
          day += 1
        ) {
          const date =
            `${month}-${String(
              day
            ).padStart(2, "0")}`;

          if (
            employee.joiningDate &&
            date <
              employee.joiningDate
          ) {
            calendar.push({
              date,
              status:
                "Not Joined",
              code:
                "NJ",
            });

            continue;
          }

          const record =
            attendanceMap.get(
              date
            );

          const holiday =
            holidayMap.get(
              date
            );

          const leave =
            leaveMap.get(
              date
            );

          if (record) {
            const formatted =
              formatAttendance(
                record
              );

            const missedPunch =
              date < today &&
              formatted.loginTime &&
              !formatted.logoutTime;

            const status =
              missedPunch
                ? "Missed Punch"
                : formatted.status;

            const code =
              status ===
              "Present"
                ? "P"
                : status ===
                    "Late"
                  ? "L"
                  : status ===
                      "Half Day"
                    ? "HD"
                    : status ===
                        "Missed Punch"
                      ? "MP"
                      : "P";

            calendar.push({
              ...formatted,
              status,
              code,
            });

            summary.workingDays +=
              1;

            summary.totalWorkedMinutes +=
              Number(
                formatted.totalWorkedMinutes ||
                  0
              );

            summary.overtimeMinutes +=
              Number(
                formatted.overtimeMinutes ||
                  0
              );

            summary.lateMinutes +=
              Number(
                formatted.lateMinutes ||
                  0
              );

            summary.earlyLogoutMinutes +=
              Number(
                formatted.earlyLogoutMinutes ||
                  0
              );

            if (missedPunch) {
              summary.missedPunch++;
            } else if (
              status ===
              "Present"
            ) {
              summary.present++;
            } else if (
              status ===
              "Late"
            ) {
              summary.late++;
            } else if (
              status ===
              "Half Day"
            ) {
              summary.halfDay++;
            }

            continue;
          }

          if (
            holiday &&
            holiday.type !==
              "Optional"
          ) {
            calendar.push({
              date,
              status:
                "Holiday",
              code:
                "H",
              holidayName:
                holiday.name,
            });

            summary.holiday++;

            continue;
          }

          if (
            isWeeklyOff(date)
          ) {
            calendar.push({
              date,
              status:
                "Weekly Off",
              code:
                "WO",
            });

            summary.weeklyOff++;

            continue;
          }

          if (leave) {
            calendar.push({
              date,
              status:
                "On Leave",
              code:
                "LV",
              leaveType:
                leave.leaveType,
              leaveDuration:
                leave.duration,
            });

            if (
              date <= today
            ) {
              summary.leave++;
            }

            continue;
          }

          if (date > today) {
            calendar.push({
              date,
              status: "",
              code: "",
              isFuture:
                true,
            });

            continue;
          }

          calendar.push({
            date,
            status:
              "Absent",
            code:
              "A",
          });

          summary.workingDays++;
          summary.absent++;
        }

        const equivalentPresent =
          summary.present +
          summary.late +
          summary.halfDay *
            0.5;

        summary.attendanceRate =
          summary.workingDays >
          0
            ? Math.round(
                (
                  equivalentPresent /
                  summary.workingDays
                ) *
                  1000
              ) / 10
            : 0;

        employeeRows.push({
          employeeId,

          employeeCode:
            employee.employeeCode,

          employeeName:
            employee.name,

          department:
            employee.department ||
            "",

          role:
            employee.role ||
            "",

          summary,

          calendar,
        });
      }

      return res.json({
        success: true,

        month,

        daysInMonth:
          range.daysInMonth,

        employees:
          employeeRows,

        holidays,
      });
    } catch (error) {
      next(error);
    }
  }
);
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