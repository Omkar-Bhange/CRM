"use strict";

const mongoose = require("mongoose");

/* =====================================================
   PRODUCT SALE PAYMENT
===================================================== */

/*
 * Permanent payment records for original ProductSale.
 *
 * Do not store only a number in ProductSale.
 * Every receipt/payment should have its own record.
 */

const productSalePaymentSchema = new mongoose.Schema(
  {
    paymentCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    paymentNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    idempotencyKey: {
      type: String,
      default: null,
      trim: true,
      index: true,
      sparse: true,
    },

    productSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductSale",
      required: true,
      index: true,
    },

    saleCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    clientCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
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

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "productsalepayments",
  }
);

productSalePaymentSchema.index({
  productSaleId: 1,
  paymentDate: -1,
});

/* =====================================================
   PRODUCTSALE PAYMENT MODEL REGISTRATION & EXPORT
===================================================== */

const ProductSalePayment =
  mongoose.models.ProductSalePayment ||
  mongoose.model("ProductSalePayment", productSalePaymentSchema);

module.exports = ProductSalePayment;
