const mongoose = require("mongoose");

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
          "feedback",
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

const ticketClientFeedbackSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    submittedByClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    submittedByName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
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

      // SLA Snapshot & Milestone Fields (Enhancement 4)
      slaFirstResponseMinutes: {
        type: Number,
        default: null,
      },

      slaResolutionMinutes: {
        type: Number,
        default: null,
      },

      firstResponseDueAt: {
        type: Date,
        default: null,
        index: true,
      },

      resolutionDueAt: {
        type: Date,
        default: null,
        index: true,
      },

      firstResolvedAt: {
        type: Date,
        default: null,
      },

      slaPolicyVersion: {
        type: String,
        default: "",
        trim: true,
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

      clientFeedback: {
        type: ticketClientFeedbackSchema,
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

module.exports =
  mongoose.models.SupportTicket ||
  mongoose.model(
    "SupportTicket",
    supportTicketSchema
  );
