const mongoose = require("mongoose");

/* =====================================================
   APP COUNTER SCHEMA (Atomic Sequence Generator)
===================================================== */

const appCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: "appcounters",
  }
);

const AppCounter =
  mongoose.models.AppCounter ||
  mongoose.model("AppCounter", appCounterSchema);

module.exports = AppCounter;
