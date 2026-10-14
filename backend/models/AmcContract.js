"use strict";

const mongoose = require("mongoose");

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
      "update",
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

      cycleNumber: {
        type: Number,
        default: 1,
      },

      previousInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AmcInvoice",
        default: null,
      },

      previousInvoiceCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      gstApplicable: {
        type: String,
        enum: ["YES", "NO"],
        default: "YES",
      },

      taxType: {
        type: String,
        enum: ["intra", "inter"],
        default: "intra",
      },

      totalTaxAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      taxClassification: {
        type: String,
        default: "Standard Rate (18%)",
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

      upcomingRenewal: {
        invoiceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AmcInvoice",
          default: null,
        },
        invoiceCode: {
          type: String,
          default: "",
          trim: true,
          uppercase: true,
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
        gstApplicable: {
          type: String,
          enum: ["YES", "NO"],
          default: "YES",
        },
        taxType: {
          type: String,
          enum: ["intra", "inter"],
          default: "intra",
        },
        taxClassification: {
          type: String,
          default: "Standard Rate (18%)",
          trim: true,
        },
        paymentStatus: {
          type: String,
          default: "Pending",
          trim: true,
        },
        notes: {
          type: String,
          default: "",
          trim: true,
        },
        createdAt: {
          type: Date,
          default: null,
        },
      },

      renewalLockAt: {
        type: Date,
        default: null,
      },

      renewalVersion: {
        type: Number,
        default: 0,
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


module.exports = AmcContract;
