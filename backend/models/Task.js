const mongoose = require("mongoose");

/* =====================================================
 TASK SCHEMA
===================================================== */

const taskChecklistItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
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
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
  }
);

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

    checklist: {
      type: [taskChecklistItemSchema],
      default: [],
    },

    blockerReason: {
      type: String,
      default: "",
      trim: true,
    },

    waitingFor: {
      type: String,
      default: "",
      trim: true,
    },

    expectedResolutionDate: {
      type: Date,
      default: null,
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

module.exports =
  mongoose.models.Task ||
  mongoose.model("Task", taskSchema);
