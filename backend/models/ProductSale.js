"use strict";

const mongoose = require("mongoose");

/* =====================================================
   PRODUCT SALE ITEM SUB-SCHEMA
===================================================== */

const productSaleItemSchema = new mongoose.Schema(
  {
    /*
     * Product Master reference.
     */
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required."],
      index: true,
    },

    /*
     * Snapshot fields.
     *
     * Product Master may change later, but an old
     * invoice must always keep the original name/code.
     */
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
      default: "",
      trim: true,
    },

    /*
     * This will be populated after the sale creates
     * the corresponding entry inside client.products[].
     */
    clientProductId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    licenceType: {
      type: String,
      enum: [
        "Perpetual Licence",
        "Annual Licence",
        "Monthly Subscription",
      ],
      default: "Perpetual Licence",
    },

    licensedUsers: {
      type: Number,
      default: 1,
      min: 1,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    /*
     * COMMERCIAL VALUE
     */
    rate: {
      type: Number,
      default: 0,
      min: 0,
    },

    grossAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxableAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstRate: {
      type: Number,
      default: 18,
      min: 0,
    },

    cgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    sgstAmount: {
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

    /*
     * IMPLEMENTATION / SUPPORT
     */

    purchaseDate: {
      type: Date,
      default: null,
    },

    installationDate: {
      type: Date,
      default: null,
    },

    warrantyMonths: {
      type: Number,
      default: 12,
      min: 0,
    },

    warrantyStartDate: {
      type: Date,
      default: null,
    },

    warrantyEndDate: {
      type: Date,
      default: null,
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

    installationStatus: {
      type: String,
      enum: [
        "Not Installed",
        "Installation Pending",
        "Installed",
        "Inactive",
      ],
      default: "Not Installed",
    },

    /*
     * AMC configuration for this product.
     *
     * This does NOT create an AMC invoice yet.
     * It only remembers what should happen after
     * warranty/free-support ends.
     */
    amcApplicable: {
      type: Boolean,
      default: true,
    },

    proposedAmcAmount: {
      type: Number,
      default: 0,
      min: 0,
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
   PRODUCT SALE SCHEMA
===================================================== */

const productSaleSchema = new mongoose.Schema(
  {
    /*
     * Internal sale number.
     *
     * Example:
     * SAL-2026-0001
     */
    saleCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    /*
     * Numeric running sequence.
     */
    saleNumber: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },

    /*
     * Your actual invoice/reference number.
     */
    invoiceNo: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      index: true,
    },

    saleDate: {
      type: Date,
      required: [
        true,
        "Sale date is required.",
      ],
      default: Date.now,
      index: true,
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    dueDate: {
      type: Date,
      default: null,
      index: true,
    },

    /* =================================================
       CLIENT SNAPSHOT
    ================================================= */

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

    mobile: {
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

    gstNo: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    billingAddress: {
      type: String,
      default: "",
      trim: true,
    },

    /* =================================================
       PRODUCTS
    ================================================= */

    items: {
      type: [productSaleItemSchema],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one product is required.",
      },
    },

    /* =================================================
       INVOICE TOTALS
    ================================================= */

    grossAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxableAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    cgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    sgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    igstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    roundOff: {
      type: Number,
      default: 0,
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

    paymentStatus: {
      type: String,
      enum: [
        "Unpaid",
        "Partially Paid",
        "Paid",
        "Overdue",
      ],
      default: "Unpaid",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "Draft",
        "Confirmed",
        "Cancelled",
      ],
      default: "Confirmed",
      index: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    paymentVersion: {
      type: Number,
      default: 0,
    },

    /* =================================================
       AUDIT
    ================================================= */

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
    collection: "productsales",
  }
);

productSaleSchema.index({
  saleCode: "text",
  invoiceNo: "text",
  clientCode: "text",
  clientName: "text",
  "items.productCode": "text",
  "items.productName": "text",
});

productSaleSchema.index({
  clientId: 1,
  saleDate: -1,
});

/* =====================================================
   PRODUCTSALE MODEL REGISTRATION & EXPORT
===================================================== */

const ProductSale =
  mongoose.models.ProductSale ||
  mongoose.model("ProductSale", productSaleSchema);

module.exports = ProductSale;

