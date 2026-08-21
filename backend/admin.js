const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt =
  require("bcryptjs");
const crypto =
  require("crypto");
const authenticateUser = require("./authMiddleware");
const { User } = require("./auth");
const {
  SystemSettings,
} = require("./settings");
const AgentDailySummary = require("./agentSession");
const AgentDevice = require("./models/AgentDevice");

const SETTINGS_KEY =
  "system";
async function getSystemSettings() {
  const settings =
    await SystemSettings.findOne({
      settingsKey:
        SETTINGS_KEY,
    }).lean();

  if (!settings) {
    throw new Error(
      "System settings were not initialized."
    );
  }

  return settings;
}

async function getActivePriorities() {
  const settings =
    await getSystemSettings();

  return (
    settings.priorities || []
  )
    .filter(
      (item) =>
        item.status ===
        "Active"
    )
    .map((item) => ({
      id:
        item._id ||
        item.id,

      name:
        String(
          item.name || ""
        ).trim(),

      responseHours:
        Number(
          item.responseHours ||
          0
        ),

      color:
        item.color ||
        "Slate",
    }))
    .filter(
      (item) =>
        item.name
    );
}

async function getActiveTaskStatuses() {
  const settings =
    await getSystemSettings();

  return (
    settings.taskStatuses ||
    []
  )
    .filter(
      (item) =>
        item.status ===
        "Active"
    )
    .sort(
      (a, b) =>
        Number(a.order || 0) -
        Number(b.order || 0)
    )
    .map((item) => ({
      id:
        item._id ||
        item.id,

      name:
        String(
          item.name || ""
        ).trim(),

      order:
        Number(
          item.order || 0
        ),

      isFinal:
        Boolean(
          item.isFinal
        ),

      color:
        item.color ||
        "Slate",
    }))
    .filter(
      (item) =>
        item.name
    );
}

async function validatePriority(
  value
) {
  const normalizedValue =
    String(value || "").trim();

  const priorities =
    await getActivePriorities();

  const matched =
    priorities.find(
      (item) =>
        item.name.toLowerCase() ===
        normalizedValue.toLowerCase()
    );

  return matched || null;
}

async function validateTaskStatus(
  value
) {
  const normalizedValue =
    String(value || "").trim();

  const statuses =
    await getActiveTaskStatuses();

  const matched =
    statuses.find(
      (item) =>
        item.name.toLowerCase() ===
        normalizedValue.toLowerCase()
    );

  return matched || null;
}
const router = express.Router();
/* =====================================================
   SUPPORT TICKET FILE UPLOAD CONFIGURATION
===================================================== */

const ticketUploadDirectory = path.join(
  __dirname,
  "uploads",
  "tickets"
);

if (!fs.existsSync(ticketUploadDirectory)) {
  fs.mkdirSync(ticketUploadDirectory, {
    recursive: true,
  });
}

const allowedTicketFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
];

const ticketAttachmentStorage =
  multer.diskStorage({
    destination: (
      req,
      file,
      callback
    ) => {
      callback(
        null,
        ticketUploadDirectory
      );
    },

    filename: (
      req,
      file,
      callback
    ) => {
      const originalExtension =
        path.extname(
          file.originalname
        );

      const originalBaseName =
        path
          .basename(
            file.originalname,
            originalExtension
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .slice(0, 80);

      const uniqueName =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}-${originalBaseName}${originalExtension}`;

      callback(null, uniqueName);
    },
  });

const uploadTicketAttachment =
  multer({
    storage:
      ticketAttachmentStorage,

    limits: {
      fileSize:
        10 * 1024 * 1024,
    },

    fileFilter: (
      req,
      file,
      callback
    ) => {
      if (
        allowedTicketFileTypes.includes(
          file.mimetype
        )
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          "Unsupported file type. Upload an image, PDF, Word, Excel, text, CSV or ZIP file."
        )
      );
    },
  });

const taskUploadDirectory = path.join(__dirname, "uploads", "tasks");
if (!fs.existsSync(taskUploadDirectory)) fs.mkdirSync(taskUploadDirectory, { recursive: true });
const uploadTaskAttachment = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, taskUploadDirectory),
    filename: (req, file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => allowedTicketFileTypes.includes(file.mimetype)
    ? callback(null, true)
    : callback(new Error("Unsupported file type. Upload an image, PDF, Word, Excel, text, CSV or ZIP file.")),
});

/* =====================================================
   AMC DOCUMENT FILE UPLOAD CONFIGURATION
===================================================== */

const amcUploadDirectory = path.join(
  __dirname,
  "uploads",
  "amc"
);

if (!fs.existsSync(amcUploadDirectory)) {
  fs.mkdirSync(amcUploadDirectory, {
    recursive: true,
  });
}

const allowedAmcDocumentTypes = [
  "AMC Agreement",
  "Own Invoice / Bill",
  "Payment Receipt",
  "Quotation",
  "Purchase Order",
  "Other Document",
];

const allowedAmcFileTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const amcDocumentStorage =
  multer.diskStorage({
    destination: (
      req,
      file,
      callback
    ) => {
      callback(
        null,
        amcUploadDirectory
      );
    },

    filename: (
      req,
      file,
      callback
    ) => {
      const extension =
        path
          .extname(
            file.originalname || ""
          )
          .toLowerCase();

      const baseName =
        path
          .basename(
            file.originalname ||
              "document",
            extension
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .replace(
            /-+/g,
            "-"
          )
          .replace(
            /^-|-$/g,
            ""
          )
          .slice(
            0,
            80
          ) ||
        "document";

      const uniqueName =
        `${Date.now()}-${crypto
          .randomBytes(6)
          .toString(
            "hex"
          )}-${baseName}${extension}`;

      callback(
        null,
        uniqueName
      );
    },
  });

const uploadAmcDocument =
  multer({
    storage:
      amcDocumentStorage,

    limits: {
      fileSize:
        10 *
        1024 *
        1024,

      files:
        10,
    },

    fileFilter: (
      req,
      file,
      callback
    ) => {
      const extension =
        path
          .extname(
            file.originalname ||
              ""
          )
          .toLowerCase();

      const validExtension =
        [
          ".pdf",
          ".jpg",
          ".jpeg",
          ".png",
        ].includes(
          extension
        );

      if (
        allowedAmcFileTypes.includes(
          file.mimetype
        ) &&
        validExtension
      ) {
        callback(
          null,
          true
        );

        return;
      }

      callback(
        new Error(
          "Only PDF, JPG, JPEG and PNG files are allowed."
        )
      );
    },
  });

function deleteAmcFile(
  filePath
) {
  try {
    if (
      filePath &&
      fs.existsSync(
        filePath
      )
    ) {
      fs.unlinkSync(
        filePath
      );
    }
  } catch (error) {
    console.error(
      "Delete AMC file error:",
      error
    );
  }
}
router.use(authenticateUser);

router.use((req, res, next) => {
  if (req.user.role === "admin") return next();

  const taskMatch = req.path.match(/^\/task\/([a-fA-F0-9]{24})(\/(status|comment))?$/);
  const ticketAttachMatch = req.path.match(/^\/ticket\/[a-fA-F0-9]{24}\/attachment$/);

  const employeeAllowed =
    req.user.role === "employee" &&
    ((taskMatch &&
      ((req.method === "GET" && !taskMatch[2]) ||
        (req.method === "PATCH" && taskMatch[2] === "/status") ||
        (req.method === "POST" && taskMatch[2] === "/comment"))) ||
     (ticketAttachMatch && req.method === "POST"));

  if (employeeAllowed) return next();

  return res.status(403).json({
    success: false,
    message: "Admin access is required.",
  });
});
/* =====================================================
   AGENT DEVICE MANAGEMENT
   Admin only
===================================================== */

/*
 * GET /api/admin/agent-devices
 *
 * Returns registered Windows agent devices.
 *
 * Optional:
 * ?status=pending
 * ?status=approved
 */

router.get(
  "/agent-devices",
  async (req, res) => {
    try {
      const status =
        String(
          req.query.status || ""
        )
          .trim()
          .toLowerCase();

      const query = {};

      if (status === "pending") {
        query.isApproved = {
          $ne: true,
        };
      }

      if (status === "approved") {
        query.isApproved = true;
      }

      const devices =
        await AgentDevice.find(
          query
        )
          .sort({
            isApproved: 1,
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,

        count:
          devices.length,

        devices:
          devices.map(
            (device) => ({
              id:
                device._id,

              deviceId:
                device.deviceId,

              employeeCode:
                device.employeeCode,

              pcName:
                device.pcName ||
                "",

              deviceName:
                device.deviceName ||
                "",

              platform:
                device.platform ||
                "windows",

              appVersion:
                device.appVersion ||
                "",

              isActive:
                device.isActive !==
                false,

              isApproved:
                device.isApproved ===
                true,

              approvedAt:
                device.approvedAt ||
                null,

              approvedBy:
                device.approvedBy ||
                null,

              approvalNote:
                device.approvalNote ||
                "",

              lastSeen:
                device.lastSeen ||
                null,

              createdAt:
                device.createdAt ||
                null,

              updatedAt:
                device.updatedAt ||
                null,
            })
          ),
      });
    } catch (error) {
      console.error(
        "Agent device list error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load agent devices.",
      });
    }
  }
);


/*
 * PATCH /api/admin/agent-devices/:id/approve
 *
 * Approves a Windows PC as a trusted device.
 */

router.patch(
  "/agent-devices/:id/approve",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid device ID.",
        });
      }

      const device =
        await AgentDevice.findById(
          id
        );

      if (!device) {
        return res.status(404).json({
          success: false,
          message:
            "Agent device not found.",
        });
      }

      const note =
        String(
          req.body?.note || ""
        ).trim();

      device.isApproved =
        true;

      device.approvedBy =
        req.user._id;

      device.approvedAt =
        new Date();

      device.approvalNote =
        note;

      device.isActive =
        true;

      await device.save();

      return res.json({
        success: true,

        message:
          "Agent device approved successfully.",

        device: {
          id:
            device._id,

          deviceId:
            device.deviceId,

          employeeCode:
            device.employeeCode,

          pcName:
            device.pcName,

          deviceName:
            device.deviceName,

          isApproved:
            device.isApproved,

          isActive:
            device.isActive,

          approvedAt:
            device.approvedAt,

          approvedBy:
            device.approvedBy,

          approvalNote:
            device.approvalNote,
        },
      });
    } catch (error) {
      console.error(
        "Agent device approval error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to approve agent device.",
      });
    }
  }
);


/*
 * PATCH /api/admin/agent-devices/:id/reject
 *
 * Rejects / disables a Windows agent device.
 */

router.patch(
  "/agent-devices/:id/reject",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid device ID.",
        });
      }

      const device =
        await AgentDevice.findById(
          id
        );

      if (!device) {
        return res.status(404).json({
          success: false,
          message:
            "Agent device not found.",
        });
      }

      const note =
        String(
          req.body?.note ||
          "Rejected by administrator."
        ).trim();

      device.isApproved =
        false;

      /*
       * Rejecting also disables this token/device.
       *
       * authenticateAgent already requires
       * isActive: true.
       */

      device.isActive =
        false;

      device.approvedBy =
        null;

      device.approvedAt =
        null;

      device.approvalNote =
        note;

      await device.save();

      return res.json({
        success: true,

        message:
          "Agent device rejected and disabled.",

        device: {
          id:
            device._id,

          deviceId:
            device.deviceId,

          employeeCode:
            device.employeeCode,

          pcName:
            device.pcName,

          deviceName:
            device.deviceName,

          isApproved:
            false,

          isActive:
            false,

          approvalNote:
            device.approvalNote,
        },
      });
    } catch (error) {
      console.error(
        "Agent device rejection error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to reject agent device.",
      });
    }
  }
);
/* =====================================================
   ATTENDANCE APPROVAL REQUESTS
   Admin only
===================================================== */

router.get(
  "/attendance-approval-requests",
  async (req, res) => {
    try {
      const AttendanceApprovalRequest =
        mongoose.models.AttendanceApprovalRequest;

      if (!AttendanceApprovalRequest) {
        return res.status(500).json({
          success: false,
          message:
            "Attendance approval model is not available.",
        });
      }

      const status =
        String(
          req.query.status || "Pending"
        ).trim();

      const query = {};

      if (
        ["Pending", "Approved", "Rejected"].includes(
          status
        )
      ) {
        query.status = status;
      }

      const requests =
        await AttendanceApprovalRequest.find(
          query
        )
          .sort({
            requestedAt: -1,
          })
          .lean();

      return res.json({
        success: true,
        count: requests.length,
        requests,
      });
    } catch (error) {
      console.error(
        "Attendance approval list error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load attendance approval requests.",
      });
    }
  }
);


/* =====================================================
   APPROVE REMOTE ATTENDANCE REQUEST
===================================================== */

router.patch(
  "/attendance-approval-requests/:id/approve",
  async (req, res) => {
    try {
      const AttendanceApprovalRequest =
        mongoose.models.AttendanceApprovalRequest;

      const Attendance =
        mongoose.models.AttendanceV2;

      const Employee =
        mongoose.models.Employee;

      if (
        !AttendanceApprovalRequest ||
        !Attendance ||
        !Employee
      ) {
        return res.status(500).json({
          success: false,
          message:
            "Attendance models are not available.",
        });
      }

      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid approval request ID.",
        });
      }

      const request =
        await AttendanceApprovalRequest.findById(
          id
        );

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            "Attendance approval request not found.",
        });
      }

      if (
        request.status !==
        "Pending"
      ) {
        return res.status(409).json({
          success: false,
          message:
            `This request is already ${request.status.toLowerCase()}.`,
        });
      }

      const approvalType =
        String(
          req.body?.approvalType ||
          "Work From Home"
        ).trim();

      const allowedApprovalTypes = [
        "Work From Home",
        "Client Site",
        "Office Exception",
        "Late Arrival",
      ];

      if (
        !allowedApprovalTypes.includes(
          approvalType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid approval type.",
        });
      }

      const employee =
        await Employee.findById(
          request.employeeId
        );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found.",
        });
      }

      /*
       * Never create duplicate attendance.
       */

      let attendance =
        await Attendance.findOne({
          employeeId:
            employee._id,

          date:
            request.date,

          isDeleted: {
            $ne: true,
          },
        });

      if (!attendance) {
        /*
         * Use ORIGINAL request time,
         * not admin approval time.
         *
         * Example:
         * Requested at 10:22
         * Approved at 11:00
         *
         * Attendance should still represent
         * the 10:22 login request.
         */

        const loginTime =
          new Date(
            request.requestedAt
          );

        /*
         * Shift = 10:00
         * Grace = 15 minutes
         */

        const shiftStartAt =
          new Date(
            `${request.date}T10:00:00+05:30`
          );

        const difference =
          Math.floor(
            (
              loginTime.getTime() -
              shiftStartAt.getTime()
            ) /
              60000
          );

        const lateMinutes =
          difference > 15
            ? difference
            : 0;

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
              request.date,

            loginTime,

            logoutTime:
              null,

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
              "10:00",

            shiftEnd:
              "18:00",

            lateMinutes,

            earlyLogoutMinutes:
              0,

            overtimeMinutes:
              0,

            status:
              lateMinutes > 0
                ? "Late"
                : "Present",

            workStatus:
              "Working",

            isAutoClosed:
              false,

            autoClosedReason:
              "",

            note:
              `${approvalType} approved by admin.`,

            createdBy:
              req.user._id,

            updatedBy:
              req.user._id,
          });
      }

      request.status =
        "Approved";

      request.approvalType =
        approvalType;

      request.reviewedBy =
        req.user._id;

      request.reviewedAt =
        new Date();

      request.reviewNote =
        String(
          req.body?.note ||
          ""
        ).trim();

      request.attendanceId =
        attendance._id;

      await request.save();

      /*
       * Mark employee as active/working.
       */

      employee.status =
        "Working";

      employee.lastActivityAt =
        new Date();

      await employee.save();

      return res.json({
        success: true,

        message:
          "Attendance request approved successfully.",

        request,

        attendance,
      });
    } catch (error) {
      console.error(
        "Attendance approval error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to approve attendance request.",
      });
    }
  }
);


/* =====================================================
   REJECT REMOTE ATTENDANCE REQUEST
===================================================== */

router.patch(
  "/attendance-approval-requests/:id/reject",
  async (req, res) => {
    try {
      const AttendanceApprovalRequest =
        mongoose.models.AttendanceApprovalRequest;

      if (!AttendanceApprovalRequest) {
        return res.status(500).json({
          success: false,
          message:
            "Attendance approval model is not available.",
        });
      }

      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid approval request ID.",
        });
      }

      const request =
        await AttendanceApprovalRequest.findById(
          id
        );

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            "Attendance approval request not found.",
        });
      }

      if (
        request.status !==
        "Pending"
      ) {
        return res.status(409).json({
          success: false,
          message:
            `This request is already ${request.status.toLowerCase()}.`,
        });
      }

      request.status =
        "Rejected";

      request.reviewedBy =
        req.user._id;

      request.reviewedAt =
        new Date();

      request.reviewNote =
        String(
          req.body?.note ||
          "Attendance request rejected."
        ).trim();

      request.attendanceId =
        null;

      await request.save();

      return res.json({
        success: true,

        message:
          "Attendance request rejected.",

        request,
      });
    } catch (error) {
      console.error(
        "Attendance rejection error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to reject attendance request.",
      });
    }
  }
);
/* =====================================================
   PRODUCT MASTER SCHEMA
===================================================== */

const productSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: [
        true,
        "Product code is required.",
      ],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    productName: {
      type: String,
      required: [
        true,
        "Product name is required.",
      ],
      trim: true,
      index: true,
    },

    category: {
      type: String,
      default: "Software",
      trim: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    currentVersion: {
      type: String,
      default: "v1.0.0",
      trim: true,
    },

    platform: {
      type: String,
      enum: [
        "Web",
        "Desktop",
        "Mobile",
        "Web + Mobile",
        "Desktop + Mobile",
        "Web + Desktop",
        "Web + Desktop + Mobile",
        "Other",
      ],
      default: "Web",
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Inactive",
        "Deprecated",
      ],
      default: "Active",
      index: true,
    },

    releaseDate: {
      type: Date,
      default: null,
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

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "products",
  }
);



productSchema.index({
  productName: "text",
  productCode: "text",
  category: "text",
  description: "text",
});

const Product =
  mongoose.models.Product ||
  mongoose.model(
    "Product",
    productSchema
  );

/* =====================================================
 PROJECT MASTER SCHEMA
===================================================== */

const projectSchema = new mongoose.Schema(
  {
    projectCode: {
      type: String,
      required: [
        true,
        "Project code is required.",
      ],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    projectName: {
      type: String,
      required: [
        true,
        "Project name is required.",
      ],
      trim: true,
      index: true,
    },

    projectType: {
      type: String,
      enum: [
        "Product Development",
        "Client Implementation",
        "Internal Development",
        "Maintenance",
        "Upgrade",
        "Customization",
        "Research",
        "Other",
      ],
      default: "Internal Development",
      index: true,
    },

productId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Product",
  default: null,
  index: true,
},

    productCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    productName: {
      type: String,
      default: "",
      trim: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },

    clientCode: {
      type: String,
      default: "",
      trim: true,
    },

    clientName: {
      type: String,
      default: "",
      trim: true,
    },
    requirementId: {
  type:
    mongoose.Schema.Types.ObjectId,

  ref: "Requirement",

  default: null,
  index: true,
},

requirementCode: {
  type: String,
  default: "",
  trim: true,
  uppercase: true,
},

finalAmount: {
  type: Number,
  default: 0,
  min: 0,
},

amcApplicable: {
  type: Boolean,
  default: false,
},

proposedAmcAmount: {
  type: Number,
  default: 0,
  min: 0,
},

warrantyEndDate: {
  type: Date,
  default: null,
},
deliveryDate: {
  type: Date,
  default: null,
},

amcContractId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "AmcContract",
  default: null,
  index: true,
},

amcContractCode: {
  type: String,
  default: "",
  trim: true,
  uppercase: true,
},

amcActivated: {
  type: Boolean,
  default: false,
},

completedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

completedByName: {
  type: String,
  default: "",
  trim: true,
},
convertedToProduct: {
  type: Boolean,
  default: false,
  index: true,
},

convertedProductAt: {
  type: Date,
  default: null,
},

convertedProductBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

convertedProductByName: {
  type: String,
  default: "",
  trim: true,
},

    description: {
      type: String,
      default: "",
      trim: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
      index: true,
    },

    completedDate: {
      type: Date,
      default: null,
    },

    priority: {
      type: String,
      default: "Medium",
      trim: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "Planned",
        "Active",
        "On Hold",
        "Completed",
        "Cancelled",
      ],
      default: "Planned",
      index: true,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "projects",
  }
);

projectSchema.index({
  projectName: "text",
  projectCode: "text",
  productName: "text",
  clientName: "text",
  description: "text",
});

const Project =
  mongoose.models.Project ||
  mongoose.model(
    "Project",
    projectSchema
  );

  /* =====================================================
   REQUIREMENT / ENQUIRY SCHEMA
===================================================== */

const requirementSchema =
  new mongoose.Schema(
    {
      requirementCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      sourceType: {
        type: String,
        enum: [
          "Existing Client",
          "New Prospect",
        ],
        required: true,
        index: true,
      },

      /* ===============================================
         EXISTING CLIENT
      =============================================== */

      clientId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Client",
        default: null,
        index: true,
      },

      clientCode: {
        type: String,
        default: "",
        trim: true,
      },

      clientName: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      /* ===============================================
         NEW PROSPECT
      =============================================== */

      prospectName: {
        type: String,
        default: "",
        trim: true,
      },

      prospectCompany: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      prospectMobile: {
        type: String,
        default: "",
        trim: true,
      },

      prospectEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      prospectCity: {
        type: String,
        default: "",
        trim: true,
      },

      /* ===============================================
         REQUIREMENT
      =============================================== */

      title: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      requirementType: {
        type: String,

        enum: [
          "New Software",
          "Customization",
          "Mobile App",
          "Website",
          "Integration",
          "Upgrade",
          "Automation",
          "Support Requirement",
          "Other",
        ],

        default:
          "New Software",

        index: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      source: {
        type: String,

        enum: [
          "Existing Client",
          "Phone",
          "WhatsApp",
          "Email",
          "Website",
          "Referral",
          "Walk In",
          "Other",
        ],

        default:
          "Existing Client",

        index: true,
      },

      priority: {
        type: String,
        default: "Medium",
        trim: true,
        index: true,
      },

      expectedDeliveryDate: {
        type: Date,
        default: null,
      },

      /* ===============================================
         COMMERCIAL / QUOTATION
      =============================================== */

      estimatedBudget: {
        type: Number,
        default: 0,
        min: 0,
      },

      estimatedCost: {
        type: Number,
        default: 0,
        min: 0,
      },

      quotedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      quotationNo: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      quotationDate: {
        type: Date,
        default: null,
      },

      /* ===============================================
         ASSIGNMENT
      =============================================== */

      assignedEmployeeId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Employee",

        default: null,
        index: true,
      },

      assignedEmployeeCode: {
        type: String,
        default: "",
        trim: true,
      },

      assignedEmployeeName: {
        type: String,
        default: "",
        trim: true,
      },

      /* ===============================================
         WORKFLOW
      =============================================== */

      status: {
        type: String,

        enum: [
          "New",
          "Discussion",
          "Analysis",
          "Estimate Pending",
          "Quotation Pending",
          "Quotation Sent",
          "Negotiation",
          "Approved",
          "Rejected",
          "On Hold",
          "Converted to Project",
        ],

        default:
          "New",

        index: true,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },

      /* ===============================================
         PROJECT CONVERSION
      =============================================== */

      convertedProjectId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Project",

        default: null,
      },

      convertedProjectCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      convertedAt: {
        type: Date,
        default: null,
      },

      /* ===============================================
         AUDIT
      =============================================== */

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      createdByName: {
        type: String,
        default: "",
        trim: true,
      },

      updatedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      updatedByName: {
        type: String,
        default: "",
        trim: true,
      },

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },

      deletedAt: {
        type: Date,
        default: null,
      },

      deletedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      deletedByName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
      collection: "requirements",
    }
  );


requirementSchema.index({
  requirementCode: "text",
  title: "text",
  clientName: "text",
  prospectName: "text",
  prospectCompany: "text",
  description: "text",
});


const Requirement =
  mongoose.models.Requirement ||
  mongoose.model(
    "Requirement",
    requirementSchema
  );
/* ===========================
   CLIENT SCHEMA
=========================== */

/* =====================================================
   CLIENT SCHEMA
===================================================== */

const clientProductSchema =
  new mongoose.Schema(
    {
      productId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [
          true,
          "Product ID is required.",
        ],
        index: true,
      },

      productCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },

      productName: {
        type: String,
        required: true,
        trim: true,
      },

      version: {
        type: String,
        default: "v1.0.0",
        trim: true,
      },

      purchaseDate: {
        type: String,
        default: "",
      },

      installationDate: {
        type: String,
        default: "",
      },

      licensedUsers: {
        type: Number,
        default: 1,
        min: 1,
      },

      supportType: {
        type: String,
        enum: [
          "Basic",
          "Standard",
          "Premium",
        ],
        default: "Standard",
      },

      amcStatus: {
        type: String,
        enum: [
          "Not Started",
          "Pending",
          "Paid",
          "Partially Paid",
          "Overdue",
        ],
        default: "Not Started",
      },

      expiryDate: {
        type: String,
        default: "",
      },

      installationStatus: {
        type: String,
        enum: [
          "Not Installed",
          "Installation Pending",
          "Installed",
          "Inactive",
        ],
        default: "Installed",
      },
      licenceType: {
  type: String,
  enum: ["Perpetual Licence", "Annual Licence", "Monthly Subscription"],
  default: "Annual Licence",
},

licenceKey: {
  type: String,
  default: "",
  trim: true,
},

activeUsers: {
  type: Number,
  default: 0,
  min: 0,
},

serverType: {
  type: String,
  default: "",
  trim: true,
},

database: {
  type: String,
  default: "",
  trim: true,
},

assignedEngineer: {
  type: String,
  default: "Support Team",
  trim: true,
},

modules: {
  type: [String],
  default: [],
},

documents: {
  type: [
    {
      name: { type: String, default: "" },
      url: { type: String, default: "" },
    },
  ],
  default: [],
},

      notes: {
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

const clientSchema =
  new mongoose.Schema(
    {
      clientCode: {
        type: String,
        required: [
          true,
          "Client code is required.",
        ],
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      companyName: {
        type: String,
        required: [
          true,
          "Company name is required.",
        ],
        trim: true,
        index: true,
      },

      contactPerson: {
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
      userId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      loginEnabled: {
        type: Boolean,
        default: true,
      },

      loginCreatedAt: {
        type: Date,
        default: null,
      },

      mobile: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      products: {
        type: [clientProductSchema],
        default: [],
      },

      amcStatus: {
        type: String,
        enum: [
          "Not Started",
          "Pending",
          "Paid",
          "Partially Paid",
          "Overdue",
        ],
        default: "Not Started",
        index: true,
      },
      gstNo: { type: String, default: "", trim: true },
panNo: { type: String, default: "", trim: true },

addressLine1: { type: String, default: "", trim: true },
addressLine2: { type: String, default: "", trim: true },
state: { type: String, default: "", trim: true },
pinCode: { type: String, default: "", trim: true },
country: { type: String, default: "India", trim: true },

billingContact: { type: String, default: "", trim: true },
billingEmail: { type: String, default: "", trim: true },

preferredContact: {
  type: String,
  enum: ["Phone", "Email", "WhatsApp"],
  default: "Phone",
},

supportLanguage: {
  type: String,
  enum: ["English", "Hindi", "Marathi"],
  default: "English",
},

      nextRenewal: {
        type: String,
        default: "",
      },

      openTickets: {
        type: Number,
        default: 0,
        min: 0,
      },
assignedEmployeeId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Employee",
  default: null,
  index: true,
},

assignedEmployeeCode: {
  type: String,
  default: "",
  trim: true,
  uppercase: true,
},

assignedEmployeeName: {
  type: String,
  default: "",
  trim: true,
},


      status: {
        type: String,
        enum: [
          "Active",
          "Inactive",
          "Suspended",
        ],
        default: "Active",
        index: true,
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      createdByName: {
        type: String,
        default: "",
        trim: true,
      },

      updatedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      updatedByName: {
        type: String,
        default: "",
        trim: true,
      },

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },

      deletedAt: {
        type: Date,
        default: null,
      },

      deletedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      deletedByName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
      collection: "clients",
    }
  );
clientSchema.index({
  clientCode: "text",
  companyName: "text",
  contactPerson: "text",
  email: "text",
  mobile: "text",
  city: "text",
  assignedEmployeeCode: "text",
  assignedEmployeeName: "text",
  "products.productName": "text",
  "products.productCode": "text",
});

const Client =
  mongoose.models.Client ||
  mongoose.model(
    "Client",
    clientSchema
  );

/* =====================================================
 TASK SCHEMA
===================================================== */

const taskTimelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    performedByName: {
      type: String,
      default: "",
      trim: true,
    },

    performedByRole: {
      type: String,
      enum: ["admin", "employee", "client", "system"],
      default: "system",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const taskCommentSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    authorName: {
      type: String,
      default: "",
      trim: true,
    },

    authorRole: {
      type: String,
      enum: ["admin", "employee", "client"],
      default: "admin",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const taskAttachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    fileType: {
      type: String,
      default: "",
      trim: true,
    },

    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedByName: {
      type: String,
      default: "",
      trim: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const taskSchema = new mongoose.Schema(
  {
    taskCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Task title is required."],
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    workType: {
      type: String,
      enum: [
        "Client Support",
        "Internal Development",
        "Development",
        "Testing",
        "Installation",
        "Training",
        "Documentation",
        "Internal Work",
        "Follow-up",
        "Other",
      ],
      default: "Client Support",
    },

    taskFor: {
      type: String,
      enum: [
        "Project",
        "Product",
        "General",
      ],
      default: "Project",
      index: true,
    },
    generalTaskFor: {
      type: String,
      default: "",
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },

    clientName: {
      type: String,
      default: "Internal Development",
      trim: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    productCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    productName: {
      type: String,
      default: "",
      trim: true,
    },

projectId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Project",
  default: null,
  index: true,
},

projectCode: {
  type: String,
  default: "",
  trim: true,
  uppercase: true,
},

projectName: {
  type: String,
  default: "",
  trim: true,
},

    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    ticketCode: {
      type: String,
      default: "",
      trim: true,
    },

    assignedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Assigned employee is required."],
      index: true,
    },

    assignedEmployeeName: {
      type: String,
      required: true,
      trim: true,
    },

    assignedEmployeeCode: {
      type: String,
      default: "",
      trim: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedByName: {
      type: String,
      default: "",
      trim: true,
    },

    priority: {
      type: String,
      default: "Medium",
      trim: true,
      index: true,
    },

    status: {
      type: String,
      default: "Assigned",
      trim: true,
      index: true,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    startDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required."],
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    estimatedMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    spentMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    startedAt: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    totalPausedMinutes: { type: Number, default: 0, min: 0 },
    elapsedMinutes: { type: Number, default: 0, min: 0 },
    elapsedSeconds: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: null },

    resolutionNote: {
      type: String,
      default: "",
      trim: true,
    },

    timeline: {
      type: [taskTimelineSchema],
      default: [],
    },

    comments: {
      type: [taskCommentSchema],
      default: [],
    },

    attachments: {
      type: [taskAttachmentSchema],
      default: [],
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "tasks",
  }
);

const Task =
  mongoose.models.Task ||
  mongoose.model("Task", taskSchema);
 // module.exports.Task = Task;

 /* =====================================================
   PROJECT TASK SUMMARY / AUTO PROGRESS
===================================================== */

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

  const totalTasks = projectTasks.length;

  const completedTasks = projectTasks.filter(
    (task) =>
      task.status === "Completed" ||
      Number(task.progress || 0) >= 100
  ).length;

  const activeTasks = projectTasks.filter(
    (task) =>
      ![
        "Completed",
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
          (total, task) => {
            const taskProgress =
              task.status === "Completed"
                ? 100
                : Math.min(
                    100,
                    Math.max(
                      0,
                      Number(task.progress || 0)
                    )
                  );

            return total + taskProgress;
          },
          0
        ) / totalTasks
      )
    : 0;

  /*
   * Keep project progress synchronized with tasks.
   * We intentionally do not automatically change the
   * project status here because status may be managed
   * separately by the administrator.
   */
  if (Number(project.progress || 0) !== progress) {
    project.progress = progress;
    await project.save();
  }

  return {
    totalTasks,
    activeTasks,
    completedTasks,
    overdueTasks,
    progress,
    tasks: projectTasks,
  };
}
/* =====================================================
 ACTIVITY LOG SCHEMA
===================================================== */

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      enum: [
        "Client",
        "Product",
        "Project",
        "Task",
        "Ticket",
        "Employee",
        "Attendance",
        "AMC",
        "Payment",
        "System",
      ],
      default: "System",
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    entityType: {
      type: String,
      enum: [
        "client",
        "product",
        "project",
        "task",
        "ticket",
        "employee",
        "attendance",
        "amc",
        "payment",
        "system",
      ],
      default: "system",
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    entityCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    entityName: {
      type: String,
      default: "",
      trim: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },

    clientName: {
      type: String,
      default: "",
      trim: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    employeeName: {
      type: String,
      default: "",
      trim: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    performedByName: {
      type: String,
      default: "",
      trim: true,
    },

    performedByRole: {
      type: String,
      enum: ["admin", "employee", "client", "system"],
      default: "system",
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "activitylogs",
  }
);

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model(
    "ActivityLog",
    activityLogSchema
  );

/* =====================================================
SUPPORT TICKET SCHEMAS
===================================================== */

const ticketTimelineSchema =
  new mongoose.Schema(
    {
      type: {
        type: String,
        enum: [
          "created",
          "assigned",
          "status",
          "reply",
          "attachment",
              "call",
          "resolved",
          "closed",
          "reopened",
          "task",
          "updated",
          "deleted",
        ],
        default: "updated",
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      performedByName: {
        type: String,
        default: "",
        trim: true,
      },

      performedByRole: {
        type: String,
        enum: [
          "admin",
          "employee",
          "client",
          "system",
        ],
        default: "system",
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  );

  const ticketInternalNoteSchema =
  new mongoose.Schema(
    {
      note: {
        type: String,
        required: true,
        trim: true,
      },

      authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      authorName: {
        type: String,
        default: "",
        trim: true,
      },

      authorRole: {
        type: String,
        enum: [
          "admin",
          "employee",
        ],
        default: "employee",
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  );
const ticketReplySchema =
  new mongoose.Schema(
    {
      message: {
        type: String,
        required: true,
        trim: true,
      },

      replyType: {
        type: String,
        enum: [
          "Public",
          "Internal",
        ],
        default: "Public",
      },

      authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      authorName: {
        type: String,
        default: "",
        trim: true,
      },

      authorRole: {
        type: String,
        enum: [
          "admin",
          "employee",
          "client",
        ],
        default: "admin",
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  );

const ticketAttachmentSchema =
  new mongoose.Schema(
    {
      fileName: {
        type: String,
        required: true,
        trim: true,
      },

      fileUrl: {
        type: String,
        required: true,
        trim: true,
      },

      fileType: {
        type: String,
        default: "",
        trim: true,
      },

      fileSize: {
        type: Number,
        default: 0,
        min: 0,
      },

      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      uploadedByName: {
        type: String,
        default: "",
        trim: true,
      },

      uploadedByRole: {
        type: String,
        enum: [
          "admin",
          "employee",
          "client",
        ],
        default: "admin",
      },

      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  );

  const ticketCallLogSchema =
  new mongoose.Schema(
    {
      callType: { type: String, enum: ["Incoming", "Outgoing"], default: "Outgoing" },
      contactPerson: { type: String, default: "", trim: true },
      mobile: { type: String, default: "", trim: true },
      duration: { type: String, default: "", trim: true },
      summary: { type: String, required: true, trim: true },
      loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      loggedByName: { type: String, default: "", trim: true },
      loggedByRole: { type: String, enum: ["admin", "employee"], default: "employee" },
      createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
  );
const supportTicketSchema =
  new mongoose.Schema(
    {
      ticketCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
      },

      title: {
        type: String,
        required: [
          true,
          "Ticket title is required.",
        ],
        trim: true,
      },

      description: {
        type: String,
        required: [
          true,
          "Problem description is required.",
        ],
        trim: true,
      },

      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true,
        index: true,
      },

      clientCode: {
        type: String,
        default: "",
        trim: true,
      },

      clientName: {
        type: String,
        required: true,
        trim: true,
      },

      contactPerson: {
        type: String,
        default: "",
        trim: true,
      },

      contactMobile: {
        type: String,
        default: "",
        trim: true,
      },

      contactEmail: {
        type: String,
        default: "",
        trim: true,
      },

      productId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      productName: {
        type: String,
        required: [
          true,
          "Product is required.",
        ],
        trim: true,
        index: true,
      },

      productVersion: {
        type: String,
        default: "",
        trim: true,
      },

      module: {
        type: String,
        default: "General",
        trim: true,
      },

    category: {
  type: String,
  enum: [
    "Billing",
    "Reports",
    "Inventory",
    "Accounts",
    "GST",
    "Backup",
    "Login",
    "Bug",
    "Configuration",
    "Data Issue",
    "Feature Request",
    "Installation",
    "Training",
    "Permission",
    "Performance",
    "Report",
    "Other",
  ],
  default: "Other",
},

      source: {
        type: String,
        enum: [
          "Client Portal",
          "Phone Call",
          "WhatsApp",
          "Email",
          "Admin",
        ],
        default: "Admin",
        index: true,
      },

      priority: {
        type: String,
        default: "Medium",
        trim: true,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "New",
          "Assigned",
          "In Progress",
          "Waiting for Client",
          "Testing",
          "Resolved",
          "Verified",
          "Closed",
          "Cancelled",
        ],
        default: "New",
        index: true,
      },

      assignedEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
        index: true,
      },

      assignedEmployeeName: {
        type: String,
        default: "Unassigned",
        trim: true,
      },

      assignedEmployeeCode: {
        type: String,
        default: "",
        trim: true,
      },

      assignedAt: {
        type: Date,
        default: null,
      },

      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      assignedByName: {
        type: String,
        default: "",
        trim: true,
      },

      dueDate: {
        type: Date,
        default: null,
        index: true,
      },

      firstResponseAt: {
        type: Date,
        default: null,
      },

      resolvedAt: {
        type: Date,
        default: null,
      },

      verifiedAt: {
        type: Date,
        default: null,
      },

      closedAt: {
        type: Date,
        default: null,
      },

      resolutionNote: {
        type: String,
        default: "",
        trim: true,
      },

      rootCause: {
        type: String,
        default: "",
        trim: true,
      },

      linkedTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null,
        index: true,
      },

      linkedTaskCode: {
        type: String,
        default: "",
        trim: true,
      },

      spentMinutes: {
        type: Number,
        default: 0,
        min: 0,
      },

      replies: {
        type: [ticketReplySchema],
        default: [],
      },
      internalNotes: {
    type: [ticketInternalNoteSchema],
    default: [],
},

      attachments: {
        type: [ticketAttachmentSchema],
        default: [],
      },
      callLogs: {
  type: [ticketCallLogSchema],
  default: [],
},

      timeline: {
        type: [ticketTimelineSchema],
        default: [],
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

      createdByRole: {
        type: String,
        enum: [
          "admin",
          "employee",
          "client",
          "system",
        ],
        default: "admin",
      },

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
    {
      timestamps: true,
      collection: "supporttickets",
    }
  );

supportTicketSchema.index({
  clientId: 1,
  status: 1,
  createdAt: -1,
});

supportTicketSchema.index({
  assignedEmployeeId: 1,
  status: 1,
});

supportTicketSchema.index({
  title: "text",
  description: "text",
  clientName: "text",
  productName: "text",
  module: "text",
});

const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model(
    "SupportTicket",
    supportTicketSchema
  );

/* =====================================================
   AMC CONTRACT SCHEMAS
===================================================== */

const amcTimelineSchema =
  new mongoose.Schema(
    {
      type: {
        type: String,
    enum: [
  "created",
  "updated",
  "invoice",
  "payment",
  "reminder",
  "renewal",
  "assignment",
  "status",
  "document",
  "deleted",
],
        default: "updated",
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      performedByName: {
        type: String,
        default: "",
        trim: true,
      },

      performedByRole: {
        type: String,
        enum: [
          "admin",
          "employee",
          "client",
          "system",
        ],
        default: "system",
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  );

  /* =====================================================
   AMC DOCUMENT SCHEMA
===================================================== */

const amcDocumentSchema =
  new mongoose.Schema(
    {
      documentType: {
        type: String,

        enum: [
          "AMC Agreement",
          "Own Invoice / Bill",
          "Payment Receipt",
          "Quotation",
          "Purchase Order",
          "Other Document",
        ],

        default:
          "Other Document",
      },

      fileName: {
        type: String,
        required: true,
        trim: true,
      },

      storedFileName: {
        type: String,
        required: true,
        trim: true,
      },

      mimeType: {
        type: String,
        default: "",
        trim: true,
      },

      fileSize: {
        type: Number,
        default: 0,
        min: 0,
      },

      relativePath: {
        type: String,
        required: true,
        trim: true,
      },

      source: {
        type: String,

        enum: [
          "Uploaded",
          "Own Invoice",
          "System",
        ],

        default:
          "Uploaded",
      },

      status: {
        type: String,

        enum: [
          "Available",
          "Archived",
        ],

        default:
          "Available",
      },

      uploadedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,
      },

      uploadedByName: {
        type: String,
        default: "",
        trim: true,
      },

      uploadedAt: {
        type: Date,
        default:
          Date.now,
      },

      isDeleted: {
        type: Boolean,
        default:
          false,
      },

      deletedAt: {
        type: Date,
        default:
          null,
      },

      deletedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,
      },

      deletedByName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      _id:
        true,
    }
  );

const amcRenewalHistorySchema =
  new mongoose.Schema(
    {
      contractCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      invoiceCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      invoiceDate: {
        type: Date,
        default: null,
      },

      startDate: {
        type: Date,
        default: null,
      },

      expiryDate: {
        type: Date,
        default: null,
      },

      dueDate: {
        type: Date,
        default: null,
      },

      plan: {
        type: String,
        default: "Standard",
        trim: true,
      },

      licensedUsers: {
        type: Number,
        default: 1,
        min: 1,
      },

      taxableAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      cgstRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      cgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      sgstRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      sgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      igstRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      igstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      paidAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      pendingAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      status: {
        type: String,
        default: "Pending",
        trim: true,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },

      archivedAt: {
        type: Date,
        default: Date.now,
      },

      archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      archivedByName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      _id: true,
    }
  );

const amcContractSchema =
  new mongoose.Schema(
    {
      contractCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
      },
            /*
       * Current active invoice for this AMC contract.
       *
       * Historical invoices remain permanently stored
       * inside the amcinvoices collection.
       */
      currentInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AmcInvoice",
        default: null,
        index: true,
      },

      currentInvoiceCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
        index: true,
      },

      invoiceCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
        index: true,
      },

      invoiceDate: {
        type: Date,
        default: null,
      },

      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: [
          true,
          "Client is required.",
        ],
        index: true,
      },

      clientCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },

      clientName: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      contactPerson: {
        type: String,
        default: "",
        trim: true,
      },

      contactMobile: {
        type: String,
        default: "",
        trim: true,
      },

      contactEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      /*
       * This is the _id of the selected product entry
       * inside client.products.
       */
      clientProductId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [
          true,
          "Client product is required.",
        ],
        index: true,
      },

      /*
       * This is the Product Master _id stored inside
       * the selected client product.
       */
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [
          true,
          "Product is required.",
        ],
        index: true,
      },

      productCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },

      productName: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      productVersion: {
        type: String,
        default: "",
        trim: true,
      },

      plan: {
        type: String,
        enum: [
          "Basic",
          "Standard",
          "Premium",
          "Custom",
        ],
        default: "Standard",
        index: true,
      },

      licensedUsers: {
        type: Number,
        default: 1,
        min: 1,
      },

      startDate: {
        type: Date,
        required: [
          true,
          "AMC start date is required.",
        ],
        index: true,
      },

      expiryDate: {
        type: Date,
        required: [
          true,
          "AMC expiry date is required.",
        ],
        index: true,
      },

      dueDate: {
        type: Date,
        required: [
          true,
          "Payment due date is required.",
        ],
        index: true,
      },

      taxableAmount: {
        type: Number,
        required: [
          true,
          "AMC taxable amount is required.",
        ],
        min: 0,
      },

      cgstRate: {
        type: Number,
        default: 9,
        min: 0,
      },

      cgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      sgstRate: {
        type: Number,
        default: 9,
        min: 0,
      },

      sgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      igstRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      igstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalTaxAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      paidAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      pendingAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      status: {
        type: String,
        enum: [
          "Upcoming",
          "Pending",
          "Partially Paid",
          "Paid",
          "Overdue",
          "Cancelled",
        ],
        default: "Pending",
        index: true,
      },

      assignedEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
        index: true,
      },

      assignedEmployeeCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      assignedEmployeeName: {
        type: String,
        default: "Unassigned",
        trim: true,
      },

      reminderStatus: {
        type: String,
        enum: [
          "Not Sent",
          "Sent",
          "Call Logged",
          "Not Required",
        ],
        default: "Not Sent",
      },

      lastReminderAt: {
        type: Date,
        default: null,
      },

      nextFollowUpDate: {
        type: Date,
        default: null,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },

 renewalHistory: {
  type: [
    amcRenewalHistorySchema
  ],

  default: [],
},

documents: {
  type: [
    amcDocumentSchema
  ],

  default: [],
},

timeline: {
  type: [
    amcTimelineSchema
  ],

  default: [],
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

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },

      deletedAt: {
        type: Date,
        default: null,
      },

      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      deletedByName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
      collection: "amccontracts",
    }
  );

amcContractSchema.index({
  contractCode: "text",
  invoiceCode: "text",
  clientCode: "text",
  clientName: "text",
  productCode: "text",
  productName: "text",
  assignedEmployeeCode: "text",
  assignedEmployeeName: "text",
});

amcContractSchema.index({
  clientId: 1,
  productId: 1,
  expiryDate: 1,
});

const AmcContract =
  mongoose.models.AmcContract ||
  mongoose.model(
    "AmcContract",

    amcContractSchema
  );

  /* =====================================================
   AMC INVOICE SCHEMA

   This is the permanent financial invoice collection.

   Client Master can be archived or soft-deleted without
   affecting AMC invoices or payments.
===================================================== */

const amcInvoiceSchema =
  new mongoose.Schema(
    {
      invoiceCode: {
        type: String,
        required: [
          true,
          "AMC invoice code is required.",
        ],
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      invoiceNumber: {
        type: Number,
        default: 0,
        min: 0,
      },

      invoiceDate: {
        type: Date,
        required: [
          true,
          "Invoice date is required.",
        ],
        default: Date.now,
        index: true,
      },

      invoiceType: {
        type: String,
        enum: [
          "Initial",
          "Renewal",
          "Adjustment",
        ],
        default: "Initial",
        index: true,
      },

      /*
       * Contract reference.
       */
      amcContractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AmcContract",
        required: [
          true,
          "AMC contract is required.",
        ],
        index: true,
      },

      contractCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      /*
       * Contract period represented by this invoice.
       */
      contractStartDate: {
        type: Date,
        required: true,
      },

      contractExpiryDate: {
        type: Date,
        required: true,
      },

      dueDate: {
        type: Date,
        required: [
          true,
          "Invoice due date is required.",
        ],
        index: true,
      },

      /*
       * Client reference plus permanent snapshot.
       *
       * Even when Client Master is later archived,
       * these values remain inside the invoice.
       */
      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        default: null,
        index: true,
      },

      clientCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      clientName: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      contactPerson: {
        type: String,
        default: "",
        trim: true,
      },

      contactMobile: {
        type: String,
        default: "",
        trim: true,
      },

      contactEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      /*
       * Product reference plus permanent snapshot.
       */
      clientProductId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        index: true,
      },

      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
        index: true,
      },

      productCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      productName: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      productVersion: {
        type: String,
        default: "",
        trim: true,
      },

      plan: {
        type: String,
        enum: [
          "Basic",
          "Standard",
          "Premium",
          "Custom",
        ],
        default: "Standard",
      },

      licensedUsers: {
        type: Number,
        default: 1,
        min: 1,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      /*
       * GST and invoice totals.
       */
      taxableAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      cgstRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      cgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      sgstRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      sgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      igstRate: {
        type: Number,
        default: 0,
        min: 0,
      },

      igstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalTaxAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      /*
       * Payment summary is maintained from
       * permanent amcpayments records.
       */
      paidAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      pendingAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      paymentStatus: {
        type: String,
        enum: [
          "Pending",
          "Partially Paid",
          "Paid",
          "Overdue",
          "Cancelled",
        ],
        default: "Pending",
        index: true,
      },

      status: {
        type: String,
        enum: [
          "Draft",
          "Issued",
          "Cancelled",
        ],
        default: "Issued",
        index: true,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
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

      /*
       * Financial records should normally be cancelled,
       * not physically removed.
       */
      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },

      deletedAt: {
        type: Date,
        default: null,
      },

      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      deletedByName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
      collection: "amcinvoices",
    }
  );

amcInvoiceSchema.index({
  amcContractId: 1,
  invoiceDate: -1,
});

amcInvoiceSchema.index({
  clientId: 1,
  invoiceDate: -1,
});

amcInvoiceSchema.index({
  productId: 1,
  invoiceDate: -1,
});

amcInvoiceSchema.index({
  invoiceCode: "text",
  contractCode: "text",
  clientCode: "text",
  clientName: "text",
  productCode: "text",
  productName: "text",
});

const AmcInvoice =
  mongoose.models.AmcInvoice ||
  mongoose.model(
    "AmcInvoice",
    amcInvoiceSchema
  );

/* =====================================================
   AMC PAYMENT SCHEMA
===================================================== */

const amcPaymentSchema =
  new mongoose.Schema(
    {
      paymentCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      amcContractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AmcContract",
        required: true,
        index: true,
      },
            /*
       * Every payment belongs to one permanent invoice.
       */
      amcInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AmcInvoice",
        required: [
          true,
          "AMC invoice is required.",
        ],
        index: true,
      },

      contractCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },

      invoiceCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true,
        index: true,
      },

      clientCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      clientName: {
        type: String,
        required: true,
        trim: true,
      },

      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
      },

      productCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      productName: {
        type: String,
        default: "",
        trim: true,
      },

      amount: {
        type: Number,
        required: [
          true,
          "Payment amount is required.",
        ],
        min: 0.01,
      },

      paymentDate: {
        type: Date,
        required: [
          true,
          "Payment date is required.",
        ],
        index: true,
      },

      mode: {
        type: String,
        enum: [
          "Cash",
          "Bank Transfer",
          "UPI",
          "Cheque",
          "Card",
          "Other",
        ],
        default: "Bank Transfer",
      },

      referenceNo: {
        type: String,
        default: "",
        trim: true,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },

      receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      receivedByName: {
        type: String,
        default: "",
        trim: true,
      },

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
    {
      timestamps: true,
      collection: "amcpayments",
    }
  );

amcPaymentSchema.index({
  amcContractId: 1,
  paymentDate: -1,
});

const AmcPayment =
  mongoose.models.AmcPayment ||
  mongoose.model(
    "AmcPayment",
    amcPaymentSchema
  );

/* =====================================================
   AMC REMINDER SCHEMA
===================================================== */

const amcReminderSchema =
  new mongoose.Schema(
    {
      amcContractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AmcContract",
        required: true,
        index: true,
      },

      contractCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },

      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true,
        index: true,
      },

      clientCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      clientName: {
        type: String,
        required: true,
        trim: true,
      },

      channel: {
        type: String,
        enum: [
          "WhatsApp",
          "Email",
          "SMS",
          "Phone Call",
        ],
        required: true,
      },

      message: {
        type: String,
        required: [
          true,
          "Reminder message is required.",
        ],
        trim: true,
      },

      assignedEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
        index: true,
      },

      assignedEmployeeCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      assignedEmployeeName: {
        type: String,
        default: "Unassigned",
        trim: true,
      },

      followUpDate: {
        type: Date,
        default: null,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },

      sentAt: {
        type: Date,
        default: Date.now,
      },

      sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      sentByName: {
        type: String,
        default: "",
        trim: true,
      },

      status: {
        type: String,
        enum: [
          "Sent",
          "Call Logged",
          "Failed",
        ],
        default: "Sent",
      },

      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
    },
    {
      timestamps: true,
      collection: "amcreminders",
    }
  );

amcReminderSchema.index({
  amcContractId: 1,
  sentAt: -1,
});

const AmcReminder =
  mongoose.models.AmcReminder ||
  mongoose.model(
    "AmcReminder",
    amcReminderSchema
  );



/* =====================================================
   CLIENT DOCUMENT SCHEMA (metadata only, no file storage)
===================================================== */

const clientDocumentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    clientCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    clientName: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Document name is required."],
      trim: true,
    },

    type: {
      type: String,
      enum: ["PDF", "Excel", "Word", "Image", "ZIP", "Other"],
      default: "Other",
    },

    category: {
      type: String,
      enum: [
        "Agreement",
        "Legal",
        "Quotation",
        "Invoice",
        "Installation",
        "Other",
      ],
      default: "Other",
    },

    size: {
      type: String,
      default: "",
      trim: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedByName: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "clientdocuments",
  }
);

const ClientDocument =
  mongoose.models.ClientDocument ||
  mongoose.model("ClientDocument", clientDocumentSchema);


  async function generateRequirementCode() {
  const year =
    new Date().getFullYear();

  const prefix =
    `REQ-${year}-`;

  const lastRequirement =
    await Requirement.findOne({
      requirementCode: {
        $regex:
          `^${prefix}`,
      },
    })
      .sort({
        requirementCode: -1,
      })
      .lean();

  let nextNumber = 1;

  if (
    lastRequirement?.requirementCode
  ) {
    const match =
      String(
        lastRequirement.requirementCode
      ).match(
        /(\d+)$/
      );

    if (match) {
      nextNumber =
        Number(
          match[1]
        ) + 1;
    }
  }

  return `${prefix}${String(
    nextNumber
  ).padStart(
    4,
    "0"
  )}`;
}

  /* =====================================================
   AMC HELPERS
===================================================== */

function generateAmcContractCode() {
  const year =
    new Date().getFullYear();

  const uniquePart =
    `${Date.now()}${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0")}`.slice(-8);

  return `AMC-CTR-${year}-${uniquePart}`;
}

function generateAmcInvoiceCode() {
  const year =
    new Date().getFullYear();

  const uniquePart =
    `${Date.now()}${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0")}`.slice(-8);

  return `AMC-INV-${year}-${uniquePart}`;
}

function generateAmcPaymentCode() {
  const year =
    new Date().getFullYear();

  const uniquePart =
    `${Date.now()}${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0")}`.slice(-8);

  return `AMC-PAY-${year}-${uniquePart}`;
}

function roundAmcAmount(value) {
  return Number(
    Number(value || 0).toFixed(2)
  );
}

function calculateAmcAmounts({
  taxableAmount,
  cgstRate = 9,
  sgstRate = 9,
  igstRate = 0,
}) {
  const normalizedTaxableAmount =
    roundAmcAmount(taxableAmount);

  const normalizedCgstRate =
    Math.max(
      Number(cgstRate || 0),
      0
    );

  const normalizedSgstRate =
    Math.max(
      Number(sgstRate || 0),
      0
    );

  const normalizedIgstRate =
    Math.max(
      Number(igstRate || 0),
      0
    );

  const cgstAmount =
    roundAmcAmount(
      normalizedTaxableAmount *
      (normalizedCgstRate / 100)
    );

  const sgstAmount =
    roundAmcAmount(
      normalizedTaxableAmount *
      (normalizedSgstRate / 100)
    );

  const igstAmount =
    roundAmcAmount(
      normalizedTaxableAmount *
      (normalizedIgstRate / 100)
    );

  const totalTaxAmount =
    roundAmcAmount(
      cgstAmount +
      sgstAmount +
      igstAmount
    );

  const totalAmount =
    roundAmcAmount(
      normalizedTaxableAmount +
      totalTaxAmount
    );

  return {
    taxableAmount:
      normalizedTaxableAmount,

    cgstRate:
      normalizedCgstRate,

    cgstAmount,

    sgstRate:
      normalizedSgstRate,

    sgstAmount,

    igstRate:
      normalizedIgstRate,

    igstAmount,

    totalTaxAmount,

    totalAmount,
  };
}

function calculateAmcStatus({
  startDate,
  expiryDate,
  totalAmount,
  paidAmount,
  currentStatus,
}) {
  if (
    currentStatus ===
    "Cancelled"
  ) {
    return "Cancelled";
  }

  const normalizedTotal =
    roundAmcAmount(totalAmount);

  const normalizedPaid =
    roundAmcAmount(paidAmount);

  const pendingAmount =
    Math.max(
      roundAmcAmount(
        normalizedTotal -
        normalizedPaid
      ),
      0
    );

  if (pendingAmount === 0) {
    return "Paid";
  }

  if (normalizedPaid > 0) {
    return "Partially Paid";
  }

  const now = new Date();

  now.setHours(
    0,
    0,
    0,
    0
  );

  if (expiryDate) {
    const expiry =
      new Date(expiryDate);

    expiry.setHours(
      0,
      0,
      0,
      0
    );

    if (
      !Number.isNaN(
        expiry.getTime()
      ) &&
      expiry < now
    ) {
      return "Overdue";
    }
  }

  if (startDate) {
    const start =
      new Date(startDate);

    start.setHours(
      0,
      0,
      0,
      0
    );

    if (
      !Number.isNaN(
        start.getTime()
      ) &&
      start > now
    ) {
      return "Upcoming";
    }
  }

  return "Pending";
}

async function resolveAmcClient(
  clientId
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      clientId
    )
  ) {
    throw new Error(
      "Invalid client ID."
    );
  }

  const client =
    await Client.findOne({
      _id: clientId,
      isDeleted: false,
      status: "Active",
    });

  if (!client) {
    throw new Error(
      "Selected client was not found or is inactive."
    );
  }

  return client;
}

function resolveAmcClientProduct(
  client,
  clientProductId
) {
  if (!client) {
    throw new Error(
      "Client was not found."
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      clientProductId
    )
  ) {
    throw new Error(
      "Invalid client product ID."
    );
  }

  const clientProduct =
    client.products.id(
      clientProductId
    );

  if (!clientProduct) {
    throw new Error(
      "Selected product is not assigned to this client."
    );
  }

  if (
    clientProduct.installationStatus ===
    "Inactive"
  ) {
    throw new Error(
      "Selected client product is inactive."
    );
  }

  return clientProduct;
}

async function resolveAmcEmployee(
  employeeId
) {
  const normalizedEmployeeId =
    String(employeeId || "").trim();

  if (!normalizedEmployeeId) {
    return {
      assignedEmployeeId:
        null,

      assignedEmployeeCode:
        "",

      assignedEmployeeName:
        "Unassigned",
    };
  }

  const employee =
    await resolveClientEmployee(
      normalizedEmployeeId,
      {
        required: false,
      }
    );

  return {
    assignedEmployeeId:
      employee.assignedEmployeeId,

    assignedEmployeeCode:
      employee.assignedEmployeeCode,

    assignedEmployeeName:
      employee.assignedEmployeeName ||
      "Unassigned",
  };
}
function amcInvoiceResponse(
  invoice
) {
  if (!invoice) {
    return null;
  }

  return {
    id:
      invoice._id,

    _id:
      invoice._id,

    invoiceCode:
      invoice.invoiceCode,

    invoiceNumber:
      invoice.invoiceNumber,

    invoiceDate:
      invoice.invoiceDate,

    invoiceType:
      invoice.invoiceType,

    amcContractId:
      invoice.amcContractId,

    contractCode:
      invoice.contractCode,

    contractStartDate:
      invoice.contractStartDate,

    contractExpiryDate:
      invoice.contractExpiryDate,

    dueDate:
      invoice.dueDate,

    clientId:
      invoice.clientId,

    clientCode:
      invoice.clientCode,

    clientName:
      invoice.clientName,

    contactPerson:
      invoice.contactPerson,

    contactMobile:
      invoice.contactMobile,

    contactEmail:
      invoice.contactEmail,

    clientProductId:
      invoice.clientProductId,

    productId:
      invoice.productId,

    productCode:
      invoice.productCode,

    productName:
      invoice.productName,

    productVersion:
      invoice.productVersion,

    plan:
      invoice.plan,

    licensedUsers:
      invoice.licensedUsers,

    description:
      invoice.description,

    taxableAmount:
      invoice.taxableAmount,

    cgstRate:
      invoice.cgstRate,

    cgstAmount:
      invoice.cgstAmount,

    sgstRate:
      invoice.sgstRate,

    sgstAmount:
      invoice.sgstAmount,

    igstRate:
      invoice.igstRate,

    igstAmount:
      invoice.igstAmount,

    totalTaxAmount:
      invoice.totalTaxAmount,

    totalAmount:
      invoice.totalAmount,

    paidAmount:
      invoice.paidAmount,

    pendingAmount:
      invoice.pendingAmount,

    paymentStatus:
      invoice.paymentStatus,

    status:
      invoice.status,

    notes:
      invoice.notes,

    createdAt:
      invoice.createdAt,

    updatedAt:
      invoice.updatedAt,
  };
}
function mergeAmcContractWithInvoice(
  contract,
  invoice
) {
  const contractData =
    amcContractResponse(
      contract
    );

  if (!invoice) {
    /*
     * Compatibility for old contracts created before
     * the amcinvoices collection was introduced.
     */
    return {
      ...contractData,

      currentInvoice:
        null,

      invoice:
        null,
    };
  }

  const invoiceData =
    amcInvoiceResponse(
      invoice
    );

  return {
    ...contractData,

    currentInvoiceId:
      invoice._id,

    currentInvoiceCode:
      invoice.invoiceCode,

    /*
     * Keep these top-level values so the current
     * AmcBilling frontend continues working.
     *
     * Their source is now the permanent invoice.
     */
    invoiceCode:
      invoice.invoiceCode,

    invoiceDate:
      invoice.invoiceDate,

    startDate:
      invoice.contractStartDate,

    expiryDate:
      invoice.contractExpiryDate,

    dueDate:
      invoice.dueDate,

    clientId:
      invoice.clientId,

    clientCode:
      invoice.clientCode,

    clientName:
      invoice.clientName,

    contactPerson:
      invoice.contactPerson,

    contactMobile:
      invoice.contactMobile,

    contactEmail:
      invoice.contactEmail,

    clientProductId:
      invoice.clientProductId,

    productId:
      invoice.productId,

    productCode:
      invoice.productCode,

    productName:
      invoice.productName,

    productVersion:
      invoice.productVersion,

    plan:
      invoice.plan,

    licensedUsers:
      invoice.licensedUsers,

    taxableAmount:
      invoice.taxableAmount,

    cgstRate:
      invoice.cgstRate,

    cgstAmount:
      invoice.cgstAmount,

    sgstRate:
      invoice.sgstRate,

    sgstAmount:
      invoice.sgstAmount,

    igstRate:
      invoice.igstRate,

    igstAmount:
      invoice.igstAmount,

    totalTaxAmount:
      invoice.totalTaxAmount,

    totalAmount:
      invoice.totalAmount,

    paidAmount:
      invoice.paidAmount,

    pendingAmount:
      invoice.pendingAmount,

    /*
     * Contract status remains the overall AMC status.
     */
    status:
      contract.status,

    invoicePaymentStatus:
      invoice.paymentStatus,

    currentInvoice:
      invoiceData,

    invoice:
      invoiceData,
  };
}

function amcContractResponse(
  contract
) {
  return {
    id:
      contract._id,

    _id:
      contract._id,

    contractCode:
      contract.contractCode,
          currentInvoiceId:
      contract.currentInvoiceId,

    currentInvoiceCode:
      contract.currentInvoiceCode,

    invoiceCode:
      contract.invoiceCode,

    invoiceDate:
      contract.invoiceDate,

    clientId:
      contract.clientId,

    clientCode:
      contract.clientCode,

    clientName:
      contract.clientName,

    contactPerson:
      contract.contactPerson,

    contactMobile:
      contract.contactMobile,

    contactEmail:
      contract.contactEmail,

    clientProductId:
      contract.clientProductId,

    productId:
      contract.productId,

    productCode:
      contract.productCode,

    productName:
      contract.productName,

    productVersion:
      contract.productVersion,

    plan:
      contract.plan,

    licensedUsers:
      contract.licensedUsers,

    startDate:
      contract.startDate,

    expiryDate:
      contract.expiryDate,

    dueDate:
      contract.dueDate,

    taxableAmount:
      contract.taxableAmount,

    cgstRate:
      contract.cgstRate,

    cgstAmount:
      contract.cgstAmount,

    sgstRate:
      contract.sgstRate,

    sgstAmount:
      contract.sgstAmount,

    igstRate:
      contract.igstRate,

    igstAmount:
      contract.igstAmount,

    totalTaxAmount:
      contract.totalTaxAmount,

    totalAmount:
      contract.totalAmount,

    paidAmount:
      contract.paidAmount,

    pendingAmount:
      contract.pendingAmount,

    status:
      contract.status,

    assignedEmployeeId:
      contract.assignedEmployeeId,

    assignedEmployeeCode:
      contract.assignedEmployeeCode,

    assignedEmployeeName:
      contract.assignedEmployeeName,

    reminderStatus:
      contract.reminderStatus,

    lastReminderAt:
      contract.lastReminderAt,

    nextFollowUpDate:
      contract.nextFollowUpDate,

    notes:
      contract.notes,

   renewalHistory:
  contract.renewalHistory,

documents:
  (contract.documents || [])
    .filter(
      (document) =>
        !document.isDeleted &&
        document.status !==
          "Archived"
    )
    .map(
      (document) => ({
        id:
          document._id,

        _id:
          document._id,

        type:
          document.documentType,

        documentType:
          document.documentType,

        name:
          document.fileName,

        fileName:
          document.fileName,

        mimeType:
          document.mimeType,

        size:
          document.fileSize,

        fileSize:
          document.fileSize,

        source:
          document.source,

        status:
          document.status,

        uploadedByName:
          document.uploadedByName,

        uploadedAt:
          document.uploadedAt,

        previewUrl:
          `/api/admin/amc/contract/${contract._id}/document/${document._id}/view`,

        downloadUrl:
          `/api/admin/amc/contract/${contract._id}/document/${document._id}/download`,
      })
    ),

timeline:
  contract.timeline,

    createdBy:
      contract.createdBy,

    createdByName:
      contract.createdByName,

    updatedBy:
      contract.updatedBy,

    updatedByName:
      contract.updatedByName,

    createdAt:
      contract.createdAt,

    updatedAt:
      contract.updatedAt,
  };
}

function amcPaymentResponse(
  payment
) {
  return {
    id:
      payment._id,

    _id:
      payment._id,

    paymentCode:
      payment.paymentCode,

    amcContractId:
      payment.amcContractId,
            amcInvoiceId:
      payment.amcInvoiceId,

    contractCode:
      payment.contractCode,

    invoiceCode:
      payment.invoiceCode,

    clientId:
      payment.clientId,

    clientCode:
      payment.clientCode,

    clientName:
      payment.clientName,

    productId:
      payment.productId,

    productCode:
      payment.productCode,

    productName:
      payment.productName,

    amount:
      payment.amount,

    paymentDate:
      payment.paymentDate,

    mode:
      payment.mode,

    referenceNo:
      payment.referenceNo,

    notes:
      payment.notes,

    receivedBy:
      payment.receivedBy,

    receivedByName:
      payment.receivedByName,

    createdAt:
      payment.createdAt,

    updatedAt:
      payment.updatedAt,
  };
}

function amcReminderResponse(
  reminder
) {
  return {
    id:
      reminder._id,

    _id:
      reminder._id,

    amcContractId:
      reminder.amcContractId,

    contractCode:
      reminder.contractCode,

    clientId:
      reminder.clientId,

    clientCode:
      reminder.clientCode,

    clientName:
      reminder.clientName,

    channel:
      reminder.channel,

    message:
      reminder.message,

    assignedEmployeeId:
      reminder.assignedEmployeeId,

    assignedEmployeeCode:
      reminder.assignedEmployeeCode,

    assignedEmployeeName:
      reminder.assignedEmployeeName,

    followUpDate:
      reminder.followUpDate,

    notes:
      reminder.notes,

    sentAt:
      reminder.sentAt,

    sentBy:
      reminder.sentBy,

    sentByName:
      reminder.sentByName,

    status:
      reminder.status,

    createdAt:
      reminder.createdAt,

    updatedAt:
      reminder.updatedAt,
  };
}
/* =====================================================
 TASK HELPERS
===================================================== */
function generateTicketCode() {
  const year =
    new Date().getFullYear();

  const uniquePart =
    `${Date.now()}${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0")}`.slice(-8);

  return `TKT-${year}-${uniquePart}`;
}

function generateTaskCode() {
  const year = new Date().getFullYear();

  const uniquePart = `${Date.now()}${Math.floor(
    Math.random() * 1000
  )
    .toString()
    .padStart(3, "0")}`.slice(-8);

  return `TSK-${year}-${uniquePart}`;
}

function normalizeObjectId(value) {
  if (!value) {
    return null;
  }

  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
}

async function createActivityLog({
  action,
  category = "System",
  description = "",
  entityType = "system",
  entityId = null,
  entityCode = "",
  entityName = "",
  clientId = null,
  clientName = "",
  employeeId = null,
  employeeName = "",
  performedBy = null,
  performedByName = "",
  performedByRole = "system",
  metadata = {},
}) {
  try {
    return await ActivityLog.create({
      action: String(action || "").trim(),

      category,

      description:
        String(description || "").trim(),

      entityType,

      entityId: normalizeObjectId(entityId),

      entityCode:
        String(entityCode || "").trim(),

      entityName:
        String(entityName || "").trim(),

      clientId: normalizeObjectId(clientId),

      clientName:
        String(clientName || "").trim(),

      employeeId:
        normalizeObjectId(employeeId),

      employeeName:
        String(employeeName || "").trim(),

      performedBy:
        normalizeObjectId(performedBy),

      performedByName:
        String(performedByName || "").trim(),

      performedByRole,

      metadata:
        metadata &&
          typeof metadata === "object"
          ? metadata
          : {},
    });
  } catch (error) {
    /*
     * Activity logging must never break the main API.
     */
    console.error(
      "Create activity log error:",
      error
    );

    return null;
  }
}

function productResponse(product) {
  return {
    id: product._id,
    _id: product._id,

    productCode:
      product.productCode,

    productName:
      product.productName,

    category:
      product.category,

    description:
      product.description,

    currentVersion:
      product.currentVersion,

    platform:
      product.platform,

    status:
      product.status,

    releaseDate:
      product.releaseDate,

    createdBy:
      product.createdBy,

    createdByName:
      product.createdByName,

    updatedBy:
      product.updatedBy,

    updatedByName:
      product.updatedByName,

    createdAt:
      product.createdAt,

    updatedAt:
      product.updatedAt,
  };
}
function rejectLockedProject(
  project,
  res
) {
  if (
    project?.convertedToProduct === true
  ) {
    res.status(409).json({
      success: false,

      code:
        "PROJECT_LOCKED",

      message:
        "This project has been converted to a product and is now a read-only historical record.",

      data:
        projectResponse(
          project
        ),
    });

    return true;
  }

  return false;
}

function projectResponse(project) {
  return {
    id: project._id,
    _id: project._id,

    projectCode:
      project.projectCode,

    projectName:
      project.projectName,

    projectType:
      project.projectType,

    productId:
      project.productId,

    productCode:
      project.productCode,

    productName:
      project.productName,

    clientId:
      project.clientId,

    clientCode:
      project.clientCode,

    clientName:
      project.clientName,
      requirementId:
  project.requirementId,

requirementCode:
  project.requirementCode,

finalAmount:
  Number(
    project.finalAmount || 0
  ),

amcApplicable:
  Boolean(
    project.amcApplicable
  ),

proposedAmcAmount:
  Number(
    project.proposedAmcAmount || 0
  ),

warrantyEndDate:
  project.warrantyEndDate,
  deliveryDate:
  project.deliveryDate,

amcContractId:
  project.amcContractId,

amcContractCode:
  project.amcContractCode,

amcActivated:
  Boolean(
    project.amcActivated
  ),

completedBy:
  project.completedBy,

completedByName:
  project.completedByName,

  convertedToProduct:
  Boolean(
    project.convertedToProduct
  ),

convertedProductAt:
  project.convertedProductAt,

convertedProductBy:
  project.convertedProductBy,

convertedProductByName:
  project.convertedProductByName,

isReadOnly:
  Boolean(
    project.convertedToProduct
  ),
    description:
      project.description,

    startDate:
      project.startDate,

    dueDate:
      project.dueDate,

    completedDate:
      project.completedDate,

    priority:
      project.priority,

    status:
      project.status,

    progress:
      project.progress,

    createdBy:
      project.createdBy,

    createdByName:
      project.createdByName,

    updatedBy:
      project.updatedBy,

    updatedByName:
      project.updatedByName,

    createdAt:
      project.createdAt,

    updatedAt:
      project.updatedAt,
  };
}

/* =====================================================
   CLIENT HELPERS
===================================================== */

/* =====================================================
   CLIENT LOGIN HELPERS
===================================================== */

function generateTemporaryPassword() {
  const upper =
    "ABCDEFGHJKLMNPQRSTUVWXYZ";

  const lower =
    "abcdefghijkmnopqrstuvwxyz";

  const numbers =
    "23456789";

  const symbols =
    "@#$!";

  const randomCharacter = (
    characters
  ) =>
    characters[
    crypto.randomInt(
      0,
      characters.length
    )
    ];

  const requiredCharacters = [
    randomCharacter(upper),
    randomCharacter(lower),
    randomCharacter(numbers),
    randomCharacter(symbols),
  ];

  const allCharacters =
    upper +
    lower +
    numbers +
    symbols;

  while (
    requiredCharacters.length < 10
  ) {
    requiredCharacters.push(
      randomCharacter(
        allCharacters
      )
    );
  }

  for (
    let index =
      requiredCharacters.length -
      1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      crypto.randomInt(
        0,
        index + 1
      );

    [
      requiredCharacters[index],
      requiredCharacters[
      randomIndex
      ],
    ] = [
        requiredCharacters[
        randomIndex
        ],
        requiredCharacters[index],
      ];
  }

  return requiredCharacters.join(
    ""
  );
}

function mapClientStatusToUserStatus(
  clientStatus
) {
  if (
    clientStatus === "Active"
  ) {
    return "Active";
  }

  if (
    clientStatus ===
    "Suspended"
  ) {
    return "Blocked";
  }

  return "Inactive";
}

async function findClientUser(
  client
) {
  if (!client) {
    return null;
  }

  let user =
    await User.findOne({
      role: "client",
      clientId: client._id,
    });

  if (
    !user &&
    client.email
  ) {
    user =
      await User.findOne({
        role: "client",
        email:
          String(
            client.email
          )
            .trim()
            .toLowerCase(),
      });
  }

  return user;
}

async function syncClientUser(
  client
) {
  const existingUser =
    await findClientUser(
      client
    );

  if (!existingUser) {
    return null;
  }

  existingUser.name =
    client.contactPerson ||
    client.companyName;

  existingUser.email =
    String(
      client.email || ""
    )
      .trim()
      .toLowerCase();

  existingUser.mobile =
    client.mobile || "";

  existingUser.clientId =
    client._id;

  existingUser.clientCode =
    client.clientCode;

  existingUser.companyName =
    client.companyName;

  existingUser.status =
    mapClientStatusToUserStatus(
      client.status
    );

  await existingUser.save();

  return existingUser;
}

function clientProductResponse(product = {}) {
  return {
    id:
      product._id ||
      product.id ||
      "",

    _id:
      product._id ||
      product.id ||
      "",

    productId:
      product.productId?._id ||
      product.productId ||
      null,

    productCode:
      product.productCode ||
      product.productId?.productCode ||
      "",

    productName:
      product.productName ||
      product.productId?.productName ||
      "",

    version:
      product.version ||
      product.productId?.currentVersion ||
      "v1.0.0",

    purchaseDate:
      product.purchaseDate ||
      "",

    installationDate:
      product.installationDate ||
      "",

    licensedUsers:
      Math.max(
        Number(
          product.licensedUsers ||
          1
        ),
        1
      ),

    supportType:
      product.supportType ||
      "Standard",

    amcStatus:
      product.amcStatus ||
      "Not Started",

    expiryDate:
      product.expiryDate ||
      "",

    installationStatus:
      product.installationStatus ||
      "Installed",

    notes:
      product.notes ||
      "",

    createdAt:
      product.createdAt ||
      null,

    updatedAt:
      product.updatedAt ||
      null,
  };
}
function clientResponse(client) {
  return {
    id: client._id,
    _id: client._id,

    clientCode:
      client.clientCode,

    companyName:
      client.companyName,

    contactPerson:
      client.contactPerson,

    email:
      client.email,
    userId:
      client.userId || null,

    loginEnabled:
      client.loginEnabled !==
      false,

    loginCreatedAt:
      client.loginCreatedAt ||
      null,

    mobile:
      client.mobile,

    city:
      client.city,

    products:
      Array.isArray(client.products)
        ? client.products.map(
          clientProductResponse
        )
        : [],

    productCount:
      Array.isArray(client.products)
        ? client.products.length
        : 0,

    amcStatus:
      client.amcStatus,

    nextRenewal:
      client.nextRenewal,

    openTickets:
      Number(
        client.openTickets || 0
      ),


assignedEmployeeId:
  client.assignedEmployeeId?._id ||
  client.assignedEmployeeId ||
  null,

assignedEmployeeCode:
  client.assignedEmployeeCode ||
  client.assignedEmployeeId
    ?.employeeCode ||
  "",

assignedEmployeeName:
  client.assignedEmployeeName ||
  client.assignedEmployeeId
    ?.name ||
  "Unassigned",



    status:
      client.status,

    createdBy:
      client.createdBy,

    createdByName:
      client.createdByName,

    updatedBy:
      client.updatedBy,

    updatedByName:
      client.updatedByName,

    createdAt:
      client.createdAt,

    updatedAt:
      client.updatedAt,
  };
}

async function resolveClientProduct(
  productData = {}
) {
  const productId =
    productData.productId;

  if (!productId) {
    throw new Error(
      "Product ID is required."
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      productId
    )
  ) {
    throw new Error(
      "Invalid product ID."
    );
  }

  const product =
    await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

  if (!product) {
    throw new Error(
      "Selected product was not found."
    );
  }

  if (
    product.status !== "Active"
  ) {
    throw new Error(
      `${product.productName} is not active.`
    );
  }

 return {
  productId: product._id,
  productCode: product.productCode,
  productName: product.productName,
  version: product.currentVersion || product.version || "v1.0.0",

  purchaseDate: productData.purchaseDate || "",
  installationDate: productData.installationDate || "",

  licenceType: productData.licenceType || "Annual Licence",
  licenceKey: productData.licenceKey || "",

  licensedUsers: productData.licensedUsers || 1,
  activeUsers: productData.activeUsers || 0,

  supportType: productData.supportType || "Standard",
  amcStatus: productData.amcStatus || "Not Started",
  expiryDate: productData.expiryDate || "",

  installationStatus: productData.installationStatus || "Installed",

  serverType: productData.serverType || "",
  database: productData.database || "",
  assignedEngineer: productData.assignedEngineer || "Support Team",

  modules: productData.modules || [],
  documents: productData.documents || [],

  notes: productData.notes || ""
};
}

async function resolveClientProducts(
  products = []
) {
  if (!Array.isArray(products)) {
    return [];
  }

  const resolvedProducts = [];
  const usedProductIds =
    new Set();

  for (const item of products) {
    const resolved =
      await resolveClientProduct(
        item
      );

    const key =
      String(
        resolved.productId
      );

    if (
      usedProductIds.has(key)
    ) {
      throw new Error(
        `${resolved.productName} is assigned more than once.`
      );
    }

    usedProductIds.add(key);
    resolvedProducts.push(
      resolved
    );
  }

  return resolvedProducts;
}

function taskResponse(task) {
  return {
    id:
      task._id,

    _id:
      task._id,

    taskCode:
      task.taskCode,

    title:
      task.title,

    description:
      task.description,

    workType:
      task.workType,
    taskFor:
      task.taskFor,

    generalTaskFor:
      task.generalTaskFor,

    clientId:
      task.clientId,

    clientName:
      task.clientName,

    productId:
      task.productId,

    productCode:
      task.productCode,

    productName:
      task.productName,

    projectId:
      task.projectId,

    projectCode:
      task.projectCode,

    projectName:
      task.projectName,

    ticketId:
      task.ticketId,

    ticketCode:
      task.ticketCode,

    assignedEmployeeId:
      task.assignedEmployeeId,

    assignedEmployeeName:
      task.assignedEmployeeName,

    assignedEmployeeCode:
      task.assignedEmployeeCode,

    assignedBy:
      task.assignedBy,

    assignedByName:
      task.assignedByName,

    priority:
      task.priority,

    status:
      task.status,

    progress:
      task.progress,

    startDate:
      task.startDate,

    dueDate:
      task.dueDate,

    completedAt:
      task.completedAt,

    estimatedMinutes:
      task.estimatedMinutes,

    spentMinutes:
      task.spentMinutes,

    startedAt: task.startedAt,
    pausedAt: task.pausedAt,
    totalPausedMinutes: task.totalPausedMinutes,
    elapsedMinutes: task.elapsedMinutes,
    elapsedSeconds: task.elapsedSeconds,
    lastUpdated: task.lastUpdated,

    resolutionNote:
      task.resolutionNote,

    timeline:
      task.timeline,

    comments:
      task.comments,

    attachments:
      task.attachments,

    createdAt:
      task.createdAt,

    updatedAt:
      task.updatedAt,
  };
}
function ticketResponse(ticket) {
  return {
    id: ticket._id,
    _id: ticket._id,

    ticketCode:
      ticket.ticketCode,

    title: ticket.title,
    description:
      ticket.description,

    clientId: ticket.clientId,
    clientCode:
      ticket.clientCode,
    clientName:
      ticket.clientName,

    contactPerson:
      ticket.contactPerson,
    contactMobile:
      ticket.contactMobile,
    contactEmail:
      ticket.contactEmail,

    productId:
      ticket.productId,
    productName:
      ticket.productName,
    productVersion:
      ticket.productVersion,

    module: ticket.module,
    category: ticket.category,

    source: ticket.source,
    priority: ticket.priority,
    status: ticket.status,

    assignedEmployeeId:
      ticket.assignedEmployeeId,
    assignedEmployeeName:
      ticket.assignedEmployeeName,
    assignedEmployeeCode:
      ticket.assignedEmployeeCode,

    assignedAt:
      ticket.assignedAt,
    assignedBy:
      ticket.assignedBy,
    assignedByName:
      ticket.assignedByName,

    dueDate: ticket.dueDate,
    firstResponseAt:
      ticket.firstResponseAt,

    resolvedAt:
      ticket.resolvedAt,
    verifiedAt:
      ticket.verifiedAt,
    closedAt:
      ticket.closedAt,

    resolutionNote:
      ticket.resolutionNote,
    rootCause:
      ticket.rootCause,

    linkedTaskId:
      ticket.linkedTaskId,
    linkedTaskCode:
      ticket.linkedTaskCode,

    spentMinutes:
      ticket.spentMinutes,

    replies:
      ticket.replies,

    attachments:
      ticket.attachments,

    timeline:
      ticket.timeline,

    replyCount:
      Array.isArray(ticket.replies)
        ? ticket.replies.length
        : 0,

    attachmentCount:
      Array.isArray(
        ticket.attachments
      )
        ? ticket.attachments.length
        : 0,

    createdBy:
      ticket.createdBy,

    createdByName:
      ticket.createdByName,

    createdByRole:
      ticket.createdByRole,

    createdAt:
      ticket.createdAt,

    updatedAt:
      ticket.updatedAt,
  };
}

async function findEmployeeById(employeeId) {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return null;
  }

  return mongoose.connection
    .collection("employees")
    .findOne({
      _id: new mongoose.Types.ObjectId(employeeId),
      isActive: {
        $ne: false,
      },
    });
}
async function resolveClientEmployee(
  employeeId,
  {
    required = false,
  } = {}
) {
  const normalizedEmployeeId =
    String(employeeId || "").trim();

  if (!normalizedEmployeeId) {
    if (required) {
      throw new Error(
        "Please select an assigned employee."
      );
    }

    return {
      assignedEmployeeId: null,
      assignedEmployeeCode: "",
      assignedEmployeeName: "",
    };
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      normalizedEmployeeId
    )
  ) {
    throw new Error(
      "Invalid assigned employee ID."
    );
  }

  const employee =
    await findEmployeeById(
      normalizedEmployeeId
    );

  if (!employee) {
    throw new Error(
      "Selected employee was not found or is inactive."
    );
  }

  return {
    assignedEmployeeId:
      employee._id,

    assignedEmployeeCode:
      String(
        employee.employeeCode || ""
      )
        .trim()
        .toUpperCase(),

    assignedEmployeeName:
      String(
        employee.name || ""
      ).trim(),
  };
}



async function updateEmployeeTaskSummary(
  employeeId,
  changes
) {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return;
  }

  await mongoose.connection
    .collection("employees")
    .updateOne(
      {
        _id: new mongoose.Types.ObjectId(employeeId),
      },
      changes
    );
}
/* =====================================================
   SMART EMPLOYEE AUTO ASSIGNMENT
===================================================== */

async function findBestEmployeeForTask({
  clientId = null,
  preferredEmployeeId = null,
} = {}) {
  /*
   * Assignment order:
   *
   * 1. Client's assigned employee if FREE
   * 2. Any other FREE employee with least workload
   * 3. If nobody FREE -> employee with least workload
   *
   * Employees on Leave / Break / Offline / Inactive
   * are not automatically assigned.
   */

  const employeesCollection =
    mongoose.connection.collection("employees");

  /* =========================================
     FIND CLIENT'S PREFERRED EMPLOYEE
  ========================================= */

  let clientPreferredEmployeeId =
    preferredEmployeeId || null;

  if (
    !clientPreferredEmployeeId &&
    clientId &&
    mongoose.Types.ObjectId.isValid(clientId)
  ) {
    const client = await Client.findById(clientId)
      .select("assignedEmployeeId")
      .lean();

    if (client?.assignedEmployeeId) {
      clientPreferredEmployeeId =
        client.assignedEmployeeId;
    }
  }

  /* =========================================
     LOAD ELIGIBLE EMPLOYEES
  ========================================= */

  const employees = await employeesCollection
    .find({
      isActive: {
        $ne: false,
      },

      status: {
        $nin: [
          "Leave",
          "Break",
          "Offline",
          "Inactive",
        ],
      },
    })
    .toArray();

  if (!employees.length) {
    return null;
  }

  /* =========================================
     GET REAL ACTIVE TASK COUNTS
  ========================================= */

  const employeeIds = employees.map(
    (employee) => employee._id
  );

  const taskCounts = await Task.aggregate([
    {
      $match: {
        assignedEmployeeId: {
          $in: employeeIds,
        },

        isDeleted: false,

        status: {
          $nin: [
            "Completed",
            "Closed",
            "Cancelled",
          ],
        },
      },
    },

    {
      $group: {
        _id: "$assignedEmployeeId",
        activeTasks: {
          $sum: 1,
        },
      },
    },
  ]);

  const taskCountMap = new Map(
    taskCounts.map((item) => [
      String(item._id),
      Number(item.activeTasks || 0),
    ])
  );

  /* =========================================
     GET ACTIVE TICKET COUNTS
  ========================================= */

  const ticketCounts =
    await SupportTicket.aggregate([
      {
        $match: {
          assignedEmployeeId: {
            $in: employeeIds,
          },

          isDeleted: false,

          status: {
            $nin: [
              "Resolved",
              "Verified",
              "Closed",
              "Cancelled",
            ],
          },
        },
      },

      {
        $group: {
          _id: "$assignedEmployeeId",

          activeTickets: {
            $sum: 1,
          },
        },
      },
    ]);

  const ticketCountMap = new Map(
    ticketCounts.map((item) => [
      String(item._id),
      Number(item.activeTickets || 0),
    ])
  );

  /* =========================================
     BUILD WORKLOAD INFORMATION
  ========================================= */

  const rankedEmployees = employees.map(
    (employee) => {
      const activeTasks =
        taskCountMap.get(
          String(employee._id)
        ) || 0;

      const activeTickets =
        ticketCountMap.get(
          String(employee._id)
        ) || 0;

      return {
        employee,

        activeTasks,

        activeTickets,

        workload:
          activeTasks + activeTickets,
      };
    }
  );

  /* =========================================
     RULE 1:
     CLIENT ASSIGNED EMPLOYEE IF FREE
  ========================================= */

  if (
    clientPreferredEmployeeId &&
    mongoose.Types.ObjectId.isValid(
      clientPreferredEmployeeId
    )
  ) {
    const preferred =
      rankedEmployees.find(
        (item) =>
          String(item.employee._id) ===
          String(clientPreferredEmployeeId)
      );

    if (
      preferred &&
      preferred.employee.status === "Free"
    ) {
      return {
        employee: preferred.employee,

        reason:
          "CLIENT_ASSIGNED_EMPLOYEE_FREE",

        workload:
          preferred.workload,

        activeTasks:
          preferred.activeTasks,

        activeTickets:
          preferred.activeTickets,
      };
    }
  }

  /* =========================================
     RULE 2:
     FIND OTHER FREE EMPLOYEE
  ========================================= */

  const freeEmployees =
    rankedEmployees
      .filter(
        (item) =>
          item.employee.status === "Free"
      )
      .sort((a, b) => {
        if (a.workload !== b.workload) {
          return (
            a.workload - b.workload
          );
        }

        return (
          a.activeTasks -
          b.activeTasks
        );
      });

  if (freeEmployees.length) {
    const selected =
      freeEmployees[0];

    return {
      employee:
        selected.employee,

      reason:
        "FREE_EMPLOYEE_LEAST_WORKLOAD",

      workload:
        selected.workload,

      activeTasks:
        selected.activeTasks,

      activeTickets:
        selected.activeTickets,
    };
  }

  /* =========================================
     RULE 3:
     NOBODY FREE -> LEAST WORKLOAD
  ========================================= */

  const workingEmployees =
    rankedEmployees
      .filter(
        (item) =>
          item.employee.status === "Working"
      )
      .sort((a, b) => {
        if (a.workload !== b.workload) {
          return (
            a.workload - b.workload
          );
        }

        return (
          a.activeTasks -
          b.activeTasks
        );
      });

  if (!workingEmployees.length) {
    return null;
  }

  const selected =
    workingEmployees[0];

  return {
    employee:
      selected.employee,

    reason:
      "WORKING_EMPLOYEE_LEAST_WORKLOAD",

    workload:
      selected.workload,

    activeTasks:
      selected.activeTasks,

    activeTickets:
      selected.activeTickets,
  };
}
async function normalizeEmployeeTaskCounts(
  employeeId
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      employeeId
    )
  ) {
    return;
  }

  const objectId =
    new mongoose.Types.ObjectId(
      employeeId
    );

  const activeTaskCount =
    await Task.countDocuments({
      assignedEmployeeId: objectId,

      isDeleted: false,

      status: {
        $nin: [
          "Completed",
          "Closed",
          "Cancelled",
        ],
      },
    });

  const completedTodayStart =
    new Date();

  completedTodayStart.setHours(
    0,
    0,
    0,
    0
  );

  const completedTodayCount =
    await Task.countDocuments({
      assignedEmployeeId: objectId,

      isDeleted: false,

      status: {
        $in: ["Completed", "Closed"],
      },

      completedAt: {
        $gte: completedTodayStart,
      },
    });

  await mongoose.connection
    .collection("employees")
    .updateOne(
      {
        _id: objectId,
      },
      {
        $set: {
          openTasks:
            activeTaskCount,

          completedToday:
            completedTodayCount,

          lastActivityAt:
            new Date(),
        },
      }
    );
}

async function normalizeClientOpenTicketCount(
  clientId
) {
  if (
    !mongoose.Types.ObjectId.isValid(
      clientId
    )
  ) {
    return;
  }

  const objectId =
    new mongoose.Types.ObjectId(
      clientId
    );

  const openTicketCount =
    await SupportTicket.countDocuments({
      clientId: objectId,

      isDeleted: false,

      status: {
        $nin: [
          "Resolved",
          "Verified",
          "Closed",
          "Cancelled",
        ],
      },
    });

  await Client.updateOne(
    {
      _id: objectId,
    },
    {
      $set: {
        openTickets:
          openTicketCount,
      },
    }
  );
}
/* =====================================================
   CREATE PRODUCT
   POST /api/admin/product
===================================================== */

router.post(
  "/product",
  async (req, res) => {
    try {
      const {
        productCode,
        productName,
        category,
        description,
        currentVersion,
        platform,
        status,
        releaseDate,
      } = req.body;

      const normalizedCode =
        String(
          productCode || ""
        )
          .trim()
          .toUpperCase();

      const normalizedName =
        String(
          productName || ""
        ).trim();

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            "Product code is required.",
        });
      }

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message:
            "Product name is required.",
        });
      }

      const duplicateProduct =
        await Product.findOne({
          isDeleted: false,

          $or: [
            {
              productCode:
                normalizedCode,
            },

            {
              productName: {
                $regex:
                  `^${normalizedName.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                  )}$`,

                $options: "i",
              },
            },
          ],
        });

      if (duplicateProduct) {
        return res.status(409).json({
          success: false,

          message:
            duplicateProduct.productCode ===
              normalizedCode
              ? "Product code already exists."
              : "Product name already exists.",
        });
      }


      const product =
        await Product.create({
          productCode:
            normalizedCode,

          productName:
            normalizedName,

          category:
            String(
              category || "Software"
            ).trim(),

          description:
            String(
              description || ""
            ).trim(),

          currentVersion:
            String(
              currentVersion ||
              "v1.0.0"
            ).trim(),

          platform:
            platform || "Web",

          status:
            status || "Active",

          releaseDate:
            releaseDate
              ? new Date(
                releaseDate
              )
              : null,

          createdBy:
            req.user._id,

          createdByName:
            req.user.name ||
            "Admin",

          updatedBy:
            req.user._id,

          updatedByName:
            req.user.name ||
            "Admin",
        });

      await createActivityLog({
        action:
          "Product Created",

        category:
          "Product",

        description:
          `${product.productName} was added to Product Master.`,

        entityType:
          "product",

        entityId:
          product._id,

        entityCode:
          product.productCode,

        entityName:
          product.productName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          category:
            product.category,

          version:
            product.currentVersion,

          platform:
            product.platform,

          status:
            product.status,
        },
      });

      return res.status(201).json({
        success: true,

        message:
          "Product created successfully.",

        data:
          productResponse(product),
      });
    } catch (error) {
      console.error(
        "Create product error:",
        error
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "Product code already exists.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to create product.",
      });
    }
  }
);


/* =====================================================
   GET ALL PRODUCTS
   GET /api/admin/products
===================================================== */

router.get(
  "/products",
  async (req, res) => {
    try {
      const {
        search = "",
        status = "All",
        category = "All",
        platform = "All",
      } = req.query;

      const query = {
        isDeleted: false,
      };

      if (
        status &&
        status !== "All"
      ) {
        query.status = status;
      }

      if (
        category &&
        category !== "All"
      ) {
        query.category =
          category;
      }

      if (
        platform &&
        platform !== "All"
      ) {
        query.platform =
          platform;
      }

      const normalizedSearch =
        String(search || "").trim();

      if (normalizedSearch) {
        query.$or = [
          {
            productCode: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },

          {
            productName: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },

          {
            category: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },

          {
            description: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },

          {
            currentVersion: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },
        ];
      }

      const products =
        await Product.find(query)
          .sort({
            productName: 1,
          });

      const stats = {
        totalProducts:
          products.length,

        activeProducts:
          products.filter(
            (product) =>
              product.status ===
              "Active"
          ).length,

        inactiveProducts:
          products.filter(
            (product) =>
              product.status ===
              "Inactive"
          ).length,

        deprecatedProducts:
          products.filter(
            (product) =>
              product.status ===
              "Deprecated"
          ).length,
      };

      return res.status(200).json({
        success: true,

        count:
          products.length,

        stats,

        data:
          products.map(
            productResponse
          ),
      });
    } catch (error) {
      console.error(
        "Load products error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load products.",
      });
    }
  }
);

/* =====================================================
   GET ONE PRODUCT
   GET /api/admin/product/:id
===================================================== */

router.get(
  "/product/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      const product =
        await Product.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data:
          productResponse(product),
      });
    } catch (error) {
      console.error(
        "Get product error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load product.",
      });
    }
  }
);

/* =====================================================
   UPDATE PRODUCT
   PUT /api/admin/product/:id
===================================================== */

router.put(
  "/product/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      const product =
        await Product.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const {
        productCode,
        productName,
        category,
        description,
        currentVersion,
        platform,
        status,
        releaseDate,
      } = req.body;

      const normalizedCode =
        String(
          productCode ??
          product.productCode
        )
          .trim()
          .toUpperCase();

      const normalizedName =
        String(
          productName ??
          product.productName
        ).trim();

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            "Product code is required.",
        });
      }

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message:
            "Product name is required.",
        });
      }

      const duplicateProduct =
        await Product.findOne({
          _id: {
            $ne: id,
          },

          isDeleted: false,

          $or: [
            {
              productCode:
                normalizedCode,
            },

            {
              productName: {
                $regex:
                  `^${normalizedName.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                  )}$`,

                $options: "i",
              },
            },
          ],
        });

      if (duplicateProduct) {
        return res.status(409).json({
          success: false,

          message:
            duplicateProduct.productCode ===
              normalizedCode
              ? "Another product already uses this product code."
              : "Another product already uses this product name.",
        });
      }

      const previousData = {
        productCode:
          product.productCode,

        productName:
          product.productName,

        category:
          product.category,

        currentVersion:
          product.currentVersion,

        platform:
          product.platform,

        status:
          product.status,
      };

      product.productCode =
        normalizedCode;

      product.productName =
        normalizedName;

      product.category =
        String(
          category ??
          product.category ??
          "Software"
        ).trim();

      product.description =
        String(
          description ??
          product.description ??
          ""
        ).trim();

      product.currentVersion =
        String(
          currentVersion ??
          product.currentVersion ??
          "v1.0.0"
        ).trim();

      if (
        platform !== undefined
      ) {
        product.platform =
          platform;
      }

      if (
        status !== undefined
      ) {
        product.status =
          status;
      }

      if (
        releaseDate !== undefined
      ) {
        product.releaseDate =
          releaseDate
            ? new Date(
              releaseDate
            )
            : null;
      }

      product.updatedBy =
        req.user._id;

      product.updatedByName =
        req.user.name ||
        "Admin";

      await product.save();

      await createActivityLog({
        action:
          "Product Updated",

        category:
          "Product",

        description:
          `${product.productName} information was updated.`,

        entityType:
          "product",

        entityId:
          product._id,

        entityCode:
          product.productCode,

        entityName:
          product.productName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          previous:
            previousData,

          current: {
            productCode:
              product.productCode,

            productName:
              product.productName,

            category:
              product.category,

            currentVersion:
              product.currentVersion,

            platform:
              product.platform,

            status:
              product.status,
          },
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Product updated successfully.",

        data:
          productResponse(product),
      });
    } catch (error) {
      console.error(
        "Update product error:",
        error
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "Product code already exists.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update product.",
      });
    }
  }
);

/* =====================================================
   CHANGE PRODUCT STATUS
   PATCH /api/admin/product/:id/status
===================================================== */

router.patch(
  "/product/:id/status",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { status } =
        req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      const allowedStatuses = [
        "Active",
        "Inactive",
        "Deprecated",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product status.",
        });
      }

      const product =
        await Product.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const previousStatus =
        product.status;

      if (
        previousStatus === status
      ) {
        return res.status(200).json({
          success: true,

          message:
            "Product already has this status.",

          data:
            productResponse(product),
        });
      }

      product.status =
        status;

      product.updatedBy =
        req.user._id;

      product.updatedByName =
        req.user.name ||
        "Admin";

      await product.save();

      await createActivityLog({
        action:
          "Product Status Changed",

        category:
          "Product",

        description:
          `${product.productName} changed from ${previousStatus} to ${status}.`,

        entityType:
          "product",

        entityId:
          product._id,

        entityCode:
          product.productCode,

        entityName:
          product.productName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          previousStatus,
          currentStatus:
            status,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Product status updated successfully.",

        data:
          productResponse(product),
      });
    } catch (error) {
      console.error(
        "Change product status error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to change product status.",
      });
    }
  }
);
/* =====================================================
   CONVERT COMPLETED PROJECT TO PRODUCT
   POST /api/admin/project/:id/convert-to-product
===================================================== */

router.post(
  "/project/:id/convert-to-product",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project ID.",
        });
      }

      const project =
        await Project.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }
      if (
  project.convertedToProduct ===
  true
) {
  return res.status(409).json({
    success: false,

    code:
      "PROJECT_LOCKED",

    message:
      "This project has already been converted to a product. New project tasks cannot be created.",
  });
}

      /*
       * Already converted.
       */

      if (
        project.convertedToProduct
      ) {
        return res.status(409).json({
          success: false,

          code:
            "ALREADY_CONVERTED",

          message:
            "This project has already been converted to a product.",

          data:
            projectResponse(
              project
            ),
        });
      }

      /*
       * Only completed projects can
       * become permanent products.
       */

      if (
        project.status !==
          "Completed" ||
        Number(
          project.progress || 0
        ) < 100
      ) {
        return res.status(409).json({
          success: false,

          code:
            "PROJECT_NOT_COMPLETED",

          message:
            "Complete the project before converting it to a product.",
        });
      }

      /*
       * A project already linked to an
       * existing Product should not create
       * another Product.
       */

      if (project.productId) {
        return res.status(409).json({
          success: false,

          code:
            "PROJECT_ALREADY_HAS_PRODUCT",

          message:
            "This project is already linked to an existing product.",
        });
      }

      const {
        productCode,
        productName,

        category,
        description,

        currentVersion,
        platform,

        releaseDate,
      } = req.body || {};

      const normalizedCode =
        String(
          productCode || ""
        )
          .trim()
          .toUpperCase();

      const normalizedName =
        String(
          productName ||
            project.projectName ||
            ""
        ).trim();

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            "Product code is required.",
        });
      }

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message:
            "Product name is required.",
        });
      }

      /*
       * Prevent duplicate Product Code.
       */

      const duplicateProduct =
        await Product.findOne({
          productCode:
            normalizedCode,

          isDeleted:
            false,
        });

      if (duplicateProduct) {
        return res.status(409).json({
          success: false,
          message:
            "Product code already exists.",
        });
      }

      /*
       * Create Product Master record.
       */

      const product =
        await Product.create({
          productCode:
            normalizedCode,

          productName:
            normalizedName,

          category:
            String(
              category ||
                "Software"
            ).trim() ||
            "Software",

          description:
            String(
              description ||
                project.description ||
                ""
            ).trim(),

          currentVersion:
            String(
              currentVersion ||
                "v1.0.0"
            ).trim() ||
            "v1.0.0",

          platform:
            platform ||
            "Web",

          status:
            "Active",

          releaseDate:
            releaseDate
              ? new Date(
                  releaseDate
                )
              : project.deliveryDate ||
                project.completedDate ||
                new Date(),

          createdBy:
            req.user._id,

          createdByName:
            req.user.name ||
            "Admin",

          updatedBy:
            req.user._id,

          updatedByName:
            req.user.name ||
            "Admin",
        });

      /*
       * Link Product back to Project.
       */

      project.productId =
        product._id;

      project.productCode =
        product.productCode;

      project.productName =
        product.productName;

      /*
       * Permanently lock Project.
       */

      project.convertedToProduct =
        true;

      project.convertedProductAt =
        new Date();

      project.convertedProductBy =
        req.user._id;

      project.convertedProductByName =
        req.user.name ||
        "Admin";

      project.updatedBy =
        req.user._id;

      project.updatedByName =
        req.user.name ||
        "Admin";

      await project.save();

      await createActivityLog({
        action:
          "Project Converted To Product",

        category:
          "Project",

        description:
          `${project.projectCode} - ${project.projectName} was converted to product ${product.productCode} - ${product.productName}.`,

        entityType:
          "project",

        entityId:
          project._id,

        entityCode:
          project.projectCode,

        entityName:
          project.projectName,

        clientId:
          project.clientId,

        clientName:
          project.clientName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          productId:
            product._id,

          productCode:
            product.productCode,

          productName:
            product.productName,

          convertedAt:
            project.convertedProductAt,
        },
      });

      return res.status(201).json({
        success: true,

        message:
          "Project converted to product successfully. The project is now read-only.",

        data: {
          project:
            projectResponse(
              project
            ),

          product:
            productResponse(
              product
            ),
        },
      });
    } catch (error) {
      console.error(
        "Convert project to product error:",
        error
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,

          message:
            "Product code already exists.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to convert project to product.",
      });
    }
  }
);

/* =====================================================
   SOFT DELETE PRODUCT
   DELETE /api/admin/product/:id
===================================================== */

router.delete(
  "/product/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      const product =
        await Product.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      const linkedClientCount =
        await Client.countDocuments({
          "products.productId":
            product._id,
        });

      const linkedTicketCount =
        await SupportTicket.countDocuments({
          productId:
            product._id,

          isDeleted: false,
        });

      const linkedTaskCount =
        await Task.countDocuments({
          productId:
            product._id,

          isDeleted: false,
        });

      if (
        linkedClientCount > 0 ||
        linkedTicketCount > 0 ||
        linkedTaskCount > 0
      ) {
        return res.status(409).json({
          success: false,

          message:
            "This product is already used by clients, tickets or tasks. Mark it Inactive instead of deleting it.",

          usage: {
            clients:
              linkedClientCount,

            tickets:
              linkedTicketCount,

            tasks:
              linkedTaskCount,
          },
        });
      }

      product.isDeleted =
        true;

      product.deletedAt =
        new Date();

      product.deletedBy =
        req.user._id;

      product.deletedByName =
        req.user.name ||
        "Admin";

      product.status =
        "Inactive";

      await product.save();

      await createActivityLog({
        action:
          "Product Deleted",

        category:
          "Product",

        description:
          `${product.productName} was removed from Product Master.`,

        entityType:
          "product",

        entityId:
          product._id,

        entityCode:
          product.productCode,

        entityName:
          product.productName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          previousStatus:
            product.status,

          deletedAt:
            product.deletedAt,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Product deleted successfully.",

        data: {
          id:
            product._id,

          productCode:
            product.productCode,

          productName:
            product.productName,
        },
      });
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to delete product.",
      });
    }
  }
);

/* =====================================================
   SEED DEFAULT PRODUCTS
   POST /api/admin/products/seed
===================================================== */

router.post(
  "/products/seed",
  async (req, res) => {
    try {
      const defaultProducts = [
        {
          productCode:
            "PRD-001",

          productName:
            "NexERP",

          category:
            "ERP",

          description:
            "Enterprise resource planning and billing software.",

          currentVersion:
            "v1.0.0",

          platform:
            "Web + Desktop",

          status:
            "Active",
        },

        {
          productCode:
            "PRD-002",

          productName:
            "BillFlow",

          category:
            "Billing",

          description:
            "Billing, invoicing and customer account software.",

          currentVersion:
            "v1.0.0",

          platform:
            "Web + Desktop",

          status:
            "Active",
        },

        {
          productCode:
            "PRD-003",

          productName:
            "StockPro",

          category:
            "Inventory",

          description:
            "Stock, batch and warehouse management software.",

          currentVersion:
            "v1.0.0",

          platform:
            "Web + Desktop",

          status:
            "Active",
        },

        {
          productCode:
            "PRD-004",

          productName:
            "RetailPOS",

          category:
            "POS",

          description:
            "Retail billing and point-of-sale software.",

          currentVersion:
            "v1.0.0",

          platform:
            "Desktop",

          status:
            "Active",
        },

        {
          productCode:
            "PRD-005",

          productName:
            "PayrollIX",

          category:
            "Payroll",

          description:
            "Employee payroll and salary management.",

          currentVersion:
            "v1.0.0",

          platform:
            "Web + Desktop",

          status:
            "Active",
        },
      ];

      const results = [];

      for (
        const productData
        of defaultProducts
      ) {
        const existingProduct =
          await Product.findOne({
            $or: [
              {
                productCode:
                  productData.productCode,
              },

              {
                productName: {
                  $regex:
                    `^${productData.productName}$`,

                  $options: "i",
                },
              },
            ],
          });

        if (existingProduct) {
          results.push({
            productCode:
              existingProduct.productCode,

            productName:
              existingProduct.productName,

            action:
              "Skipped",

            reason:
              "Product already exists.",
          });

          continue;
        }

        const product =
          await Product.create({
            ...productData,

            createdBy:
              req.user._id,

            createdByName:
              req.user.name ||
              "Admin",

            updatedBy:
              req.user._id,

            updatedByName:
              req.user.name ||
              "Admin",
          });

        results.push({
          productCode:
            product.productCode,

          productName:
            product.productName,

          action:
            "Created",
        });
      }

      const products =
        await Product.find({
          isDeleted: false,
        }).sort({
          productName: 1,
        });

      return res.status(200).json({
        success: true,

        message:
          "Default product seed completed.",

        results,

        data:
          products.map(
            productResponse
          ),
      });
    } catch (error) {
      console.error(
        "Seed products error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to seed products.",
      });
    }
  }
);

/* =====================================================
   CREATE PROJECT
   POST /api/admin/project
===================================================== */

router.post(
  "/project",
  async (req, res) => {
    try {
      const {
        projectCode,
        projectName,
        projectType,
        productId,
        clientId,
        description,
        startDate,
        dueDate,
        priority,
        status,
        progress,
      } = req.body;

      const normalizedCode =
        String(projectCode || "")
          .trim()
          .toUpperCase();

      const normalizedName =
        String(projectName || "")
          .trim();

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            "Project code is required.",
        });
      }

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message:
            "Project name is required.",
        });
      }

      const duplicate =
        await Project.findOne({
          isDeleted: false,

          $or: [
            {
              projectCode:
                normalizedCode,
            },

            {
              projectName: {
                $regex:
                  `^${normalizedName.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                  )}$`,

                $options: "i",
              },
            },
          ],
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,

          message:
            duplicate.projectCode ===
              normalizedCode
              ? "Project code already exists."
              : "Project name already exists.",
        });
      }

      let resolvedProduct = null;

      if (productId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            productId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid product ID.",
          });
        }

        resolvedProduct =
          await Product.findOne({
            _id: productId,
            isDeleted: false,
          });

        if (!resolvedProduct) {
          return res.status(404).json({
            success: false,
            message:
              "Selected product was not found.",
          });
        }
      }

      let resolvedClient = null;

      if (clientId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            clientId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid client ID.",
          });
        }

        resolvedClient =
          await Client.findById(
            clientId
          );

        if (!resolvedClient) {
          return res.status(404).json({
            success: false,
            message:
              "Selected client was not found.",
          });
        }
      }

      const normalizedProgress =
        Math.min(
          Math.max(
            Number(progress || 0),
            0
          ),
          100
        );

      const normalizedStatus =
        status || "Planned";

      /*
       * Validate selected priority using
       * System Settings.
       */
      const selectedPriority =
        await validatePriority(
          priority || "Medium"
        );

      if (!selectedPriority) {
        return res.status(400).json({
          success: false,
          message:
            "Selected priority is invalid or inactive.",
        });
      }

      const project =
        await Project.create({
          projectCode:
            normalizedCode,

          projectName:
            normalizedName,

          projectType:
            projectType ||
            "Internal Development",

          productId:
            resolvedProduct?._id ||
            null,

          productCode:
            resolvedProduct?.productCode ||
            "",

          productName:
            resolvedProduct?.productName ||
            "",

          clientId:
            resolvedClient?._id ||
            null,

          clientCode:
            resolvedClient?.clientCode ||
            "",

          clientName:
            resolvedClient?.companyName ||
            "",

          description:
            String(
              description || ""
            ).trim(),

          startDate:
            startDate
              ? new Date(startDate)
              : null,

          dueDate:
            dueDate
              ? new Date(dueDate)
              : null,

          completedDate:
            normalizedStatus ===
              "Completed"
              ? new Date()
              : null,

          priority:
            selectedPriority.name,

          status:
            normalizedStatus,

          progress:
            normalizedStatus ===
              "Completed"
              ? 100
              : normalizedProgress,

          createdBy:
            req.user._id,

          createdByName:
            req.user.name ||
            "Admin",

          updatedBy:
            req.user._id,

          updatedByName:
            req.user.name ||
            "Admin",
        });

      await createActivityLog({
        action:
          "Project Created",

        category:
          "Project",

        description:
          `${project.projectName} was added to Project Master.`,

        entityType:
          "project",

        entityId:
          project._id,

        entityCode:
          project.projectCode,

        entityName:
          project.projectName,

        clientId:
          project.clientId,

        clientName:
          project.clientName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          projectType:
            project.projectType,

          productId:
            project.productId,

          productName:
            project.productName,

          priority:
            project.priority,

          status:
            project.status,

          progress:
            project.progress,
        },
      });

      return res.status(201).json({
        success: true,

        message:
          "Project created successfully.",

        data:
          projectResponse(project),
      });
    } catch (error) {
      console.error(
        "Create project error:",
        error
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "Project code already exists.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to create project.",
      });
    }
  }
);



/* =====================================================
   GET ALL PROJECTS
   GET /api/admin/projects
===================================================== */

router.get(
  "/projects",
  async (req, res) => {
    try {
      const {
        search = "",
        status = "All",
        projectType = "All",
        priority = "All",
        productId = "",
        clientId = "",
      } = req.query;

      const query = {
        isDeleted: false,
      };

      if (
        status &&
        status !== "All"
      ) {
        query.status = status;
      }

      if (
        projectType &&
        projectType !== "All"
      ) {
        query.projectType =
          projectType;
      }

      if (
        priority &&
        priority !== "All"
      ) {
        query.priority =
          priority;
      }

      if (productId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            productId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid product ID.",
          });
        }

        query.productId =
          productId;
      }

      if (clientId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            clientId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid client ID.",
          });
        }

        query.clientId =
          clientId;
      }

      const normalizedSearch =
        String(search || "").trim();

      if (normalizedSearch) {
        query.$or = [
          {
            projectCode: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },

          {
            projectName: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },

          {
            productName: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },

          {
            clientName: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },

          {
            description: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },
        ];
      }

      const projects =
        await Project.find(query)
          .sort({
            createdAt: -1,
          });

      const stats = {
        totalProjects:
          projects.length,

        plannedProjects:
          projects.filter(
            (project) =>
              project.status ===
              "Planned"
          ).length,

        activeProjects:
          projects.filter(
            (project) =>
              project.status ===
              "Active"
          ).length,

        onHoldProjects:
          projects.filter(
            (project) =>
              project.status ===
              "On Hold"
          ).length,

        completedProjects:
          projects.filter(
            (project) =>
              project.status ===
              "Completed"
          ).length,
      };

      return res.status(200).json({
        success: true,

        count:
          projects.length,

        stats,

        data:
          projects.map(
            projectResponse
          ),
      });
    } catch (error) {
      console.error(
        "Load projects error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load projects.",
      });
    }
  }
);

/* =====================================================
   GET ONE PROJECT
   GET /api/admin/project/:id
===================================================== */

router.get(
  "/project/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project ID.",
        });
      }

      const project =
        await Project.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }

      return res.status(200).json({
        success: true,

        data:
          projectResponse(project),
      });
    } catch (error) {
      console.error(
        "Get project error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load project.",
      });
    }
  }
);


/* =====================================================
   PROJECT DETAILS WITH TASK SUMMARY
   GET /api/admin/project/:id/details
===================================================== */

router.get(
  "/project/:id/details",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project ID.",
        });
      }

      const project =
        await Project.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }

      /*
       * Synchronize project progress
       * before returning the details.
       */

      const summary =
        await syncProjectTaskProgress(
          project._id
        );

      /*
       * Reload project because progress
       * may have just been updated.
       */

      const refreshedProject =
        await Project.findOne({
          _id: project._id,
          isDeleted: false,
        });

      /*
       * Load full project tasks.
       */

      const tasks =
        await Task.find({
          projectId:
            project._id,

          taskFor:
            "Project",

          isDeleted:
            false,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      /*
       * Unique project team.
       *
       * Anyone assigned to at least one
       * project task is considered part
       * of the project team.
       */

      const teamMap =
        new Map();

      for (const task of tasks) {
        const employeeId =
          task.assignedEmployeeId
            ? String(
                task.assignedEmployeeId
              )
            : "";

        if (
          !employeeId ||
          teamMap.has(employeeId)
        ) {
          continue;
        }

        teamMap.set(
          employeeId,
          {
            employeeId:
              task.assignedEmployeeId,

            employeeCode:
              task.assignedEmployeeCode ||
              "",

            employeeName:
              task.assignedEmployeeName ||
              "Unassigned",
          }
        );
      }

      const team =
        Array.from(
          teamMap.values()
        );

      /*
       * Format tasks for project screen.
       */

      const taskData =
        tasks.map(
          (task) => ({
            id:
              task._id,

            taskCode:
              task.taskCode,

            title:
              task.title,

            description:
              task.description ||
              "",

            workType:
              task.workType ||
              "",

            priority:
              task.priority ||
              "Medium",

            status:
              task.status ||
              "Assigned",

            progress:
              Number(
                task.progress ||
                0
              ),

            assignedEmployeeId:
              task.assignedEmployeeId ||
              null,

            assignedEmployeeCode:
              task.assignedEmployeeCode ||
              "",

            assignedEmployeeName:
              task.assignedEmployeeName ||
              "Unassigned",

            startDate:
              task.startDate ||
              null,

            dueDate:
              task.dueDate ||
              null,

            completedAt:
              task.completedAt ||
              null,

            estimatedMinutes:
              Number(
                task.estimatedMinutes ||
                0
              ),

            spentMinutes:
              Number(
                task.spentMinutes ||
                0
              ),

            createdAt:
              task.createdAt,

            updatedAt:
              task.updatedAt,
          })
        );

      return res.status(200).json({
        success: true,

        data: {
          project:
            projectResponse(
              refreshedProject
            ),

          summary: {
            totalTasks:
              summary?.totalTasks ||
              0,

            activeTasks:
              summary?.activeTasks ||
              0,

            completedTasks:
              summary?.completedTasks ||
              0,

            overdueTasks:
              summary?.overdueTasks ||
              0,

            progress:
              summary?.progress ||
              0,
          },

          team,

          tasks:
            taskData,
        },
      });
    } catch (error) {
      console.error(
        "Project details error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to load project details.",
      });
    }
  }
);

/* =====================================================
   UPDATE PROJECT
   PUT /api/admin/project/:id
===================================================== */

router.put(
  "/project/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project ID.",
        });
      }

      const project =
        await Project.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }
      if (
  rejectLockedProject(
    project,
    res
  )
) {
  return;
}

      const {
        projectCode,
        projectName,
        projectType,
        productId,
        clientId,
        description,
        startDate,
        dueDate,
        priority,
        status,
        progress,
      } = req.body;

      const normalizedCode =
        String(
          projectCode ??
          project.projectCode
        )
          .trim()
          .toUpperCase();

      const normalizedName =
        String(
          projectName ??
          project.projectName
        ).trim();

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            "Project code is required.",
        });
      }

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message:
            "Project name is required.",
        });
      }

      const duplicate =
        await Project.findOne({
          _id: {
            $ne: id,
          },

          isDeleted: false,

          $or: [
            {
              projectCode:
                normalizedCode,
            },

            {
              projectName: {
                $regex:
                  `^${normalizedName.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                  )}$`,

                $options: "i",
              },
            },
          ],
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,

          message:
            duplicate.projectCode ===
              normalizedCode
              ? "Another project already uses this project code."
              : "Another project already uses this project name.",
        });
      }

      let resolvedProduct = null;

      if (productId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            productId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid product ID.",
          });
        }

        resolvedProduct =
          await Product.findOne({
            _id: productId,
            isDeleted: false,
          });

        if (!resolvedProduct) {
          return res.status(404).json({
            success: false,
            message:
              "Selected product was not found.",
          });
        }
      }

      let resolvedClient = null;

      if (clientId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            clientId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid client ID.",
          });
        }

        resolvedClient =
          await Client.findById(
            clientId
          );

        if (!resolvedClient) {
          return res.status(404).json({
            success: false,
            message:
              "Selected client was not found.",
          });
        }
      }

      const previousData = {
        projectCode:
          project.projectCode,

        projectName:
          project.projectName,

        projectType:
          project.projectType,

        productId:
          project.productId,

        productName:
          project.productName,

        clientId:
          project.clientId,

        clientName:
          project.clientName,

        status:
          project.status,

        priority:
          project.priority,

        progress:
          project.progress,
      };

      project.projectCode =
        normalizedCode;

      project.projectName =
        normalizedName;

      project.projectType =
        projectType ??
        project.projectType;

      project.productId =
        resolvedProduct?._id ||
        null;

      project.productCode =
        resolvedProduct?.productCode ||
        "";

      project.productName =
        resolvedProduct?.productName ||
        "";

      project.clientId =
        resolvedClient?._id ||
        null;

      project.clientCode =
        resolvedClient?.clientCode ||
        "";

      project.clientName =
        resolvedClient?.companyName ||
        "";

      project.description =
        String(
          description ??
          project.description ??
          ""
        ).trim();

      if (startDate !== undefined) {
        project.startDate =
          startDate
            ? new Date(startDate)
            : null;
      }

      if (dueDate !== undefined) {
        project.dueDate =
          dueDate
            ? new Date(dueDate)
            : null;
      }

      if (priority !== undefined) {
        const selectedPriority =
          await validatePriority(
            priority
          );

        if (!selectedPriority) {
          return res.status(400).json({
            success: false,

            message:
              "Selected priority is invalid or inactive.",
          });
        }

        project.priority =
          selectedPriority.name;
      }

      if (status !== undefined) {
        project.status =
          status;
      }

      if (progress !== undefined) {
        project.progress =
          Math.min(
            Math.max(
              Number(progress || 0),
              0
            ),
            100
          );
      }

      if (
        project.status ===
        "Completed"
      ) {
        project.progress = 100;

        project.completedDate =
          project.completedDate ||
          new Date();
      } else {
        project.completedDate =
          null;
      }

      project.updatedBy =
        req.user._id;

      project.updatedByName =
        req.user.name ||
        "Admin";

      await project.save();

      await createActivityLog({
        action:
          "Project Updated",

        category:
          "Project",

        description:
          `${project.projectName} information was updated.`,

        entityType:
          "project",

        entityId:
          project._id,

        entityCode:
          project.projectCode,

        entityName:
          project.projectName,

        clientId:
          project.clientId,

        clientName:
          project.clientName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          previous:
            previousData,

          current: {
            projectCode:
              project.projectCode,

            projectName:
              project.projectName,

            projectType:
              project.projectType,

            productId:
              project.productId,

            productName:
              project.productName,

            clientId:
              project.clientId,

            clientName:
              project.clientName,

            status:
              project.status,

            priority:
              project.priority,

            progress:
              project.progress,
          },
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Project updated successfully.",

        data:
          projectResponse(project),
      });
    } catch (error) {
      console.error(
        "Update project error:",
        error
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "Project code already exists.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to update project.",
      });
    }
  }
);

/* =====================================================
   CHANGE PROJECT STATUS
   PATCH /api/admin/project/:id/status
===================================================== */

router.patch(
  "/project/:id/status",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        status,
        progress,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project ID.",
        });
      }

   const allowedStatuses = [
  "Planned",
  "Active",
  "On Hold",
  "Cancelled",
];
/*
 * Completed projects must go through
 * the dedicated completion workflow.
 */
if (status === "Completed") {
  return res.status(400).json({
    success: false,
    requiresCompletionFlow: true,
    message:
      "Use Complete Project to finish this project. All project tasks must be completed first.",
  });
}

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project status.",
        });
      }

      const project =
        await Project.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }
      if (
  rejectLockedProject(
    project,
    res
  )
) {
  return;
}

      const previousStatus =
        project.status;

      project.status =
        status;

      if (
        progress !== undefined
      ) {
        project.progress =
          Math.min(
            Math.max(
              Number(progress || 0),
              0
            ),
            100
          );
      }

   project.completedDate = null;

      project.updatedBy =
        req.user._id;

      project.updatedByName =
        req.user.name ||
        "Admin";

      await project.save();

      await createActivityLog({
        action:
          "Project Status Changed",

        category:
          "Project",

        description:
          `${project.projectName} changed from ${previousStatus} to ${status}.`,

        entityType:
          "project",

        entityId:
          project._id,

        entityCode:
          project.projectCode,

        entityName:
          project.projectName,

        clientId:
          project.clientId,

        clientName:
          project.clientName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          previousStatus,

          currentStatus:
            project.status,

          progress:
            project.progress,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Project status updated successfully.",

        data:
          projectResponse(project),
      });
    } catch (error) {
      console.error(
        "Change project status error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to change project status.",
      });
    }
  }
);

/* =====================================================
   COMPLETE PROJECT
   POST /api/admin/project/:id/complete

   Rules:
   - Project must exist
   - Project must have at least one task
   - Every active project task must be completed
   - Progress must be 100%
   - Records delivery/warranty/AMC planning
   - Does NOT create AMC contract yet unless AMC setup
     is handled separately
===================================================== */

router.post(
  "/project/:id/complete",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project ID.",
        });
      }

      const project =
        await Project.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }

      if (
        project.status ===
        "Completed"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This project is already completed.",
          data:
            projectResponse(
              project
            ),
        });
      }

      /*
       * Recalculate current task state.
       */
      const summary =
        await syncProjectTaskProgress(
          project._id
        );

      const totalTasks =
        Number(
          summary?.totalTasks ||
          0
        );

      const completedTasks =
        Number(
          summary?.completedTasks ||
          0
        );

      const progress =
        Number(
          summary?.progress ||
          0
        );

      /*
       * A project should not be completed
       * without any development tasks.
       */
      if (totalTasks === 0) {
        return res.status(400).json({
          success: false,
          code:
            "NO_PROJECT_TASKS",

          message:
            "Create and complete at least one project task before completing the project.",

          summary: {
            totalTasks,
            completedTasks,
            progress,
          },
        });
      }

      /*
       * All tasks must be completed.
       */
      if (
        completedTasks !==
          totalTasks ||
        progress < 100
      ) {
        return res.status(409).json({
          success: false,
          code:
            "PROJECT_TASKS_INCOMPLETE",

          message:
            `${completedTasks} of ${totalTasks} project tasks are completed. Complete all tasks before closing the project.`,

          summary: {
            totalTasks,
            completedTasks,
            activeTasks:
              summary?.activeTasks ||
              0,

            overdueTasks:
              summary?.overdueTasks ||
              0,

            progress,
          },
        });
      }

      const {
        completionDate,
        deliveryDate,

        finalAmount,

        amcApplicable,
        proposedAmcAmount,

        warrantyEndDate,
      } = req.body || {};

      /*
       * Dates
       */

      const parsedCompletionDate =
        completionDate
          ? new Date(
              completionDate
            )
          : new Date();

      if (
        Number.isNaN(
          parsedCompletionDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid completion date.",
        });
      }

      const parsedDeliveryDate =
        deliveryDate
          ? new Date(
              deliveryDate
            )
          : parsedCompletionDate;

      if (
        Number.isNaN(
          parsedDeliveryDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid delivery date.",
        });
      }

      let parsedWarrantyEndDate =
        null;

      if (warrantyEndDate) {
        parsedWarrantyEndDate =
          new Date(
            warrantyEndDate
          );

        if (
          Number.isNaN(
            parsedWarrantyEndDate.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid warranty end date.",
          });
        }

        if (
          parsedWarrantyEndDate <
          parsedDeliveryDate
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Warranty end date cannot be before delivery date.",
          });
        }
      }

      /*
       * Commercial values
       */

      const normalizedFinalAmount =
        Math.max(
          Number(
            finalAmount ??
              project.finalAmount ??
              0
          ),
          0
        );

      const normalizedAmcApplicable =
        Boolean(
          amcApplicable
        );

      const normalizedAmcAmount =
        normalizedAmcApplicable
          ? Math.max(
              Number(
                proposedAmcAmount ??
                  project.proposedAmcAmount ??
                  0
              ),
              0
            )
          : 0;

      if (
        normalizedAmcApplicable &&
        normalizedAmcAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter the proposed yearly AMC amount.",
        });
      }

      /*
       * Complete the project.
       */

      project.status =
        "Completed";

      project.progress =
        100;

      project.completedDate =
        parsedCompletionDate;

      project.deliveryDate =
        parsedDeliveryDate;

      project.finalAmount =
        normalizedFinalAmount;

      project.amcApplicable =
        normalizedAmcApplicable;

      project.proposedAmcAmount =
        normalizedAmcAmount;

      project.warrantyEndDate =
        parsedWarrantyEndDate;

      /*
       * AMC is NOT automatically activated here.
       *
       * The existing AMC module requires a valid
       * client product before a contract can exist.
       */
      project.amcActivated =
        Boolean(
          project.amcContractId
        );

      project.completedBy =
        req.user._id;

      project.completedByName =
        req.user.name ||
        "Admin";

      project.updatedBy =
        req.user._id;

      project.updatedByName =
        req.user.name ||
        "Admin";

      await project.save();

      /*
       * Update Client summary.
       */

      if (project.clientId) {
        const client =
          await Client.findOne({
            _id:
              project.clientId,

            isDeleted:
              false,
          });

        if (client) {
          if (
            normalizedAmcApplicable
          ) {
            client.amcStatus =
              client.amcStatus ===
              "Not Started"
                ? "Not Started"
                : client.amcStatus;
          }

          client.updatedBy =
            req.user._id;

          client.updatedByName =
            req.user.name ||
            "Admin";

          await client.save();
        }
      }

      /*
       * Activity log.
       */

      await createActivityLog({
        action:
          "Project Completed",

        category:
          "Project",

        description:
          `${project.projectCode} - ${project.projectName} was completed successfully.`,

        entityType:
          "project",

        entityId:
          project._id,

        entityCode:
          project.projectCode,

        entityName:
          project.projectName,

        clientId:
          project.clientId,

        clientName:
          project.clientName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          completedDate:
            project.completedDate,

          deliveryDate:
            project.deliveryDate,

          finalAmount:
            project.finalAmount,

          amcApplicable:
            project.amcApplicable,

          proposedAmcAmount:
            project.proposedAmcAmount,

          warrantyEndDate:
            project.warrantyEndDate,

          totalTasks,

          completedTasks,

          progress:
            project.progress,
        },
      });

      /*
       * Tell frontend whether AMC can
       * already be activated.
       *
       * Existing AMC contracts require
       * an actual product assigned to client.
       */

      let amcReady =
        false;

      let amcReason =
        "";

      if (
        project.amcApplicable
      ) {
        if (
          !project.clientId
        ) {
          amcReason =
            "AMC cannot be activated because this project has no client.";
        } else if (
          !project.productId
        ) {
          amcReason =
            "AMC is planned, but first assign the completed software/product to the client.";
        } else {
          const client =
            await Client.findOne({
              _id:
                project.clientId,

              isDeleted:
                false,
            });

          const clientProduct =
            client?.products?.find(
              (item) =>
                String(
                  item.productId
                ) ===
                String(
                  project.productId
                )
            );

          if (clientProduct) {
            amcReady =
              true;
          } else {
            amcReason =
              "AMC is planned, but this project product is not assigned to the client yet.";
          }
        }
      }

      return res.status(200).json({
        success: true,

        message:
          "Project completed successfully.",

        data: {
          project:
            projectResponse(
              project
            ),

          summary: {
            totalTasks,
            completedTasks,
            progress: 100,
          },

          amc: {
            applicable:
              project.amcApplicable,

            activated:
              project.amcActivated,

            ready:
              amcReady,

            reason:
              amcReason,

            proposedAmount:
              project.proposedAmcAmount,

            warrantyEndDate:
              project.warrantyEndDate,
          },
        },
      });
    } catch (error) {
      console.error(
        "Complete project error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to complete project.",
      });
    }
  }
);
/* =====================================================
   SOFT DELETE PROJECT
   DELETE /api/admin/project/:id
===================================================== */

router.delete(
  "/project/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project ID.",
        });
      }

      const project =
        await Project.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }
      if (
  rejectLockedProject(
    project,
    res
  )
) {
  return;
}

      const linkedTaskCount =
        await Task.countDocuments({
          projectId:
            project._id,

          isDeleted: false,
        });

      if (linkedTaskCount > 0) {
        return res.status(409).json({
          success: false,

          message:
            "This project is already used by tasks. Mark it Cancelled instead of deleting it.",

          usage: {
            tasks:
              linkedTaskCount,
          },
        });
      }

      const previousStatus =
        project.status;

      project.isDeleted =
        true;

      project.deletedAt =
        new Date();

      project.deletedBy =
        req.user._id;

      project.deletedByName =
        req.user.name ||
        "Admin";

      project.status =
        "Cancelled";

      await project.save();

      await createActivityLog({
        action:
          "Project Deleted",

        category:
          "Project",

        description:
          `${project.projectName} was removed from Project Master.`,

        entityType:
          "project",

        entityId:
          project._id,

        entityCode:
          project.projectCode,

        entityName:
          project.projectName,

        clientId:
          project.clientId,

        clientName:
          project.clientName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          previousStatus,

          deletedAt:
            project.deletedAt,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Project deleted successfully.",

        data: {
          id:
            project._id,

          projectCode:
            project.projectCode,

          projectName:
            project.projectName,
        },
      });
    } catch (error) {
      console.error(
        "Delete project error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to delete project.",
      });
    }
  }
);

/* =====================================================
   ADD CLIENT
===================================================== */
/* =====================================================
   CREATE CLIENT
   POST /api/admin/client
===================================================== */

/* =====================================================
   CREATE CLIENT AND LOGIN ACCOUNT
   POST /api/admin/client
===================================================== */

router.post(
  "/client",
  async (req, res) => {
    let createdClient = null;
    let createdUser = null;

    try {
      const {
        clientCode,
        companyName,
        contactPerson,
        email,
        mobile,
        city,
        products,
        amcStatus,
        nextRenewal,
        assignedEmployeeId,
status,

        createLogin = true,
        temporaryPassword = "",
      } = req.body;

      const normalizedCode =
        String(
          clientCode || ""
        )
          .trim()
          .toUpperCase();

      const normalizedCompanyName =
        String(
          companyName || ""
        ).trim();

      const normalizedContactPerson =
        String(
          contactPerson || ""
        ).trim();

      const normalizedEmail =
        String(
          email || ""
        )
          .trim()
          .toLowerCase();

      if (!normalizedCode) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Client code is required.",
          });
      }

      if (
        !normalizedCompanyName
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Company name is required.",
          });
      }

      if (
        createLogin &&
        !normalizedEmail
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Email is required when creating a client login account.",
          });
      }

      const escapedCompanyName =
        normalizedCompanyName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const duplicateClient =
        await Client.findOne({
          isDeleted: false,

          $or: [
            {
              clientCode:
                normalizedCode,
            },
            {
              companyName: {
                $regex:
                  `^${escapedCompanyName}$`,
                $options: "i",
              },
            },
          ],
        });

      if (duplicateClient) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              duplicateClient.clientCode ===
                normalizedCode
                ? "Client code already exists."
                : "Company name already exists.",
          });
      }

      if (createLogin) {
        const existingUser =
          await User.findOne({
            email:
              normalizedEmail,
          });

        if (existingUser) {
          return res
            .status(409)
            .json({
              success: false,
              message:
                "A login account with this email already exists.",
            });
        }
      }

      let resolvedProducts = [];

      try {
        resolvedProducts =
          await resolveClientProducts(
            products || []
          );
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              error.message,
          });
      }
      let resolvedEmployee;

try {
  resolvedEmployee =
    await resolveClientEmployee(
      assignedEmployeeId,
      {
        required: false,
      }
    );
} catch (error) {
  return res
    .status(400)
    .json({
      success: false,

      message:
        error.message ||
        "Unable to validate the assigned employee.",
    });
}

      createdClient =
        await Client.create({
          clientCode:
            normalizedCode,

          companyName:
            normalizedCompanyName,

          contactPerson:
            normalizedContactPerson,

          email:
            normalizedEmail,

          mobile:
            String(
              mobile || ""
            ).trim(),

          city:
            String(
              city || ""
            ).trim(),

          products:
            resolvedProducts,

          amcStatus:
            amcStatus ||
            "Not Started",

          nextRenewal:
            nextRenewal || "",

          openTickets: 0,

        assignedEmployeeId:
  resolvedEmployee
    .assignedEmployeeId,

assignedEmployeeCode:
  resolvedEmployee
    .assignedEmployeeCode,

assignedEmployeeName:
  resolvedEmployee
    .assignedEmployeeName,

          status:
            status || "Active",

          loginEnabled:
            Boolean(
              createLogin
            ),

          createdBy:
            req.user._id,

          createdByName:
            req.user.name ||
            "Admin",

          updatedBy:
            req.user._id,

          updatedByName:
            req.user.name ||
            "Admin",
        });

      let plainTemporaryPassword =
        "";

      if (createLogin) {
        plainTemporaryPassword =
          String(
            temporaryPassword || ""
          ).trim() ||
          generateTemporaryPassword();

        if (
          plainTemporaryPassword.length <
          6
        ) {
          await Client.deleteOne({
            _id:
              createdClient._id,
          });

          return res
            .status(400)
            .json({
              success: false,
              message:
                "Temporary password must contain at least 6 characters.",
            });
        }

        const hashedPassword =
          await bcrypt.hash(
            plainTemporaryPassword,
            12
          );

        createdUser =
          await User.create({
            name:
              normalizedContactPerson ||
              normalizedCompanyName,

            email:
              normalizedEmail,

            mobile:
              String(
                mobile || ""
              ).trim(),

            password:
              hashedPassword,

            role:
              "client",

            status:
              mapClientStatusToUserStatus(
                createdClient.status
              ),

            clientId:
              createdClient._id,

            clientCode:
              createdClient.clientCode,

            companyName:
              createdClient.companyName,

            mustChangePassword:
              true,
          });

        createdClient.userId =
          createdUser._id;

        createdClient.loginCreatedAt =
          new Date();

        await createdClient.save();
      }

      await createActivityLog({
        action:
          "Client Created",

        category:
          "Client",

        description:
          `${createdClient.companyName} was added to Client Master.`,

        entityType:
          "client",

        entityId:
          createdClient._id,

        entityCode:
          createdClient.clientCode,

        entityName:
          createdClient.companyName,

        clientId:
          createdClient._id,

        clientName:
          createdClient.companyName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

       metadata: {
  city:
    createdClient.city,

  status:
    createdClient.status,

  productCount:
    createdClient.products.length,

  assignedEmployeeId:
    createdClient
      .assignedEmployeeId,

  assignedEmployeeCode:
    createdClient
      .assignedEmployeeCode,

  assignedEmployeeName:
    createdClient
      .assignedEmployeeName,

  loginCreated:
    Boolean(
      createdUser
    ),

  userId:
    createdUser?._id ||
    null,
},
      });

      return res
        .status(201)
        .json({
          success: true,

          message:
            createdUser
              ? "Client and login account created successfully."
              : "Client created successfully.",

          data:
            clientResponse(
              createdClient
            ),

          login: createdUser
            ? {
              userId:
                createdUser._id,

              email:
                createdUser.email,

              temporaryPassword:
                plainTemporaryPassword,

              mustChangePassword:
                true,
            }
            : null,
        });
    } catch (error) {
      console.error(
        "Create client error:",
        error
      );

      /*
       * Manual rollback if creating the
       * user fails after client creation.
       */
      if (
        createdUser?._id
      ) {
        await User.deleteOne({
          _id:
            createdUser._id,
        }).catch(() => { });
      }

      if (
        createdClient?._id
      ) {
        await Client.deleteOne({
          _id:
            createdClient._id,
        }).catch(() => { });
      }

      if (
        error.code === 11000
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Client code or login email already exists.",
          });
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message ||
            "Unable to create client and login account.",
        });
    }
  }
);

/* =====================================================
   GET ALL CLIENTS
   GET /api/admin/clients
===================================================== */

router.get(
  "/clients",
  async (req, res) => {
    try {
     const {
  search = "",
  status = "All",
  amcStatus = "All",
  productId = "",
  assignedEmployeeId = "",
} = req.query;

      const query = {
        isDeleted: false,
      };

      if (
        status &&
        status !== "All"
      ) {
        query.status =
          status;
      }

      if (
        amcStatus &&
        amcStatus !== "All"
      ) {
        query.amcStatus =
          amcStatus;
      }

      if (productId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            productId
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid product ID.",
            });
        }

        query[
          "products.productId"
        ] =
          new mongoose.Types.ObjectId(
            productId
          );
      }

        if (assignedEmployeeId) {
  if (
    !mongoose.Types.ObjectId.isValid(
      assignedEmployeeId
    )
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Invalid assigned employee ID.",
      });
  }

  query.assignedEmployeeId =
    new mongoose.Types.ObjectId(
      assignedEmployeeId
    );
}
      const normalizedSearch =
        String(
          search || ""
        ).trim();

      if (
        normalizedSearch
      ) {
        query.$or = [
          {
            clientCode: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },
          {
            companyName: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },
          {
            contactPerson: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },
          {
            email: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },
          {
            mobile: {
              $regex:
                normalizedSearch,
              $options: "i",
            },
          },
         {
  city: {
    $regex: normalizedSearch,
    $options: "i",
  },
},
{
  assignedEmployeeName: {
    $regex: normalizedSearch,
    $options: "i",
  },
},
{
  assignedEmployeeCode: {
    $regex: normalizedSearch,
    $options: "i",
  },
},
{
  "products.productName": {
    $regex: normalizedSearch,
    $options: "i",
  },
},
        ];
      }

      const clients =
        await Client.find(
          query
        ).sort({
          companyName: 1,
        });

      const stats = {
        totalClients:
          clients.length,

        activeClients:
          clients.filter(
            (client) =>
              client.status ===
              "Active"
          ).length,

        inactiveClients:
          clients.filter(
            (client) =>
              client.status ===
              "Inactive"
          ).length,

        clientsWithAMC:
          clients.filter(
            (client) =>
              client.amcStatus ===
              "Paid" ||
              client.amcStatus ===
              "Partially Paid"
          ).length,

        totalProducts:
          clients.reduce(
            (
              total,
              client
            ) =>
              total +
              (
                client.products ||
                []
              ).length,
            0
          ),

        openTickets:
          clients.reduce(
            (
              total,
              client
            ) =>
              total +
              Number(
                client.openTickets ||
                0
              ),
            0
          ),
      };

      return res
        .status(200)
        .json({
          success: true,

          count:
            clients.length,

          stats,

          data:
            clients.map(
              clientResponse
            ),
        });
    } catch (error) {
      console.error(
        "Load clients error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to load clients.",
        });
    }
  }
);

/* =====================================================
   GET ONE CLIENT
   GET /api/admin/client/:id
===================================================== */

router.get(
  "/client/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid client ID.",
          });
      }

      const client =
        await Client.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!client) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Client not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          data:
            clientResponse(client),
        });
    } catch (error) {
      console.error(
        "Get client error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to load client.",
        });
    }
  }
);

/* =====================================================
   GET CLIENT AMC (contract + invoices)
   GET /api/admin/client/:id/amc
===================================================== */

router.get("/client/:id/amc", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID.",
      });
    }

    const [contracts, invoices] = await Promise.all([
      AmcContract.find({
        clientId: id,
        isDeleted: false,
      }).sort({ createdAt: -1 }),

      AmcInvoice.find({
        clientId: id,
        isDeleted: false,
      }).sort({ invoiceDate: -1 }),
    ]);

    const contractReminderByCode = {};
    contracts.forEach((contract) => {
      contractReminderByCode[contract.contractCode] =
        contract.reminderStatus || "Not Sent";
    });

    return res.status(200).json({
      success: true,
      data: {
        contracts,
        invoices: invoices.map((invoice) => ({
          id: invoice._id,
          invoiceCode: invoice.invoiceCode,
          invoiceDate: invoice.invoiceDate,
          productName: invoice.productName,
          startDate: invoice.contractStartDate,
          endDate: invoice.contractExpiryDate,
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          dueDate: invoice.dueDate,
          paymentStatus: invoice.paymentStatus,
          reminderStatus:
            contractReminderByCode[invoice.contractCode] || "Not Sent",
        })),
      },
    });
  } catch (error) {
    console.error("Get client AMC error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load client AMC records.",
    });
  }
});

/* =====================================================
   GET CLIENT PAYMENTS
   GET /api/admin/client/:id/payments
===================================================== */

router.get("/client/:id/payments", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID.",
      });
    }

    const payments = await AmcPayment.find({
      clientId: id,
      isDeleted: false,
    }).sort({ paymentDate: -1 });

    return res.status(200).json({
      success: true,
      data: payments.map((payment) => ({
        id: payment._id,
        receiptNo: payment.paymentCode,
        invoiceNo: payment.invoiceCode,
        product: payment.productName,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        mode: payment.mode,
        referenceNo: payment.referenceNo,
        receivedBy: payment.receivedByName,
        status: "Completed",
      })),
    });
  } catch (error) {
    console.error("Get client payments error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load client payments.",
    });
  }
});

/* =====================================================
   GET CLIENT DOCUMENTS
   GET /api/admin/client/:id/documents
===================================================== */

router.get("/client/:id/documents", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID.",
      });
    }

    const documents = await ClientDocument.find({
      clientId: id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: documents.map((doc) => ({
        id: doc._id,
        name: doc.name,
        type: doc.type,
        category: doc.category,
        size: doc.size,
        uploadedOn: doc.createdAt,
        uploadedBy: doc.uploadedByName,
        notes: doc.notes,
      })),
    });
  } catch (error) {
    console.error("Get client documents error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load client documents.",
    });
  }
});

/* =====================================================
   ADD CLIENT DOCUMENT (metadata only)
   POST /api/admin/client/:id/documents
===================================================== */

router.post("/client/:id/documents", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID.",
      });
    }

    const client = await Client.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    const {
      name,
      type = "Other",
      category = "Other",
      size = "",
      notes = "",
      uploadedByName = "",
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Document name is required.",
      });
    }

    const document = await ClientDocument.create({
      clientId: client._id,
      clientCode: client.clientCode || "",
      clientName: client.companyName || "",
      name: String(name).trim(),
      type,
      category,
      size,
      notes,
      uploadedByName,
    });

    await ActivityLog.create({
      action: "Document Uploaded",
      category: "Client",
      description: `${document.name} uploaded for ${client.companyName}`,
      entityType: "client",
      entityId: client._id,
      entityName: client.companyName,
      clientId: client._id,
      clientName: client.companyName,
      performedByName: uploadedByName || "Admin",
      performedByRole: "admin",
    });

    return res.status(201).json({
      success: true,
      message: "Document added.",
      data: {
        id: document._id,
        name: document.name,
        type: document.type,
        category: document.category,
        size: document.size,
        uploadedOn: document.createdAt,
        uploadedBy: document.uploadedByName,
      },
    });
  } catch (error) {
    console.error("Add client document error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to add document.",
    });
  }
});

/* =====================================================
   DELETE CLIENT DOCUMENT
   DELETE /api/admin/client/:id/documents/:docId
===================================================== */

router.delete("/client/:id/documents/:docId", async (req, res) => {
  try {
    const { id, docId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(docId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID.",
      });
    }

    const document = await ClientDocument.findOneAndUpdate(
      { _id: docId, clientId: id },
      { isDeleted: true },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document removed.",
    });
  } catch (error) {
    console.error("Delete client document error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to delete document.",
    });
  }
});

/* =====================================================
   UPDATE CLIENT
   PUT /api/admin/client/:id
===================================================== */

router.put(
  "/client/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid client ID.",
          });
      }

      const client =
        await Client.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!client) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Client not found.",
          });
      }

      const {
        clientCode,
        companyName,
        contactPerson,
        email,
        mobile,
        city,
        products,
        amcStatus,
        nextRenewal,
       assignedEmployeeId,
status,
      } = req.body;

      const normalizedCode =
        String(
          clientCode ??
          client.clientCode
        )
          .trim()
          .toUpperCase();

      const normalizedCompanyName =
        String(
          companyName ??
          client.companyName
        ).trim();

      if (!normalizedCode) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Client code is required.",
          });
      }

      if (
        !normalizedCompanyName
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Company name is required.",
          });
      }

      const escapedCompanyName =
        normalizedCompanyName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const duplicateClient =
        await Client.findOne({
          _id: {
            $ne: id,
          },

          isDeleted: false,

          $or: [
            {
              clientCode:
                normalizedCode,
            },
            {
              companyName: {
                $regex:
                  `^${escapedCompanyName}$`,
                $options: "i",
              },
            },
          ],
        });

      if (duplicateClient) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              duplicateClient.clientCode ===
                normalizedCode
                ? "Another client already uses this client code."
                : "Another client already uses this company name.",
          });
      }

      if (
        products !== undefined
      ) {
        try {
          client.products =
            await resolveClientProducts(
              products
            );
        } catch (error) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                error.message,
            });
        }
      }

      client.clientCode =
        normalizedCode;

      client.companyName =
        normalizedCompanyName;

      client.contactPerson =
        String(
          contactPerson ??
          client.contactPerson ??
          ""
        ).trim();

      const nextEmail =
        String(
          email ??
          client.email ??
          ""
        )
          .trim()
          .toLowerCase();

      /*
       * Check whether another User account
       * already uses the new email.
       */
      if (
        nextEmail &&
        nextEmail !== client.email
      ) {
        const duplicateLogin =
          await User.findOne({
            email: nextEmail,

            _id: {
              $ne:
                client.userId ||
                undefined,
            },
          });

        if (duplicateLogin) {
          return res
            .status(409)
            .json({
              success: false,
              message:
                "Another login account already uses this email.",
            });
        }
      }

      client.email =
        nextEmail;
      client.mobile =
        String(
          mobile ??
          client.mobile ??
          ""
        ).trim();

      client.city =
        String(
          city ??
          client.city ??
          ""
        ).trim();

      if (
        amcStatus !== undefined
      ) {
        client.amcStatus =
          amcStatus;
      }

      if (
        nextRenewal !==
        undefined
      ) {
        client.nextRenewal =
          nextRenewal || "";
      }

    
if (
  assignedEmployeeId !==
  undefined
) {
  let resolvedEmployee;

  try {
    resolvedEmployee =
      await resolveClientEmployee(
        assignedEmployeeId,
        {
          required: false,
        }
      );
  } catch (error) {
    return res
      .status(400)
      .json({
        success: false,

        message:
          error.message ||
          "Unable to validate the assigned employee.",
      });
  }

  client.assignedEmployeeId =
    resolvedEmployee
      .assignedEmployeeId;

  client.assignedEmployeeCode =
    resolvedEmployee
      .assignedEmployeeCode;

  client.assignedEmployeeName =
    resolvedEmployee
      .assignedEmployeeName;
}



      if (
        status !== undefined
      ) {
        client.status =
          status;
      }

      client.updatedBy =
        req.user._id;

      client.updatedByName =
        req.user.name ||
        "Admin";

      await client.save();

      await createActivityLog({
        action:
          "Client Updated",

        category:
          "Client",

        description:
          `${client.companyName} information was updated.`,

        entityType:
          "client",

        entityId:
          client._id,

        entityCode:
          client.clientCode,

        entityName:
          client.companyName,

        clientId:
          client._id,

        clientName:
          client.companyName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

      metadata: {
  status:
    client.status,

  amcStatus:
    client.amcStatus,

  productCount:
    client.products.length,

  assignedEmployeeId:
    client.assignedEmployeeId,

  assignedEmployeeCode:
    client.assignedEmployeeCode,

  assignedEmployeeName:
    client.assignedEmployeeName,
},
      });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Client updated successfully.",

          data:
            clientResponse(client),
        });
    } catch (error) {
      console.error(
        "Update client error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to update client.",
        });
    }
  }
);

/* =====================================================
   ASSIGN PRODUCT TO CLIENT
   POST /api/admin/client/:id/product
===================================================== */

router.post(
  "/client/:id/product",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid client ID.",
          });
      }

      const client =
        await Client.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!client) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Client not found.",
          });
      }

      let resolvedProduct;

      try {
        resolvedProduct =
          await resolveClientProduct(
            req.body
          );
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              error.message,
          });
      }

      const alreadyAssigned =
        client.products.some(
          (product) =>
            String(
              product.productId
            ) ===
            String(
              resolvedProduct.productId
            )
        );

      if (alreadyAssigned) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This product is already assigned to the client.",
          });
      }

      client.products.push(
        resolvedProduct
      );

      client.updatedBy =
        req.user._id;

      client.updatedByName =
        req.user.name ||
        "Admin";

      await client.save();

      const assignedProduct =
        client.products[
        client.products.length -
        1
        ];

      await createActivityLog({
        action:
          "Product Assigned",

        category:
          "Product",

        description:
          `${assignedProduct.productName} was assigned to ${client.companyName}.`,

        entityType:
          "product",

        entityId:
          assignedProduct.productId,

        entityCode:
          assignedProduct.productCode,

        entityName:
          assignedProduct.productName,

        clientId:
          client._id,

        clientName:
          client.companyName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          clientProductId:
            assignedProduct._id,

          version:
            assignedProduct.version,

          supportType:
            assignedProduct.supportType,

          amcStatus:
            assignedProduct.amcStatus,
        },
      });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Product assigned successfully.",

          data:
            clientResponse(client),
        });
    } catch (error) {
      console.error(
        "Assign client product error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to assign product.",
        });
    }
  }
);

/* =====================================================
   UPDATE CLIENT PRODUCT
   PUT /api/admin/client/:clientId/product/:assignmentId
===================================================== */

router.put(
  "/client/:clientId/product/:assignmentId",
  async (req, res) => {
    try {
      const {
        clientId,
        assignmentId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          clientId
        ) ||
        !mongoose.Types.ObjectId.isValid(
          assignmentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid client or assignment ID.",
          });
      }

      const client =
        await Client.findOne({
          _id: clientId,
          isDeleted: false,
        });

      if (!client) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Client not found.",
          });
      }

      const assignment =
        client.products.id(
          assignmentId
        );

      if (!assignment) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Assigned product was not found.",
          });
      }

     let resolvedProduct;

try {
  resolvedProduct =
    await resolveClientProduct({
      ...req.body,

      productId:
        req.body.productId ||
        assignment.productId,
    });
} catch (error) {
  return res
    .status(400)
    .json({
      success: false,

      message:
        error.message ||
        "Unable to validate the selected product.",
    });
}

      const duplicate =
        client.products.some(
          (product) =>
            String(product._id) !==
            String(
              assignmentId
            ) &&
            String(
              product.productId
            ) ===
            String(
              resolvedProduct.productId
            )
        );

      if (duplicate) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This product is already assigned to the client.",
          });
      }

      assignment.productId =
        resolvedProduct.productId;

      assignment.productCode =
        resolvedProduct.productCode;

      assignment.productName =
        resolvedProduct.productName;

      assignment.version =
        resolvedProduct.version;

      assignment.purchaseDate =
        resolvedProduct.purchaseDate;

      assignment.installationDate =
        resolvedProduct.installationDate;

      assignment.licensedUsers =
        resolvedProduct.licensedUsers;

      assignment.supportType =
        resolvedProduct.supportType;

      assignment.amcStatus =
        resolvedProduct.amcStatus;

      assignment.expiryDate =
        resolvedProduct.expiryDate;

      assignment.installationStatus =
        resolvedProduct.installationStatus;

      assignment.notes =
        resolvedProduct.notes;

      client.updatedBy =
        req.user._id;

      client.updatedByName =
        req.user.name ||
        "Admin";

      await client.save();

      await createActivityLog({
        action:
          "Client Product Updated",

        category:
          "Product",

        description:
          `${assignment.productName} assignment was updated for ${client.companyName}.`,

        entityType:
          "product",

        entityId:
          assignment.productId,

        entityCode:
          assignment.productCode,

        entityName:
          assignment.productName,

        clientId:
          client._id,

        clientName:
          client.companyName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",
      });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Client product updated successfully.",

          data:
            clientResponse(client),
        });
    } catch (error) {
      console.error(
        "Update client product error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to update client product.",
        });
    }
  }
);

/* =====================================================
   REMOVE CLIENT PRODUCT
   DELETE /api/admin/client/:clientId/product/:assignmentId
===================================================== */

router.delete(
  "/client/:clientId/product/:assignmentId",
  async (req, res) => {
    try {
      const {
        clientId,
        assignmentId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          clientId
        ) ||
        !mongoose.Types.ObjectId.isValid(
          assignmentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid client or assignment ID.",
          });
      }

      const client =
        await Client.findOne({
          _id: clientId,
          isDeleted: false,
        });

      if (!client) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Client not found.",
          });
      }

      const assignment =
        client.products.id(
          assignmentId
        );

      if (!assignment) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Assigned product was not found.",
          });
      }

      const removedProduct = {
        productId:
          assignment.productId,

        productCode:
          assignment.productCode,

        productName:
          assignment.productName,
      };

      client.products.pull(
        assignmentId
      );

      client.updatedBy =
        req.user._id;

      client.updatedByName =
        req.user.name ||
        "Admin";

      await client.save();

      await createActivityLog({
        action:
          "Product Removed",

        category:
          "Product",

        description:
          `${removedProduct.productName} was removed from ${client.companyName}.`,

        entityType:
          "product",

        entityId:
          removedProduct.productId,

        entityCode:
          removedProduct.productCode,

        entityName:
          removedProduct.productName,

        clientId:
          client._id,

        clientName:
          client.companyName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",
      });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Product removed successfully.",

          data:
            clientResponse(client),
        });
    } catch (error) {
      console.error(
        "Remove client product error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to remove client product.",
        });
    }
  }
);

/* =====================================================
   CHANGE CLIENT STATUS
   PATCH /api/admin/client/:id/status
===================================================== */

router.patch(
  "/client/:id/status",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { status } =
        req.body;

      const allowedStatuses = [
        "Active",
        "Inactive",
        "Suspended",
      ];

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid client ID.",
          });
      }

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid client status.",
          });
      }

      const client =
        await Client.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!client) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Client not found.",
          });
      }

      client.status =
        status;

      client.updatedBy =
        req.user._id;

      client.updatedByName =
        req.user.name ||
        "Admin";

      await client.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Client status updated successfully.",

          data:
            clientResponse(client),
        });
    } catch (error) {
      console.error(
        "Change client status error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to change client status.",
        });
    }
  }
);

/* =====================================================
   SOFT DELETE CLIENT
   DELETE /api/admin/client/:id
===================================================== */

router.delete(
  "/client/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid client ID.",
          });
      }

      const client =
        await Client.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!client) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Client not found.",
          });
      }

      const [
        projectCount,
        taskCount,
        ticketCount,
      ] = await Promise.all([
        Project.countDocuments({
          clientId:
            client._id,

          isDeleted: false,
        }),

        Task.countDocuments({
          clientId:
            client._id,

          isDeleted: false,
        }),

        SupportTicket.countDocuments(
          {
            clientId:
              client._id,

            isDeleted: false,
          }
        ),
      ]);

      if (
        projectCount > 0 ||
        taskCount > 0 ||
        ticketCount > 0
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "This client is already used by projects, tasks or tickets. Mark the client Inactive instead of deleting it.",

            usage: {
              projects:
                projectCount,

              tasks:
                taskCount,

              tickets:
                ticketCount,
            },
          });
      }

      client.isDeleted =
        true;

      client.deletedAt =
        new Date();

      client.deletedBy =
        req.user._id;

      client.deletedByName =
        req.user.name ||
        "Admin";

      client.status =
        "Inactive";

      await client.save();

      await createActivityLog({
        action:
          "Client Deleted",

        category:
          "Client",

        description:
          `${client.companyName} was removed from Client Master.`,

        entityType:
          "client",

        entityId:
          client._id,

        entityCode:
          client.clientCode,

        entityName:
          client.companyName,

        clientId:
          client._id,

        clientName:
          client.companyName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",
      });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Client deleted successfully.",

          data: {
            id:
              client._id,

            clientCode:
              client.clientCode,

            companyName:
              client.companyName,
          },
        });
    } catch (error) {
      console.error(
        "Delete client error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to delete client.",
        });
    }
  }
);
/* =====================================================
   MIGRATE OLD CLIENT PRODUCTS TO PRODUCT MASTER
   POST /api/admin/clients/migrate-products
===================================================== */

router.post(
  "/clients/migrate-products",
  async (req, res) => {
    try {
      const clients =
        await Client.find({
          isDeleted: {
            $ne: true,
          },
        });

      const products =
        await Product.find({
          isDeleted: false,
        });

      const productByName =
        new Map();

      for (const product of products) {
        productByName.set(
          String(
            product.productName
          )
            .trim()
            .toLowerCase(),
          product
        );
      }

      let migratedClients = 0;
      let migratedProducts = 0;
      const unmatchedProducts = [];

      for (const client of clients) {
        const rawProducts =
          Array.isArray(
            client.products
          )
            ? client.products
            : [];

        const migrated = [];
        const usedIds =
          new Set();

        for (
          const rawProduct
          of rawProducts
        ) {
          const rawObject =
            typeof rawProduct ===
              "string"
              ? {
                productName:
                  rawProduct,
              }
              : rawProduct.toObject
                ? rawProduct.toObject()
                : rawProduct;

          let masterProduct = null;

          if (
            rawObject.productId &&
            mongoose.Types.ObjectId.isValid(
              rawObject.productId
            )
          ) {
            masterProduct =
              products.find(
                (product) =>
                  String(
                    product._id
                  ) ===
                  String(
                    rawObject.productId
                  )
              );
          }

          if (!masterProduct) {
            const normalizedName =
              String(
                rawObject.productName ||
                ""
              )
                .trim()
                .toLowerCase();

            masterProduct =
              productByName.get(
                normalizedName
              );
          }

          if (!masterProduct) {
            unmatchedProducts.push({
              clientId:
                client._id,

              clientCode:
                client.clientCode,

              companyName:
                client.companyName,

              productName:
                rawObject.productName ||
                "",
            });

            continue;
          }

          const key =
            String(
              masterProduct._id
            );

          if (
            usedIds.has(key)
          ) {
            continue;
          }

          usedIds.add(key);

          migrated.push({
            productId:
              masterProduct._id,

            productCode:
              masterProduct.productCode,

            productName:
              masterProduct.productName,

            version:
              String(
                rawObject.version ||
                masterProduct.currentVersion ||
                "v1.0.0"
              ).trim(),

            purchaseDate:
              rawObject.purchaseDate ||
              "",

            installationDate:
              rawObject.installationDate ||
              "",

            licensedUsers:
              Math.max(
                Number(
                  rawObject.licensedUsers ||
                  1
                ),
                1
              ),

            supportType:
              rawObject.supportType ||
              "Standard",

            amcStatus:
              rawObject.amcStatus ||
              client.amcStatus ||
              "Not Started",

            expiryDate:
              rawObject.expiryDate ||
              client.nextRenewal ||
              "",

            installationStatus:
              rawObject.installationStatus ||
              "Installed",

            notes:
              String(
                rawObject.notes ||
                ""
              ).trim(),
          });

          migratedProducts += 1;
        }

        const oldSnapshot =
          JSON.stringify(
            rawProducts.map(
              (item) => ({
                productId:
                  item.productId ||
                  null,

                productCode:
                  item.productCode ||
                  "",

                productName:
                  item.productName ||
                  String(item || ""),
              })
            )
          );

        const newSnapshot =
          JSON.stringify(
            migrated.map(
              (item) => ({
                productId:
                  String(
                    item.productId
                  ),

                productCode:
                  item.productCode,

                productName:
                  item.productName,
              })
            )
          );

        if (
          oldSnapshot !==
          newSnapshot
        ) {
          client.products =
            migrated;

          client.updatedBy =
            req.user._id;

          client.updatedByName =
            req.user.name ||
            "Admin";

          await client.save();
          try {
            await syncClientUser(
              client
            );
          } catch (userSyncError) {
            console.error(
              "Client user sync error:",
              userSyncError
            );

            return res
              .status(409)
              .json({
                success: false,

                message:
                  userSyncError.code ===
                    11000
                    ? "The updated email is already used by another login account."
                    : userSyncError.message ||
                    "Client was saved, but the login account could not be synchronized.",
              });
          }

          migratedClients += 1;
        }
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Client product migration completed.",

          summary: {
            totalClients:
              clients.length,

            migratedClients,

            migratedProducts,

            unmatchedCount:
              unmatchedProducts.length,
          },

          unmatchedProducts,
        });
    } catch (error) {
      console.error(
        "Migrate client products error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to migrate client products.",
        });
    }
  }
);
/* =====================================================
   CREATE REQUIREMENT
   POST /api/admin/requirement
===================================================== */

router.post(
  "/requirement",
  async (req, res) => {
    try {
      const {
        sourceType,

        clientId,

        prospectName,
        prospectCompany,
        prospectMobile,
        prospectEmail,
        prospectCity,

        title,
        requirementType,
        description,
        source,

        priority,

        expectedDeliveryDate,

        estimatedBudget,
        estimatedCost,
        quotedAmount,

        quotationNo,
        quotationDate,

        assignedEmployeeId,

        status,
        notes,
      } = req.body || {};

      const normalizedSourceType =
        String(
          sourceType || ""
        ).trim();

      if (
        ![
          "Existing Client",
          "New Prospect",
        ].includes(
          normalizedSourceType
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Select Existing Client or New Prospect.",
          });
      }

      const normalizedTitle =
        String(
          title || ""
        ).trim();

      const normalizedDescription =
        String(
          description || ""
        ).trim();

      if (!normalizedTitle) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Requirement title is required.",
          });
      }

      if (
        !normalizedDescription
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Requirement description is required.",
          });
      }

      /*
       * Validate priority from existing System Settings.
       */

      const selectedPriority =
        await validatePriority(
          priority || "Medium"
        );

      if (!selectedPriority) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Selected priority is invalid or inactive.",
          });
      }

      let resolvedClient =
        null;

      /*
       * EXISTING CLIENT
       */

      if (
        normalizedSourceType ===
        "Existing Client"
      ) {
        if (
          !clientId ||
          !mongoose.Types.ObjectId.isValid(
            clientId
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Please select a valid client.",
            });
        }

        resolvedClient =
          await Client.findOne({
            _id:
              clientId,

            isDeleted:
              false,
          });

        if (!resolvedClient) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                "Selected client was not found.",
            });
        }
      }

      /*
       * NEW PROSPECT
       */

      if (
        normalizedSourceType ===
        "New Prospect"
      ) {
        if (
          !String(
            prospectName || ""
          ).trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Prospect name is required.",
            });
        }

        if (
          !String(
            prospectMobile || ""
          ).trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Prospect mobile number is required.",
            });
        }
      }

      /*
       * OPTIONAL EMPLOYEE ASSIGNMENT
       */

      let employee =
        null;

      if (assignedEmployeeId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            assignedEmployeeId
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid employee ID.",
            });
        }

        employee =
          await mongoose
            .model(
              "Employee"
            )
            .findById(
              assignedEmployeeId
            );

        if (!employee) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                "Assigned employee was not found.",
            });
        }
      }

      const requirementCode =
        await generateRequirementCode();

      const requirement =
        await Requirement.create({
          requirementCode,

          sourceType:
            normalizedSourceType,

          clientId:
            resolvedClient?._id ||
            null,

          clientCode:
            resolvedClient?.clientCode ||
            "",

          clientName:
            resolvedClient?.companyName ||
            "",

          prospectName:
            String(
              prospectName || ""
            ).trim(),

          prospectCompany:
            String(
              prospectCompany || ""
            ).trim(),

          prospectMobile:
            String(
              prospectMobile || ""
            ).trim(),

          prospectEmail:
            String(
              prospectEmail || ""
            )
              .trim()
              .toLowerCase(),

          prospectCity:
            String(
              prospectCity || ""
            ).trim(),

          title:
            normalizedTitle,

          requirementType:
            requirementType ||
            "New Software",

          description:
            normalizedDescription,

          source:
            source ||
            (
              normalizedSourceType ===
                "Existing Client"
                ? "Existing Client"
                : "Other"
            ),

          priority:
            selectedPriority.name,

          expectedDeliveryDate:
            expectedDeliveryDate
              ? new Date(
                  expectedDeliveryDate
                )
              : null,

          estimatedBudget:
            Math.max(
              Number(
                estimatedBudget ||
                0
              ),
              0
            ),

          estimatedCost:
            Math.max(
              Number(
                estimatedCost ||
                0
              ),
              0
            ),

          quotedAmount:
            Math.max(
              Number(
                quotedAmount ||
                0
              ),
              0
            ),

          quotationNo:
            String(
              quotationNo || ""
            )
              .trim()
              .toUpperCase(),

          quotationDate:
            quotationDate
              ? new Date(
                  quotationDate
                )
              : null,

          assignedEmployeeId:
            employee?._id ||
            null,

          assignedEmployeeCode:
            employee?.employeeCode ||
            "",

          assignedEmployeeName:
            employee?.name ||
            "",

          status:
            status ||
            "New",

          notes:
            String(
              notes || ""
            ).trim(),

          createdBy:
            req.user._id,

          createdByName:
            req.user.name ||
            "Admin",

          updatedBy:
            req.user._id,

          updatedByName:
            req.user.name ||
            "Admin",
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Requirement created successfully.",

          data:
            requirement,
        });
    } catch (error) {
      console.error(
        "Create requirement error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to create requirement.",
        });
    }
  }
);
/* =====================================================
   GET REQUIREMENTS
   GET /api/admin/requirements
===================================================== */

router.get(
  "/requirements",
  async (req, res) => {
    try {
      const {
        search = "",
        status = "All",
        sourceType = "All",
        priority = "All",
        limit = 200,
      } = req.query;

      const query = {
        isDeleted: false,
      };

      if (
        status !== "All"
      ) {
        query.status =
          status;
      }

      if (
        sourceType !== "All"
      ) {
        query.sourceType =
          sourceType;
      }

      if (
        priority !== "All"
      ) {
        query.priority =
          priority;
      }

      const normalizedSearch =
        String(
          search || ""
        ).trim();

      if (normalizedSearch) {
        query.$or = [
          {
            requirementCode: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            title: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            clientName: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            prospectName: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            prospectCompany: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },
        ];
      }

      const safeLimit =
        Math.min(
          Math.max(
            Number(
              limit || 200
            ),
            1
          ),
          500
        );

      const data =
        await Requirement.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .limit(
            safeLimit
          )
          .lean();

      return res.json({
        success: true,
        count:
          data.length,
        data,
      });
    } catch (error) {
      console.error(
        "Load requirements error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load requirements.",
        });
    }
  }
);
router.get(
  "/requirement/:id",
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid requirement ID.",
          });
      }

      const requirement =
        await Requirement.findOne({
          _id:
            req.params.id,

          isDeleted:
            false,
        });

      if (!requirement) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Requirement not found.",
          });
      }

      return res.json({
        success: true,
        data:
          requirement,
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load requirement.",
        });
    }
  }
);
/* =====================================================
   UPDATE REQUIREMENT STATUS
===================================================== */

router.patch(
  "/requirement/:id/status",
  async (req, res) => {
    try {
      const allowedStatuses = [
        "New",
        "Discussion",
        "Analysis",
        "Estimate Pending",
        "Quotation Pending",
        "Quotation Sent",
        "Negotiation",
        "Approved",
        "Rejected",
        "On Hold",
        "Converted to Project",
      ];

      const status =
        String(
          req.body.status || ""
        ).trim();

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid requirement status.",
          });
      }

      const requirement =
        await Requirement.findOne({
          _id:
            req.params.id,

          isDeleted:
            false,
        });

      if (!requirement) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Requirement not found.",
          });
      }

      if (
        requirement.status ===
          "Converted to Project" &&
        status !==
          "Converted to Project"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Converted requirement cannot be moved back to another status.",
          });
      }

      requirement.status =
        status;

      requirement.updatedBy =
        req.user._id;

      requirement.updatedByName =
        req.user.name ||
        "Admin";

      await requirement.save();

      return res.json({
        success: true,

        message:
          "Requirement status updated.",

        data:
          requirement,
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to update requirement status.",
        });
    }
  }
);
/* =====================================================
   CONVERT REQUIREMENT TO PROJECT
===================================================== */

router.post(
  "/requirement/:id/convert-to-project",
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid requirement ID.",
          });
      }

      const requirement =
        await Requirement.findOne({
          _id:
            req.params.id,

          isDeleted:
            false,
        });

      if (!requirement) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Requirement not found.",
          });
      }

      if (
        requirement.convertedProjectId
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Requirement is already converted to a project.",
          });
      }

      if (
        requirement.status !==
        "Approved"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Requirement must be Approved before converting to a project.",
          });
      }

      /*
       * For phase 1:
       * New Prospect must first be converted into a Client
       * from the UI.
       *
       * We deliberately do not auto-create clients yet,
       * because your Client creation currently also handles
       * account/login/product rules.
       */

    /*
 * New Prospect:
 *
 * After the prospect agrees to the project,
 * admin creates the Client normally from Client Master.
 *
 * During conversion the frontend can send that new clientId.
 */

const requestedClientId =
  req.body?.clientId ||
  requirement.clientId ||
  null;

if (
  requirement.sourceType ===
    "New Prospect" &&
  !requestedClientId
) {
  return res
    .status(409)
    .json({
      success: false,

      requiresClientCreation:
        true,

      message:
        "Create the prospect as a client, then select that client before converting the requirement.",
    });
}

if (
  requestedClientId &&
  !mongoose.Types.ObjectId.isValid(
    requestedClientId
  )
) {
  return res
    .status(400)
    .json({
      success: false,
      message:
        "Invalid client ID.",
    });
}

const client =
  requestedClientId
    ? await Client.findOne({
        _id:
          requestedClientId,

        isDeleted:
          false,
      })
    : null;

if (
  requestedClientId &&
  !client
) {
  return res
    .status(404)
    .json({
      success: false,
      message:
        "Selected client was not found.",
    });
}

/*
 * If this requirement originally came from a prospect,
 * permanently link it to the newly-created client.
 */

if (
  client &&
  String(
    requirement.clientId || ""
  ) !==
    String(client._id)
) {
  requirement.clientId =
    client._id;

  requirement.clientCode =
    client.clientCode ||
    "";

  requirement.clientName =
    client.companyName ||
    "";

  await requirement.save();
}

      const {
          clientId,
        projectCode,
        projectName,
        projectType,
        startDate,
        dueDate,
        priority,
        finalAmount,
        amcApplicable,
        proposedAmcAmount,
        warrantyEndDate,
      } = req.body || {};

      const normalizedCode =
        String(
          projectCode || ""
        )
          .trim()
          .toUpperCase();

      if (!normalizedCode) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Project code is required.",
          });
      }

      const duplicateProject =
        await Project.findOne({
          projectCode:
            normalizedCode,

          isDeleted:
            false,
        });

      if (duplicateProject) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Project code already exists.",
          });
      }

      const selectedPriority =
        await validatePriority(
          priority ||
          requirement.priority ||
          "Medium"
        );

      if (!selectedPriority) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Selected priority is invalid or inactive.",
          });
      }

      const project =
        await Project.create({
          projectCode:
            normalizedCode,

          projectName:
            String(
              projectName ||
              requirement.title
            ).trim(),

          projectType:
            projectType ||
            (
              requirement.requirementType ===
                "Customization"
                ? "Customization"
                : requirement.requirementType ===
                    "Upgrade"
                  ? "Upgrade"
                  : "Client Implementation"
            ),

          clientId:
            client?._id ||
            null,

          clientCode:
            client?.clientCode ||
            "",

          clientName:
            client?.companyName ||
            requirement.clientName ||
            requirement.prospectCompany ||
            requirement.prospectName ||
            "",

          requirementId:
            requirement._id,

          requirementCode:
            requirement.requirementCode,

          description:
            requirement.description,

          startDate:
            startDate
              ? new Date(
                  startDate
                )
              : new Date(),

          dueDate:
            dueDate
              ? new Date(
                  dueDate
                )
              : requirement.expectedDeliveryDate ||
                null,

          priority:
            selectedPriority.name,

          status:
            "Planned",

          progress:
            0,

          finalAmount:
            Math.max(
              Number(
                finalAmount ||
                requirement.quotedAmount ||
                0
              ),
              0
            ),

          amcApplicable:
            Boolean(
              amcApplicable
            ),

          proposedAmcAmount:
            Math.max(
              Number(
                proposedAmcAmount ||
                0
              ),
              0
            ),

          warrantyEndDate:
            warrantyEndDate
              ? new Date(
                  warrantyEndDate
                )
              : null,

          createdBy:
            req.user._id,

          createdByName:
            req.user.name ||
            "Admin",

          updatedBy:
            req.user._id,

          updatedByName:
            req.user.name ||
            "Admin",
        });

      requirement.status =
        "Converted to Project";

      requirement.convertedProjectId =
        project._id;

      requirement.convertedProjectCode =
        project.projectCode;

      requirement.convertedAt =
        new Date();

      requirement.updatedBy =
        req.user._id;

      requirement.updatedByName =
        req.user.name ||
        "Admin";

      await requirement.save();

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Requirement converted to project successfully.",

          data: {
            requirement,
            project,
          },
        });
    } catch (error) {
      console.error(
        "Convert requirement to project error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to convert requirement to project.",
        });
    }
  }
);
router.delete(
  "/requirement/:id",
  async (req, res) => {
    try {
      const requirement =
        await Requirement.findOne({
          _id:
            req.params.id,

          isDeleted:
            false,
        });

      if (!requirement) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Requirement not found.",
          });
      }

      if (
        requirement.status ===
        "Converted to Project"
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Converted requirement cannot be deleted.",
          });
      }

      requirement.isDeleted =
        true;

      requirement.deletedAt =
        new Date();

      requirement.deletedBy =
        req.user._id;

      requirement.deletedByName =
        req.user.name ||
        "Admin";

      await requirement.save();

      return res.json({
        success: true,

        message:
          "Requirement deleted successfully.",
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to delete requirement.",
        });
    }
  }
);
async function resolveTaskProject(projectId) {
  if (!projectId) {
    throw new Error(
      "Project is required."
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      projectId
    )
  ) {
    throw new Error(
      "Invalid project ID."
    );
  }

  const project =
    await Project.findOne({
      _id: projectId,
      isDeleted: false,
    });

  if (!project) {
    throw new Error(
      "Selected project was not found."
    );
  }

  if (
    ["Completed", "Cancelled"].includes(
      project.status
    )
  ) {
    throw new Error(
      `Tasks cannot be created for a ${project.status.toLowerCase()} project.`
    );
  }

  return {
    projectId: project._id,
    projectCode:
      project.projectCode,
    projectName:
      project.projectName,
    project,
  };
}
router.post("/task/:id/start", async (req, res) => {
try {
const Task = mongoose.model("Task");
const Employee = mongoose.model("Employee");


const task = await Task.findById(req.params.id);
if (!task) {
  return res.status(404).json({
    success: false,
    message: "Task not found.",
  });
}

const employee = await Employee.findById(task.assignedEmployeeId);
if (!employee) {
  return res.status(404).json({
    success: false,
    message: "Assigned employee not found.",
  });
}

// Mark task as active
task.status = "In Progress";
task.startedAt = new Date();
await task.save();
if (
  task.taskFor === "Project" &&
  task.projectId
) {
  await syncProjectTaskProgress(
    task.projectId
  );
}
// Update employee current task
employee.status = "Working";

// Dashboard field
employee.currentTask = task.title;

// Windows Agent fields
employee.currentTaskId = task._id;
employee.currentTaskCode = task.taskCode || "";
employee.currentTaskTitle = task.title || "";
employee.currentClient = task.clientName || "—";
employee.currentProject = task.projectName || "—";
employee.currentTaskStartedAt = new Date();

await employee.save();

console.log("START TASK UPDATE", {
  employee: employee.employeeCode,
  taskId: employee.currentTaskId,
  taskCode: employee.currentTaskCode,
  taskTitle: employee.currentTaskTitle,
  client: employee.currentClient,
  project: employee.currentProject,
});

return res.json({
  success: true,
  message: "Task started successfully.",
  task,
  employee,
});


} catch (error) {
console.error(error);
return res.status(500).json({
success: false,
message: "Server error.",
});
}
});

/* =====================================================
   CREATE TASK
   POST /api/admin/task
===================================================== */

router.post("/task", async (req, res) => {
  try {
    const {
      title,
      description,
      workType,

      taskFor,
      generalTaskFor,

      clientId,
      clientName,

      productId,
      projectId,

      ticketId,
      ticketCode,

      assignedEmployeeId,

      priority,
      status,

      dueDate,
      estimatedMinutes,
    } = req.body;

    const normalizedTaskFor =
      ["Project", "Product", "General"].includes(
        String(taskFor || "").trim()
      )
        ? String(taskFor).trim()
        : "General";

    let resolvedProject = {
      projectId: null,
      projectCode: "",
      projectName: "",
      project: null,
    };

    let resolvedProductId = null;
    let resolvedProductCode = "";
    let resolvedProductName = "";

    let resolvedClientId = null;
    let resolvedClientName =
      "Internal Development";

    /* =========================================
       PROJECT TASK
    ========================================= */

    if (
      normalizedTaskFor ===
      "Project"
    ) {
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a project.",
        });
      }

      resolvedProject =
        await resolveTaskProject(
          projectId
        );

      const project =
        resolvedProject.project;

      resolvedClientId =
        project.clientId ||
        null;

      resolvedClientName =
        project.clientName ||
        "Internal Development";

      resolvedProductId =
        project.productId ||
        null;

      resolvedProductCode =
        project.productCode ||
        "";

      resolvedProductName =
        project.productName ||
        "";
    }

    /* =========================================
       PRODUCT TASK
    ========================================= */

    if (
      normalizedTaskFor ===
      "Product"
    ) {
      if (!productId) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a product.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      const product =
        await Product.findOne({
          _id: productId,
          isDeleted: false,
          status: "Active",
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Selected product was not found or is inactive.",
        });
      }

      resolvedProductId =
        product._id;

      resolvedProductCode =
        product.productCode;

      resolvedProductName =
        product.productName;

      if (clientId) {
        if (
          !mongoose.Types.ObjectId.isValid(
            clientId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid client ID.",
          });
        }

        const client =
          await Client.findOne({
            _id: clientId,
            isDeleted: false,
          });

        if (!client) {
          return res.status(404).json({
            success: false,
            message:
              "Selected client was not found.",
          });
        }

        resolvedClientId =
          client._id;

        resolvedClientName =
          client.companyName;
      }
    }

    /* =========================================
       GENERAL TASK
    ========================================= */

    if (
      normalizedTaskFor ===
      "General"
    ) {
      resolvedProject = {
        projectId: null,
        projectCode: "",
        projectName: "",
        project: null,
      };

      resolvedProductId = null;
      resolvedProductCode = "";
      resolvedProductName = "";

      resolvedClientId = null;
      resolvedClientName =
        "Internal Development";
    }
    /* =========================================
       EMPLOYEE VALIDATION
    ========================================= */

 /* =========================================
   EMPLOYEE ASSIGNMENT
   Manual selection OR Smart Auto Assignment
========================================= */

let employee = null;

let assignmentMode = "MANUAL";

let assignmentReason =
  "ADMIN_SELECTED_EMPLOYEE";

let assignmentWorkload = null;

/*
 * =====================================================
 * OPTION 1:
 * ADMIN MANUALLY SELECTED AN EMPLOYEE
 * =====================================================
 *
 * Manual selection always gets first preference.
 * Auto-assignment does NOT override Admin's choice.
 */
if (
  assignedEmployeeId &&
  String(assignedEmployeeId).trim()
) {
  employee = await findEmployeeById(
    assignedEmployeeId
  );

  if (!employee) {
    return res.status(404).json({
      success: false,
      message:
        "Selected employee was not found or is inactive.",
    });
  }

  assignmentMode = "MANUAL";

  assignmentReason =
    "ADMIN_SELECTED_EMPLOYEE";
}

/*
 * =====================================================
 * OPTION 2:
 * NO EMPLOYEE SELECTED
 * USE SMART AUTO ASSIGNMENT
 * =====================================================
 */
else {
  const autoAssignment =
    await findBestEmployeeForTask({
      clientId:
        resolvedClientId || null,
    });

  if (
    !autoAssignment ||
    !autoAssignment.employee
  ) {
    return res.status(409).json({
      success: false,
      message:
        "No employee is currently available for automatic assignment. Please select an employee manually.",
    });
  }

  employee =
    autoAssignment.employee;

  assignmentMode =
    "AUTO";

  assignmentReason =
    autoAssignment.reason;

  assignmentWorkload = {
    workload:
      Number(
        autoAssignment.workload || 0
      ),

    activeTasks:
      Number(
        autoAssignment.activeTasks || 0
      ),

    activeTickets:
      Number(
        autoAssignment.activeTickets || 0
      ),
  };

  console.log(
    "[AUTO TASK ASSIGNMENT]",
    {
      employeeId:
        String(employee._id),

      employeeCode:
        employee.employeeCode,

      employeeName:
        employee.name,

      clientId:
        resolvedClientId
          ? String(
              resolvedClientId
            )
          : null,

      reason:
        assignmentReason,

      workload:
        assignmentWorkload,
    }
  );
}

    /* =========================================
       DUE DATE VALIDATION
    ========================================= */

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: "Due date is required.",
      });
    }

    /* =========================================
       PRIORITY VALIDATION
    ========================================= */

    const selectedPriority =
      await validatePriority(
        priority || "Medium"
      );

    if (!selectedPriority) {
      return res.status(400).json({
        success: false,
        message:
          "Selected priority is invalid or inactive.",
      });
    }

    /* =========================================
       STATUS VALIDATION
    ========================================= */

    const selectedStatus =
      await validateTaskStatus(
        status || "Assigned"
      );

    if (!selectedStatus) {
      return res.status(400).json({
        success: false,
        message:
          "Selected task status is invalid or inactive.",
      });
    }
    const task = await Task.create({
      taskCode:
        generateTaskCode(),

      title:
        String(title || "").trim(),

      description:
        String(
          description || ""
        ).trim(),

      workType:
        workType ||
        "Client Support",

      taskFor:
        normalizedTaskFor,
      generalTaskFor:
        normalizedTaskFor ===
          "General"
          ? String(
            generalTaskFor || ""
          ).trim()
          : "",

      clientId:
        resolvedClientId,

      clientName:
        resolvedClientName,

      productId:
        resolvedProductId,

      productCode:
        resolvedProductCode,

      productName:
        resolvedProductName,

      projectId:
        resolvedProject.projectId,

      projectCode:
        resolvedProject.projectCode,

      projectName:
        resolvedProject.projectName,

      ticketId:
        normalizeObjectId(
          ticketId
        ),

      ticketCode:
        String(
          ticketCode || ""
        ).trim(),

      assignedEmployeeId:
        employee._id,

      assignedEmployeeName:
        employee.name,

      assignedEmployeeCode:
        employee.employeeCode ||
        "",

      assignedBy:
        req.user._id,

      assignedByName:
        req.user.name ||
        "Admin",

      priority:
        selectedPriority.name,

      status:
        selectedStatus.name,

      progress:
        selectedStatus.isFinal
          ? 100
          : 0,

      startDate:
        selectedStatus.name ===
          "In Progress"
          ? new Date()
          : null,

      dueDate:
        new Date(dueDate),

      completedAt:
        selectedStatus.isFinal
          ? new Date()
          : null,

      estimatedMinutes:
        Math.max(
          Number(
            estimatedMinutes || 0
          ),
          0
        ),

      spentMinutes:
        0,

 timeline: [
  {
    action:
      "Task Created",

    description:
      normalizedTaskFor === "Project"
        ? `Task created under project ${resolvedProject.projectName} and assigned to ${employee.name}.`
        : normalizedTaskFor === "Product"
          ? `Task created for product ${resolvedProductName} and assigned to ${employee.name}.`
          : `General internal task created and assigned to ${employee.name}.`,

    performedBy:
      req.user._id,

    performedByName:
      req.user.name ||
      "Admin",

    performedByRole:
      "admin",

    createdAt:
      new Date(),
  },

  ...(assignmentMode === "AUTO"
    ? [
        {
          action:
            "Auto Assigned",

          description:
            assignmentReason ===
            "CLIENT_ASSIGNED_EMPLOYEE_FREE"
              ? `${employee.name} was automatically selected because this employee is assigned to the client and is currently free.`

              : assignmentReason ===
                "FREE_EMPLOYEE_LEAST_WORKLOAD"
                ? `${employee.name} was automatically selected as the free employee with the lowest workload (${assignmentWorkload?.activeTasks || 0} active tasks, ${assignmentWorkload?.activeTickets || 0} active tickets).`

                : `${employee.name} was automatically selected because no employee was free and this employee had the lowest workload (${assignmentWorkload?.activeTasks || 0} active tasks, ${assignmentWorkload?.activeTickets || 0} active tickets).`,

          performedBy:
            null,

          performedByName:
            "System",

          performedByRole:
            "system",

          createdAt:
            new Date(),
        },
      ]
    : []),
],
    });

    await updateEmployeeTaskSummary(employee._id, {
      $inc: {
        openTasks: 1,
      },

      $set: {
        status: "Working",
        currentTask: task.title,
        currentClient: task.clientName,
        currentProject:
          task.projectName,
        lastActivityAt: new Date(),
      },
    });

    await createActivityLog({
      action: "Task Created",

      category: "Task",

      description:
        `${task.taskCode} was created and assigned to ${employee.name}.`,

      entityType: "task",

      entityId: task._id,

      entityCode: task.taskCode,

      entityName: task.title,

      clientId: task.clientId,

      clientName: task.clientName,

      employeeId: employee._id,

      employeeName: employee.name,

      performedBy: req.user._id,

      performedByName:
        req.user.name || "Admin",

      performedByRole: "admin",

      metadata: {
        projectId: task.projectId,
        projectCode: task.projectCode,
        projectName: task.projectName,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
      },
    });
/*
 * Keep linked project progress synchronized.
 */

if (
  task.taskFor === "Project" &&
  task.projectId
) {
  await syncProjectTaskProgress(
    task.projectId
  );
}
// if (
//   project?.convertedToProduct ===
//   true
// ) {
//   return res.status(409).json({
//     success: false,

//     code:
//       "PROJECT_LOCKED",

//     message:
//       "This project has already been converted to a product. New project tasks cannot be created.",
//   });
// }

    return res.status(201).json({
      success: true,
      message: "Task created and assigned successfully.",
      data: taskResponse(task),
    });
  } catch (error) {
    console.error("Create task error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Task code conflict occurred. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to create task.",
    });
  }
});

/* =====================================================
   GET ALL TASKS
   GET /api/admin/tasks
===================================================== */

router.get("/tasks", async (req, res) => {
  try {
    const {
      search = "",
      status = "All",
      priority = "All",
      employeeId = "",
      clientId = "",
      projectId = "",
    } = req.query;

    const query = {
      isDeleted: false,
    };

    if (status !== "All") {
      query.status = status;
    }

    if (priority !== "All") {
      query.priority = priority;
    }

    if (
      employeeId &&
      mongoose.Types.ObjectId.isValid(employeeId)
    ) {
      query.assignedEmployeeId =
        new mongoose.Types.ObjectId(employeeId);
    }

    if (
      clientId &&
      mongoose.Types.ObjectId.isValid(clientId)
    ) {
      query.clientId =
        new mongoose.Types.ObjectId(clientId);
    }

    if (
      projectId &&
      mongoose.Types.ObjectId.isValid(
        projectId
      )
    ) {
      query.projectId =
        new mongoose.Types.ObjectId(
          projectId
        );
    }

    const normalizedSearch = String(search).trim();

    if (normalizedSearch) {
      query.$or = [
        {
          taskCode: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          title: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          clientName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          projectCode: {
            $regex:
              normalizedSearch,

            $options: "i",
          },
        },

        {
          projectName: {
            $regex:
              normalizedSearch,

            $options: "i",
          },
        },
        {
          assignedEmployeeName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
      ];
    }

    const tasks = await Task.find(query).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks.map(taskResponse),
    });
  } catch (error) {
    console.error("Load tasks error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to load tasks.",
    });
  }
});

/* =====================================================
   GET ONE TASK
   GET /api/admin/task/:id
===================================================== */

router.get("/task/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (req.user.role === "employee") {
      const employee = await Employee.findOne({ userId: req.user._id });
      if (!employee || String(task.assignedEmployeeId) !== String(employee._id)) {
        return res.status(403).json({ success: false, message: "You can view only your assigned tasks." });
      }
    }

    return res.status(200).json({
      success: true,
      data: taskResponse(task),
    });
  } catch (error) {
    console.error("Get task error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to load task.",
    });
  }
});

/* =====================================================
   UPDATE TASK
   PUT /api/admin/task/:id
===================================================== */

router.put("/task/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const previousEmployeeId = String(
      task.assignedEmployeeId
    );
    const previousEmployeeName =
      task.assignedEmployeeName;

    const previousTaskData = {
      title:
        task.title,

      clientName:
        task.clientName,

      projectId:
        task.projectId,

      projectCode:
        task.projectCode,

      projectName:
        task.projectName,

      priority:
        task.priority,

      dueDate:
        task.dueDate,

      estimatedMinutes:
        task.estimatedMinutes,
    };
    const {
      title,
      description,
      workType,
      clientId,
      clientName,
      productId,
      projectId,
      ticketId,
      ticketCode,
      assignedEmployeeId,
      priority,
      status,
      progress,
      dueDate,
      estimatedMinutes,
      resolutionNote,
    } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty.",
        });
      }

      task.title = String(title).trim();
    }

    if (description !== undefined) {
      task.description =
        String(description || "").trim();
    }

    if (workType !== undefined) {
      task.workType = workType;
    }

    if (projectId !== undefined) {
      const resolvedProject =
        await resolveTaskProject(
          projectId
        );

      task.projectId =
        resolvedProject.projectId;

      task.projectCode =
        resolvedProject.projectCode;

      task.projectName =
        resolvedProject.projectName;

      task.clientId =
        resolvedProject.project
          .clientId ||
        null;

      task.clientName =
        resolvedProject.project
          .clientName ||
        "Internal Development";

      task.productId =
        resolvedProject.project
          .productId ||
        null;
    }

    if (clientId !== undefined) {
      if (!clientId) {
        task.clientId = null;
        task.clientName =
          String(clientName || "").trim() ||
          "Internal Development";
      } else {
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid client ID.",
          });
        }

        const client = await Client.findById(clientId);

        if (!client) {
          return res.status(404).json({
            success: false,
            message: "Selected client was not found.",
          });
        }

        task.clientId = client._id;
        task.clientName = client.companyName;
      }
    } else if (clientName !== undefined) {
      task.clientName =
        String(clientName || "").trim() ||
        "Internal Development";
    }

    if (productId !== undefined) {
      task.productId =
        normalizeObjectId(productId);
    }

    if (ticketId !== undefined) {
      task.ticketId =
        normalizeObjectId(ticketId);
    }

    if (ticketCode !== undefined) {
      task.ticketCode =
        String(ticketCode || "").trim();
    }

    if (priority !== undefined) {
      const selectedPriority =
        await validatePriority(priority);

      if (!selectedPriority) {
        return res.status(400).json({
          success: false,
          message:
            "Selected priority is invalid or inactive.",
        });
      }

      task.priority =
        selectedPriority.name;
    }

    if (dueDate !== undefined) {
      task.dueDate = new Date(dueDate);
    }

    if (estimatedMinutes !== undefined) {
      task.estimatedMinutes = Math.max(
        Number(estimatedMinutes || 0),
        0
      );
    }

    if (resolutionNote !== undefined) {
      task.resolutionNote =
        String(resolutionNote || "").trim();
    }

    if (progress !== undefined) {
      task.progress = Math.min(
        Math.max(Number(progress || 0), 0),
        100
      );
    }

    if (status !== undefined) {
      const selectedTaskStatus =
        await validateTaskStatus(
          status
        );

      if (!selectedTaskStatus) {
        return res.status(400).json({
          success: false,
          message:
            "Selected task status is invalid or inactive.",
        });
      }

      task.status =
        selectedTaskStatus.name;

      if (
        selectedTaskStatus.isFinal
      ) {
        task.progress = 100;

        task.completedAt =
          task.completedAt ||
          new Date();
      } else {
        task.completedAt =
          null;
      }
    }

    if (
      assignedEmployeeId &&
      String(assignedEmployeeId) !==
      previousEmployeeId
    ) {
      const newEmployee = await findEmployeeById(
        assignedEmployeeId
      );

      if (!newEmployee) {
        return res.status(404).json({
          success: false,
          message:
            "Selected employee was not found or is inactive.",
        });
      }

      task.assignedEmployeeId = newEmployee._id;
      task.assignedEmployeeName = newEmployee.name;
      task.assignedEmployeeCode =
        newEmployee.employeeCode || "";

      task.timeline.push({
        action: "Task Reassigned",
        description: `Task reassigned to ${newEmployee.name}.`,
        performedBy: req.user._id,
        performedByName:
          req.user.name || "Admin",
        performedByRole: "admin",
      });

      await updateEmployeeTaskSummary(
        previousEmployeeId,
        {
          $inc: {
            openTasks: -1,
          },
          $set: {
            lastActivityAt: new Date(),
          },
        }
      );

      await updateEmployeeTaskSummary(
        newEmployee._id,
        {
          $inc: {
            openTasks: 1,
          },
          $set: {
            status: "Working",
            currentTask: task.title,
            currentClient: task.clientName,
            currentProject:
              task.projectName,
            lastActivityAt: new Date(),
          },
        }
      );
    } else {
      task.timeline.push({
        action: "Task Updated",
        description:
          "Task details were updated by Admin.",
        performedBy: req.user._id,
        performedByName:
          req.user.name || "Admin",
        performedByRole: "admin",
      });
    }
    const employeeWasChanged =
      String(task.assignedEmployeeId) !==
      String(previousEmployeeId);

    await task.save();


    if (employeeWasChanged) {
      await createActivityLog({
        action: "Task Reassigned",

        category: "Task",

        description:
          `${task.taskCode} was reassigned from ${previousEmployeeName || "Unassigned"
          } to ${task.assignedEmployeeName}.`,

        entityType: "task",

        entityId: task._id,

        entityCode: task.taskCode,

        entityName: task.title,

        clientId: task.clientId,

        clientName: task.clientName,

        employeeId:
          task.assignedEmployeeId,

        employeeName:
          task.assignedEmployeeName,

        performedBy: req.user._id,

        performedByName:
          req.user.name || "Admin",

        performedByRole: "admin",

        metadata: {
          previousEmployeeId,
          previousEmployeeName,
          currentEmployeeId:
            task.assignedEmployeeId,
          currentEmployeeName:
            task.assignedEmployeeName,
          project: task.project,
          priority: task.priority,
        },
      });
    } else {
      await createActivityLog({
        action: "Task Updated",

        category: "Task",

        description:
          `${task.taskCode} task information was updated.`,

        entityType: "task",

        entityId: task._id,

        entityCode: task.taskCode,

        entityName: task.title,

        clientId: task.clientId,

        clientName: task.clientName,

        employeeId:
          task.assignedEmployeeId,

        employeeName:
          task.assignedEmployeeName,

        performedBy: req.user._id,

        performedByName:
          req.user.name || "Admin",

        performedByRole: "admin",

        metadata: {
          previous: previousTaskData,

          current: {
            title: task.title,
            clientName: task.clientName,
            project: task.project,
            priority: task.priority,
            dueDate: task.dueDate,
            estimatedMinutes:
              task.estimatedMinutes,
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: taskResponse(task),
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to update task.",
    });
  }
});

/* =====================================================
   UPDATE TASK STATUS
   PATCH /api/admin/task/:id/status
===================================================== */

router.patch("/task/:id/status", async (req, res) => {
  try {
    // ... existing code up to the point where task is saved and employee summaries are updated ...

    if (isCompleted && !wasCompleted) {
      await updateEmployeeTaskSummary(
        task.assignedEmployeeId,
        {
          $inc: {
            openTasks: -1,
            completedToday: 1,
          },

          $set: {
            status: "Free",
            currentTask:
              "Available for assignment",
            currentClient: "—",
            currentProject: "—",
            lastActivityAt: new Date(),
          },
        }
      );
    }

    if (!isCompleted && wasCompleted) {
      await updateEmployeeTaskSummary(
        task.assignedEmployeeId,
        {
          $inc: {
            openTasks: 1,
            completedToday: -1,
          },

          $set: {
            status: "Working",
            currentTask: task.title,
            currentClient: task.clientName,
            currentProject:
              task.projectName,
            lastActivityAt: new Date(),
          },
        }
      );
    }

    // --- AUTO-RESOLVE LINKED TICKET ---
    // Insert this block here
    if (isCompleted && task.ticketId) {
      const SupportTicket = mongoose.models.SupportTicket;
      const ticket = await SupportTicket.findById(task.ticketId);
      if (ticket && !["Resolved", "Closed"].includes(ticket.status)) {
        ticket.status = "Resolved";
        ticket.resolvedAt = new Date();
        ticket.resolutionNote = `Resolved by completing linked task ${task.taskCode}.`;
        ticket.timeline.push({
          type: "resolved",
          title: "Ticket Resolved Automatically",
          description: `Resolved after linked task ${task.taskCode} was completed.`,
          performedBy: req.user._id,
          performedByName: req.user.name || "Admin",
          performedByRole: req.user.role || "admin",
        });
        await ticket.save();
        // Update client open ticket count
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
    }
    // --- END AUTO-RESOLVE ---
/*
 * AUTO SYNC PROJECT PROGRESS
 */

if (
  task.taskFor === "Project" &&
  task.projectId
) {
  await syncProjectTaskProgress(
    task.projectId
  );
}
    return res.status(200).json({
      success: true,
      message: "Task status updated successfully.",
      data: taskResponse(task),
    });
  } catch (error) {
    console.error("Update task status error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to update task status.",
    });
  }
});
/* =====================================================
   ADD TASK COMMENT
   POST /api/admin/task/:id/comment
===================================================== */

router.post("/task/:id/comment", async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    if (!String(message || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (req.user.role === "employee") {
      const employee = await Employee.findOne({ userId: req.user._id });
      if (!employee || String(task.assignedEmployeeId) !== String(employee._id)) {
        return res.status(403).json({ success: false, message: "You can comment only on your assigned tasks." });
      }
    }

    task.comments.push({
      message: String(message).trim(),
      authorId: req.user._id,
      authorName: req.user.name || "Employee",
      authorRole: req.user.role,
    });

    task.timeline.push({
      action: "Comment Added",
      description: "Admin added a task comment.",
      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",
    });

    await task.save();
    await createActivityLog({
      action: "Task Comment Added",

      category: "Task",

      description:
        `A comment was added to ${task.taskCode}.`,

      entityType: "task",

      entityId: task._id,

      entityCode: task.taskCode,

      entityName: task.title,

      clientId: task.clientId,

      clientName: task.clientName,

      employeeId:
        task.assignedEmployeeId,

      employeeName:
        task.assignedEmployeeName,

      performedBy: req.user._id,

      performedByName:
        req.user.name || "Admin",

      performedByRole: "admin",

      metadata: {
        comment:
          String(message).trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      data: taskResponse(task),
    });
  } catch (error) {
    console.error("Add task comment error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to add comment.",
    });
  }
});

/* =====================================================
   UPLOAD TASK ATTACHMENT
===================================================== */
router.post("/task/:id/attachment", uploadTaskAttachment.single("attachment"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid task ID." });
    if (!req.file) return res.status(400).json({ success: false, message: "Please select a file." });
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    task.attachments.push({
      fileName: req.file.originalname,
      fileUrl: `/uploads/tasks/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name || "Administrator",
    });
    task.timeline.push({ action: "Attachment Uploaded", description: `${req.file.originalname} was attached to the task.`, performedBy: req.user._id, performedByName: req.user.name || "Administrator", performedByRole: req.user.role });
    await task.save();
    return res.status(201).json({ success: true, message: "Task attachment uploaded successfully.", data: taskResponse(task) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to upload task attachment." });
  }
});

/* =====================================================
   SOFT DELETE TASK
   DELETE /api/admin/task/:id
===================================================== */

router.delete("/task/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }
const affectedProjectId =
  task.taskFor === "Project" &&
  task.projectId
    ? task.projectId
    : null;
    const wasOpen = ![
      "Completed",
      "Closed",
      "Cancelled",
    ].includes(task.status);

    task.isDeleted = true;

    task.timeline.push({
      action: "Task Deleted",
      description:
        "Task was removed by Admin.",
      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",
    });

    await task.save();
    if (affectedProjectId) {
  await syncProjectTaskProgress(
    affectedProjectId
  );
}
    await createActivityLog({
      action: "Task Deleted",

      category: "Task",

      description:
        `${task.taskCode} was deleted by Admin.`,

      entityType: "task",

      entityId: task._id,

      entityCode: task.taskCode,

      entityName: task.title,

      clientId: task.clientId,

      clientName: task.clientName,

      employeeId:
        task.assignedEmployeeId,

      employeeName:
        task.assignedEmployeeName,

      performedBy: req.user._id,

      performedByName:
        req.user.name || "Admin",

      performedByRole: "admin",

      metadata: {
        status: task.status,
        priority: task.priority,
        project: task.project,
        wasOpen,
      },
    });

    if (wasOpen) {
      await updateEmployeeTaskSummary(
        task.assignedEmployeeId,
        {
          $inc: {
            openTasks: -1,
          },
          $set: {
            lastActivityAt: new Date(),
          },
        }
      );
    }
    await normalizeEmployeeTaskCounts(
      task.assignedEmployeeId
    );

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
      data: {
        id: task._id,
        taskCode: task.taskCode,
        title: task.title,
      },
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to delete task.",
    });
  }
});
/* =====================================================
   GET ACTIVITY LOGS
   GET /api/admin/activities
===================================================== */

router.get("/activities", async (req, res) => {
  try {
    const {
      search = "",
      category = "All",
      entityType = "All",
      clientId = "",
      employeeId = "",
      limit = 50,
      page = 1,
    } = req.query;

    const query = {
      isDeleted: false,
    };

    if (category !== "All") {
      query.category = category;
    }

    if (entityType !== "All") {
      query.entityType = entityType;
    }

    if (
      clientId &&
      mongoose.Types.ObjectId.isValid(clientId)
    ) {
      query.clientId =
        new mongoose.Types.ObjectId(clientId);
    }

    if (
      employeeId &&
      mongoose.Types.ObjectId.isValid(
        employeeId
      )
    ) {
      query.employeeId =
        new mongoose.Types.ObjectId(
          employeeId
        );
    }

    const normalizedSearch =
      String(search || "").trim();

    if (normalizedSearch) {
      query.$or = [
        {
          action: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          entityCode: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          entityName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          clientName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          employeeName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          performedByName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
      ];
    }

    const safeLimit = Math.min(
      Math.max(Number(limit || 50), 1),
      200
    );

    const safePage = Math.max(
      Number(page || 1),
      1
    );

    const skip =
      (safePage - 1) * safeLimit;

    const [activities, total] =
      await Promise.all([
        ActivityLog.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(safeLimit),

        ActivityLog.countDocuments(query),
      ]);

    return res.status(200).json({
      success: true,

      count: activities.length,

      total,

      page: safePage,

      totalPages: Math.max(
        Math.ceil(total / safeLimit),
        1
      ),

      data: activities,
    });
  } catch (error) {
    console.error(
      "Load activity logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load activity logs.",
    });
  }
});

/* =====================================================
   GET ONE ENTITY'S ACTIVITY
   GET /api/admin/activities/:entityType/:entityId
===================================================== */

router.get(
  "/activities/:entityType/:entityId",
  async (req, res) => {
    try {
      const {
        entityType,
        entityId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          entityId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid entity ID.",
        });
      }

      const activities =
        await ActivityLog.find({
          entityType,
          entityId:
            new mongoose.Types.ObjectId(
              entityId
            ),
          isDeleted: false,
        }).sort({
          createdAt: -1,
        });

      return res.status(200).json({
        success: true,
        count: activities.length,
        data: activities,
      });
    } catch (error) {
      console.error(
        "Load entity activity error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to load activity.",
      });
    }
  }
);
/* =====================================================
   CREATE SUPPORT TICKET
   POST /api/admin/ticket
===================================================== */

router.post("/ticket", async (req, res) => {
  try {
    const {
      title,
      description,

      clientId,
      productId,
      productName,

      module,
      category,
      source,
      priority,

      assignedEmployeeId,
      dueDate,

      contactPerson,
      contactMobile,
      contactEmail,
    } = req.body;

    const normalizedTitle =
      String(title || "").trim();

    const normalizedDescription =
      String(description || "").trim();

    if (!normalizedTitle) {
      return res.status(400).json({
        success: false,
        message: "Ticket title is required.",
      });
    }

    if (!normalizedDescription) {
      return res.status(400).json({
        success: false,
        message:
          "Problem description is required.",
      });
    }

    if (
      !clientId ||
      !mongoose.Types.ObjectId.isValid(
        clientId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a valid client.",
      });
    }

    const client = await Client.findById(
      clientId
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message:
          "Selected client was not found.",
      });
    }

    let resolvedProduct = null;

    if (
      productId &&
      mongoose.Types.ObjectId.isValid(
        productId
      )
    ) {
      resolvedProduct =
        client.products.id(productId);
    }

    if (
      !resolvedProduct &&
      String(productName || "").trim()
    ) {
      const normalizedProductName =
        String(productName)
          .trim()
          .toLowerCase();

      resolvedProduct = (
        client.products || []
      ).find(
        (product) =>
          String(
            product.productName || ""
          )
            .trim()
            .toLowerCase() ===
          normalizedProductName
      );
    }

    if (!resolvedProduct) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a product assigned to this client.",
      });
    }

    let employee = null;

    if (assignedEmployeeId) {
      employee = await findEmployeeById(
        assignedEmployeeId
      );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            "Selected employee was not found or is inactive.",
        });
      }

      if (
        employee.status === "Leave" ||
        employee.status === "Inactive"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Ticket cannot be assigned because ${employee.name} is ${employee.status.toLowerCase()}.`,
        });
      }
    }

    const initialStatus = employee
      ? "Assigned"
      : "New";

    const ticket = await SupportTicket.create({
      ticketCode: generateTicketCode(),

      title: normalizedTitle,

      description:
        normalizedDescription,

      clientId: client._id,

      clientCode:
        client.clientCode || "",

      clientName:
        client.companyName,

      contactPerson:
        String(
          contactPerson ||
          client.contactPerson ||
          ""
        ).trim(),

      contactMobile:
        String(
          contactMobile ||
          client.mobile ||
          ""
        ).trim(),

      contactEmail:
        String(
          contactEmail ||
          client.email ||
          ""
        )
          .trim()
          .toLowerCase(),

      productId:
        resolvedProduct._id,

      productName:
        resolvedProduct.productName,

      productVersion:
        resolvedProduct.version || "",

      module:
        String(module || "General").trim(),

      category:
        category || "Other",

      source:
        source || "Admin",

      priority:
        priority || "Medium",

      status: initialStatus,

      assignedEmployeeId:
        employee ? employee._id : null,

      assignedEmployeeName:
        employee
          ? employee.name
          : "Unassigned",

      assignedEmployeeCode:
        employee
          ? employee.employeeCode || ""
          : "",

      assignedAt:
        employee ? new Date() : null,

      assignedBy:
        employee ? req.user._id : null,

      assignedByName:
        employee
          ? req.user.name || "Admin"
          : "",

      dueDate:
        dueDate
          ? new Date(dueDate)
          : null,

      createdBy:
        req.user._id,

      createdByName:
        req.user.name || "Admin",

      createdByRole: "admin",

      timeline: [
        {
          type: "created",

          title:
            "Ticket Created",

          description:
            "Support ticket was created by Admin.",

          performedBy:
            req.user._id,

          performedByName:
            req.user.name || "Admin",





          performedByRole:
            "admin",
        },

        ...(employee
          ? [
            {
              type: "assigned",

              title:
                "Ticket Assigned",

              description:
                `Ticket assigned to ${employee.name}.`,

              performedBy:
                req.user._id,

              performedByName:
                req.user.name || "Admin",

              performedByRole:
                "admin",
            },
          ]
          : []),
      ],
    });

    await normalizeClientOpenTicketCount(
      client._id
    );

    await createActivityLog({
      action: "Ticket Created",

      category: "Ticket",

      description:
        `${ticket.ticketCode} was created for ${client.companyName}.`,

      entityType: "ticket",

      entityId: ticket._id,

      entityCode:
        ticket.ticketCode,

      entityName:
        ticket.title,

      clientId:
        ticket.clientId,

      clientName:
        ticket.clientName,

      employeeId:
        ticket.assignedEmployeeId,

      employeeName:
        ticket.assignedEmployeeName,

      performedBy:
        req.user._id,

      performedByName:
        req.user.name || "Admin",

      performedByRole:
        "admin",

      metadata: {
        productName:
          ticket.productName,

        module:
          ticket.module,

        category:
          ticket.category,

        source:
          ticket.source,

        priority:
          ticket.priority,

        status:
          ticket.status,

        dueDate:
          ticket.dueDate,
      },
    });

    if (employee) {
      await createActivityLog({
        action:
          "Ticket Assigned",

        category:
          "Ticket",

        description:
          `${ticket.ticketCode} was assigned to ${employee.name}.`,

        entityType:
          "ticket",

        entityId:
          ticket._id,

        entityCode:
          ticket.ticketCode,

        entityName:
          ticket.title,

        clientId:
          ticket.clientId,

        clientName:
          ticket.clientName,

        employeeId:
          employee._id,

        employeeName:
          employee.name,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name || "Admin",

        performedByRole:
          "admin",

        metadata: {
          status:
            ticket.status,
        },
      });
    }

    return res.status(201).json({
      success: true,

      message: employee
        ? "Ticket created and assigned successfully."
        : "Ticket created successfully.",

      data:
        ticketResponse(ticket),
    });
  } catch (error) {
    console.error(
      "Create support ticket error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,

        message:
          "Ticket code conflict occurred. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to create support ticket.",
    });
  }
});
/* =====================================================
   GET ALL SUPPORT TICKETS
   GET /api/admin/tickets
===================================================== */

router.get("/tickets", async (req, res) => {
  try {
    const {
      search = "",
      status = "All",
      priority = "All",
      source = "All",
      clientId = "",
      employeeId = "",
      productName = "",
      page = 1,
      limit = 100,
    } = req.query;

    const query = {
      isDeleted: false,
    };

    if (status !== "All") {
      query.status = status;
    }

    if (priority !== "All") {
      query.priority = priority;
    }

    if (source !== "All") {
      query.source = source;
    }

    if (
      clientId &&
      mongoose.Types.ObjectId.isValid(clientId)
    ) {
      query.clientId =
        new mongoose.Types.ObjectId(clientId);
    }

    if (
      employeeId &&
      mongoose.Types.ObjectId.isValid(employeeId)
    ) {
      query.assignedEmployeeId =
        new mongoose.Types.ObjectId(employeeId);
    }

    if (String(productName || "").trim()) {
      query.productName = {
        $regex: String(productName).trim(),
        $options: "i",
      };
    }

    const normalizedSearch =
      String(search || "").trim();

    if (normalizedSearch) {
      query.$or = [
        {
          ticketCode: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          title: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          clientName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          productName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          module: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          assignedEmployeeName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
      ];
    }

    const safeLimit = Math.min(
      Math.max(Number(limit || 100), 1),
      200
    );

    const safePage = Math.max(
      Number(page || 1),
      1
    );

    const skip =
      (safePage - 1) * safeLimit;

    const [tickets, total] =
      await Promise.all([
        SupportTicket.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(safeLimit),

        SupportTicket.countDocuments(query),
      ]);

    const statsQuery = {
      isDeleted: false,
    };

    const [
      openTickets,
      criticalTickets,
      waitingTickets,
      resolvedTickets,
    ] = await Promise.all([
      SupportTicket.countDocuments({
        ...statsQuery,
        status: {
          $nin: [
            "Resolved",
            "Verified",
            "Closed",
            "Cancelled",
          ],
        },
      }),

      SupportTicket.countDocuments({
        ...statsQuery,
        priority: "Critical",
        status: {
          $nin: [
            "Resolved",
            "Verified",
            "Closed",
            "Cancelled",
          ],
        },
      }),

      SupportTicket.countDocuments({
        ...statsQuery,
        status: "Waiting for Client",
      }),

      SupportTicket.countDocuments({
        ...statsQuery,
        status: {
          $in: [
            "Resolved",
            "Verified",
            "Closed",
          ],
        },
      }),
    ]);

    return res.status(200).json({
      success: true,

      count: tickets.length,
      total,
      page: safePage,

      totalPages: Math.max(
        Math.ceil(total / safeLimit),
        1
      ),

      stats: {
        openTickets,
        criticalTickets,
        waitingTickets,
        resolvedTickets,
      },

      data: tickets.map(ticketResponse),
    });
  } catch (error) {
    console.error(
      "Load support tickets error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load support tickets.",
    });
  }
});
/* =====================================================
   GET ONE SUPPORT TICKET
   GET /api/admin/ticket/:id
===================================================== */

router.get("/ticket/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket =
      await SupportTicket.findOne({
        _id: id,
        isDeleted: false,
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: ticketResponse(ticket),
    });
  } catch (error) {
    console.error(
      "Load support ticket error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load support ticket.",
    });
  }
});
/* =====================================================
   UPDATE SUPPORT TICKET
   PUT /api/admin/ticket/:id
===================================================== */

router.put("/ticket/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket =
      await SupportTicket.findOne({
        _id: id,
        isDeleted: false,
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    const previousData = {
      title: ticket.title,
      description: ticket.description,
      clientId: ticket.clientId,
      clientName: ticket.clientName,
      productId: ticket.productId,
      productName: ticket.productName,
      module: ticket.module,
      category: ticket.category,
      source: ticket.source,
      priority: ticket.priority,
      assignedEmployeeId:
        ticket.assignedEmployeeId,
      assignedEmployeeName:
        ticket.assignedEmployeeName,
      dueDate: ticket.dueDate,
    };

    const {
      title,
      description,

      clientId,
      productId,
      productName,

      module,
      category,
      source,
      priority,

      contactPerson,
      contactMobile,
      contactEmail,

      assignedEmployeeId,
      dueDate,
    } = req.body;

    if (title !== undefined) {
      if (!String(title || "").trim()) {
        return res.status(400).json({
          success: false,
          message: "Ticket title cannot be empty.",
        });
      }

      ticket.title =
        String(title).trim();
    }

    if (description !== undefined) {
      if (!String(description || "").trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Problem description cannot be empty.",
        });
      }

      ticket.description =
        String(description).trim();
    }

    if (clientId !== undefined) {
      if (
        !clientId ||
        !mongoose.Types.ObjectId.isValid(clientId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid client.",
        });
      }

      const client =
        await Client.findById(clientId);

      if (!client) {
        return res.status(404).json({
          success: false,
          message:
            "Selected client was not found.",
        });
      }

      let resolvedProduct = null;

      if (
        productId &&
        mongoose.Types.ObjectId.isValid(productId)
      ) {
        resolvedProduct =
          client.products.id(productId);
      }

      if (
        !resolvedProduct &&
        String(productName || "").trim()
      ) {
        const normalizedProductName =
          String(productName)
            .trim()
            .toLowerCase();

        resolvedProduct =
          (client.products || []).find(
            (product) =>
              String(
                product.productName || ""
              )
                .trim()
                .toLowerCase() ===
              normalizedProductName
          );
      }

      if (!resolvedProduct) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a product assigned to this client.",
        });
      }

      ticket.clientId = client._id;
      ticket.clientCode =
        client.clientCode || "";
      ticket.clientName =
        client.companyName;

      ticket.productId =
        resolvedProduct._id;
      ticket.productName =
        resolvedProduct.productName;
      ticket.productVersion =
        resolvedProduct.version || "";

      ticket.contactPerson =
        String(
          contactPerson ??
          client.contactPerson ??
          ""
        ).trim();

      ticket.contactMobile =
        String(
          contactMobile ??
          client.mobile ??
          ""
        ).trim();

      ticket.contactEmail =
        String(
          contactEmail ??
          client.email ??
          ""
        )
          .trim()
          .toLowerCase();
    } else {
      if (contactPerson !== undefined) {
        ticket.contactPerson =
          String(contactPerson || "").trim();
      }

      if (contactMobile !== undefined) {
        ticket.contactMobile =
          String(contactMobile || "").trim();
      }

      if (contactEmail !== undefined) {
        ticket.contactEmail =
          String(contactEmail || "")
            .trim()
            .toLowerCase();
      }
    }

    if (module !== undefined) {
      ticket.module =
        String(module || "General").trim();
    }

    if (category !== undefined) {
      ticket.category = category;
    }

    if (source !== undefined) {
      ticket.source = source;
    }

    if (priority !== undefined) {
      ticket.priority = priority;
    }

    if (dueDate !== undefined) {
      ticket.dueDate = dueDate
        ? new Date(dueDate)
        : null;
    }

    const oldEmployeeId =
      ticket.assignedEmployeeId
        ? String(ticket.assignedEmployeeId)
        : "";

    const oldEmployeeName =
      ticket.assignedEmployeeName ||
      "Unassigned";

    let employeeWasChanged = false;

    if (assignedEmployeeId !== undefined) {
      if (!assignedEmployeeId) {
        employeeWasChanged =
          Boolean(ticket.assignedEmployeeId);

        ticket.assignedEmployeeId = null;
        ticket.assignedEmployeeName =
          "Unassigned";
        ticket.assignedEmployeeCode = "";
        ticket.assignedAt = null;
        ticket.assignedBy = null;
        ticket.assignedByName = "";

        if (ticket.status === "Assigned") {
          ticket.status = "New";
        }
      } else {
        const employee =
          await findEmployeeById(
            assignedEmployeeId
          );



        if (!employee) {
          return res.status(404).json({
            success: false,
            message:
              "Selected employee was not found or is inactive.",
          });
        }

        if (
          employee.status === "Leave" ||
          employee.status === "Inactive"
        ) {
          return res.status(400).json({
            success: false,
            message:
              `${employee.name} is currently ${employee.status}.`,
          });
        }

        employeeWasChanged =
          String(employee._id) !==
          oldEmployeeId;

        ticket.assignedEmployeeId =
          employee._id;

        ticket.assignedEmployeeName =
          employee.name;

        ticket.assignedEmployeeCode =
          employee.employeeCode || "";

        ticket.assignedAt =
          new Date();

        ticket.assignedBy =
          req.user._id;

        ticket.assignedByName =
          req.user.name || "Admin";

        if (ticket.status === "New") {
          ticket.status = "Assigned";
        }
      }
    }

    ticket.timeline.push({
      type: employeeWasChanged
        ? "assigned"
        : "updated",

      title: employeeWasChanged
        ? "Ticket Assignment Updated"
        : "Ticket Updated",

      description: employeeWasChanged
        ? `Assignment changed from ${oldEmployeeName} to ${ticket.assignedEmployeeName}.`
        : "Ticket details were updated by Admin.",

      performedBy:
        req.user._id,

      performedByName:
        req.user.name || "Admin",

      performedByRole:
        "admin",
    });

    await ticket.save();

    if (
      String(previousData.clientId || "") !==
      String(ticket.clientId || "")
    ) {
      await normalizeClientOpenTicketCount(
        previousData.clientId
      );
    }

    await normalizeClientOpenTicketCount(
      ticket.clientId
    );

    await createActivityLog({
      action: employeeWasChanged
        ? "Ticket Assigned"
        : "Ticket Updated",

      category: "Ticket",

      description: employeeWasChanged
        ? `${ticket.ticketCode} assignment changed from ${oldEmployeeName} to ${ticket.assignedEmployeeName}.`
        : `${ticket.ticketCode} information was updated.`,

      entityType: "ticket",

      entityId: ticket._id,

      entityCode:
        ticket.ticketCode,

      entityName:
        ticket.title,

      clientId:
        ticket.clientId,

      clientName:
        ticket.clientName,

      employeeId:
        ticket.assignedEmployeeId,

      employeeName:
        ticket.assignedEmployeeName,

      performedBy:
        req.user._id,

      performedByName:
        req.user.name || "Admin",

      performedByRole:
        "admin",

      metadata: {
        previous: previousData,

        current: {
          title: ticket.title,
          clientName:
            ticket.clientName,
          productName:
            ticket.productName,
          module: ticket.module,
          category:
            ticket.category,
          source: ticket.source,
          priority:
            ticket.priority,
          assignedEmployeeName:
            ticket.assignedEmployeeName,
          dueDate:
            ticket.dueDate,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: employeeWasChanged
        ? "Ticket assignment updated successfully."
        : "Ticket updated successfully.",
      data: ticketResponse(ticket),
    });
  } catch (error) {
    console.error(
      "Update support ticket error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to update support ticket.",
    });
  }
});
/* =====================================================
   SOFT DELETE SUPPORT TICKET
   DELETE /api/admin/ticket/:id
===================================================== */

router.delete("/ticket/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const ticket =
      await SupportTicket.findOne({
        _id: id,
        isDeleted: false,
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    ticket.isDeleted = true;

    ticket.timeline.push({
      type: "deleted",
      title: "Ticket Deleted",
      description:
        "Ticket was removed by Admin.",

      performedBy:
        req.user._id,

      performedByName:
        req.user.name || "Admin",

      performedByRole:
        "admin",
    });

    await ticket.save();

    await normalizeClientOpenTicketCount(
      ticket.clientId
    );

    await createActivityLog({
      action: "Ticket Deleted",
      category: "Ticket",

      description:
        `${ticket.ticketCode} was deleted by Admin.`,

      entityType: "ticket",
      entityId: ticket._id,

      entityCode:
        ticket.ticketCode,

      entityName:
        ticket.title,

      clientId:
        ticket.clientId,

      clientName:
        ticket.clientName,

      employeeId:
        ticket.assignedEmployeeId,

      employeeName:
        ticket.assignedEmployeeName,

      performedBy:
        req.user._id,

      performedByName:
        req.user.name || "Admin",

      performedByRole:
        "admin",

      metadata: {
        status: ticket.status,
        priority: ticket.priority,
        productName:
          ticket.productName,
        linkedTaskId:
          ticket.linkedTaskId,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Support ticket deleted successfully.",

      data: {
        id: ticket._id,
        ticketCode:
          ticket.ticketCode,
        title: ticket.title,
      },
    });
  } catch (error) {
    console.error(
      "Delete support ticket error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to delete support ticket.",
    });
  }
});
/* =====================================================
   UPDATE SUPPORT TICKET STATUS
   PATCH /api/admin/ticket/:id/status
===================================================== */

router.patch("/ticket/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }



    if (status === "Resolved") {
      return res.status(400).json({
        success: false,
        message:
          "Use the resolve ticket action and provide a resolution note.",
      });
    }

 const ticket = await SupportTicket.findOne({ _id: id, isDeleted: false });
if (!ticket) {
  fs.unlink(req.file.path, () => {});
  return res.status(404).json({ success: false, message: "Support ticket not found." });
}

let uploaderName = req.user.name || "Admin";
if (req.user.role === "employee") {
  const employee = await Employee.findOne({ userId: req.user._id });
  if (!employee || String(ticket.assignedEmployeeId) !== String(employee._id)) {
    fs.unlink(req.file.path, () => {});
    return res.status(403).json({ success: false, message: "You can only attach files to your assigned tickets." });
  }
  uploaderName = employee.name;
}

    const previousStatus = ticket.status;

    if (previousStatus === status) {
      return res.status(200).json({
        success: true,
        message: "Ticket already has this status.",
        data: ticketResponse(ticket),
      });
    }

    if (
      status === "Assigned" &&
      !ticket.assignedEmployeeId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Assign an employee before changing the ticket to Assigned.",
      });
    }

    const completedStatuses = [
      "Resolved",
      "Verified",
      "Closed",
    ];

    const activeStatuses = [
      "New",
      "Assigned",
      "In Progress",
      "Waiting for Client",
      "Testing",
    ];

    const isReopening =
      completedStatuses.includes(
        previousStatus
      ) &&
      activeStatuses.includes(status);

    const isClosing =
      status === "Closed";

    ticket.status = status;

    /*
     * Reopened tickets are active again.
     * Remove all completion timestamps.
     */
    if (isReopening) {
      ticket.resolvedAt = null;
      ticket.verifiedAt = null;
      ticket.closedAt = null;
    }

    /*
     * Normal active-status changes should also clear
     * completion timestamps.
     */
    if (
      activeStatuses.includes(status) &&
      !isReopening
    ) {
      ticket.resolvedAt = null;
      ticket.verifiedAt = null;
      ticket.closedAt = null;
    }

    if (status === "Verified") {
      ticket.verifiedAt =
        new Date();

      ticket.closedAt = null;
    }

    if (isClosing) {
      if (
        !["Resolved", "Verified"].includes(
          previousStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only a resolved or verified ticket can be closed.",
        });
      }

      ticket.closedAt =
        new Date();
    }

    if (status === "Cancelled") {
      ticket.closedAt =
        new Date();
    }

    ticket.timeline.push({
      type: isClosing
        ? "closed"
        : isReopening
          ? "reopened"
          : "status",

      title: isClosing
        ? "Ticket Closed"
        : isReopening
          ? "Ticket Reopened"
          : "Ticket Status Changed",

      description: isClosing
        ? `Ticket was closed after resolution. Previous status: ${previousStatus}.`
        : isReopening
          ? `Ticket was reopened from ${previousStatus} and moved to ${status}.`
          : `Status changed from ${previousStatus} to ${status}.`,

      performedBy:
        req.user._id,

      performedByName:
        req.user.name || "Admin",

      performedByRole:
        "admin",
    });
    await ticket.save();

    await normalizeClientOpenTicketCount(
      ticket.clientId
    );

    await createActivityLog({
      action: isClosing
        ? "Ticket Closed"
        : isReopening
          ? "Ticket Reopened"
          : "Ticket Status Changed",

      category: "Ticket",

      description: isClosing
        ? `${ticket.ticketCode} was closed by Admin.`
        : isReopening
          ? `${ticket.ticketCode} was reopened from ${previousStatus} and moved to ${status}.`
          : `${ticket.ticketCode} changed from ${previousStatus} to ${status}.`,

      entityType: "ticket",
      entityId: ticket._id,
      entityCode: ticket.ticketCode,
      entityName: ticket.title,

      clientId: ticket.clientId,
      clientName: ticket.clientName,

      employeeId: ticket.assignedEmployeeId,
      employeeName: ticket.assignedEmployeeName,

      performedBy: req.user._id,
      performedByName: req.user.name || "Admin",
      performedByRole: "admin",

      metadata: {
        previousStatus,
        currentStatus: status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully.",
      data: ticketResponse(ticket),
    });
  } catch (error) {
    console.error(
      "Update ticket status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to update ticket status.",
    });
  }
});

/* =====================================================
   ASSIGN SUPPORT TICKET
   PATCH /api/admin/ticket/:id/assign
===================================================== */

router.patch("/ticket/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedEmployeeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    if (
      !assignedEmployeeId ||
      !mongoose.Types.ObjectId.isValid(
        assignedEmployeeId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid employee.",
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    const employee = await findEmployeeById(
      assignedEmployeeId
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Selected employee was not found or is inactive.",
      });
    }

    if (
      employee.status === "Leave" ||
      employee.status === "Inactive"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${employee.name} is currently ${employee.status}.`,
      });
    }

    const previousEmployeeId =
      ticket.assignedEmployeeId
        ? String(ticket.assignedEmployeeId)
        : "";

    const previousEmployeeName =
      ticket.assignedEmployeeName ||
      "Unassigned";

    if (
      previousEmployeeId ===
      String(employee._id)
    ) {
      return res.status(200).json({
        success: true,
        message:
          "Ticket is already assigned to this employee.",
        data: ticketResponse(ticket),
      });
    }

    ticket.assignedEmployeeId =
      employee._id;

    ticket.assignedEmployeeName =
      employee.name;

    ticket.assignedEmployeeCode =
      employee.employeeCode || "";

    ticket.assignedAt = new Date();

    ticket.assignedBy =
      req.user._id;

    ticket.assignedByName =
      req.user.name || "Admin";

    if (ticket.status === "New") {
      ticket.status = "Assigned";
    }

    ticket.timeline.push({
      type: "assigned",
      title: "Ticket Assigned",
      description:
        `Assignment changed from ${previousEmployeeName} to ${employee.name}.`,
      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",
    });

    await ticket.save();

    await createActivityLog({
      action: "Ticket Assigned",
      category: "Ticket",

      description:
        `${ticket.ticketCode} was assigned from ${previousEmployeeName} to ${employee.name}.`,

      entityType: "ticket",
      entityId: ticket._id,
      entityCode: ticket.ticketCode,
      entityName: ticket.title,

      clientId: ticket.clientId,
      clientName: ticket.clientName,

      employeeId: employee._id,
      employeeName: employee.name,

      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",

      metadata: {
        previousEmployeeId,
        previousEmployeeName,
        assignedEmployeeId:
          employee._id,
        assignedEmployeeName:
          employee.name,
        status: ticket.status,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Ticket assigned successfully.",
      data: ticketResponse(ticket),
    });
  } catch (error) {
    console.error(
      "Assign support ticket error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to assign support ticket.",
    });
  }
});
/* =====================================================
   ADD SUPPORT TICKET REPLY
   POST /api/admin/ticket/:id/reply
===================================================== */

router.post("/ticket/:id/reply", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      message,
      replyType = "Public",
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const normalizedMessage =
      String(message || "").trim();

    if (!normalizedMessage) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required.",
      });
    }

    if (
      !["Public", "Internal"].includes(
        replyType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid reply type.",
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    ticket.replies.push({
      message: normalizedMessage,
      replyType,

      authorId: req.user._id,
      authorName:
        req.user.name || "Admin",
      authorRole: "admin",
    });

    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt =
        new Date();
    }

    ticket.timeline.push({
      type: "reply",

      title:
        replyType === "Internal"
          ? "Internal Note Added"
          : "Reply Added",

      description:
        replyType === "Internal"
          ? "Admin added an internal note."
          : "Admin replied to the ticket.",

      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",
    });

    await ticket.save();

    await createActivityLog({
      action:
        replyType === "Internal"
          ? "Ticket Internal Note Added"
          : "Ticket Reply Added",

      category: "Ticket",

      description:
        replyType === "Internal"
          ? `An internal note was added to ${ticket.ticketCode}.`
          : `A reply was added to ${ticket.ticketCode}.`,

      entityType: "ticket",
      entityId: ticket._id,
      entityCode: ticket.ticketCode,
      entityName: ticket.title,

      clientId: ticket.clientId,
      clientName: ticket.clientName,

      employeeId:
        ticket.assignedEmployeeId,

      employeeName:
        ticket.assignedEmployeeName,

      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",

      metadata: {
        replyType,
        message: normalizedMessage,
      },
    });

    return res.status(201).json({
      success: true,
      message:
        replyType === "Internal"
          ? "Internal note added successfully."
          : "Reply added successfully.",
      data: ticketResponse(ticket),
    });
  } catch (error) {
    console.error(
      "Add ticket reply error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to add ticket reply.",
    });
  }
});

/* =====================================================
   RESOLVE SUPPORT TICKET
   PATCH /api/admin/ticket/:id/resolve
===================================================== */

router.patch("/ticket/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      resolutionNote,
      rootCause = "",
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const normalizedResolution =
      String(resolutionNote || "").trim();

    if (!normalizedResolution) {
      return res.status(400).json({
        success: false,
        message:
          "Resolution note is required.",
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found.",
      });
    }

    if (ticket.status === "Resolved") {
      return res.status(200).json({
        success: true,
        message:
          "Ticket is already resolved.",
        data: ticketResponse(ticket),
      });
    }

    const previousStatus =
      ticket.status;

    ticket.status = "Resolved";

    ticket.resolutionNote =
      normalizedResolution;

    ticket.rootCause =
      String(rootCause || "").trim();

    ticket.resolvedAt =
      new Date();

    ticket.verifiedAt = null;
    ticket.closedAt = null;

    ticket.timeline.push({
      type: "resolved",
      title: "Ticket Resolved",
      description:
        normalizedResolution,

      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",
    });

    await ticket.save();

    await normalizeClientOpenTicketCount(
      ticket.clientId
    );

    await createActivityLog({
      action: "Ticket Resolved",
      category: "Ticket",

      description:
        `${ticket.ticketCode} was resolved by Admin.`,

      entityType: "ticket",
      entityId: ticket._id,
      entityCode: ticket.ticketCode,
      entityName: ticket.title,

      clientId: ticket.clientId,
      clientName: ticket.clientName,

      employeeId:
        ticket.assignedEmployeeId,

      employeeName:
        ticket.assignedEmployeeName,

      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",

      metadata: {
        previousStatus,
        resolutionNote:
          normalizedResolution,
        rootCause:
          ticket.rootCause,
        resolvedAt:
          ticket.resolvedAt,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Support ticket resolved successfully.",
      data: ticketResponse(ticket),
    });
  } catch (error) {
    console.error(
      "Resolve support ticket error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to resolve support ticket.",
    });
  }
});

/* =====================================================
   UPLOAD SUPPORT TICKET ATTACHMENT
   POST /api/admin/ticket/:id/attachment
===================================================== */

router.post(
  "/ticket/:id/attachment",

  uploadTicketAttachment.single(
    "attachment"
  ),

  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        if (req.file?.path) {
          fs.unlink(
            req.file.path,
            () => { }
          );
        }

        return res.status(400).json({
          success: false,
          message:
            "Invalid ticket ID.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a file.",
        });
      }

      const ticket =
        await SupportTicket.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!ticket) {
        fs.unlink(
          req.file.path,
          () => { }
        );

        return res.status(404).json({
          success: false,
          message:
            "Support ticket not found.",
        });
      }

      const fileUrl =
        `/uploads/tickets/${req.file.filename}`;

      ticket.attachments.push({
        fileName:
          req.file.originalname,

        fileUrl,

        fileType:
          req.file.mimetype,

        fileSize:
          req.file.size,

        uploadedBy:
          req.user._id,

        uploadedByName:
          req.user.name ||
          "Admin",

        uploadedByRole:
          "admin",
      });

      ticket.timeline.push({
        type: "attachment",

        title:
          "Attachment Uploaded",

        description:
          `${req.file.originalname} was uploaded to the ticket.`,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",
      });

      await ticket.save();

      await createActivityLog({
        action:
          "Ticket Attachment Uploaded",

        category: "Ticket",

        description:
          `${req.file.originalname} was uploaded to ${ticket.ticketCode}.`,

        entityType:
          "ticket",

        entityId:
          ticket._id,

        entityCode:
          ticket.ticketCode,

        entityName:
          ticket.title,

        clientId:
          ticket.clientId,

        clientName:
          ticket.clientName,

        employeeId:
          ticket.assignedEmployeeId,

        employeeName:
          ticket.assignedEmployeeName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          "admin",

        metadata: {
          fileName:
            req.file.originalname,

          storedName:
            req.file.filename,

          fileUrl,

          fileType:
            req.file.mimetype,

          fileSize:
            req.file.size,
        },
      });

      return res.status(201).json({
        success: true,

        message:
          "Attachment uploaded successfully.",

        data:
          ticketResponse(ticket),
      });
    } catch (error) {
      if (req.file?.path) {
        fs.unlink(
          req.file.path,
          () => { }
        );
      }

      console.error(
        "Upload ticket attachment error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to upload attachment.",
      });
    }
  }
);
router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "File size must not exceed 10 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "File upload failed.",
      });
    }

    if (
      error?.message?.includes(
        "Unsupported file type"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
);
/* =====================================================
   CREATE AMC CONTRACT + FIRST PERMANENT INVOICE
   POST /api/admin/amc/contract
===================================================== */

router.post(
  "/amc/contract",
  async (req, res) => {
    let createdContract =
      null;

    let createdInvoice =
      null;

    try {
      const {
        clientId,
        clientProductId,

        plan,
        licensedUsers,

        startDate,
        expiryDate,
        dueDate,

        taxableAmount,

        cgstRate,
        sgstRate,
        igstRate,

        assignedEmployeeId,

        notes,
      } = req.body;

      if (!clientId) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a client.",
        });
      }

      if (!clientProductId) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a client product.",
        });
      }

      if (!startDate) {
        return res.status(400).json({
          success: false,
          message:
            "AMC start date is required.",
        });
      }

      if (!expiryDate) {
        return res.status(400).json({
          success: false,
          message:
            "AMC expiry date is required.",
        });
      }

      if (!dueDate) {
        return res.status(400).json({
          success: false,
          message:
            "Payment due date is required.",
        });
      }

      const parsedStartDate =
        new Date(startDate);

      const parsedExpiryDate =
        new Date(expiryDate);

      const parsedDueDate =
        new Date(dueDate);

      if (
        Number.isNaN(
          parsedStartDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid AMC start date.",
        });
      }

      if (
        Number.isNaN(
          parsedExpiryDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid AMC expiry date.",
        });
      }

      if (
        Number.isNaN(
          parsedDueDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment due date.",
        });
      }

      if (
        parsedExpiryDate <=
        parsedStartDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "AMC expiry date must be after the start date.",
        });
      }

      const normalizedTaxableAmount =
        Number(
          taxableAmount ||
          0
        );

      if (
        !Number.isFinite(
          normalizedTaxableAmount
        ) ||
        normalizedTaxableAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid AMC taxable amount.",
        });
      }

      const normalizedUsers =
        Math.max(
          Number(
            licensedUsers ||
            1
          ),
          1
        );

      const allowedPlans = [
        "Basic",
        "Standard",
        "Premium",
        "Custom",
      ];

      const normalizedPlan =
        allowedPlans.includes(
          plan
        )
          ? plan
          : "Standard";

      const normalizedNotes =
        String(
          notes ||
          ""
        ).trim();

      /*
       * Read current Client Master only while creating
       * snapshots. Future invoice reads do not depend
       * on the client still existing.
       */
      const client =
        await resolveAmcClient(
          clientId
        );

      const clientProduct =
        resolveAmcClientProduct(
          client,
          clientProductId
        );

      const resolvedEmployee =
        await resolveAmcEmployee(
          assignedEmployeeId
        );

      const duplicateContract =
        await AmcContract.findOne({
          clientId:
            client._id,

          clientProductId:
            clientProduct._id,

          isDeleted:
            false,

          status: {
            $nin: [
              "Cancelled",
              "Paid",
            ],
          },

          startDate: {
            $lte:
              parsedExpiryDate,
          },

          expiryDate: {
            $gte:
              parsedStartDate,
          },
        });

      if (duplicateContract) {
        return res.status(409).json({
          success: false,

          message:
            `An active AMC contract already exists for ${clientProduct.productName}.`,

          existingContract: {
            id:
              duplicateContract._id,

            contractCode:
              duplicateContract.contractCode,

            status:
              duplicateContract.status,
          },
        });
      }

      const calculatedAmounts =
        calculateAmcAmounts({
          taxableAmount:
            normalizedTaxableAmount,

          cgstRate:
            Number(
              cgstRate ??
              9
            ),

          sgstRate:
            Number(
              sgstRate ??
              9
            ),

          igstRate:
            Number(
              igstRate ??
              0
            ),
        });

      const contractStatus =
        calculateAmcStatus({
          startDate:
            parsedStartDate,

          expiryDate:
            parsedExpiryDate,

          totalAmount:
            calculatedAmounts
              .totalAmount,

          paidAmount:
            0,
        });

      const invoicePaymentStatus =
        contractStatus ===
        "Overdue"
          ? "Overdue"
          : "Pending";

      const contractCode =
        generateAmcContractCode();

      const invoiceCode =
        generateAmcInvoiceCode();

      const now =
        new Date();

      const timeline = [
        {
          type:
            "created",

          title:
            "AMC contract created",

          description:
            `${normalizedPlan} AMC contract was created for ${clientProduct.productName}.`,

          performedBy:
            req.user._id,

          performedByName:
            req.user.name ||
            "Admin",

          performedByRole:
            req.user.role ||
            "admin",
        },

        {
          type:
            "invoice",

          title:
            "AMC invoice generated",

          description:
            `Invoice ${invoiceCode} was generated for ₹${calculatedAmounts.totalAmount}.`,

          performedBy:
            req.user._id,

          performedByName:
            req.user.name ||
            "Admin",

          performedByRole:
            req.user.role ||
            "admin",
        },
      ];

      if (
        resolvedEmployee
          .assignedEmployeeId
      ) {
        timeline.push({
          type:
            "assignment",

          title:
            `Assigned to ${resolvedEmployee.assignedEmployeeName}`,

          description:
            `${resolvedEmployee.assignedEmployeeCode || "Employee"} was assigned to manage this AMC contract.`,

          performedBy:
            req.user._id,

          performedByName:
            req.user.name ||
            "Admin",

          performedByRole:
            req.user.role ||
            "admin",
        });
      }

      /*
       * First create the agreement.
       *
       * Legacy invoice amount fields are temporarily kept
       * for frontend compatibility. Financial truth is now
       * stored inside AmcInvoice.
       */
      createdContract =
        await AmcContract.create({
          contractCode,

          currentInvoiceCode:
            invoiceCode,

          invoiceCode,

          invoiceDate:
            now,

          clientId:
            client._id,

          clientCode:
            client.clientCode,

          clientName:
            client.companyName,

          contactPerson:
            client.contactPerson ||
            "",

          contactMobile:
            client.mobile ||
            "",

          contactEmail:
            client.email ||
            "",

          clientProductId:
            clientProduct._id,

          productId:
            clientProduct.productId,

          productCode:
            clientProduct.productCode,

          productName:
            clientProduct.productName,

          productVersion:
            clientProduct.version ||
            "",

          plan:
            normalizedPlan,

          licensedUsers:
            normalizedUsers,

          startDate:
            parsedStartDate,

          expiryDate:
            parsedExpiryDate,

          dueDate:
            parsedDueDate,

          ...calculatedAmounts,

          paidAmount:
            0,

          pendingAmount:
            calculatedAmounts
              .totalAmount,

          status:
            contractStatus,

          assignedEmployeeId:
            resolvedEmployee
              .assignedEmployeeId,

          assignedEmployeeCode:
            resolvedEmployee
              .assignedEmployeeCode,

          assignedEmployeeName:
            resolvedEmployee
              .assignedEmployeeName,

          reminderStatus:
            contractStatus ===
            "Paid"
              ? "Not Required"
              : "Not Sent",

          notes:
            normalizedNotes,

          timeline,

          createdBy:
            req.user._id,

          createdByName:
            req.user.name ||
            "Admin",

          updatedBy:
            req.user._id,

          updatedByName:
            req.user.name ||
            "Admin",
        });

      /*
       * Create the first permanent invoice using snapshots.
       */
      createdInvoice =
        await AmcInvoice.create({
          invoiceCode,

          invoiceDate:
            now,

          invoiceType:
            "Initial",

          amcContractId:
            createdContract._id,

          contractCode:
            createdContract
              .contractCode,

          contractStartDate:
            parsedStartDate,

          contractExpiryDate:
            parsedExpiryDate,

          dueDate:
            parsedDueDate,

          clientId:
            client._id,

          clientCode:
            client.clientCode,

          clientName:
            client.companyName,

          contactPerson:
            client.contactPerson ||
            "",

          contactMobile:
            client.mobile ||
            "",

          contactEmail:
            client.email ||
            "",

          clientProductId:
            clientProduct._id,

          productId:
            clientProduct.productId,

          productCode:
            clientProduct.productCode,

          productName:
            clientProduct.productName,

          productVersion:
            clientProduct.version ||
            "",

          plan:
            normalizedPlan,

          licensedUsers:
            normalizedUsers,

          description:
            `${normalizedPlan} Annual Maintenance Contract for ${clientProduct.productName}.`,

          ...calculatedAmounts,

          paidAmount:
            0,

          pendingAmount:
            calculatedAmounts
              .totalAmount,

          paymentStatus:
            invoicePaymentStatus,

          status:
            "Issued",

          notes:
            normalizedNotes,

          createdBy:
            req.user._id,

          createdByName:
            req.user.name ||
            "Admin",

          updatedBy:
            req.user._id,

          updatedByName:
            req.user.name ||
            "Admin",
        });

      /*
       * Link contract to the permanent current invoice.
       */
      createdContract.currentInvoiceId =
        createdInvoice._id;

      createdContract.currentInvoiceCode =
        createdInvoice.invoiceCode;

      await createdContract.save();

      /*
       * Client Master receives only current status values.
       * No invoice or payment history is saved in Client.
       */
      clientProduct.supportType =
        normalizedPlan ===
        "Custom"
          ? clientProduct
              .supportType
          : normalizedPlan;

      clientProduct.amcStatus =
        contractStatus ===
        "Upcoming"
          ? "Not Started"
          : contractStatus;

      clientProduct.expiryDate =
        parsedExpiryDate
          .toISOString()
          .slice(
            0,
            10
          );

      client.amcStatus =
        contractStatus ===
        "Upcoming"
          ? "Not Started"
          : contractStatus;

      client.nextRenewal =
        parsedExpiryDate
          .toISOString()
          .slice(
            0,
            10
          );

      await client.save();

      await createActivityLog({
        action:
          "AMC Contract Created",

        category:
          "AMC",

        description:
          `${createdContract.contractCode} was created for ${client.companyName} - ${clientProduct.productName}.`,

        entityType:
          "amc",

        entityId:
          createdContract._id,

        entityCode:
          createdContract.contractCode,

        entityName:
          `${client.companyName} - ${clientProduct.productName}`,

        clientId:
          client._id,

        clientName:
          client.companyName,

        employeeId:
          resolvedEmployee
            .assignedEmployeeId,

        employeeName:
          resolvedEmployee
            .assignedEmployeeName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          req.user.role ||
          "admin",

        metadata: {
          invoiceId:
            createdInvoice._id,

          invoiceCode:
            createdInvoice
              .invoiceCode,

          productCode:
            createdInvoice
              .productCode,

          productName:
            createdInvoice
              .productName,

          plan:
            createdInvoice.plan,

          taxableAmount:
            createdInvoice
              .taxableAmount,

          totalAmount:
            createdInvoice
              .totalAmount,

          status:
            createdContract.status,
        },
      });

      return res.status(201).json({
        success: true,

        message:
          "AMC contract and invoice created successfully.",

        data: {
          ...amcContractResponse(
            createdContract
          ),

          currentInvoice:
            amcInvoiceResponse(
              createdInvoice
            ),

          invoice:
            amcInvoiceResponse(
              createdInvoice
            ),
        },
      });
    } catch (error) {
      console.error(
        "Create AMC contract and invoice error:",
        error
      );

      /*
       * Manual rollback protects against half-created data
       * when MongoDB transactions are unavailable.
       */
      if (
        createdInvoice?._id
      ) {
        await AmcInvoice.deleteOne({
          _id:
            createdInvoice._id,
        }).catch(() => {});
      }

      if (
        createdContract?._id
      ) {
        await AmcContract.deleteOne({
          _id:
            createdContract._id,
        }).catch(() => {});
      }

      if (
        error.code ===
        11000
      ) {
        return res.status(409).json({
          success: false,

          message:
            "AMC contract or invoice number already exists.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to create AMC contract and invoice.",
      });
    }
  }
);
/* =====================================================
   GET ALL AMC CONTRACTS
   GET /api/admin/amc/contracts
===================================================== */

/* =====================================================
   GET ALL AMC CONTRACTS WITH CURRENT INVOICE
   GET /api/admin/amc/contracts
===================================================== */

router.get(
  "/amc/contracts",
  async (req, res) => {
    try {
      const {
        search = "",
        status = "All",
        plan = "All",
        productId = "",
        clientId = "",
        assignedEmployeeId = "",
        limit = 200,
      } = req.query;

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      /*
       * Financial overdue status belongs to invoices.
       */
      await AmcInvoice.updateMany(
        {
          isDeleted:
            false,

          status: {
            $ne:
              "Cancelled",
          },

          paymentStatus: {
            $in: [
              "Pending",
              "Partially Paid",
            ],
          },

          dueDate: {
            $lt:
              today,
          },

          pendingAmount: {
            $gt:
              0,
          },
        },
        {
          $set: {
            paymentStatus:
              "Overdue",

            updatedAt:
              new Date(),
          },
        }
      );

      /*
       * Synchronize current contract status using its
       * current permanent invoice.
       */
      const overdueInvoices =
        await AmcInvoice.find({
          isDeleted:
            false,

          status: {
            $ne:
              "Cancelled",
          },

          paymentStatus:
            "Overdue",

          pendingAmount: {
            $gt:
              0,
          },
        })
          .select(
            "amcContractId"
          )
          .lean();

      const overdueContractIds =
        overdueInvoices
          .map(
            (invoice) =>
              invoice.amcContractId
          )
          .filter(Boolean);

      if (
        overdueContractIds.length >
        0
      ) {
        await AmcContract.updateMany(
          {
            _id: {
              $in:
                overdueContractIds,
            },

            isDeleted:
              false,

            status: {
              $nin: [
                "Paid",
                "Cancelled",
              ],
            },
          },
          {
            $set: {
              status:
                "Overdue",

              updatedAt:
                new Date(),
            },
          }
        );
      }

      const query = {
        isDeleted:
          false,
      };

      if (
        status &&
        status !== "All"
      ) {
        query.status =
          status;
      }

      if (
        plan &&
        plan !== "All"
      ) {
        query.plan =
          plan;
      }

      if (
        productId &&
        mongoose.Types.ObjectId.isValid(
          productId
        )
      ) {
        query.productId =
          new mongoose.Types.ObjectId(
            productId
          );
      }

      if (
        clientId &&
        mongoose.Types.ObjectId.isValid(
          clientId
        )
      ) {
        query.clientId =
          new mongoose.Types.ObjectId(
            clientId
          );
      }

      if (
        assignedEmployeeId &&
        mongoose.Types.ObjectId.isValid(
          assignedEmployeeId
        )
      ) {
        query.assignedEmployeeId =
          new mongoose.Types.ObjectId(
            assignedEmployeeId
          );
      }

      const normalizedSearch =
        String(
          search || ""
        ).trim();

      if (normalizedSearch) {
        query.$or = [
          {
            contractCode: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            currentInvoiceCode: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            invoiceCode: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            clientCode: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            clientName: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            contactPerson: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            contactMobile: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            productCode: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            productName: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            assignedEmployeeCode: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },

          {
            assignedEmployeeName: {
              $regex:
                normalizedSearch,

              $options:
                "i",
            },
          },
        ];
      }

      const normalizedLimit =
        Math.min(
          Math.max(
            Number(
              limit ||
              200
            ),
            1
          ),
          1000
        );

      const contracts =
        await AmcContract.find(
          query
        )
          .sort({
            createdAt:
              -1,
          })
          .limit(
            normalizedLimit
          );

      /*
       * Load all current invoices in one query.
       * This avoids running one query per contract.
       */
      const currentInvoiceIds =
        contracts
          .map(
            (contract) =>
              contract.currentInvoiceId
          )
          .filter(Boolean);

      const currentInvoiceCodes =
        contracts
          .filter(
            (contract) =>
              !contract.currentInvoiceId &&
              (
                contract.currentInvoiceCode ||
                contract.invoiceCode
              )
          )
          .map(
            (contract) =>
              contract.currentInvoiceCode ||
              contract.invoiceCode
          );

      const invoiceOrConditions =
        [];

      if (
        currentInvoiceIds.length >
        0
      ) {
        invoiceOrConditions.push({
          _id: {
            $in:
              currentInvoiceIds,
          },
        });
      }

      if (
        currentInvoiceCodes.length >
        0
      ) {
        invoiceOrConditions.push({
          invoiceCode: {
            $in:
              currentInvoiceCodes,
          },
        });
      }

      const invoices =
        invoiceOrConditions.length >
        0
          ? await AmcInvoice.find({
              isDeleted:
                false,

              $or:
                invoiceOrConditions,
            })
          : [];

      const invoiceById =
        new Map();

      const invoiceByCode =
        new Map();

      invoices.forEach(
        (invoice) => {
          invoiceById.set(
            String(
              invoice._id
            ),
            invoice
          );

          invoiceByCode.set(
            String(
              invoice.invoiceCode
            ),
            invoice
          );
        }
      );
      // =============================
// LOAD PAYMENTS AND REMINDERS
// =============================
const contractIds = contracts.map((contract) => String(contract._id));
const contractCodes = contracts.map((contract) => contract.contractCode);

const [payments, reminders] = await Promise.all([
  AmcPayment.find({
    isDeleted: false,
    $or: [
      { contractId: { $in: contractIds } },
      { contractCode: { $in: contractCodes } },
    ],
  }).sort({ paymentDate: -1 }),

  AmcReminder.find({
    isDeleted: false,
    $or: [
      { amcContractId: { $in: contractIds } },
      { contractCode: { $in: contractCodes } },
    ],
  }).sort({ sentAt: -1 }),
]);

const paymentsByContract = new Map();

payments.forEach((payment) => {
  const key =
    payment.contractCode || String(payment.contractId || "");

  if (!paymentsByContract.has(key)) {
    paymentsByContract.set(key, []);
  }

  paymentsByContract.get(key).push(payment);
});

const remindersByContract = new Map();

reminders.forEach((reminder) => {
  const key =
    reminder.contractCode || String(reminder.amcContractId || "");

  if (!remindersByContract.has(key)) {
    remindersByContract.set(key, []);
  }

  remindersByContract.get(key).push(reminder);
});

    const data = contracts.map((contract) => {
  const invoice =
    invoiceById.get(String(contract.currentInvoiceId || "")) ||
    invoiceByCode.get(
      String(contract.currentInvoiceCode || contract.invoiceCode || "")
    ) ||
    null;

  const merged = mergeAmcContractWithInvoice(contract, invoice);
merged.payments =
  paymentsByContract.get(contract.contractCode) ||
  paymentsByContract.get(String(contract._id)) ||
  [];

merged.reminders =
  remindersByContract.get(contract.contractCode) ||
  remindersByContract.get(String(contract._id)) ||
  [];

  merged.renewalHistory =
    contract.renewalHistory || [];

  return merged;
});


      /*
       * Dashboard totals now come from permanent invoices,
       * not Client Master or copied contract totals.
       */
      const invoiceStats =
        await AmcInvoice.aggregate([
          {
            $match: {
              isDeleted:
                false,

              status: {
                $ne:
                  "Cancelled",
              },
            },
          },

          {
            $group: {
              _id:
                null,

              totalCollected: {
                $sum:
                  "$paidAmount",
              },

              totalPending: {
                $sum:
                  "$pendingAmount",
              },
            },
          },
        ]);

      const [
        overdueCount,
        upcomingCount,
      ] =
        await Promise.all([
          AmcInvoice.countDocuments({
            isDeleted:
              false,

            status: {
              $ne:
                "Cancelled",
            },

            paymentStatus:
              "Overdue",

            pendingAmount: {
              $gt:
                0,
            },
          }),

          AmcContract.countDocuments({
            isDeleted:
              false,

            status:
              "Upcoming",
          }),
        ]);

      return res.status(200).json({
        success:
          true,

        data,

        count:
          data.length,

        stats: {
          totalCollected:
            roundAmcAmount(
              invoiceStats[0]
                ?.totalCollected ||
              0
            ),

          totalPending:
            roundAmcAmount(
              invoiceStats[0]
                ?.totalPending ||
              0
            ),

          overdueCount,

          upcomingCount,
        },
      });
    } catch (error) {
      console.error(
        "Load AMC contracts with invoices error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to load AMC contracts.",
      });
    }
  }
);

/* =====================================================
   GET ONE AMC CONTRACT
   GET /api/admin/amc/contract/:id
===================================================== */

/* =====================================================
   GET ONE AMC CONTRACT WITH INVOICE HISTORY
   GET /api/admin/amc/contract/:id
===================================================== */

router.get(
  "/amc/contract/:id",
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid AMC contract ID.",
        });
      }

      const contract =
        await AmcContract.findOne({
          _id:
            id,

          isDeleted:
            false,
        });

      if (!contract) {
        return res.status(404).json({
          success:
            false,

          message:
            "AMC contract was not found.",
        });
      }

      /*
       * Load every permanent invoice belonging
       * to this AMC contract.
       */
      const invoices =
        await AmcInvoice.find({
          amcContractId:
            contract._id,

          isDeleted:
            false,
        }).sort({
          invoiceDate:
            -1,

          createdAt:
            -1,
        });

      /*
       * Resolve the current invoice using the linked ID.
       * For older data, fall back to invoice code or the
       * newest invoice.
       */
      let currentInvoice =
        invoices.find(
          (invoice) =>
            String(
              invoice._id
            ) ===
            String(
              contract.currentInvoiceId ||
              ""
            )
        ) ||
        invoices.find(
          (invoice) =>
            invoice.invoiceCode ===
            (
              contract.currentInvoiceCode ||
              contract.invoiceCode
            )
        ) ||
        invoices[0] ||
        null;

      /*
       * Update overdue status using invoice due date,
       * not the AMC expiry date.
       */
      if (
        currentInvoice &&
        currentInvoice.status !==
          "Cancelled"
      ) {
        const today =
          new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );

        const invoiceDueDate =
          currentInvoice.dueDate
            ? new Date(
                currentInvoice.dueDate
              )
            : null;

        if (invoiceDueDate) {
          invoiceDueDate.setHours(
            0,
            0,
            0,
            0
          );
        }

        let calculatedPaymentStatus =
          currentInvoice.paymentStatus;

        if (
          Number(
            currentInvoice.pendingAmount ||
            0
          ) <= 0
        ) {
          calculatedPaymentStatus =
            "Paid";
        } else if (
          Number(
            currentInvoice.paidAmount ||
            0
          ) > 0
        ) {
          calculatedPaymentStatus =
            "Partially Paid";
        } else if (
          invoiceDueDate &&
          !Number.isNaN(
            invoiceDueDate.getTime()
          ) &&
          invoiceDueDate < today
        ) {
          calculatedPaymentStatus =
            "Overdue";
        } else {
          calculatedPaymentStatus =
            "Pending";
        }

        if (
          calculatedPaymentStatus !==
          currentInvoice.paymentStatus
        ) {
          currentInvoice.paymentStatus =
            calculatedPaymentStatus;

          currentInvoice.updatedBy =
            req.user._id;

          currentInvoice.updatedByName =
            req.user.name ||
            "Admin";

          await currentInvoice.save();
        }

        /*
         * Keep the overall contract status synchronized
         * with the current invoice payment status.
         */
        let calculatedContractStatus =
          contract.status;

        if (
          contract.status !==
          "Cancelled"
        ) {
          if (
            calculatedPaymentStatus ===
            "Paid"
          ) {
            calculatedContractStatus =
              "Paid";
          } else if (
            calculatedPaymentStatus ===
            "Partially Paid"
          ) {
            calculatedContractStatus =
              "Partially Paid";
          } else if (
            calculatedPaymentStatus ===
            "Overdue"
          ) {
            calculatedContractStatus =
              "Overdue";
          } else {
            const startDate =
              contract.startDate
                ? new Date(
                    contract.startDate
                  )
                : null;

            if (startDate) {
              startDate.setHours(
                0,
                0,
                0,
                0
              );
            }

            calculatedContractStatus =
              startDate &&
              !Number.isNaN(
                startDate.getTime()
              ) &&
              startDate > today
                ? "Upcoming"
                : "Pending";
          }
        }

        const contractNeedsUpdate =
          calculatedContractStatus !==
            contract.status ||
          String(
            contract.currentInvoiceId ||
            ""
          ) !==
            String(
              currentInvoice._id
            ) ||
          contract.currentInvoiceCode !==
            currentInvoice.invoiceCode;

        if (contractNeedsUpdate) {
          contract.status =
            calculatedContractStatus;

          contract.currentInvoiceId =
            currentInvoice._id;

          contract.currentInvoiceCode =
            currentInvoice.invoiceCode;

          /*
           * Compatibility copies only.
           * Invoice remains the financial source of truth.
           */
          contract.invoiceCode =
            currentInvoice.invoiceCode;

          contract.invoiceDate =
            currentInvoice.invoiceDate;

          contract.taxableAmount =
            currentInvoice.taxableAmount;

          contract.cgstRate =
            currentInvoice.cgstRate;

          contract.cgstAmount =
            currentInvoice.cgstAmount;

          contract.sgstRate =
            currentInvoice.sgstRate;

          contract.sgstAmount =
            currentInvoice.sgstAmount;

          contract.igstRate =
            currentInvoice.igstRate;

          contract.igstAmount =
            currentInvoice.igstAmount;

          contract.totalTaxAmount =
            currentInvoice.totalTaxAmount;

          contract.totalAmount =
            currentInvoice.totalAmount;

          contract.paidAmount =
            currentInvoice.paidAmount;

          contract.pendingAmount =
            currentInvoice.pendingAmount;

          contract.dueDate =
            currentInvoice.dueDate;

          contract.updatedBy =
            req.user._id;

          contract.updatedByName =
            req.user.name ||
            "Admin";

          await contract.save();
        }
      }

      const [
        payments,
        reminders,
      ] =
        await Promise.all([
          AmcPayment.find({
            amcContractId:
              contract._id,

            isDeleted:
              false,
          }).sort({
            paymentDate:
              -1,

            createdAt:
              -1,
          }),

          AmcReminder.find({
            amcContractId:
              contract._id,

            isDeleted:
              false,
          }).sort({
            sentAt:
              -1,

            createdAt:
              -1,
          }),
        ]);

      /*
       * Group payments by permanent invoice.
       */
      const paymentsByInvoice =
        new Map();

      payments.forEach(
        (payment) => {
          const invoiceId =
            String(
              payment.amcInvoiceId ||
              ""
            );

          if (
            !paymentsByInvoice.has(
              invoiceId
            )
          ) {
            paymentsByInvoice.set(
              invoiceId,
              []
            );
          }

          paymentsByInvoice
            .get(
              invoiceId
            )
            .push(
              amcPaymentResponse(
                payment
              )
            );
        }
      );

      const invoiceHistory =
        invoices.map(
          (invoice) => ({
            ...amcInvoiceResponse(
              invoice
            ),

            isCurrent:
              String(
                invoice._id
              ) ===
              String(
                currentInvoice?._id ||
                ""
              ),

            payments:
              paymentsByInvoice.get(
                String(
                  invoice._id
                )
              ) ||
              [],

            paymentCount:
              (
                paymentsByInvoice.get(
                  String(
                    invoice._id
                  )
                ) ||
                []
              ).length,
          })
        );

      const contractData =
        mergeAmcContractWithInvoice(
          contract,
          currentInvoice
        );

      return res.status(200).json({
        success:
          true,

        data: {
          ...contractData,

          currentInvoice:
            currentInvoice
              ? {
                  ...amcInvoiceResponse(
                    currentInvoice
                  ),

                  payments:
                    paymentsByInvoice.get(
                      String(
                        currentInvoice._id
                      )
                    ) ||
                    [],
                }
              : null,

          invoice:
            currentInvoice
              ? amcInvoiceResponse(
                  currentInvoice
                )
              : null,

          invoices:
            invoiceHistory,

          invoiceHistory,

          invoiceCount:
            invoices.length,

          payments:
            payments.map(
              amcPaymentResponse
            ),

          reminders:
            reminders.map(
              amcReminderResponse
            ),

          paymentCount:
            payments.length,

          reminderCount:
            reminders.length,
        },
      });
    } catch (error) {
      console.error(
        "Load AMC contract with invoice history error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to load AMC contract.",
      });
    }
  }
);
/* =====================================================
   RECORD AMC INVOICE PAYMENT
   POST /api/admin/amc/payment

   Financial source of truth:
   AmcInvoice -> AmcPayment

   Accepted body:
   {
     amcInvoiceId,
     amcContractId, // optional fallback
     amount,
     paymentDate,
     mode,
     referenceNo,
     notes
   }
===================================================== */

router.post(
  "/amc/payment",
  async (req, res) => {
    const session =
      await mongoose.startSession();

    let savedPayment =
      null;

    let savedInvoice =
      null;

    let savedContract =
      null;

    try {
      const {
        amcInvoiceId,
        amcContractId,

        amount,
        paymentDate,

        mode =
          "Bank Transfer",

        referenceNo =
          "",

        notes =
          "",
      } = req.body;

      const normalizedAmount =
        roundAmcAmount(
          amount
        );

      if (
        !Number.isFinite(
          normalizedAmount
        ) ||
        normalizedAmount <= 0
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Enter a valid payment amount.",
        });
      }

      if (!paymentDate) {
        return res.status(400).json({
          success:
            false,

          message:
            "Payment date is required.",
        });
      }

      const parsedPaymentDate =
        new Date(
          `${paymentDate}T00:00:00`
        );

      if (
        Number.isNaN(
          parsedPaymentDate.getTime()
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid payment date.",
        });
      }

      const allowedModes = [
        "Cash",
        "Bank Transfer",
        "UPI",
        "Cheque",
        "Card",
        "Other",
      ];

      const normalizedMode =
        allowedModes.includes(
          mode
        )
          ? mode
          : "Other";

      /*
       * Bank/UPI/Cheque/Card payments should preferably
       * contain a reference number.
       */
      const normalizedReferenceNo =
        String(
          referenceNo ||
          ""
        ).trim();

      const normalizedNotes =
        String(
          notes ||
          ""
        ).trim();

      if (
        [
          "Bank Transfer",
          "UPI",
          "Cheque",
          "Card",
        ].includes(
          normalizedMode
        ) &&
        !normalizedReferenceNo
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            `Reference number is required for ${normalizedMode}.`,
        });
      }

      /*
       * At least invoice ID or contract ID is required.
       */
      const validInvoiceId =
        amcInvoiceId &&
        mongoose.Types.ObjectId.isValid(
          amcInvoiceId
        );

      const validContractId =
        amcContractId &&
        mongoose.Types.ObjectId.isValid(
          amcContractId
        );

      if (
        !validInvoiceId &&
        !validContractId
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "A valid AMC invoice ID is required.",
        });
      }

      await session.withTransaction(
        async () => {
          let invoice =
            null;

          /*
           * Preferred method:
           * direct permanent invoice selection.
           */
          if (validInvoiceId) {
            invoice =
              await AmcInvoice.findOne({
                _id:
                  amcInvoiceId,

                isDeleted:
                  false,
              }).session(
                session
              );
          }

          /*
           * Compatibility fallback:
           * resolve current invoice through contract.
           */
          if (
            !invoice &&
            validContractId
          ) {
            const fallbackContract =
              await AmcContract.findOne({
                _id:
                  amcContractId,

                isDeleted:
                  false,
              }).session(
                session
              );

            if (
              fallbackContract
                ?.currentInvoiceId
            ) {
              invoice =
                await AmcInvoice.findOne({
                  _id:
                    fallbackContract
                      .currentInvoiceId,

                  isDeleted:
                    false,
                }).session(
                  session
                );
            }

            if (
              !invoice &&
              (
                fallbackContract
                  ?.currentInvoiceCode ||
                fallbackContract
                  ?.invoiceCode
              )
            ) {
              invoice =
                await AmcInvoice.findOne({
                  invoiceCode:
                    fallbackContract
                      .currentInvoiceCode ||
                    fallbackContract
                      .invoiceCode,

                  isDeleted:
                    false,
                }).session(
                  session
                );
            }
          }

          if (!invoice) {
            const error =
              new Error(
                "AMC invoice was not found."
              );

            error.statusCode =
              404;

            throw error;
          }

          if (
            invoice.status ===
            "Cancelled"
          ) {
            const error =
              new Error(
                "Payment cannot be recorded against a cancelled invoice."
              );

            error.statusCode =
              400;

            throw error;
          }

          const contract =
            await AmcContract.findOne({
              _id:
                invoice.amcContractId,

              isDeleted:
                false,
            }).session(
              session
            );

          if (!contract) {
            const error =
              new Error(
                "The AMC contract linked to this invoice was not found."
              );

            error.statusCode =
              404;

            throw error;
          }

          if (
            contract.status ===
            "Cancelled"
          ) {
            const error =
              new Error(
                "Payment cannot be recorded against a cancelled AMC contract."
              );

            error.statusCode =
              400;

            throw error;
          }

          const invoiceTotal =
            roundAmcAmount(
              invoice.totalAmount
            );

          /*
           * Recalculate paid amount from permanent payment
           * records instead of trusting copied totals.
           */
          const existingPaymentTotals =
            await AmcPayment.aggregate([
              {
                $match: {
                  amcInvoiceId:
                    invoice._id,

                  isDeleted:
                    false,
                },
              },

              {
                $group: {
                  _id:
                    null,

                  paidAmount: {
                    $sum:
                      "$amount",
                  },
                },
              },
            ]).session(
              session
            );

          const existingPaidAmount =
            roundAmcAmount(
              existingPaymentTotals[0]
                ?.paidAmount ||
              0
            );

          const actualPendingAmount =
            Math.max(
              roundAmcAmount(
                invoiceTotal -
                existingPaidAmount
              ),
              0
            );

          if (
            actualPendingAmount <= 0
          ) {
            const error =
              new Error(
                "This invoice is already fully paid."
              );

            error.statusCode =
              400;

            throw error;
          }

          if (
            normalizedAmount >
            actualPendingAmount
          ) {
            const error =
              new Error(
                `Payment cannot exceed the pending amount of ₹${actualPendingAmount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits:
                      2,

                    maximumFractionDigits:
                      2,
                  }
                )}.`
              );

            error.statusCode =
              400;

            throw error;
          }

          const paymentCode =
            generateAmcPaymentCode();

          const createdPayments =
            await AmcPayment.create(
              [
                {
                  paymentCode,

                  amcContractId:
                    contract._id,

                  amcInvoiceId:
                    invoice._id,

                  contractCode:
                    contract.contractCode,

                  invoiceCode:
                    invoice.invoiceCode,

                  /*
                   * Snapshot fields make payment history
                   * independent of Client Master.
                   */
                  clientId:
                    invoice.clientId,

                  clientCode:
                    invoice.clientCode,

                  clientName:
                    invoice.clientName,

                  productId:
                    invoice.productId,

                  productCode:
                    invoice.productCode,

                  productName:
                    invoice.productName,

                  amount:
                    normalizedAmount,

                  paymentDate:
                    parsedPaymentDate,

                  mode:
                    normalizedMode,

                  referenceNo:
                    normalizedReferenceNo,

                  notes:
                    normalizedNotes,

                  receivedBy:
                    req.user._id,

                  receivedByName:
                    req.user.name ||
                    "Admin",

                  isDeleted:
                    false,
                },
              ],
              {
                session,
              }
            );

          const payment =
            createdPayments[0];

          const updatedPaidAmount =
            roundAmcAmount(
              existingPaidAmount +
              normalizedAmount
            );

          const updatedPendingAmount =
            Math.max(
              roundAmcAmount(
                invoiceTotal -
                updatedPaidAmount
              ),
              0
            );

          const paymentStatus =
            updatedPendingAmount <= 0
              ? "Paid"
              : "Partially Paid";

          /*
           * Update permanent invoice balance.
           */
          invoice.paidAmount =
            updatedPaidAmount;

          invoice.pendingAmount =
            updatedPendingAmount;

          invoice.paymentStatus =
            paymentStatus;

          invoice.updatedBy =
            req.user._id;

          invoice.updatedByName =
            req.user.name ||
            "Admin";

          await invoice.save({
            session,
          });

          /*
           * Keep compatibility values in the contract.
           * Invoice remains the source of truth.
           */
          contract.currentInvoiceId =
            invoice._id;

          contract.currentInvoiceCode =
            invoice.invoiceCode;

          contract.invoiceCode =
            invoice.invoiceCode;

          contract.invoiceDate =
            invoice.invoiceDate;

          contract.taxableAmount =
            invoice.taxableAmount;

          contract.cgstRate =
            invoice.cgstRate;

          contract.cgstAmount =
            invoice.cgstAmount;

          contract.sgstRate =
            invoice.sgstRate;

          contract.sgstAmount =
            invoice.sgstAmount;

          contract.igstRate =
            invoice.igstRate;

          contract.igstAmount =
            invoice.igstAmount;

          contract.totalTaxAmount =
            invoice.totalTaxAmount;

          contract.totalAmount =
            invoice.totalAmount;

          contract.paidAmount =
            updatedPaidAmount;

          contract.pendingAmount =
            updatedPendingAmount;

          contract.status =
            paymentStatus;

          contract.reminderStatus =
            paymentStatus ===
            "Paid"
              ? "Not Required"
              : contract.reminderStatus;

          if (
            paymentStatus ===
            "Paid"
          ) {
            contract.nextFollowUpDate =
              null;
          }

          contract.timeline.push({
            type:
              "payment",

            title:
              paymentStatus ===
              "Paid"
                ? "AMC invoice fully paid"
                : "AMC payment received",

            description:
              `₹${normalizedAmount.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits:
                    2,

                  maximumFractionDigits:
                    2,
                }
              )} received through ${normalizedMode} against invoice ${invoice.invoiceCode}${
                normalizedReferenceNo
                  ? ` · Reference ${normalizedReferenceNo}`
                  : ""
              }. Pending amount: ₹${updatedPendingAmount.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits:
                    2,

                  maximumFractionDigits:
                    2,
                }
              )}.`,

            performedBy:
              req.user._id,

            performedByName:
              req.user.name ||
              "Admin",

            performedByRole:
              req.user.role ||
              "admin",
          });

          contract.updatedBy =
            req.user._id;

          contract.updatedByName =
            req.user.name ||
            "Admin";

          await contract.save({
            session,
          });

          savedPayment =
            payment;

          savedInvoice =
            invoice;

          savedContract =
            contract;
        }
      );

      /*
       * Update Client Master only when it still exists.
       *
       * Payment records remain safe even when the Client
       * Master was archived or deleted.
       */
      if (
        savedInvoice?.clientId
      ) {
        const client =
          await Client.findOne({
            _id:
              savedInvoice.clientId,

            isDeleted:
              false,
          });

        if (client) {
          const clientProduct =
            client.products.id(
              savedInvoice.clientProductId
            );

          const masterAmcStatus =
            savedInvoice.paymentStatus ===
            "Paid"
              ? "Paid"
              : "Partially Paid";

          if (clientProduct) {
            clientProduct.amcStatus =
              masterAmcStatus;
          }

          client.amcStatus =
            masterAmcStatus;

          client.updatedBy =
            req.user._id;

          client.updatedByName =
            req.user.name ||
            "Admin";

          await client.save();
        }
      }

      await createActivityLog({
        action:
          "AMC Payment Received",

        category:
          "Payment",

        description:
          `Payment ${savedPayment.paymentCode} of ₹${savedPayment.amount.toLocaleString(
            "en-IN",
            {
              minimumFractionDigits:
                2,

              maximumFractionDigits:
                2,
            }
          )} was received against invoice ${savedInvoice.invoiceCode}.`,

        entityType:
          "payment",

        entityId:
          savedPayment._id,

        entityCode:
          savedPayment.paymentCode,

        entityName:
          savedInvoice.invoiceCode,

        clientId:
          savedInvoice.clientId,

        clientName:
          savedInvoice.clientName,

        employeeId:
          savedContract
            .assignedEmployeeId,

        employeeName:
          savedContract
            .assignedEmployeeName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          req.user.role ||
          "admin",

        metadata: {
          amcContractId:
            savedContract._id,

          contractCode:
            savedContract
              .contractCode,

          amcInvoiceId:
            savedInvoice._id,

          invoiceCode:
            savedInvoice
              .invoiceCode,

          paymentCode:
            savedPayment
              .paymentCode,

          paymentDate:
            savedPayment
              .paymentDate,

          amount:
            savedPayment.amount,

          mode:
            savedPayment.mode,

          referenceNo:
            savedPayment
              .referenceNo,

          paidAmount:
            savedInvoice
              .paidAmount,

          pendingAmount:
            savedInvoice
              .pendingAmount,

          paymentStatus:
            savedInvoice
              .paymentStatus,
        },
      });

      const contractData =
        mergeAmcContractWithInvoice(
          savedContract,
          savedInvoice
        );

      return res.status(201).json({
        success:
          true,

        message:
          savedInvoice.paymentStatus ===
          "Paid"
            ? "Payment recorded successfully. The invoice is now fully paid."
            : "Payment recorded successfully.",

        data: {
          payment:
            amcPaymentResponse(
              savedPayment
            ),

          invoice:
            amcInvoiceResponse(
              savedInvoice
            ),

          contract:
            contractData,
        },

        payment:
          amcPaymentResponse(
            savedPayment
          ),

        invoice:
          amcInvoiceResponse(
            savedInvoice
          ),

        contract:
          contractData,
      });
    } catch (error) {
      console.error(
        "Record AMC invoice payment error:",
        error
      );

      return res
        .status(
          error.statusCode ||
          500
        )
        .json({
          success:
            false,

          message:
            error.message ||
            "Unable to record AMC payment.",
        });
    } finally {
      await session.endSession();
    }
  }
);

/* =====================================================
   AMC DOCUMENT API
===================================================== */


/* =====================================================
   UPLOAD AMC DOCUMENT
===================================================== */

router.post(
  "/amc/contract/:id/documents",

  uploadAmcDocument.array(
    "documents",
    10
  ),

  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Invalid AMC contract ID.",
          });
      }

      const contract =
        await AmcContract.findOne({
          _id:
            id,

          isDeleted:
            false,
        });

      if (!contract) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "AMC contract was not found.",
          });
      }

      if (
        !req.files ||
        req.files.length ===
          0
      ) {
        return res
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Please select at least one document.",
          });
      }

      const documentType =
        String(
          req.body
            .documentType ||
            "Other Document"
        ).trim();

      if (
        !allowedAmcDocumentTypes.includes(
          documentType
        )
      ) {
        for (
          const file
          of req.files
        ) {
          deleteAmcFile(
            file.path
          );
        }

        return res
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Invalid AMC document type.",
          });
      }

      const uploadedAt =
        new Date();

      const documents =
        req.files.map(
          (
            file
          ) => ({
            documentType,

            fileName:
              file.originalname,

            storedFileName:
              file.filename,

            mimeType:
              file.mimetype,

            fileSize:
              file.size,

            relativePath:
              path.join(
                "uploads",
                "amc",
                file.filename
              ),

            source:
              documentType ===
              "Own Invoice / Bill"
                ? "Own Invoice"
                : "Uploaded",

            status:
              "Available",

            uploadedBy:
              req.user
                ._id,

            uploadedByName:
              req.user
                .name ||
              "Admin",

            uploadedAt,
          })
        );

      contract.documents.push(
        ...documents
      );

      contract.timeline.push({
        type:
          "document",

        title:
          documents.length ===
          1
            ? "AMC document uploaded"
            : `${documents.length} AMC documents uploaded`,

        description:
          `${documentType}: ${documents
            .map(
              (
                document
              ) =>
                document.fileName
            )
            .join(
              ", "
            )}`,

        performedBy:
          req.user
            ._id,

        performedByName:
          req.user
            .name ||
          "Admin",

        performedByRole:
          req.user
            .role ||
          "admin",

        createdAt:
          uploadedAt,
      });

      contract.updatedBy =
        req.user._id;

      contract.updatedByName =
        req.user.name ||
        "Admin";

      await contract.save();

      await createActivityLog({
        action:
          "AMC Document Uploaded",

        category:
          "AMC",

        description:
          `${documents.length} document(s) uploaded for ${contract.contractCode}.`,

        entityType:
          "amc",

        entityId:
          contract._id,

        entityCode:
          contract.contractCode,

        entityName:
          `${contract.clientName} - ${contract.productName}`,

        clientId:
          contract.clientId,

        clientName:
          contract.clientName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          req.user.role ||
          "admin",

        metadata: {
          documentType,

          fileCount:
            documents.length,
        },
      });

      return res
        .status(
          201
        )
        .json({
          success:
            true,

          message:
            "AMC document uploaded successfully.",

          data:
            amcContractResponse(
              contract
            ),
        });
    } catch (
      error
    ) {
      console.error(
        "AMC document upload error:",
        error
      );

      if (
        req.files
      ) {
        for (
          const file
          of req.files
        ) {
          deleteAmcFile(
            file.path
          );
        }
      }

      return res
        .status(
          500
        )
        .json({
          success:
            false,

          message:
            error.message ||
            "Unable to upload AMC document.",
        });
    }
  }
);


/* =====================================================
   GET AMC DOCUMENTS
===================================================== */

router.get(
  "/amc/contract/:id/documents",

  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Invalid AMC contract ID.",
          });
      }

      const contract =
        await AmcContract.findOne({
          _id:
            id,

          isDeleted:
            false,
        });

      if (!contract) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "AMC contract was not found.",
          });
      }

      const documents =
        (
          contract.documents ||
          []
        )
          .filter(
            (
              document
            ) =>
              !document.isDeleted &&
              document.status !==
                "Archived"
          )
          .map(
            (
              document
            ) => ({
              id:
                document._id,

              _id:
                document._id,

              type:
                document.documentType,

              documentType:
                document.documentType,

              name:
                document.fileName,

              fileName:
                document.fileName,

              mimeType:
                document.mimeType,

              size:
                document.fileSize,

              fileSize:
                document.fileSize,

              source:
                document.source,

              status:
                document.status,

              uploadedByName:
                document.uploadedByName,

              uploadedAt:
                document.uploadedAt,

              previewUrl:
                `/api/admin/amc/contract/${contract._id}/document/${document._id}/view`,

              downloadUrl:
                `/api/admin/amc/contract/${contract._id}/document/${document._id}/download`,
            })
          );

      return res.json({
        success:
          true,

        data: {
          documents,
        },
      });
    } catch (
      error
    ) {
      console.error(
        "Load AMC documents error:",
        error
      );

      return res
        .status(
          500
        )
        .json({
          success:
            false,

          message:
            error.message ||
            "Unable to load AMC documents.",
        });
    }
  }
);


/* =====================================================
   PREVIEW AMC DOCUMENT
===================================================== */

router.get(
  "/amc/contract/:id/document/:documentId/view",

  async (
    req,
    res
  ) => {
    try {
      const {
        id,
        documentId,
      } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        ) ||
        !mongoose.Types.ObjectId.isValid(
          documentId
        )
      ) {
        return res
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Invalid document ID.",
          });
      }

      const contract =
        await AmcContract.findOne({
          _id:
            id,

          isDeleted:
            false,
        });

      if (!contract) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "AMC contract was not found.",
          });
      }

      const document =
        contract.documents.id(
          documentId
        );

      if (
        !document ||
        document.isDeleted ||
        document.status ===
          "Archived"
      ) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "Document was not found.",
          });
      }

      const absolutePath =
        path.resolve(
          __dirname,
          document.relativePath
        );

      const uploadsRoot =
        path.resolve(
          __dirname,
          "uploads"
        );

      if (
        !absolutePath.startsWith(
          uploadsRoot
        )
      ) {
        return res
          .status(
            403
          )
          .json({
            success:
              false,

            message:
              "Invalid document path.",
          });
      }

      if (
        !fs.existsSync(
          absolutePath
        )
      ) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "Document file was not found.",
          });
      }

      res.setHeader(
        "Content-Type",
        document.mimeType ||
          "application/octet-stream"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${String(
          document.fileName ||
            "document"
        ).replace(
          /["\r\n]/g,
          "_"
        )}"`
      );

      res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
      );

      return res.sendFile(
        absolutePath
      );
    } catch (
      error
    ) {
      console.error(
        "AMC document preview error:",
        error
      );

      return res
        .status(
          500
        )
        .json({
          success:
            false,

          message:
            "Unable to preview AMC document.",
        });
    }
  }
);


/* =====================================================
   DOWNLOAD AMC DOCUMENT
===================================================== */

router.get(
  "/amc/contract/:id/document/:documentId/download",

  async (
    req,
    res
  ) => {
    try {
      const {
        id,
        documentId,
      } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        ) ||
        !mongoose.Types.ObjectId.isValid(
          documentId
        )
      ) {
        return res
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Invalid document ID.",
          });
      }

      const contract =
        await AmcContract.findOne({
          _id:
            id,

          isDeleted:
            false,
        });

      if (!contract) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "AMC contract was not found.",
          });
      }

      const document =
        contract.documents.id(
          documentId
        );

      if (
        !document ||
        document.isDeleted ||
        document.status ===
          "Archived"
      ) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "Document was not found.",
          });
      }

      const absolutePath =
        path.resolve(
          __dirname,
          document.relativePath
        );

      const uploadsRoot =
        path.resolve(
          __dirname,
          "uploads"
        );

      if (
        !absolutePath.startsWith(
          uploadsRoot
        )
      ) {
        return res
          .status(
            403
          )
          .json({
            success:
              false,

            message:
              "Invalid document path.",
          });
      }

      if (
        !fs.existsSync(
          absolutePath
        )
      ) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "Document file was not found.",
          });
      }

      return res.download(
        absolutePath,
        document.fileName
      );
    } catch (
      error
    ) {
      console.error(
        "AMC document download error:",
        error
      );

      return res
        .status(
          500
        )
        .json({
          success:
            false,

          message:
            "Unable to download AMC document.",
        });
    }
  }
);


/* =====================================================
   DELETE AMC DOCUMENT
===================================================== */

router.delete(
  "/amc/contract/:id/document/:documentId",

  async (
    req,
    res
  ) => {
    try {
      const {
        id,
        documentId,
      } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        ) ||
        !mongoose.Types.ObjectId.isValid(
          documentId
        )
      ) {
        return res
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Invalid document ID.",
          });
      }

      const contract =
        await AmcContract.findOne({
          _id:
            id,

          isDeleted:
            false,
        });

      if (!contract) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "AMC contract was not found.",
          });
      }

      const document =
        contract.documents.id(
          documentId
        );

      if (
        !document ||
        document.isDeleted
      ) {
        return res
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "Document was not found.",
          });
      }

      const absolutePath =
        path.resolve(
          __dirname,
          document.relativePath
        );

      document.isDeleted =
        true;

      document.status =
        "Archived";

      document.deletedAt =
        new Date();

      document.deletedBy =
        req.user._id;

      document.deletedByName =
        req.user.name ||
        "Admin";

      contract.timeline.push({
        type:
          "document",

        title:
          "AMC document removed",

        description:
          `${document.fileName} was removed.`,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          req.user.role ||
          "admin",

        createdAt:
          new Date(),
      });

      contract.updatedBy =
        req.user._id;

      contract.updatedByName =
        req.user.name ||
        "Admin";

      await contract.save();

      /*
       * Database is updated first.
       * Only after successful save do we remove physical file.
       */
      deleteAmcFile(
        absolutePath
      );

      await createActivityLog({
        action:
          "AMC Document Removed",

        category:
          "AMC",

        description:
          `${document.fileName} was removed from ${contract.contractCode}.`,

        entityType:
          "amc",

        entityId:
          contract._id,

        entityCode:
          contract.contractCode,

        entityName:
          `${contract.clientName} - ${contract.productName}`,

        clientId:
          contract.clientId,

        clientName:
          contract.clientName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          req.user.role ||
          "admin",

        metadata: {
          documentId:
            document._id,

          documentType:
            document.documentType,

          fileName:
            document.fileName,
        },
      });

      return res.json({
        success:
          true,

        message:
          "AMC document removed successfully.",

        data:
          amcContractResponse(
            contract
          ),
      });
    } catch (
      error
    ) {
      console.error(
        "Delete AMC document error:",
        error
      );

      return res
        .status(
          500
        )
        .json({
          success:
            false,

          message:
            error.message ||
            "Unable to delete AMC document.",
        });
    }
  }
);

/* =====================================================
   CREATE AMC REMINDER
   POST /api/admin/amc/contract/:id/reminder
===================================================== */



router.post(
  "/amc/contract/:id/reminder",
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const {
        channel,
        message,
        followUpDate,
        assignedEmployeeId,
        notes,
      } = req.body;

      /* -----------------------------------------------
         Validate AMC contract ID
      ------------------------------------------------ */

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid AMC contract ID.",
        });
      }

      /* -----------------------------------------------
         Validate reminder channel
      ------------------------------------------------ */

      const allowedChannels = [
        "WhatsApp",
        "Email",
        "SMS",
        "Phone Call",
      ];

      if (
        !allowedChannels.includes(
          channel
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a valid reminder channel.",
        });
      }

      const normalizedMessage =
        String(
          message || ""
        ).trim();

      if (!normalizedMessage) {
        return res.status(400).json({
          success: false,
          message:
            "Reminder message is required.",
        });
      }

      /* -----------------------------------------------
         Validate follow-up date
      ------------------------------------------------ */

      let parsedFollowUpDate =
        null;

      if (followUpDate) {
        parsedFollowUpDate =
          new Date(
            followUpDate
          );

        if (
          Number.isNaN(
            parsedFollowUpDate.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid follow-up date.",
          });
        }
      }

      /* -----------------------------------------------
         Find AMC contract
      ------------------------------------------------ */

      const contract =
        await AmcContract.findOne({
          _id: id,
          isDeleted: false,
        });

      if (!contract) {
        return res.status(404).json({
          success: false,
          message:
            "AMC contract was not found.",
        });
      }

      if (
        contract.status ===
        "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A reminder cannot be created for a cancelled AMC contract.",
        });
      }

      if (
        Number(
          contract.pendingAmount ||
          0
        ) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This AMC contract has no pending payment.",
        });
      }

      /* -----------------------------------------------
         Resolve employee from Employee Master

         When no new employee is selected, retain the
         employee already assigned to the AMC contract.
      ------------------------------------------------ */

      let resolvedEmployee = {
        assignedEmployeeId:
          contract.assignedEmployeeId ||
          null,

        assignedEmployeeCode:
          contract.assignedEmployeeCode ||
          "",

        assignedEmployeeName:
          contract.assignedEmployeeName ||
          "Unassigned",
      };

      const normalizedEmployeeId =
        String(
          assignedEmployeeId || ""
        ).trim();

      if (normalizedEmployeeId) {
        resolvedEmployee =
          await resolveAmcEmployee(
            normalizedEmployeeId
          );
      }

      /* -----------------------------------------------
         Determine reminder status
      ------------------------------------------------ */

      const reminderStatus =
        channel === "Phone Call"
          ? "Call Logged"
          : "Sent";

      const reminderSentAt =
        new Date();

      /* -----------------------------------------------
         Save reminder
      ------------------------------------------------ */

      const reminder =
        await AmcReminder.create({
          amcContractId:
            contract._id,

          contractCode:
            contract.contractCode,

          clientId:
            contract.clientId,

          clientCode:
            contract.clientCode,

          clientName:
            contract.clientName,

          channel,

          message:
            normalizedMessage,

          assignedEmployeeId:
            resolvedEmployee
              .assignedEmployeeId,

          assignedEmployeeCode:
            resolvedEmployee
              .assignedEmployeeCode,

          assignedEmployeeName:
            resolvedEmployee
              .assignedEmployeeName,

          followUpDate:
            parsedFollowUpDate,

          notes:
            String(
              notes || ""
            ).trim(),

          sentAt:
            reminderSentAt,

          sentBy:
            req.user._id,

          sentByName:
            req.user.name ||
            "Admin",

          status:
            reminderStatus,
        });

      /* -----------------------------------------------
         Update AMC contract
      ------------------------------------------------ */

      contract.reminderStatus =
        reminderStatus;

      contract.lastReminderAt =
        reminderSentAt;

      contract.nextFollowUpDate =
        parsedFollowUpDate;

      contract.assignedEmployeeId =
        resolvedEmployee
          .assignedEmployeeId;

      contract.assignedEmployeeCode =
        resolvedEmployee
          .assignedEmployeeCode;

      contract.assignedEmployeeName =
        resolvedEmployee
          .assignedEmployeeName;

      contract.updatedBy =
        req.user._id;

      contract.updatedByName =
        req.user.name ||
        "Admin";

      contract.timeline.push({
        type:
          "reminder",

        title:
          channel === "Phone Call"
            ? "Payment follow-up call logged"
            : `${channel} payment reminder sent`,

        description:
          channel === "Phone Call"
            ? `Payment follow-up call was recorded. Next follow-up: ${
                parsedFollowUpDate
                  ? parsedFollowUpDate
                      .toISOString()
                      .slice(0, 10)
                  : "Not scheduled"
              }.`
            : `Payment reminder was recorded through ${channel}. Next follow-up: ${
                parsedFollowUpDate
                  ? parsedFollowUpDate
                      .toISOString()
                      .slice(0, 10)
                  : "Not scheduled"
              }.`,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          req.user.role ||
          "admin",

        createdAt:
          reminderSentAt,
      });

      await contract.save();

      /* -----------------------------------------------
         Create activity log
      ------------------------------------------------ */

      await createActivityLog({
        action:
          channel === "Phone Call"
            ? "AMC Follow-up Call Logged"
            : "AMC Reminder Sent",

        category:
          "AMC",

        description:
          channel === "Phone Call"
            ? `Payment follow-up call was recorded for ${contract.contractCode}.`
            : `${channel} payment reminder was recorded for ${contract.contractCode}.`,

        entityType:
          "amc",

        entityId:
          contract._id,

        entityCode:
          contract.contractCode,

        entityName:
          `${contract.clientName} - ${contract.productName}`,

        clientId:
          contract.clientId,

        clientName:
          contract.clientName,

        employeeId:
          resolvedEmployee
            .assignedEmployeeId,

        employeeName:
          resolvedEmployee
            .assignedEmployeeName,

        performedBy:
          req.user._id,

        performedByName:
          req.user.name ||
          "Admin",

        performedByRole:
          req.user.role ||
          "admin",

        metadata: {
          channel,

          reminderStatus,

          invoiceCode:
            contract.invoiceCode,

          pendingAmount:
            contract.pendingAmount,

          followUpDate:
            parsedFollowUpDate,

          assignedEmployeeCode:
            resolvedEmployee
              .assignedEmployeeCode,
        },
      });

      return res.status(201).json({
        success: true,

        message:
          channel === "Phone Call"
            ? "Payment follow-up call recorded successfully."
            : "AMC reminder recorded successfully.",

        data: {
          reminder:
            amcReminderResponse(
              reminder
            ),

          contract:
            amcContractResponse(
              contract
            ),
        },
      });
    } catch (error) {
      console.error(
        "Create AMC reminder error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to save AMC reminder.",
      });
    }
  }
);
router.get('/dashboard', async (req, res) => {
  try {
    const totalClients = await Client.countDocuments({ isDeleted: false });
// AMC collected
const amcCollectedResult = await AmcInvoice.aggregate([
  {
    $match: {
      isDeleted: false,
      paidAmount: { $gt: 0 },
    },
  },
  {
    $group: {
      _id: null,
      total: { $sum: '$paidAmount' },
    },
  },
]);

const amcCollected = amcCollectedResult[0]?.total || 0;

// AMC pending
const amcPendingResult = await AmcInvoice.aggregate([
  {
    $match: {
      isDeleted: false,
      pendingAmount: { $gt: 0 },
    },
  },
  {
    $group: {
      _id: null,
      total: { $sum: '$pendingAmount' },
    },
  },
]);

const amcPending = amcPendingResult[0]?.total || 0;


    const openTickets = await SupportTicket.countDocuments({
      isDeleted: false,
      status: { $nin: ['Resolved', 'Verified', 'Closed', 'Cancelled'] }
    });

    res.json({
      success: true,
      data: {
        totalClients,
        amcCollected,
        amcPending,
        openTickets
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
/* =========================================================
   GET EMPLOYEE PC ACTIVITY
   GET /api/admin/pc-activity/:employeeCode?date=2026-08-12
========================================================= */


router.get("/pc-activity/:employeeCode", async (req, res) => {
  try {
    const { employeeCode } = req.params;

    if (!employeeCode) {
      return res.status(400).json({
        success: false,
        message: "Employee code is required.",
      });
    }

    // Date format: YYYY-MM-DD (default = today)
 // Date format: YYYY-MM-DD (default = today in IST)
const dateString =
  req.query.date ||
  new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

// Create the IST day bucket (stored in Mongo as 18:30 UTC of the previous day)
const [year, month, day] = dateString.split('-').map(Number);

const dayStart = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0));
const dayEnd = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));

    const sessions = await AgentDailySummary.find({
      employeeCode: employeeCode.toUpperCase(),
      date: { $gte: dayStart, $lte: dayEnd },
    })
      .sort({ lastSeen: -1 })
      .lean();

    const device = await AgentDevice.findOne({
      employeeCode: employeeCode.toUpperCase(),
      isActive: true,
    }).lean();

    // ---------- Summary ----------
    const totalSeconds = sessions.reduce(
      (sum, item) => sum + (item.totalSeconds || 0),
      0
    );

    const productiveSeconds = sessions
      .filter(
        (item) =>
          item.category !== "Idle" &&
          item.category !== "Break"
      )
      .reduce(
        (sum, item) => sum + (item.totalSeconds || 0),
        0
      );

    const idleSeconds = sessions
      .filter((item) => item.category === "Idle")
      .reduce(
        (sum, item) => sum + (item.totalSeconds || 0),
        0
      );

    const breakSeconds = sessions
      .filter((item) => item.category === "Break")
      .reduce(
        (sum, item) => sum + (item.totalSeconds || 0),
        0
      );

    const formatDuration = (seconds = 0) => {
      const totalMinutes = Math.floor(seconds / 60);

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours <= 0) return `${minutes}m`;
      return minutes > 0
        ? `${hours}h ${minutes}m`
        : `${hours}h`;
    };

    // ---------- Current Activity ----------
    const latest = sessions[0];

    const currentActivity = latest
      ? {
          application: latest.application,
          windowTitle: latest.lastWindowTitle,
          startedAt: latest.firstSeen,
          runningTime: formatDuration(
            latest.totalSeconds
          ),
          status: device?.status || "Offline",
          lastSyncAt: latest.lastSeen,
          deviceName:
            device?.deviceName ||
            device?.pcName ||
            latest.pcName,
        }
      : {
          application: "No activity",
          windowTitle: "",
          startedAt: null,
          runningTime: "0m",
          status: "Offline",
          lastSyncAt: null,
          deviceName: device?.deviceName || "Not registered",
        };

    // ---------- Applications ----------
    const applications = sessions.map((item) => ({
      id: String(item._id),
      application: item.application,
      category: item.category,
      startedAt: item.firstSeen,
      endedAt: item.lastSeen,
      duration: formatDuration(item.totalSeconds),
      productivity:
        item.category === "Idle"
          ? "Idle"
          : item.category === "Break"
          ? "Break"
          : "Productive",
      project: item.project,
      client: item.client,
      taskId: item.taskId,
      ticketId: item.ticketId,
      windowTitle: item.lastWindowTitle,
    }));

    // ---------- Top Applications ----------
    const topApplications = [...sessions]
      .sort(
        (a, b) =>
          (b.totalSeconds || 0) -
          (a.totalSeconds || 0)
      )
      .slice(0, 5)
      .map((item) => ({
        name: item.application,
        duration: formatDuration(item.totalSeconds),
        percentage:
          totalSeconds > 0
            ? Math.round(
                (item.totalSeconds / totalSeconds) * 100
              )
            : 0,
      }));

    return res.json({
      success: true,
      data: {
        currentActivity,
        summary: {
          productiveTime:
            formatDuration(productiveSeconds),
          idleTime: formatDuration(idleSeconds),
          breakTime: formatDuration(breakSeconds),
          applicationsUsed: sessions.length,
        },
        applications,
        topApplications,
        idleSessions: [],
      },
    });
  } catch (error) {
    console.error(
      "PC activity fetch error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load PC activity.",
    });
  }
});
/* =========================================================
   GET EMPLOYEE OVERVIEW
   GET /api/admin/team/:employeeCode/overview
========================================================= */

router.get("/team/:employeeCode/overview", async (req, res) => {
  try {
    const { employeeCode } = req.params;

    const Employee = mongoose.models.Employee;
    const Task = mongoose.models.Task;
    const Attendance = mongoose.models.Attendance;
    const SupportTicket = mongoose.models.SupportTicket;

    const employee = await Employee.findOne({
      employeeCode: employeeCode.toUpperCase(),
    }).lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    const [attendance, openTasks, completedToday, openTickets] =
      await Promise.all([
        Attendance.findOne({
          employeeId: employee._id,
          date: today,
        }).lean(),

        Task.countDocuments({
          assignedEmployeeId: employee._id,
          isDeleted: false,
          status: {
            $in: [
              "Assigned",
              "In Progress",
              "Paused",
              "Testing",
            ],
          },
        }),

        Task.countDocuments({
          assignedEmployeeId: employee._id,
          isDeleted: false,
          status: "Completed",
          completedAt: {
            $gte: new Date(`${today}T00:00:00.000Z`),
            $lte: new Date(`${today}T23:59:59.999Z`),
          },
        }),

        SupportTicket.countDocuments({
          assignedEmployeeId: employee._id,
          isDeleted: false,
          status: {
            $in: ["New", "Assigned", "In Progress"],
          },
        }),
      ]);

    const formatTime = (value) => {
      if (!value) return "—";

      return new Date(value).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      });
    };

    const activeMinutes =
      attendance?.workingMinutes ||
      attendance?.totalWorkedMinutes ||
      0;

    return res.json({
      success: true,
      data: {
        role: employee.role || "Employee",
        department: employee.department || "General",
        employeeCode: employee.employeeCode,
        loginTime: formatTime(attendance?.loginTime),
        activeTime: `${Math.floor(activeMinutes / 60)}h ${activeMinutes % 60}m`,
        openTasks,
        completedToday,
        openTickets,
        status: employee.status,
      },
    });
  } catch (error) {
    console.error(
      "Employee overview fetch error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load employee overview.",
    });
  }
});
/* =========================================================
   GET EMPLOYEE ATTENDANCE
   GET /api/admin/team/:employeeCode/attendance
========================================================= */

router.get("/team/:employeeCode/attendance", async (req, res) => {
  try {
    const { employeeCode } = req.params;

    const Employee = mongoose.models.Employee;
    const Attendance = mongoose.models.Attendance;

    const employee = await Employee.findOne({
      employeeCode: employeeCode.toUpperCase(),
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
    }).lean();

    const formatTime = (value) => {
      if (!value) return "—";

      return new Date(value).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      });
    };

    const formatDuration = (minutes = 0) => {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;

      if (hrs <= 0) return `${mins}m`;
      return `${hrs}h ${mins}m`;
    };

    return res.json({
      success: true,
      data: {
        loginTime: formatTime(attendance?.loginTime),
        logoutTime: attendance?.logoutTime
          ? formatTime(attendance.logoutTime)
          : "Not logged out",

        attendanceStatus: attendance
          ? attendance.status || "Present"
          : "Absent",

        activeTime: formatDuration(
          attendance?.workingMinutes ||
            attendance?.totalWorkedMinutes ||
            0
        ),

        breakTime: formatDuration(
          attendance?.totalBreakMinutes ||
            attendance?.breakMinutes ||
            0
        ),

        idleTime: "0m",
        productiveTime: formatDuration(
          attendance?.workingMinutes ||
            attendance?.totalWorkedMinutes ||
            0
        ),

        sessions: attendance
          ? [
              {
                name: "Current Session",
                start: formatTime(attendance.loginTime),
                end: attendance.logoutTime
                  ? formatTime(attendance.logoutTime)
                  : "—",
                duration: formatDuration(
                  attendance?.workingMinutes ||
                    attendance?.totalWorkedMinutes ||
                    0
                ),
                status: attendance.logoutTime
                  ? "Completed"
                  : "Active",
              },
            ]
          : [],
      },
    });
  } catch (error) {
    console.error(
      "Employee attendance fetch error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load attendance.",
    });
  }
});
/* =====================================================
   AMC MULTER ERROR HANDLER
===================================================== */

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Document cannot exceed 10 MB.",
          });
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Maximum 10 documents can be uploaded at once.",
          });
      }

      return res
        .status(
          400
        )
        .json({
          success:
            false,

          message:
            error.message,
        });
    }

    if (
      error &&
      String(
        error.message ||
          ""
      ).includes(
        "PDF, JPG"
      )
    ) {
      return res
        .status(
          400
        )
        .json({
          success:
            false,

          message:
            error.message,
        });
    }

    next(
      error
    );
  }
);
module.exports = router;
