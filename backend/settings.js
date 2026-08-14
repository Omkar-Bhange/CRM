const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Use the middleware file

const authenticateUser = require("./authMiddleware");

router.use(authenticateUser);

router.use((req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access is required.",
    });
  }

  next();
});


/* =====================================================
   CONSTANTS
===================================================== */

const ACTIVE_STATUSES = ["Active", "Inactive"];

const SETTING_COLORS = [
  "Slate",
  "Violet",
  "Blue",
  "Emerald",
  "Amber",
  "Orange",
  "Rose",
];

const PERMISSION_OPTIONS = [
  "Overview",
  "Clients",
  "AMC & Billing",
  "Tickets",
  "Team",
  "Tasks",
  "Attendance",
  "Settings",
  "My Tasks",
  "My Attendance",
  "My Leaves",
];

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DATE_FORMATS = [
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
];

const DEFAULT_SETTINGS_KEY = "system";

/* =====================================================
   ROLE SUB-SCHEMA
===================================================== */

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required."],
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    users: {
      type: Number,
      default: 0,
      min: 0,
    },

    permissions: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ACTIVE_STATUSES,
      default: "Active",
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdByName: {
      type: String,
      default: "",
      trim: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

/* =====================================================
   TASK STATUS SUB-SCHEMA
===================================================== */

const taskStatusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [
        true,
        "Task status name is required.",
      ],
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    color: {
      type: String,
      enum: SETTING_COLORS,
      default: "Slate",
    },

    order: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    isFinal: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ACTIVE_STATUSES,
      default: "Active",
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdByName: {
      type: String,
      default: "",
      trim: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

/* =====================================================
   PRIORITY SUB-SCHEMA
===================================================== */

const prioritySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [
        true,
        "Priority name is required.",
      ],
      trim: true,
    },

    responseHours: {
      type: Number,
      required: true,
      min: 0,
      max: 8760,
      default: 8,
    },

    color: {
      type: String,
      enum: SETTING_COLORS,
      default: "Slate",
    },

    status: {
      type: String,
      enum: ACTIVE_STATUSES,
      default: "Active",
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdByName: {
      type: String,
      default: "",
      trim: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

/* =====================================================
   LEAVE TYPE SUB-SCHEMA
===================================================== */

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [
        true,
        "Leave type name is required.",
      ],
      trim: true,
    },

    code: {
      type: String,
      required: [
        true,
        "Leave type code is required.",
      ],
      trim: true,
      uppercase: true,
    },

    yearlyLimit: {
      type: Number,
      default: 0,
      min: 0,
      max: 366,
    },

    paid: {
      type: Boolean,
      default: true,
    },

    carryForward: {
      type: Boolean,
      default: false,
    },

    requiresDocument: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ACTIVE_STATUSES,
      default: "Active",
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdByName: {
      type: String,
      default: "",
      trim: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

/* =====================================================
   NOTIFICATION CHANNEL SUB-SCHEMA
===================================================== */

const notificationChannelSchema =
  new mongoose.Schema(
    {
      inApp: {
        type: Boolean,
        default: true,
      },

      email: {
        type: Boolean,
        default: false,
      },

      mobile: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

/* =====================================================
   SYSTEM SETTINGS SCHEMA
===================================================== */

const systemSettingsSchema =
  new mongoose.Schema(
    {
      settingsKey: {
        type: String,
        unique: true,
        required: true,
        default: DEFAULT_SETTINGS_KEY,
        immutable: true,
        index: true,
      },

      /* =================================================
         COMPANY SETTINGS
      ================================================= */

      company: {
        companyName: {
          type: String,
          required: true,
          trim: true,
          default: "Total Solution",
        },

        workspaceName: {
          type: String,
          required: true,
          trim: true,
          default: "Client Connect",
        },

        ownerName: {
          type: String,
          default: "",
          trim: true,
        },

        email: {
          type: String,
          default: "",
          trim: true,
          lowercase: true,
        },

        mobile: {
          type: String,
          default: "",
          trim: true,
        },

        gstNo: {
          type: String,
          default: "",
          trim: true,
          uppercase: true,
        },

        address: {
          type: String,
          default: "",
          trim: true,
        },

        city: {
          type: String,
          default: "",
          trim: true,
        },

        state: {
          type: String,
          default: "",
          trim: true,
        },

        country: {
          type: String,
          default: "India",
          trim: true,
        },

        financialYearStart: {
          type: String,
          enum: [
            "01",
            "02",
            "03",
            "04",
            "05",
            "06",
            "07",
            "08",
            "09",
            "10",
            "11",
            "12",
          ],
          default: "04",
        },

        dateFormat: {
          type: String,
          enum: DATE_FORMATS,
          default: "DD/MM/YYYY",
        },

        timezone: {
          type: String,
          default: "Asia/Kolkata",
          trim: true,
        },
      },

      /* =================================================
         ROLES AND PERMISSIONS
      ================================================= */

      roles: {
        type: [roleSchema],
        default: [],
      },

      /* =================================================
         TASK STATUSES
      ================================================= */

      taskStatuses: {
        type: [taskStatusSchema],
        default: [],
      },

      /* =================================================
         PRIORITIES
      ================================================= */

      priorities: {
        type: [prioritySchema],
        default: [],
      },

      /* =================================================
         WORKING HOURS
      ================================================= */

      workingHours: {
        officeStartTime: {
          type: String,
          default: "09:00",
        },

        officeEndTime: {
          type: String,
          default: "18:00",
        },

        lateAfterMinutes: {
          type: Number,
          default: 10,
          min: 0,
          max: 1440,
        },

        fullDayHours: {
          type: Number,
          default: 8,
          min: 0,
          max: 24,
        },

        halfDayHours: {
          type: Number,
          default: 4,
          min: 0,
          max: 24,
        },

        defaultBreakMinutes: {
          type: Number,
          default: 45,
          min: 0,
          max: 1440,
        },

        weeklyOff: {
          type: [String],
          enum: WEEK_DAYS,
          default: ["Sunday"],
        },

        autoMarkAbsent: {
          type: Boolean,
          default: true,
        },

        absentMarkTime: {
          type: String,
          default: "11:00",
        },

        allowManualCorrection: {
          type: Boolean,
          default: true,
        },
      },

      /* =================================================
         LEAVE TYPES
      ================================================= */

      leaveTypes: {
        type: [leaveTypeSchema],
        default: [],
      },

      /* =================================================
         NOTIFICATION SETTINGS
      ================================================= */

      notifications: {
        newTicket: {
          type: notificationChannelSchema,

          default: () => ({
            inApp: true,
            email: true,
            mobile: false,
          }),
        },

        taskAssigned: {
          type: notificationChannelSchema,

          default: () => ({
            inApp: true,
            email: true,
            mobile: true,
          }),
        },

        taskOverdue: {
          type: notificationChannelSchema,

          default: () => ({
            inApp: true,
            email: true,
            mobile: true,
          }),
        },

        leaveRequest: {
          type: notificationChannelSchema,

          default: () => ({
            inApp: true,
            email: true,
            mobile: false,
          }),
        },

        amcDue: {
          type: notificationChannelSchema,

          default: () => ({
            inApp: true,
            email: true,
            mobile: false,
          }),
        },

        employeeLate: {
          type: notificationChannelSchema,

          default: () => ({
            inApp: true,
            email: false,
            mobile: false,
          }),
        },

        amcReminderDays: {
          type: Number,
          default: 30,
          min: 0,
          max: 365,
        },

        taskDueReminderHours: {
          type: Number,
          default: 4,
          min: 0,
          max: 8760,
        },

        dailySummaryEnabled: {
          type: Boolean,
          default: true,
        },

        dailySummaryTime: {
          type: String,
          default: "18:30",
        },
      },

      /* =================================================
         VERSION AND AUDIT
      ================================================= */

      version: {
        type: Number,
        default: 1,
        min: 1,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      updatedByName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
      collection: "systemsettings",
      minimize: false,
    }
  );

/* =====================================================
   INDEXES
===================================================== */

// systemSettingsSchema.index(
//   {
//     settingsKey: 1,
//   },
//   {
//     unique: true,
//   }
// );

/* =====================================================
   MODEL
===================================================== */

const SystemSettings =
  mongoose.models.SystemSettings ||
  mongoose.model(
    "SystemSettings",
    systemSettingsSchema
  );
  /* =====================================================
   DEFAULT SETTINGS OBJECT
===================================================== */

function buildDefaultSettings(req = null) {
  const userId = req?.user?._id || null;

  const userName =
    req?.user?.name || "System";

  return {
    settingsKey:
      DEFAULT_SETTINGS_KEY,

    company: {
      companyName:
        "Total Solution",

      workspaceName:
        "Client Connect",

      ownerName:
        "Mangesh Kondhare",

      email:
        "admin@totalsolution.in",

      mobile: "",

      gstNo: "",

      address: "",

      city: "Pune",

      state:
        "Maharashtra",

      country:
        "India",

      financialYearStart:
        "04",

      dateFormat:
        "DD/MM/YYYY",

      timezone:
        "Asia/Kolkata",
    },

    /* ============================================
       DEFAULT ROLES
    ============================================ */

    roles: [
      {
        name:
          "Owner / Administrator",

        description:
          "Full access to every module.",

        users: 1,

        permissions: [
          "Clients",
          "AMC & Billing",
          "Tickets",
          "Team",
          "Tasks",
          "Attendance",
          "Settings",
        ],

        status: "Active",

        isSystem: true,

        createdBy: userId,

        createdByName:
          userName,

        updatedBy: userId,

        updatedByName:
          userName,
      },

      {
        name:
          "Support Manager",

        description:
          "Manage support team.",

        users: 0,

        permissions: [
          "Clients",
          "Tickets",
          "Team",
          "Tasks",
          "Attendance",
        ],

        status: "Active",

        isSystem: true,

        createdBy: userId,

        createdByName:
          userName,

        updatedBy: userId,

        updatedByName:
          userName,
      },

      {
        name: "Employee",

        description:
          "Employee Login",

        users: 0,

        permissions: [
          "My Tasks",
          "My Attendance",
          "My Leaves",
        ],

        status: "Active",

        isSystem: true,

        createdBy: userId,

        createdByName:
          userName,

        updatedBy: userId,

        updatedByName:
          userName,
      },
    ],

    /* ============================================
       TASK STATUS
    ============================================ */

    taskStatuses: [
      {
        name: "Assigned",

        description:
          "Task Assigned",

        color: "Slate",

        order: 1,

        isFinal: false,

        status: "Active",

        isSystem: true,
      },

      {
        name:
          "In Progress",

        description:
          "Currently Working",

        color:
          "Violet",

        order: 2,

        isFinal: false,

        status: "Active",

        isSystem: true,
      },

      {
        name:
          "Testing",

        description:
          "Waiting Testing",

        color: "Blue",

        order: 3,

        isFinal: false,

        status: "Active",

        isSystem: true,
      },

      {
        name:
          "Blocked",

        description:
          "Dependency Pending",

        color: "Rose",

        order: 4,

        isFinal: false,

        status: "Active",

        isSystem: true,
      },

      {
        name:
          "Completed",

        description:
          "Task Finished",

        color:
          "Emerald",

        order: 5,

        isFinal: true,

        status: "Active",

        isSystem: true,
      },
    ],

    /* ============================================
       PRIORITIES
    ============================================ */

    priorities: [
      {
        name: "Low",

        responseHours: 24,

        color: "Slate",

        status: "Active",

        isSystem: true,
      },

      {
        name:
          "Medium",

        responseHours: 8,

        color: "Amber",

        status: "Active",

        isSystem: true,
      },

      {
        name: "High",

        responseHours: 4,

        color:
          "Orange",

        status: "Active",

        isSystem: true,
      },

      {
        name:
          "Critical",

        responseHours: 1,

        color: "Rose",

        status: "Active",

        isSystem: true,
      },
    ],

    /* ============================================
       WORKING HOURS
    ============================================ */

    workingHours: {
      officeStartTime:
        "09:00",

      officeEndTime:
        "18:00",

      lateAfterMinutes: 10,

      fullDayHours: 8,

      halfDayHours: 4,

      defaultBreakMinutes: 45,

      weeklyOff: [
        "Sunday",
      ],

      autoMarkAbsent:
        true,

      absentMarkTime:
        "11:00",

      allowManualCorrection:
        true,
    },

    /* ============================================
       LEAVE TYPES
    ============================================ */

    leaveTypes: [
      {
        name:
          "Casual Leave",

        code: "CL",

        yearlyLimit: 12,

        paid: true,

        carryForward:
          false,

        requiresDocument:
          false,

        status: "Active",

        isSystem: true,
      },

      {
        name:
          "Sick Leave",

        code: "SL",

        yearlyLimit: 8,

        paid: true,

        carryForward:
          false,

        requiresDocument:
          true,

        status: "Active",

        isSystem: true,
      },

      {
        name:
          "Earned Leave",

        code: "EL",

        yearlyLimit: 15,

        paid: true,

        carryForward:
          true,

        requiresDocument:
          false,

        status: "Active",

        isSystem: true,
      },

      {
        name:
          "Unpaid Leave",

        code: "LWP",

        yearlyLimit: 0,

        paid: false,

        carryForward:
          false,

        requiresDocument:
          false,

        status: "Active",

        isSystem: true,
      },
    ],

    /* ============================================
       NOTIFICATIONS
    ============================================ */

    notifications: {
      newTicket: {
        inApp: true,
        email: true,
        mobile: false,
      },

      taskAssigned: {
        inApp: true,
        email: true,
        mobile: true,
      },

      taskOverdue: {
        inApp: true,
        email: true,
        mobile: true,
      },

      leaveRequest: {
        inApp: true,
        email: true,
        mobile: false,
      },

      amcDue: {
        inApp: true,
        email: true,
        mobile: false,
      },

      employeeLate: {
        inApp: true,
        email: false,
        mobile: false,
      },

      amcReminderDays: 30,

      taskDueReminderHours: 4,

      dailySummaryEnabled:
        true,

      dailySummaryTime:
        "18:30",
    },

    updatedBy:
      userId,

    updatedByName:
      userName,
  };
}

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

function cleanString(
  value,
  fallback = ""
) {
  if (
    value === undefined ||
    value === null
  )
    return fallback;

  return String(value).trim();
}

function cleanNumber(
  value,
  fallback = 0
) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}

function cleanBoolean(
  value,
  fallback = false
) {
  if (
    typeof value ===
    "boolean"
  )
    return value;

  return fallback;
}

function validTime(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    String(value)
  );
}

async function getOrCreateSettings(
  req
) {
  let settings =
    await SystemSettings.findOne({
      settingsKey:
        DEFAULT_SETTINGS_KEY,
    });

  if (!settings) {
    settings =
      await SystemSettings.create(
        buildDefaultSettings(
          req
        )
      );
  }

  return settings;
}

async function saveSettings(
  settings,
  req
) {
  settings.updatedBy =
    req.user._id;

  settings.updatedByName =
    req.user.name;

  settings.version += 1;

  await settings.save();

  return settings;
}

/* =====================================================
   GET COMPLETE SETTINGS
===================================================== */

router.get(
  "/",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      res.json({
        success: true,

        data: settings,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        message:
          "Unable to load settings.",
      });
    }
  }
);

/* =====================================================
   INITIALIZE SETTINGS
===================================================== */

router.post(
  "/initialize",
  async (req, res) => {
    try {
      const existing =
        await SystemSettings.findOne(
          {
            settingsKey:
              DEFAULT_SETTINGS_KEY,
          }
        );

      if (existing) {
        return res.json({
          success: true,

          message:
            "Already initialized.",

          data: existing,
        });
      }

      const settings =
        await SystemSettings.create(
          buildDefaultSettings(
            req
          )
        );

      res.json({
        success: true,

        message:
          "System Settings Initialized",

        data: settings,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        message:
          "Initialization failed.",
      });
    }
  }
);

/* =====================================================
   RESET SETTINGS
===================================================== */

router.post(
  "/reset",
  async (req, res) => {
    try {
      await SystemSettings.deleteMany(
        {}
      );

      const settings =
        await SystemSettings.create(
          buildDefaultSettings(
            req
          )
        );

      res.json({
        success: true,

        message:
          "Settings Reset Successfully",

        data: settings,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        message:
          "Reset failed.",
      });
    }
  }
);
/* =====================================================
   COMPANY SETTINGS
===================================================== */

/* =====================================================
   GET COMPANY SETTINGS
   GET /api/settings/company
===================================================== */

router.get(
  "/company",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      return res.status(200).json({
        success: true,

        data:
          settings.company,
      });
    } catch (error) {
      console.error(
        "Load company settings error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load company settings.",
      });
    }
  }
);

/* =====================================================
   UPDATE COMPANY SETTINGS
   PUT /api/settings/company
===================================================== */

router.put(
  "/company",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const currentCompany =
        settings.company || {};

      const {
        companyName,
        workspaceName,
        ownerName,
        email,
        mobile,
        gstNo,
        address,
        city,
        state,
        country,
        financialYearStart,
        dateFormat,
        timezone,
      } = req.body || {};

      const normalizedCompanyName =
        cleanString(
          companyName,
          currentCompany.companyName
        );

      const normalizedWorkspaceName =
        cleanString(
          workspaceName,
          currentCompany.workspaceName
        );

      if (!normalizedCompanyName) {
        return res.status(400).json({
          success: false,

          message:
            "Company name is required.",
        });
      }

      if (!normalizedWorkspaceName) {
        return res.status(400).json({
          success: false,

          message:
            "Workspace name is required.",
        });
      }

      const normalizedEmail =
        cleanString(
          email,
          currentCompany.email
        ).toLowerCase();

      if (
        normalizedEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          normalizedEmail
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Enter a valid company email address.",
        });
      }

      const normalizedMobile =
        cleanString(
          mobile,
          currentCompany.mobile
        );

      if (
        normalizedMobile &&
        !/^[0-9+\-\s()]{7,20}$/.test(
          normalizedMobile
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Enter a valid mobile number.",
        });
      }

      const normalizedGstNo =
        cleanString(
          gstNo,
          currentCompany.gstNo
        ).toUpperCase();

      if (
        normalizedGstNo &&
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(
          normalizedGstNo
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Enter a valid 15-character GST number.",
        });
      }

      const normalizedFinancialYearStart =
        cleanString(
          financialYearStart,
          currentCompany.financialYearStart ||
            "04"
        );

      const allowedFinancialYearMonths = [
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
      ];

      if (
        !allowedFinancialYearMonths.includes(
          normalizedFinancialYearStart
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid financial year start month.",
        });
      }

      const normalizedDateFormat =
        cleanString(
          dateFormat,
          currentCompany.dateFormat ||
            "DD/MM/YYYY"
        );

      if (
        !DATE_FORMATS.includes(
          normalizedDateFormat
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid date format.",
        });
      }

      const normalizedTimezone =
        cleanString(
          timezone,
          currentCompany.timezone ||
            "Asia/Kolkata"
        );

      if (!normalizedTimezone) {
        return res.status(400).json({
          success: false,

          message:
            "Timezone is required.",
        });
      }

      settings.company = {
        companyName:
          normalizedCompanyName,

        workspaceName:
          normalizedWorkspaceName,

        ownerName:
          cleanString(
            ownerName,
            currentCompany.ownerName
          ),

        email:
          normalizedEmail,

        mobile:
          normalizedMobile,

        gstNo:
          normalizedGstNo,

        address:
          cleanString(
            address,
            currentCompany.address
          ),

        city:
          cleanString(
            city,
            currentCompany.city
          ),

        state:
          cleanString(
            state,
            currentCompany.state
          ),

        country:
          cleanString(
            country,
            currentCompany.country ||
              "India"
          ),

        financialYearStart:
          normalizedFinancialYearStart,

        dateFormat:
          normalizedDateFormat,

        timezone:
          normalizedTimezone,
      };

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Company settings updated successfully.",

        data:
          settings.company,
      });
    } catch (error) {
      console.error(
        "Update company settings error:",
        error
      );

      if (
        error instanceof
        mongoose.Error.ValidationError
      ) {
        const firstError =
          Object.values(
            error.errors
          )[0];

        return res.status(400).json({
          success: false,

          message:
            firstError?.message ||
            "Company settings validation failed.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update company settings.",
      });
    }
  }
);

/* =====================================================
   ROLE HELPERS
===================================================== */

function normalizePermissions(
  permissions
) {
  if (
    !Array.isArray(
      permissions
    )
  ) {
    return [];
  }

  return [
    ...new Set(
      permissions
        .map((permission) =>
          cleanString(
            permission
          )
        )
        .filter((permission) =>
          PERMISSION_OPTIONS.includes(
            permission
          )
        )
    ),
  ];
}

function findRoleById(
  settings,
  roleId
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      roleId
    )
  ) {
    return null;
  }

  return settings.roles.id(
    roleId
  );
}

/* =====================================================
   GET ALL ROLES
   GET /api/settings/roles
===================================================== */

router.get(
  "/roles",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const roles = [
        ...settings.roles,
      ].sort((a, b) =>
        String(a.name).localeCompare(
          String(b.name)
        )
      );

      return res.status(200).json({
        success: true,

        count:
          roles.length,

        permissions:
          PERMISSION_OPTIONS,

        data:
          roles,
      });
    } catch (error) {
      console.error(
        "Load roles error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load roles.",
      });
    }
  }
);

/* =====================================================
   GET SINGLE ROLE
   GET /api/settings/roles/:id
===================================================== */

router.get(
  "/roles/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const role =
        findRoleById(
          settings,
          req.params.id
        );

      if (!role) {
        return res.status(404).json({
          success: false,

          message:
            "Role not found.",
        });
      }

      return res.status(200).json({
        success: true,

        data: role,
      });
    } catch (error) {
      console.error(
        "Load role error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load role.",
      });
    }
  }
);

/* =====================================================
   CREATE ROLE
   POST /api/settings/roles
===================================================== */

router.post(
  "/roles",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const {
        name,
        description,
        users,
        permissions,
        status,
      } = req.body || {};

      const normalizedName =
        cleanString(name);

      if (!normalizedName) {
        return res.status(400).json({
          success: false,

          message:
            "Role name is required.",
        });
      }

      if (
        normalizedName.length >
        80
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Role name cannot exceed 80 characters.",
        });
      }

      const duplicateRole =
        settings.roles.find(
          (role) =>
            String(
              role.name
            )
              .trim()
              .toLowerCase() ===
            normalizedName.toLowerCase()
        );

      if (duplicateRole) {
        return res.status(409).json({
          success: false,

          message:
            "Role name already exists.",
        });
      }

      const normalizedStatus =
        ACTIVE_STATUSES.includes(
          status
        )
          ? status
          : "Active";

      const normalizedUsers =
        Math.max(
          cleanNumber(
            users,
            0
          ),
          0
        );

      const normalizedPermissions =
        normalizePermissions(
          permissions
        );

      const userId =
        req.user?._id ||
        null;

      const userName =
        req.user?.name ||
        "Admin";

      settings.roles.push({
        name:
          normalizedName,

        description:
          cleanString(
            description
          ),

        users:
          normalizedUsers,

        permissions:
          normalizedPermissions,

        status:
          normalizedStatus,

        isSystem:
          false,

        createdBy:
          userId,

        createdByName:
          userName,

        updatedBy:
          userId,

        updatedByName:
          userName,
      });

      await saveSettings(
        settings,
        req
      );

      const createdRole =
        settings.roles[
          settings.roles.length -
            1
        ];

      return res.status(201).json({
        success: true,

        message:
          "Role created successfully.",

        data:
          createdRole,
      });
    } catch (error) {
      console.error(
        "Create role error:",
        error
      );

      if (
        error instanceof
        mongoose.Error.ValidationError
      ) {
        const firstError =
          Object.values(
            error.errors
          )[0];

        return res.status(400).json({
          success: false,

          message:
            firstError?.message ||
            "Role validation failed.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to create role.",
      });
    }
  }
);

/* =====================================================
   UPDATE ROLE
   PUT /api/settings/roles/:id
===================================================== */

router.put(
  "/roles/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const role =
        findRoleById(
          settings,
          req.params.id
        );

      if (!role) {
        return res.status(404).json({
          success: false,

          message:
            "Role not found.",
        });
      }

      const {
        name,
        description,
        users,
        permissions,
        status,
      } = req.body || {};

      const normalizedName =
        cleanString(
          name,
          role.name
        );

      if (!normalizedName) {
        return res.status(400).json({
          success: false,

          message:
            "Role name is required.",
        });
      }

      const duplicateRole =
        settings.roles.find(
          (existingRole) =>
            String(
              existingRole._id
            ) !==
              String(
                role._id
              ) &&
            String(
              existingRole.name
            )
              .trim()
              .toLowerCase() ===
              normalizedName.toLowerCase()
        );

      if (duplicateRole) {
        return res.status(409).json({
          success: false,

          message:
            "Role name already exists.",
        });
      }

      role.name =
        normalizedName;

      role.description =
        cleanString(
          description,
          role.description
        );

      if (
        users !==
        undefined
      ) {
        role.users =
          Math.max(
            cleanNumber(
              users,
              role.users
            ),
            0
          );
      }

      if (
        permissions !==
        undefined
      ) {
        role.permissions =
          normalizePermissions(
            permissions
          );
      }

      if (
        status !==
        undefined
      ) {
        if (
          !ACTIVE_STATUSES.includes(
            status
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Role status must be Active or Inactive.",
          });
        }

        role.status =
          status;
      }

      role.updatedBy =
        req.user?._id ||
        null;

      role.updatedByName =
        req.user?.name ||
        "Admin";

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Role updated successfully.",

        data: role,
      });
    } catch (error) {
      console.error(
        "Update role error:",
        error
      );

      if (
        error instanceof
        mongoose.Error.ValidationError
      ) {
        const firstError =
          Object.values(
            error.errors
          )[0];

        return res.status(400).json({
          success: false,

          message:
            firstError?.message ||
            "Role validation failed.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update role.",
      });
    }
  }
);

/* =====================================================
   UPDATE ROLE STATUS
   PATCH /api/settings/roles/:id/status
===================================================== */

router.patch(
  "/roles/:id/status",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const role =
        findRoleById(
          settings,
          req.params.id
        );

      if (!role) {
        return res.status(404).json({
          success: false,

          message:
            "Role not found.",
        });
      }

      const normalizedStatus =
        cleanString(
          req.body?.status
        );

      if (
        !ACTIVE_STATUSES.includes(
          normalizedStatus
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Role status must be Active or Inactive.",
        });
      }

      role.status =
        normalizedStatus;

      role.updatedBy =
        req.user?._id ||
        null;

      role.updatedByName =
        req.user?.name ||
        "Admin";

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          `Role marked as ${normalizedStatus}.`,

        data: role,
      });
    } catch (error) {
      console.error(
        "Update role status error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update role status.",
      });
    }
  }
);

/* =====================================================
   UPDATE ROLE USER COUNT
   PATCH /api/settings/roles/:id/users
===================================================== */

router.patch(
  "/roles/:id/users",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const role =
        findRoleById(
          settings,
          req.params.id
        );

      if (!role) {
        return res.status(404).json({
          success: false,

          message:
            "Role not found.",
        });
      }

      const users =
        Math.max(
          cleanNumber(
            req.body?.users,
            role.users
          ),
          0
        );

      role.users =
        users;

      role.updatedBy =
        req.user?._id ||
        null;

      role.updatedByName =
        req.user?.name ||
        "Admin";

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Role user count updated successfully.",

        data: role,
      });
    } catch (error) {
      console.error(
        "Update role user count error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update role user count.",
      });
    }
  }
);

/* =====================================================
   DELETE ROLE
   DELETE /api/settings/roles/:id
===================================================== */

router.delete(
  "/roles/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const role =
        findRoleById(
          settings,
          req.params.id
        );

      if (!role) {
        return res.status(404).json({
          success: false,

          message:
            "Role not found.",
        });
      }

      if (role.isSystem) {
        return res.status(409).json({
          success: false,

          message:
            "System roles cannot be deleted. Mark the role inactive instead.",
        });
      }

      if (
        Number(
          role.users || 0
        ) > 0
      ) {
        return res.status(409).json({
          success: false,

          message:
            "This role is assigned to users and cannot be deleted.",
        });
      }

      const deletedRole = {
        id:
          role._id,

        name:
          role.name,
      };

      role.deleteOne();

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Role deleted successfully.",

        data:
          deletedRole,
      });
    } catch (error) {
      console.error(
        "Delete role error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to delete role.",
      });
    }
  }
);

/* =====================================================
   SHARED HELPERS FOR REMAINING SETTINGS APIs
===================================================== */

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(
    value
  );
}

function findSubDocument(
  collection,
  id
) {
  if (!isValidObjectId(id)) {
    return null;
  }

  return collection.id(id);
}

function userAudit(req) {
  return {
    userId:
      req.user?._id ||
      null,

    userName:
      req.user?.name ||
      "Admin",
  };
}

function sendValidationError(
  res,
  error
) {
  if (
    error instanceof
    mongoose.Error.ValidationError
  ) {
    const firstError =
      Object.values(
        error.errors
      )[0];

    return res.status(400).json({
      success: false,

      message:
        firstError?.message ||
        "Submitted settings data is invalid.",

      errors:
        Object.fromEntries(
          Object.entries(
            error.errors
          ).map(
            ([
              field,
              fieldError,
            ]) => [
              field,
              fieldError.message,
            ]
          )
        ),
    });
  }

  return null;
}

/* =====================================================
   TASK STATUSES
===================================================== */

/* =====================================================
   GET ALL TASK STATUSES
   GET /api/settings/task-statuses
===================================================== */

router.get(
  "/task-statuses",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const taskStatuses = [
        ...settings.taskStatuses,
      ].sort(
        (a, b) =>
          Number(a.order) -
          Number(b.order)
      );

      return res.status(200).json({
        success: true,

        count:
          taskStatuses.length,

        colors:
          SETTING_COLORS,

        data:
          taskStatuses,
      });
    } catch (error) {
      console.error(
        "Load task statuses error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load task statuses.",
      });
    }
  }
);

/* =====================================================
   CREATE TASK STATUS
   POST /api/settings/task-statuses
===================================================== */

router.post(
  "/task-statuses",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const {
        name,
        description,
        color,
        order,
        isFinal,
        status,
      } = req.body || {};

      const normalizedName =
        cleanString(name);

      if (!normalizedName) {
        return res.status(400).json({
          success: false,

          message:
            "Task status name is required.",
        });
      }

      if (
        normalizedName.length >
        80
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Task status name cannot exceed 80 characters.",
        });
      }

      const duplicateStatus =
        settings.taskStatuses.some(
          (item) =>
            String(
              item.name
            )
              .trim()
              .toLowerCase() ===
            normalizedName.toLowerCase()
        );

      if (duplicateStatus) {
        return res.status(409).json({
          success: false,

          message:
            "Task status name already exists.",
        });
      }

      const requestedOrder =
        Math.max(
          cleanNumber(
            order,
            settings
              .taskStatuses
              .length + 1
          ),
          1
        );

      const {
        userId,
        userName,
      } = userAudit(req);

      settings.taskStatuses.push({
        name:
          normalizedName,

        description:
          cleanString(
            description
          ),

        color:
          SETTING_COLORS.includes(
            color
          )
            ? color
            : "Slate",

        order:
          requestedOrder,

        isFinal:
          cleanBoolean(
            isFinal,
            false
          ),

        status:
          ACTIVE_STATUSES.includes(
            status
          )
            ? status
            : "Active",

        isSystem:
          false,

        createdBy:
          userId,

        createdByName:
          userName,

        updatedBy:
          userId,

        updatedByName:
          userName,
      });

      /*
       * Sort and normalize order after insertion.
       */

      settings.taskStatuses.sort(
        (a, b) =>
          Number(a.order) -
          Number(b.order)
      );

      settings.taskStatuses.forEach(
        (item, index) => {
          item.order =
            index + 1;
        }
      );

      await saveSettings(
        settings,
        req
      );

      const createdStatus =
        settings.taskStatuses.find(
          (item) =>
            String(
              item.name
            ).toLowerCase() ===
            normalizedName.toLowerCase()
        );

      return res.status(201).json({
        success: true,

        message:
          "Task status created successfully.",

        data:
          createdStatus,

        all:
          settings.taskStatuses,
      });
    } catch (error) {
      console.error(
        "Create task status error:",
        error
      );

      const validationResponse =
        sendValidationError(
          res,
          error
        );

      if (
        validationResponse
      ) {
        return validationResponse;
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to create task status.",
      });
    }
  }
);

/* =====================================================
   REORDER TASK STATUSES
   IMPORTANT: KEEP BEFORE /task-statuses/:id
   PUT /api/settings/task-statuses/reorder
===================================================== */

router.put(
  "/task-statuses/reorder",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const ids =
        Array.isArray(
          req.body?.ids
        )
          ? req.body.ids.map(
              String
            )
          : [];

      if (
        ids.length !==
        settings.taskStatuses
          .length
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Provide every task status ID exactly once in the required order.",
        });
      }

      if (
        ids.some(
          (id) =>
            !isValidObjectId(
              id
            )
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "One or more task status IDs are invalid.",
        });
      }

      const uniqueIds =
        new Set(ids);

      if (
        uniqueIds.size !==
        ids.length
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Duplicate task status IDs are not allowed.",
        });
      }

      const currentStatusMap =
        new Map(
          settings.taskStatuses.map(
            (item) => [
              String(
                item._id
              ),
              item,
            ]
          )
        );

      const missingId =
        ids.find(
          (id) =>
            !currentStatusMap.has(
              id
            )
        );

      if (missingId) {
        return res.status(400).json({
          success: false,

          message:
            "One or more task status IDs do not exist.",
        });
      }

      const {
        userId,
        userName,
      } = userAudit(req);

      /*
       * Do not replace the Mongoose document array with plain objects.
       * Sort the existing embedded documents instead.
       */

      const reorderedStatuses =
        ids.map(
          (id, index) => {
            const item =
              currentStatusMap.get(
                id
              );

            item.order =
              index + 1;

            item.updatedBy =
              userId;

            item.updatedByName =
              userName;

            return item;
          }
        );

      settings.taskStatuses.splice(
        0,
        settings.taskStatuses
          .length,
        ...reorderedStatuses
      );

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Task statuses reordered successfully.",

        data:
          settings.taskStatuses,
      });
    } catch (error) {
      console.error(
        "Reorder task statuses error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to reorder task statuses.",
      });
    }
  }
);

/* =====================================================
   GET SINGLE TASK STATUS
   GET /api/settings/task-statuses/:id
===================================================== */

router.get(
  "/task-statuses/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const taskStatus =
        findSubDocument(
          settings.taskStatuses,
          req.params.id
        );

      if (!taskStatus) {
        return res.status(404).json({
          success: false,

          message:
            "Task status not found.",
        });
      }

      return res.status(200).json({
        success: true,

        data:
          taskStatus,
      });
    } catch (error) {
      console.error(
        "Load task status error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load task status.",
      });
    }
  }
);

/* =====================================================
   UPDATE TASK STATUS
   PUT /api/settings/task-statuses/:id
===================================================== */

router.put(
  "/task-statuses/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const taskStatus =
        findSubDocument(
          settings.taskStatuses,
          req.params.id
        );

      if (!taskStatus) {
        return res.status(404).json({
          success: false,

          message:
            "Task status not found.",
        });
      }

      const {
        name,
        description,
        color,
        order,
        isFinal,
        status,
      } = req.body || {};

      const normalizedName =
        cleanString(
          name,
          taskStatus.name
        );

      if (!normalizedName) {
        return res.status(400).json({
          success: false,

          message:
            "Task status name is required.",
        });
      }

      const duplicateStatus =
        settings.taskStatuses.some(
          (item) =>
            String(
              item._id
            ) !==
              String(
                taskStatus._id
              ) &&
            String(
              item.name
            )
              .trim()
              .toLowerCase() ===
              normalizedName.toLowerCase()
        );

      if (duplicateStatus) {
        return res.status(409).json({
          success: false,

          message:
            "Task status name already exists.",
        });
      }

      if (
        status !== undefined &&
        !ACTIVE_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Task status must be Active or Inactive.",
        });
      }

      if (
        color !== undefined &&
        !SETTING_COLORS.includes(
          color
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid task status color.",
        });
      }

      const {
        userId,
        userName,
      } = userAudit(req);

      taskStatus.name =
        normalizedName;

      taskStatus.description =
        cleanString(
          description,
          taskStatus.description
        );

      if (
        color !== undefined
      ) {
        taskStatus.color =
          color;
      }

      if (
        order !== undefined
      ) {
        taskStatus.order =
          Math.max(
            cleanNumber(
              order,
              taskStatus.order
            ),
            1
          );
      }

      if (
        isFinal !== undefined
      ) {
        taskStatus.isFinal =
          cleanBoolean(
            isFinal,
            taskStatus.isFinal
          );
      }

      if (
        status !== undefined
      ) {
        taskStatus.status =
          status;
      }

      taskStatus.updatedBy =
        userId;

      taskStatus.updatedByName =
        userName;

      settings.taskStatuses.sort(
        (a, b) =>
          Number(a.order) -
          Number(b.order)
      );

      settings.taskStatuses.forEach(
        (item, index) => {
          item.order =
            index + 1;
        }
      );

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Task status updated successfully.",

        data:
          taskStatus,

        all:
          settings.taskStatuses,
      });
    } catch (error) {
      console.error(
        "Update task status error:",
        error
      );

      const validationResponse =
        sendValidationError(
          res,
          error
        );

      if (
        validationResponse
      ) {
        return validationResponse;
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update task status.",
      });
    }
  }
);

/* =====================================================
   UPDATE TASK STATUS STATE
   PATCH /api/settings/task-statuses/:id/status
===================================================== */

router.patch(
  "/task-statuses/:id/status",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const taskStatus =
        findSubDocument(
          settings.taskStatuses,
          req.params.id
        );

      if (!taskStatus) {
        return res.status(404).json({
          success: false,

          message:
            "Task status not found.",
        });
      }

      const normalizedStatus =
        cleanString(
          req.body?.status
        );

      if (
        !ACTIVE_STATUSES.includes(
          normalizedStatus
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Status must be Active or Inactive.",
        });
      }

      const {
        userId,
        userName,
      } = userAudit(req);

      taskStatus.status =
        normalizedStatus;

      taskStatus.updatedBy =
        userId;

      taskStatus.updatedByName =
        userName;

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          `Task status marked as ${normalizedStatus}.`,

        data:
          taskStatus,
      });
    } catch (error) {
      console.error(
        "Update task status state error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update task status.",
      });
    }
  }
);

/* =====================================================
   DELETE TASK STATUS
   DELETE /api/settings/task-statuses/:id
===================================================== */

router.delete(
  "/task-statuses/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const taskStatus =
        findSubDocument(
          settings.taskStatuses,
          req.params.id
        );

      if (!taskStatus) {
        return res.status(404).json({
          success: false,

          message:
            "Task status not found.",
        });
      }

      if (
        taskStatus.isSystem
      ) {
        return res.status(409).json({
          success: false,

          message:
            "System task statuses cannot be deleted. Mark them inactive instead.",
        });
      }

      const deletedStatus = {
        id:
          taskStatus._id,

        name:
          taskStatus.name,
      };

      taskStatus.deleteOne();

      settings.taskStatuses.sort(
        (a, b) =>
          Number(a.order) -
          Number(b.order)
      );

      settings.taskStatuses.forEach(
        (item, index) => {
          item.order =
            index + 1;
        }
      );

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Task status deleted successfully.",

        data:
          deletedStatus,

        all:
          settings.taskStatuses,
      });
    } catch (error) {
      console.error(
        "Delete task status error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to delete task status.",
      });
    }
  }
);

/* =====================================================
   PRIORITIES
===================================================== */

/* =====================================================
   GET ALL PRIORITIES
   GET /api/settings/priorities
===================================================== */

router.get(
  "/priorities",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      return res.status(200).json({
        success: true,

        count:
          settings.priorities
            .length,

        colors:
          SETTING_COLORS,

        data:
          settings.priorities,
      });
    } catch (error) {
      console.error(
        "Load priorities error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load priorities.",
      });
    }
  }
);

/* =====================================================
   GET SINGLE PRIORITY
   GET /api/settings/priorities/:id
===================================================== */

router.get(
  "/priorities/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const priority =
        findSubDocument(
          settings.priorities,
          req.params.id
        );

      if (!priority) {
        return res.status(404).json({
          success: false,

          message:
            "Priority not found.",
        });
      }

      return res.status(200).json({
        success: true,

        data:
          priority,
      });
    } catch (error) {
      console.error(
        "Load priority error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load priority.",
      });
    }
  }
);

/* =====================================================
   CREATE PRIORITY
   POST /api/settings/priorities
===================================================== */

router.post(
  "/priorities",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const {
        name,
        responseHours,
        color,
        status,
      } = req.body || {};

      const normalizedName =
        cleanString(name);

      if (!normalizedName) {
        return res.status(400).json({
          success: false,

          message:
            "Priority name is required.",
        });
      }

      const duplicatePriority =
        settings.priorities.some(
          (item) =>
            String(
              item.name
            )
              .trim()
              .toLowerCase() ===
            normalizedName.toLowerCase()
        );

      if (
        duplicatePriority
      ) {
        return res.status(409).json({
          success: false,

          message:
            "Priority name already exists.",
        });
      }

      const normalizedResponseHours =
        cleanNumber(
          responseHours,
          8
        );

      if (
        normalizedResponseHours <
          0 ||
        normalizedResponseHours >
          8760
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Response hours must be between 0 and 8760.",
        });
      }

      const {
        userId,
        userName,
      } = userAudit(req);

      settings.priorities.push({
        name:
          normalizedName,

        responseHours:
          normalizedResponseHours,

        color:
          SETTING_COLORS.includes(
            color
          )
            ? color
            : "Slate",

        status:
          ACTIVE_STATUSES.includes(
            status
          )
            ? status
            : "Active",

        isSystem:
          false,

        createdBy:
          userId,

        createdByName:
          userName,

        updatedBy:
          userId,

        updatedByName:
          userName,
      });

      await saveSettings(
        settings,
        req
      );

      const createdPriority =
        settings.priorities[
          settings.priorities
            .length - 1
        ];

      return res.status(201).json({
        success: true,

        message:
          "Priority created successfully.",

        data:
          createdPriority,
      });
    } catch (error) {
      console.error(
        "Create priority error:",
        error
      );

      const validationResponse =
        sendValidationError(
          res,
          error
        );

      if (
        validationResponse
      ) {
        return validationResponse;
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to create priority.",
      });
    }
  }
);

/* =====================================================
   UPDATE PRIORITY
   PUT /api/settings/priorities/:id
===================================================== */

router.put(
  "/priorities/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const priority =
        findSubDocument(
          settings.priorities,
          req.params.id
        );

      if (!priority) {
        return res.status(404).json({
          success: false,

          message:
            "Priority not found.",
        });
      }

      const {
        name,
        responseHours,
        color,
        status,
      } = req.body || {};

      const normalizedName =
        cleanString(
          name,
          priority.name
        );

      if (!normalizedName) {
        return res.status(400).json({
          success: false,

          message:
            "Priority name is required.",
        });
      }

      const duplicatePriority =
        settings.priorities.some(
          (item) =>
            String(
              item._id
            ) !==
              String(
                priority._id
              ) &&
            String(
              item.name
            )
              .trim()
              .toLowerCase() ===
              normalizedName.toLowerCase()
        );

      if (
        duplicatePriority
      ) {
        return res.status(409).json({
          success: false,

          message:
            "Priority name already exists.",
        });
      }

      const normalizedResponseHours =
        cleanNumber(
          responseHours,
          priority.responseHours
        );

      if (
        normalizedResponseHours <
          0 ||
        normalizedResponseHours >
          8760
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Response hours must be between 0 and 8760.",
        });
      }

      if (
        color !== undefined &&
        !SETTING_COLORS.includes(
          color
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid priority color.",
        });
      }

      if (
        status !== undefined &&
        !ACTIVE_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Priority status must be Active or Inactive.",
        });
      }

      const {
        userId,
        userName,
      } = userAudit(req);

      priority.name =
        normalizedName;

      priority.responseHours =
        normalizedResponseHours;

      if (
        color !== undefined
      ) {
        priority.color =
          color;
      }

      if (
        status !== undefined
      ) {
        priority.status =
          status;
      }

      priority.updatedBy =
        userId;

      priority.updatedByName =
        userName;

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Priority updated successfully.",

        data:
          priority,
      });
    } catch (error) {
      console.error(
        "Update priority error:",
        error
      );

      const validationResponse =
        sendValidationError(
          res,
          error
        );

      if (
        validationResponse
      ) {
        return validationResponse;
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update priority.",
      });
    }
  }
);

/* =====================================================
   UPDATE PRIORITY STATUS
   PATCH /api/settings/priorities/:id/status
===================================================== */

router.patch(
  "/priorities/:id/status",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const priority =
        findSubDocument(
          settings.priorities,
          req.params.id
        );

      if (!priority) {
        return res.status(404).json({
          success: false,

          message:
            "Priority not found.",
        });
      }

      const normalizedStatus =
        cleanString(
          req.body?.status
        );

      if (
        !ACTIVE_STATUSES.includes(
          normalizedStatus
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Status must be Active or Inactive.",
        });
      }

      const {
        userId,
        userName,
      } = userAudit(req);

      priority.status =
        normalizedStatus;

      priority.updatedBy =
        userId;

      priority.updatedByName =
        userName;

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          `Priority marked as ${normalizedStatus}.`,

        data:
          priority,
      });
    } catch (error) {
      console.error(
        "Update priority status error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update priority status.",
      });
    }
  }
);

/* =====================================================
   DELETE PRIORITY
   DELETE /api/settings/priorities/:id
===================================================== */

router.delete(
  "/priorities/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const priority =
        findSubDocument(
          settings.priorities,
          req.params.id
        );

      if (!priority) {
        return res.status(404).json({
          success: false,

          message:
            "Priority not found.",
        });
      }

      if (
        priority.isSystem
      ) {
        return res.status(409).json({
          success: false,

          message:
            "System priorities cannot be deleted. Mark them inactive instead.",
        });
      }

      const deletedPriority = {
        id:
          priority._id,

        name:
          priority.name,
      };

      priority.deleteOne();

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Priority deleted successfully.",

        data:
          deletedPriority,
      });
    } catch (error) {
      console.error(
        "Delete priority error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to delete priority.",
      });
    }
  }
);

/* =====================================================
   WORKING HOURS
===================================================== */

/* =====================================================
   GET WORKING HOURS
   GET /api/settings/working-hours
===================================================== */

router.get(
  "/working-hours",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      return res.status(200).json({
        success: true,

        days:
          WEEK_DAYS,

        data:
          settings.workingHours,
      });
    } catch (error) {
      console.error(
        "Load working hours error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load working hours.",
      });
    }
  }
);

/* =====================================================
   UPDATE WORKING HOURS
   PUT /api/settings/working-hours
===================================================== */

router.put(
  "/working-hours",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const current =
        settings.workingHours ||
        {};

      const body =
        req.body || {};

      const officeStartTime =
        cleanString(
          body.officeStartTime,
          current.officeStartTime
        );

      const officeEndTime =
        cleanString(
          body.officeEndTime,
          current.officeEndTime
        );

      const absentMarkTime =
        cleanString(
          body.absentMarkTime,
          current.absentMarkTime
        );

      if (
        !validTime(
          officeStartTime
        ) ||
        !validTime(
          officeEndTime
        ) ||
        !validTime(
          absentMarkTime
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Office and absent-mark times must use HH:mm format.",
        });
      }

      if (
        officeStartTime >=
        officeEndTime
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Office end time must be later than office start time.",
        });
      }

      const lateAfterMinutes =
        cleanNumber(
          body.lateAfterMinutes,
          current.lateAfterMinutes
        );

      const fullDayHours =
        cleanNumber(
          body.fullDayHours,
          current.fullDayHours
        );

      const halfDayHours =
        cleanNumber(
          body.halfDayHours,
          current.halfDayHours
        );

      const defaultBreakMinutes =
        cleanNumber(
          body.defaultBreakMinutes,
          current.defaultBreakMinutes
        );

      if (
        lateAfterMinutes < 0 ||
        lateAfterMinutes > 1440
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Late-after minutes must be between 0 and 1440.",
        });
      }

      if (
        fullDayHours <= 0 ||
        fullDayHours > 24
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Full-day hours must be between 0 and 24.",
        });
      }

      if (
        halfDayHours <= 0 ||
        halfDayHours > 24
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Half-day hours must be between 0 and 24.",
        });
      }

      if (
        halfDayHours >
        fullDayHours
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Half-day hours cannot exceed full-day hours.",
        });
      }

      if (
        defaultBreakMinutes <
          0 ||
        defaultBreakMinutes >
          1440
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Default break minutes must be between 0 and 1440.",
        });
      }

      let weeklyOff =
        current.weeklyOff ||
        [];

      if (
        body.weeklyOff !==
        undefined
      ) {
        if (
          !Array.isArray(
            body.weeklyOff
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Weekly off must be an array of day names.",
          });
        }

        const invalidDay =
          body.weeklyOff.find(
            (day) =>
              !WEEK_DAYS.includes(
                day
              )
          );

        if (invalidDay) {
          return res.status(400).json({
            success: false,

            message:
              `${invalidDay} is not a valid week day.`,
          });
        }

        weeklyOff = [
          ...new Set(
            body.weeklyOff
          ),
        ];
      }

      settings.workingHours = {
        officeStartTime,

        officeEndTime,

        lateAfterMinutes,

        fullDayHours,

        halfDayHours,

        defaultBreakMinutes,

        weeklyOff,

        autoMarkAbsent:
          cleanBoolean(
            body.autoMarkAbsent,
            current.autoMarkAbsent
          ),

        absentMarkTime,

        allowManualCorrection:
          cleanBoolean(
            body.allowManualCorrection,
            current.allowManualCorrection
          ),
      };

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Working hours updated successfully.",

        data:
          settings.workingHours,
      });
    } catch (error) {
      console.error(
        "Update working hours error:",
        error
      );

      const validationResponse =
        sendValidationError(
          res,
          error
        );

      if (
        validationResponse
      ) {
        return validationResponse;
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update working hours.",
      });
    }
  }
);

/* =====================================================
   LEAVE TYPES
===================================================== */

/* =====================================================
   GET ALL LEAVE TYPES
   GET /api/settings/leave-types
===================================================== */

router.get(
  "/leave-types",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      return res.status(200).json({
        success: true,

        count:
          settings.leaveTypes
            .length,

        data:
          settings.leaveTypes,
      });
    } catch (error) {
      console.error(
        "Load leave types error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load leave types.",
      });
    }
  }
);

/* =====================================================
   GET SINGLE LEAVE TYPE
   GET /api/settings/leave-types/:id
===================================================== */

router.get(
  "/leave-types/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const leaveType =
        findSubDocument(
          settings.leaveTypes,
          req.params.id
        );

      if (!leaveType) {
        return res.status(404).json({
          success: false,

          message:
            "Leave type not found.",
        });
      }

      return res.status(200).json({
        success: true,

        data:
          leaveType,
      });
    } catch (error) {
      console.error(
        "Load leave type error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load leave type.",
      });
    }
  }
);

/* =====================================================
   CREATE LEAVE TYPE
   POST /api/settings/leave-types
===================================================== */

router.post(
  "/leave-types",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const {
        name,
        code,
        yearlyLimit,
        paid,
        carryForward,
        requiresDocument,
        status,
      } = req.body || {};

      const normalizedName =
        cleanString(name);

      const normalizedCode =
        cleanString(code)
          .toUpperCase();

      if (!normalizedName) {
        return res.status(400).json({
          success: false,

          message:
            "Leave type name is required.",
        });
      }

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,

          message:
            "Leave type code is required.",
        });
      }

      if (
        normalizedName.length >
        80
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Leave type name cannot exceed 80 characters.",
        });
      }

      if (
        normalizedCode.length >
        15
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Leave type code cannot exceed 15 characters.",
        });
      }

      if (
        !/^[A-Z0-9_-]+$/.test(
          normalizedCode
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Leave type code can contain only letters, numbers, underscore and hyphen.",
        });
      }

      const duplicateName =
        settings.leaveTypes.some(
          (item) =>
            String(
              item.name
            )
              .trim()
              .toLowerCase() ===
            normalizedName.toLowerCase()
        );

      if (duplicateName) {
        return res.status(409).json({
          success: false,

          message:
            "Leave type name already exists.",
        });
      }

      const duplicateCode =
        settings.leaveTypes.some(
          (item) =>
            String(
              item.code
            )
              .trim()
              .toUpperCase() ===
            normalizedCode
        );

      if (duplicateCode) {
        return res.status(409).json({
          success: false,

          message:
            "Leave type code already exists.",
        });
      }

      const normalizedYearlyLimit =
        cleanNumber(
          yearlyLimit,
          0
        );

      if (
        normalizedYearlyLimit <
          0 ||
        normalizedYearlyLimit >
          366
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Yearly leave limit must be between 0 and 366.",
        });
      }

      const normalizedStatus =
        ACTIVE_STATUSES.includes(
          status
        )
          ? status
          : "Active";

      const {
        userId,
        userName,
      } = userAudit(req);

      settings.leaveTypes.push({
        name:
          normalizedName,

        code:
          normalizedCode,

        yearlyLimit:
          normalizedYearlyLimit,

        paid:
          cleanBoolean(
            paid,
            true
          ),

        carryForward:
          cleanBoolean(
            carryForward,
            false
          ),

        requiresDocument:
          cleanBoolean(
            requiresDocument,
            false
          ),

        status:
          normalizedStatus,

        isSystem:
          false,

        createdBy:
          userId,

        createdByName:
          userName,

        updatedBy:
          userId,

        updatedByName:
          userName,
      });

      await saveSettings(
        settings,
        req
      );

      const createdLeaveType =
        settings.leaveTypes[
          settings.leaveTypes
            .length - 1
        ];

      return res.status(201).json({
        success: true,

        message:
          "Leave type created successfully.",

        data:
          createdLeaveType,
      });
    } catch (error) {
      console.error(
        "Create leave type error:",
        error
      );

      const validationResponse =
        sendValidationError(
          res,
          error
        );

      if (
        validationResponse
      ) {
        return validationResponse;
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to create leave type.",
      });
    }
  }
);

/* =====================================================
   UPDATE LEAVE TYPE
   PUT /api/settings/leave-types/:id
===================================================== */

router.put(
  "/leave-types/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const leaveType =
        findSubDocument(
          settings.leaveTypes,
          req.params.id
        );

      if (!leaveType) {
        return res.status(404).json({
          success: false,

          message:
            "Leave type not found.",
        });
      }

      const {
        name,
        code,
        yearlyLimit,
        paid,
        carryForward,
        requiresDocument,
        status,
      } = req.body || {};

      const normalizedName =
        cleanString(
          name,
          leaveType.name
        );

      const normalizedCode =
        cleanString(
          code,
          leaveType.code
        ).toUpperCase();

      if (!normalizedName) {
        return res.status(400).json({
          success: false,

          message:
            "Leave type name is required.",
        });
      }

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,

          message:
            "Leave type code is required.",
        });
      }

      if (
        !/^[A-Z0-9_-]+$/.test(
          normalizedCode
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Leave type code can contain only letters, numbers, underscore and hyphen.",
        });
      }

      const duplicateName =
        settings.leaveTypes.some(
          (item) =>
            String(
              item._id
            ) !==
              String(
                leaveType._id
              ) &&
            String(
              item.name
            )
              .trim()
              .toLowerCase() ===
              normalizedName.toLowerCase()
        );

      if (duplicateName) {
        return res.status(409).json({
          success: false,

          message:
            "Leave type name already exists.",
        });
      }

      const duplicateCode =
        settings.leaveTypes.some(
          (item) =>
            String(
              item._id
            ) !==
              String(
                leaveType._id
              ) &&
            String(
              item.code
            )
              .trim()
              .toUpperCase() ===
              normalizedCode
        );

      if (duplicateCode) {
        return res.status(409).json({
          success: false,

          message:
            "Leave type code already exists.",
        });
      }

      const normalizedYearlyLimit =
        cleanNumber(
          yearlyLimit,
          leaveType.yearlyLimit
        );

      if (
        normalizedYearlyLimit <
          0 ||
        normalizedYearlyLimit >
          366
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Yearly leave limit must be between 0 and 366.",
        });
      }

      if (
        status !== undefined &&
        !ACTIVE_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Leave type status must be Active or Inactive.",
        });
      }

      const {
        userId,
        userName,
      } = userAudit(req);

      leaveType.name =
        normalizedName;

      leaveType.code =
        normalizedCode;

      leaveType.yearlyLimit =
        normalizedYearlyLimit;

      if (
        paid !== undefined
      ) {
        leaveType.paid =
          cleanBoolean(
            paid,
            leaveType.paid
          );
      }

      if (
        carryForward !==
        undefined
      ) {
        leaveType.carryForward =
          cleanBoolean(
            carryForward,
            leaveType.carryForward
          );
      }

      if (
        requiresDocument !==
        undefined
      ) {
        leaveType.requiresDocument =
          cleanBoolean(
            requiresDocument,
            leaveType.requiresDocument
          );
      }

      if (
        status !== undefined
      ) {
        leaveType.status =
          status;
      }

      leaveType.updatedBy =
        userId;

      leaveType.updatedByName =
        userName;

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Leave type updated successfully.",

        data:
          leaveType,
      });
    } catch (error) {
      console.error(
        "Update leave type error:",
        error
      );

      const validationResponse =
        sendValidationError(
          res,
          error
        );

      if (
        validationResponse
      ) {
        return validationResponse;
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update leave type.",
      });
    }
  }
);

/* =====================================================
   UPDATE LEAVE TYPE STATUS
   PATCH /api/settings/leave-types/:id/status
===================================================== */

router.patch(
  "/leave-types/:id/status",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const leaveType =
        findSubDocument(
          settings.leaveTypes,
          req.params.id
        );

      if (!leaveType) {
        return res.status(404).json({
          success: false,

          message:
            "Leave type not found.",
        });
      }

      const normalizedStatus =
        cleanString(
          req.body?.status
        );

      if (
        !ACTIVE_STATUSES.includes(
          normalizedStatus
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Status must be Active or Inactive.",
        });
      }

      const {
        userId,
        userName,
      } = userAudit(req);

      leaveType.status =
        normalizedStatus;

      leaveType.updatedBy =
        userId;

      leaveType.updatedByName =
        userName;

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          `Leave type marked as ${normalizedStatus}.`,

        data:
          leaveType,
      });
    } catch (error) {
      console.error(
        "Update leave type status error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update leave type status.",
      });
    }
  }
);

/* =====================================================
   DELETE LEAVE TYPE
   DELETE /api/settings/leave-types/:id
===================================================== */

router.delete(
  "/leave-types/:id",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const leaveType =
        findSubDocument(
          settings.leaveTypes,
          req.params.id
        );

      if (!leaveType) {
        return res.status(404).json({
          success: false,

          message:
            "Leave type not found.",
        });
      }

      if (
        leaveType.isSystem
      ) {
        return res.status(409).json({
          success: false,

          message:
            "System leave types cannot be deleted. Mark them inactive instead.",
        });
      }

      const deletedLeaveType = {
        id:
          leaveType._id,

        name:
          leaveType.name,

        code:
          leaveType.code,
      };

      leaveType.deleteOne();

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Leave type deleted successfully.",

        data:
          deletedLeaveType,
      });
    } catch (error) {
      console.error(
        "Delete leave type error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to delete leave type.",
      });
    }
  }
);

/* =====================================================
   NOTIFICATION SETTINGS
===================================================== */

const NOTIFICATION_EVENT_KEYS = [
  "newTicket",
  "taskAssigned",
  "taskOverdue",
  "leaveRequest",
  "amcDue",
  "employeeLate",
];

function normalizeNotificationChannel(
  incoming,
  current
) {
  const source =
    incoming &&
    typeof incoming ===
      "object"
      ? incoming
      : {};

  const existing =
    current &&
    typeof current ===
      "object"
      ? current
      : {};

  return {
    inApp:
      cleanBoolean(
        source.inApp,
        existing.inApp ?? true
      ),

    email:
      cleanBoolean(
        source.email,
        existing.email ?? false
      ),

    mobile:
      cleanBoolean(
        source.mobile,
        existing.mobile ?? false
      ),
  };
}

/* =====================================================
   GET NOTIFICATION SETTINGS
   GET /api/settings/notifications
===================================================== */

router.get(
  "/notifications",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      return res.status(200).json({
        success: true,

        events:
          NOTIFICATION_EVENT_KEYS,

        data:
          settings.notifications,
      });
    } catch (error) {
      console.error(
        "Load notification settings error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load notification settings.",
      });
    }
  }
);

/* =====================================================
   UPDATE NOTIFICATION SETTINGS
   PUT /api/settings/notifications
===================================================== */

router.put(
  "/notifications",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const body =
        req.body || {};

      const current =
        settings.notifications ||
        {};

      const amcReminderDays =
        cleanNumber(
          body.amcReminderDays,
          current.amcReminderDays
        );

      const taskDueReminderHours =
        cleanNumber(
          body.taskDueReminderHours,
          current.taskDueReminderHours
        );

      const dailySummaryTime =
        cleanString(
          body.dailySummaryTime,
          current.dailySummaryTime ||
            "18:30"
        );

      if (
        amcReminderDays < 0 ||
        amcReminderDays > 365
      ) {
        return res.status(400).json({
          success: false,

          message:
            "AMC reminder days must be between 0 and 365.",
        });
      }

      if (
        taskDueReminderHours <
          0 ||
        taskDueReminderHours >
          8760
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Task due reminder hours must be between 0 and 8760.",
        });
      }

      if (
        !validTime(
          dailySummaryTime
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Daily summary time must use HH:mm format.",
        });
      }

      const updatedNotifications = {
        newTicket:
          normalizeNotificationChannel(
            body.newTicket,
            current.newTicket
          ),

        taskAssigned:
          normalizeNotificationChannel(
            body.taskAssigned,
            current.taskAssigned
          ),

        taskOverdue:
          normalizeNotificationChannel(
            body.taskOverdue,
            current.taskOverdue
          ),

        leaveRequest:
          normalizeNotificationChannel(
            body.leaveRequest,
            current.leaveRequest
          ),

        amcDue:
          normalizeNotificationChannel(
            body.amcDue,
            current.amcDue
          ),

        employeeLate:
          normalizeNotificationChannel(
            body.employeeLate,
            current.employeeLate
          ),

        amcReminderDays,

        taskDueReminderHours,

        dailySummaryEnabled:
          cleanBoolean(
            body.dailySummaryEnabled,
            current.dailySummaryEnabled
          ),

        dailySummaryTime,
      };

      settings.notifications =
        updatedNotifications;

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "Notification settings updated successfully.",

        data:
          settings.notifications,
      });
    } catch (error) {
      console.error(
        "Update notification settings error:",
        error
      );

      const validationResponse =
        sendValidationError(
          res,
          error
        );

      if (
        validationResponse
      ) {
        return validationResponse;
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update notification settings.",
      });
    }
  }
);

/* =====================================================
   BULK UPDATE COMPLETE SETTINGS
   PUT /api/settings
===================================================== */

router.put(
  "/",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      const body =
        req.body || {};

      /*
       * This route updates supported top-level settings
       * in one request.
       *
       * Product and Project settings are not handled here
       * because they already use their separate collections/APIs.
       */

      if (
        body.company &&
        typeof body.company ===
          "object"
      ) {
        const currentCompany =
          settings.company || {};

        const normalizedEmail =
          cleanString(
            body.company.email,
            currentCompany.email
          ).toLowerCase();

        if (
          normalizedEmail &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            normalizedEmail
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Enter a valid company email address.",
          });
        }

        const normalizedDateFormat =
          cleanString(
            body.company.dateFormat,
            currentCompany.dateFormat
          );

        if (
          normalizedDateFormat &&
          !DATE_FORMATS.includes(
            normalizedDateFormat
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Invalid company date format.",
          });
        }

        settings.company = {
          companyName:
            cleanString(
              body.company.companyName,
              currentCompany.companyName
            ),

          workspaceName:
            cleanString(
              body.company.workspaceName,
              currentCompany.workspaceName
            ),

          ownerName:
            cleanString(
              body.company.ownerName,
              currentCompany.ownerName
            ),

          email:
            normalizedEmail,

          mobile:
            cleanString(
              body.company.mobile,
              currentCompany.mobile
            ),

          gstNo:
            cleanString(
              body.company.gstNo,
              currentCompany.gstNo
            ).toUpperCase(),

          address:
            cleanString(
              body.company.address,
              currentCompany.address
            ),

          city:
            cleanString(
              body.company.city,
              currentCompany.city
            ),

          state:
            cleanString(
              body.company.state,
              currentCompany.state
            ),

          country:
            cleanString(
              body.company.country,
              currentCompany.country ||
                "India"
            ),

          financialYearStart:
            cleanString(
              body.company.financialYearStart,
              currentCompany.financialYearStart ||
                "04"
            ),

          dateFormat:
            normalizedDateFormat ||
            "DD/MM/YYYY",

          timezone:
            cleanString(
              body.company.timezone,
              currentCompany.timezone ||
                "Asia/Kolkata"
            ),
        };
      }

      if (
        body.workingHours &&
        typeof body.workingHours ===
          "object"
      ) {
        const currentWorkingHours =
          settings.workingHours ||
          {};

        const incomingWorkingHours =
          body.workingHours;

        const startTime =
          cleanString(
            incomingWorkingHours.officeStartTime,
            currentWorkingHours.officeStartTime
          );

        const endTime =
          cleanString(
            incomingWorkingHours.officeEndTime,
            currentWorkingHours.officeEndTime
          );

        const absentTime =
          cleanString(
            incomingWorkingHours.absentMarkTime,
            currentWorkingHours.absentMarkTime
          );

        if (
          !validTime(startTime) ||
          !validTime(endTime) ||
          !validTime(absentTime)
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Working-hour times must use HH:mm format.",
          });
        }

        if (
          startTime >= endTime
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Office end time must be later than office start time.",
          });
        }

        const weeklyOff =
          Array.isArray(
            incomingWorkingHours.weeklyOff
          )
            ? [
                ...new Set(
                  incomingWorkingHours.weeklyOff
                ),
              ]
            : currentWorkingHours.weeklyOff;

        const invalidWeeklyOff =
          weeklyOff.find(
            (day) =>
              !WEEK_DAYS.includes(
                day
              )
          );

        if (invalidWeeklyOff) {
          return res.status(400).json({
            success: false,

            message:
              `${invalidWeeklyOff} is not a valid weekly-off day.`,
          });
        }

        settings.workingHours = {
          officeStartTime:
            startTime,

          officeEndTime:
            endTime,

          lateAfterMinutes:
            cleanNumber(
              incomingWorkingHours.lateAfterMinutes,
              currentWorkingHours.lateAfterMinutes
            ),

          fullDayHours:
            cleanNumber(
              incomingWorkingHours.fullDayHours,
              currentWorkingHours.fullDayHours
            ),

          halfDayHours:
            cleanNumber(
              incomingWorkingHours.halfDayHours,
              currentWorkingHours.halfDayHours
            ),

          defaultBreakMinutes:
            cleanNumber(
              incomingWorkingHours.defaultBreakMinutes,
              currentWorkingHours.defaultBreakMinutes
            ),

          weeklyOff,

          autoMarkAbsent:
            cleanBoolean(
              incomingWorkingHours.autoMarkAbsent,
              currentWorkingHours.autoMarkAbsent
            ),

          absentMarkTime:
            absentTime,

          allowManualCorrection:
            cleanBoolean(
              incomingWorkingHours.allowManualCorrection,
              currentWorkingHours.allowManualCorrection
            ),
        };
      }

      if (
        body.notifications &&
        typeof body.notifications ===
          "object"
      ) {
        const currentNotifications =
          settings.notifications ||
          {};

        const incomingNotifications =
          body.notifications;

        const dailySummaryTime =
          cleanString(
            incomingNotifications.dailySummaryTime,
            currentNotifications.dailySummaryTime ||
              "18:30"
          );

        if (
          !validTime(
            dailySummaryTime
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Daily summary time must use HH:mm format.",
          });
        }

        settings.notifications = {
          newTicket:
            normalizeNotificationChannel(
              incomingNotifications.newTicket,
              currentNotifications.newTicket
            ),

          taskAssigned:
            normalizeNotificationChannel(
              incomingNotifications.taskAssigned,
              currentNotifications.taskAssigned
            ),

          taskOverdue:
            normalizeNotificationChannel(
              incomingNotifications.taskOverdue,
              currentNotifications.taskOverdue
            ),

          leaveRequest:
            normalizeNotificationChannel(
              incomingNotifications.leaveRequest,
              currentNotifications.leaveRequest
            ),

          amcDue:
            normalizeNotificationChannel(
              incomingNotifications.amcDue,
              currentNotifications.amcDue
            ),

          employeeLate:
            normalizeNotificationChannel(
              incomingNotifications.employeeLate,
              currentNotifications.employeeLate
            ),

          amcReminderDays:
            cleanNumber(
              incomingNotifications.amcReminderDays,
              currentNotifications.amcReminderDays
            ),

          taskDueReminderHours:
            cleanNumber(
              incomingNotifications.taskDueReminderHours,
              currentNotifications.taskDueReminderHours
            ),

          dailySummaryEnabled:
            cleanBoolean(
              incomingNotifications.dailySummaryEnabled,
              currentNotifications.dailySummaryEnabled
            ),

          dailySummaryTime,
        };
      }

      /*
       * Optional complete-array updates.
       * Use the individual CRUD routes for normal frontend operations.
       */

      if (
        Array.isArray(
          body.roles
        )
      ) {
        settings.roles =
          body.roles;
      }

      if (
        Array.isArray(
          body.taskStatuses
        )
      ) {
        settings.taskStatuses =
          body.taskStatuses;
      }

      if (
        Array.isArray(
          body.priorities
        )
      ) {
        settings.priorities =
          body.priorities;
      }

      if (
        Array.isArray(
          body.leaveTypes
        )
      ) {
        settings.leaveTypes =
          body.leaveTypes;
      }

      await saveSettings(
        settings,
        req
      );

      return res.status(200).json({
        success: true,

        message:
          "System settings updated successfully.",

        data:
          settings,
      });
    } catch (error) {
      console.error(
        "Bulk update settings error:",
        error
      );

      const validationResponse =
        sendValidationError(
          res,
          error
        );

      if (
        validationResponse
      ) {
        return validationResponse;
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update system settings.",
      });
    }
  }
);

/* =====================================================
   SETTINGS HEALTH CHECK
   GET /api/settings/health
===================================================== */

router.get(
  "/health",
  async (req, res) => {
    try {
      const settings =
        await getOrCreateSettings(
          req
        );

      return res.status(200).json({
        success: true,

        message:
          "Settings service is working.",

        data: {
          settingsId:
            settings._id,

          version:
            settings.version,

          updatedAt:
            settings.updatedAt,

          sections: {
            company:
              Boolean(
                settings.company
              ),

            roles:
              settings.roles
                .length,

            taskStatuses:
              settings
                .taskStatuses
                .length,

            priorities:
              settings.priorities
                .length,

            workingHours:
              Boolean(
                settings.workingHours
              ),

            leaveTypes:
              settings.leaveTypes
                .length,

            notifications:
              Boolean(
                settings.notifications
              ),
          },
        },
      });
    } catch (error) {
      console.error(
        "Settings health check error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Settings service is unavailable.",
      });
    }
  }
);

/* =====================================================
   ROUTE NOT FOUND HANDLER
===================================================== */

router.use(
  (req, res) => {
    return res.status(404).json({
      success: false,

      message:
        `Settings route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

/* =====================================================
   SETTINGS ROUTER ERROR HANDLER
===================================================== */

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Settings router unhandled error:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    if (
      error instanceof
      mongoose.Error.ValidationError
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Settings validation failed.",

        errors:
          Object.fromEntries(
            Object.entries(
              error.errors
            ).map(
              ([
                field,
                fieldError,
              ]) => [
                field,
                fieldError.message,
              ]
            )
          ),
      });
    }

    if (
      error?.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid settings record ID.",
      });
    }

    if (
      error?.code ===
      11000
    ) {
      return res.status(409).json({
        success: false,

        message:
          "Duplicate settings data already exists.",
      });
    }

    return res.status(
      error.statusCode ||
        500
    ).json({
      success: false,

      message:
        error.message ||
        "Internal settings server error.",
    });
  }
);

/* =====================================================
   EXPORT ROUTER
===================================================== */
module.exports = router;
module.exports.SystemSettings =
  SystemSettings;