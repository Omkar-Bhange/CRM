"use strict";

const mongoose = require("mongoose");

/* =====================================================
   CLIENT PRODUCT SUB-SCHEMA
===================================================== */

const clientProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required."],
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
      enum: ["Basic", "Standard", "Premium"],
      default: "Standard",
    },

    acquisitionType: {
      type: String,
      enum: ["Product Sale", "Legacy / Historical", "Migration"],
      default: "Legacy / Historical",
    },

    productSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductSale",
      default: null,
    },

    productSaleCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    originalInvoiceNo: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    originalPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    historicalDataComplete: {
      type: Boolean,
      default: false,
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

/* =====================================================
   CLIENT MASTER SCHEMA
===================================================== */

const clientSchema = new mongoose.Schema(
  {
    clientCode: {
      type: String,
      required: [true, "Client code is required."],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    companyName: {
      type: String,
      required: [true, "Company name is required."],
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
      type: mongoose.Schema.Types.ObjectId,
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

    gstNo: {
      type: String,
      default: "",
      trim: true,
    },

    panNo: {
      type: String,
      default: "",
      trim: true,
    },

    addressLine1: {
      type: String,
      default: "",
      trim: true,
    },

    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    pinCode: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    billingContact: {
      type: String,
      default: "",
      trim: true,
    },

    billingEmail: {
      type: String,
      default: "",
      trim: true,
    },

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
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
      index: true,
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
    collection: "clients",
  }
);

/* =====================================================
   CLIENT TEXT SEARCH INDEX
===================================================== */

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

/* =====================================================
   CLIENT MODEL REGISTRATION & EXPORT
===================================================== */

const Client =
  mongoose.models.Client ||
  mongoose.model("Client", clientSchema);

module.exports = Client;
