const mongoose = require("mongoose");

/* =====================================================
   ATTENDANCE EVENT SCHEMA
===================================================== */

const attendanceEventSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["LOGIN", "LOGOUT", "BREAK_START", "BREAK_END", "AUTO_CLOSE"],
      required: true,
      uppercase: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: {
      type: String,
      default: "web",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "attendanceevents",
  }
);

const AttendanceEvent =
  mongoose.models.AttendanceEvent ||
  mongoose.model("AttendanceEvent", attendanceEventSchema);

module.exports = AttendanceEvent;
