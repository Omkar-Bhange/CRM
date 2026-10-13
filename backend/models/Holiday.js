"use strict";

const mongoose = require("mongoose");

/* =========================================================
   HOLIDAY MASTER SCHEMA & MODEL
========================================================= */

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "National",
        "Company",
        "Optional",
      ],
      default: "Company",
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "holidays",
  }
);

module.exports =
  mongoose.models.Holiday ||
  mongoose.model("Holiday", holidaySchema);
