const mongoose = require("mongoose");

/* =====================================================
   REQUIREMENT / ENQUIRY SCHEMA
===================================================== */

const requirementTimelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      default: "Status Updated",
      trim: true,
    },
    oldStatus: {
      type: String,
      default: "",
      trim: true,
    },
    newStatus: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    nextAction: {
      type: String,
      default: "",
      trim: true,
    },
    followUpDate: {
      type: Date,
      default: null,
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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

      timeline: {
        type: [requirementTimelineSchema],
        default: [],
      },

      lostReason: {
        type: String,
        default: "",
        trim: true,
      },

      competitor: {
        type: String,
        default: "",
        trim: true,
      },

      holdReason: {
        type: String,
        default: "",
        trim: true,
      },

      nextAction: {
        type: String,
        default: "",
        trim: true,
      },

      followUpDate: {
        type: Date,
        default: null,
      },

      contactMethod: {
        type: String,
        default: "",
        trim: true,
      },

      contactPerson: {
        type: String,
        default: "",
        trim: true,
      },

      demoDate: {
        type: Date,
        default: null,
      },

      demoOwner: {
        type: String,
        default: "",
        trim: true,
      },

      quotationReference: {
        type: String,
        default: "",
        trim: true,
      },

      validUntil: {
        type: Date,
        default: null,
      },

      stageData: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
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


module.exports =
  mongoose.models.Requirement ||
  mongoose.model(
    "Requirement",
    requirementSchema
  );
