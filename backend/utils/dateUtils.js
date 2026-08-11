// utils/dateUtils.js
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30

// Returns a Date representing IST midnight for the given instant,
// stored as its correct UTC equivalent. Use this for any Date-typed
// "day bucket" field (e.g. AgentDailySummary.date).
function getISTDateBucket(date = new Date()) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

// Returns "YYYY-MM-DD" in IST. Use this for any String-typed
// "day" field (e.g. Attendance.date).
function getISTDateString(date = new Date()) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

module.exports = { getISTDateBucket, getISTDateString };