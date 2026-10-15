const mongoose = require("mongoose");

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

module.exports =
  mongoose.models.Product ||
  mongoose.model(
    "Product",
    productSchema
  );
