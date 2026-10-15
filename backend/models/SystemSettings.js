"use strict";

const mongoose = require("mongoose");

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

module.exports =
  mongoose.models.SystemSettings ||
  mongoose.model(
    "SystemSettings",
    systemSettingsSchema
  );

