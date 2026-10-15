const mongoose = require("mongoose");

/* =====================================================
   PROJECT MASTER SCHEMA
===================================================== */

const projectTeamMemberSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    employeeCode: {
      type: String,
      default: "",
      trim: true,
    },
    employeeEmail: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      default: "Team Member",
      trim: true,
    },
    responsibility: {
      type: String,
      default: "",
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Removed"],
      default: "Active",
    },
  },
  {
    _id: true,
  }
);

const projectTimelineSchema = new mongoose.Schema(
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
    oldStage: {
      type: String,
      default: "",
    },
    newStage: {
      type: String,
      default: "",
    },
    oldStatus: {
      type: String,
      default: "",
    },
    newStatus: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
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
      default: "admin",
      trim: true,
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
      type: mongoose.Schema.Types.ObjectId,
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

    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    projectManagerName: {
      type: String,
      default: "",
      trim: true,
    },

    stage: {
      type: String,
      default: "Planning",
      trim: true,
      index: true,
    },

    teamMembers: {
      type: [projectTeamMemberSchema],
      default: [],
    },

    timeline: {
      type: [projectTimelineSchema],
      default: [],
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

module.exports =
  mongoose.models.Project ||
  mongoose.model(
    "Project",
    projectSchema
  );
