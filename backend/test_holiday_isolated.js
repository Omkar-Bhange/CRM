"use strict";
/**
 * test_holiday_isolated.js
 * Isolated functional integration test suite for Holiday model.
 * Connects to a dedicated temporary local database and drops it on completion.
 */

const mongoose = require("mongoose");

const TEST_DB_NAME = `crm_isolated_holiday_test_${Date.now()}`;
const TEST_URI = `mongodb://127.0.0.1:27017/${TEST_DB_NAME}`;

let passed = 0;
let failed = 0;

function assert(label, cond) {
  if (cond) {
    console.log("  PASS:", label);
    passed++;
  } else {
    console.error("  FAIL:", label);
    failed++;
  }
}

// Simulates findHolidayByDate in backend/attendance-v2.js
async function findHolidayByDate(Holiday, date, excludeHolidayId = null) {
  const query = { date };
  if (excludeHolidayId) {
    query._id = { $ne: excludeHolidayId };
  }
  return Holiday.findOne(query).lean();
}

// Simulates attendance day determination logic from backend/attendance-v2.js lines 4570-4610 & 5130-5165
function determineDayStatus(date, holidayMap, isWeeklyOff = false) {
  const holiday = holidayMap.get(date);
  if (holiday && holiday.type !== "Optional") {
    return {
      status: "Holiday",
      uiStatus: "Holiday",
      attendanceStatus: "HOLIDAY",
      holidayName: holiday.name,
      holidayType: holiday.type,
      holidayNote: holiday.note || "",
      isWorkingDay: false,
    };
  }
  if (isWeeklyOff) {
    return {
      status: "WeeklyOff",
      uiStatus: "Weekly Off",
      attendanceStatus: "WEEKLY_OFF",
      holidayName: null,
      holidayType: null,
      holidayNote: "",
      isWorkingDay: false,
    };
  }
  return {
    status: "WorkingDay",
    uiStatus: "Working Day",
    attendanceStatus: "PRESENT",
    holidayName: null,
    holidayType: null,
    holidayNote: "",
    isWorkingDay: true,
  };
}

async function runIsolatedTests() {
  console.log("================================================================================");
  console.log("   HOLIDAY MODEL ISOLATED FUNCTIONAL INTEGRATION TEST                            ");
  console.log("================================================================================");
  console.log(`Connecting to ISOLATED database: ${TEST_URI}`);
  console.log(`Target Database Name: ${TEST_DB_NAME}`);

  await mongoose.connect(TEST_URI);
  console.log(`Connected successfully. Active DB: ${mongoose.connection.name}`);

  try {
    const Holiday = require("./models/Holiday");

    // ── 1. Model registration & collection name ──────────────────────────────
    console.log("\n[1] Model registration & collection name");
    assert("Model name is Holiday", Holiday.modelName === "Holiday");
    assert("Collection name is holidays", Holiday.collection.name === "holidays");

    // ── 2. Index building & verification ─────────────────────────────────────
    console.log("\n[2] Index building & verification");
    await Holiday.init();
    const mongoIndexes = await Holiday.collection.indexes();
    console.log("  Built MongoDB indexes:", JSON.stringify(mongoIndexes.map(i => ({ key: i.key, name: i.name, unique: i.unique }))));

    const hasUniqueDateIndex = mongoIndexes.some(
      idx => idx.key.date === 1 && idx.unique === true
    );
    assert("Unique index on date exists in MongoDB", hasUniqueDateIndex);

    const hasIsActiveIndex = mongoIndexes.some(
      idx => idx.key.isActive === 1
    );
    assert("Index on isActive exists in MongoDB", hasIsActiveIndex);

    // ── 3. Schema validation: required fields ────────────────────────────────
    console.log("\n[3] Schema validation: required fields");
    let missingDateErr = null;
    try {
      await Holiday.create({ name: "Republic Day" });
    } catch (err) {
      missingDateErr = err;
    }
    assert("Fails without date (required)", missingDateErr && missingDateErr.errors && missingDateErr.errors.date);

    let missingNameErr = null;
    try {
      await Holiday.create({ date: "2026-01-26" });
    } catch (err) {
      missingNameErr = err;
    }
    assert("Fails without name (required)", missingNameErr && missingNameErr.errors && missingNameErr.errors.name);

    // ── 4. Schema validation: enum validation ────────────────────────────────
    console.log("\n[4] Schema validation: enum validation");
    let invalidTypeErr = null;
    try {
      await Holiday.create({
        date: "2026-01-26",
        name: "Republic Day",
        type: "InvalidHolidayType",
      });
    } catch (err) {
      invalidTypeErr = err;
    }
    assert("Fails with invalid type enum", invalidTypeErr && invalidTypeErr.errors && invalidTypeErr.errors.type);

    // ── 5. Holiday creation with defaults ────────────────────────────────────
    console.log("\n[5] Holiday creation with defaults");
    const mockAdminId = new mongoose.Types.ObjectId();
    const h1 = await Holiday.create({
      date: "2026-01-26",
      name: "  Republic Day  ",
      createdBy: mockAdminId,
    });
    assert("Holiday 1 created with _id", !!h1._id);
    assert("date is 2026-01-26", h1.date === "2026-01-26");
    assert("name is trimmed", h1.name === "Republic Day");
    assert("type defaults to Company", h1.type === "Company");
    assert("note defaults to empty string", h1.note === "");
    assert("isActive defaults to true", h1.isActive === true);
    assert("createdBy is recorded", String(h1.createdBy) === String(mockAdminId));
    assert("updatedBy defaults to null", h1.updatedBy === null);
    assert("createdAt is populated", !!h1.createdAt);
    assert("updatedAt is populated", !!h1.updatedAt);
    assert("__v is present", h1.__v !== undefined);

    // ── 6. Holiday creation: National and Optional types ─────────────────────
    console.log("\n[6] Holiday creation: National and Optional types");
    const h2 = await Holiday.create({
      date: "2026-08-15",
      name: "Independence Day",
      type: "National",
      note: "National holiday observed nationwide",
      createdBy: mockAdminId,
    });
    assert("Holiday 2 (National) created", h2.type === "National");

    const h3 = await Holiday.create({
      date: "2026-11-01",
      name: "Optional Festival Holiday",
      type: "Optional",
      note: "Optional floating holiday",
      createdBy: mockAdminId,
    });
    assert("Holiday 3 (Optional) created", h3.type === "Optional");

    // ── 7. Unique date constraint enforcement ────────────────────────────────
    console.log("\n[7] Unique date constraint enforcement");
    let duplicateDateErr = null;
    try {
      await Holiday.create({
        date: "2026-01-26", // Already exists
        name: "Duplicate Republic Day",
        type: "National",
      });
    } catch (err) {
      duplicateDateErr = err;
    }
    assert("Duplicate date rejected by MongoDB unique index (E11000)", duplicateDateErr && (duplicateDateErr.code === 11000 || duplicateDateErr.name === "MongoServerError"));

    // ── 8. Duplicate check helper (findHolidayByDate) ────────────────────────
    console.log("\n[8] findHolidayByDate helper verification");
    const foundExisting = await findHolidayByDate(Holiday, "2026-01-26");
    assert("findHolidayByDate finds existing holiday", !!foundExisting && foundExisting.name === "Republic Day");

    const excludedSelf = await findHolidayByDate(Holiday, "2026-01-26", h1._id);
    assert("findHolidayByDate excludes self holiday id on edit", excludedSelf === null);

    const nonExistent = await findHolidayByDate(Holiday, "2026-12-25");
    assert("findHolidayByDate returns null for unassigned date", nonExistent === null);

    // ── 9. Holiday querying & filtering ──────────────────────────────────────
    console.log("\n[9] Holiday querying & filtering");
    // Range query (lines 1150-1200 of attendance-v2.js)
    const rangeHolidays = await Holiday.find({
      isActive: true,
      date: { $gte: "2026-01-01", $lte: "2026-08-31" },
    }).sort({ date: 1 }).lean();
    assert("Range query returns 2 holidays (Jan 26, Aug 15)", rangeHolidays.length === 2);
    assert("Sorted chronologically", rangeHolidays[0].date === "2026-01-26" && rangeHolidays[1].date === "2026-08-15");

    // Month regex query (lines 1543-1546 of attendance-v2.js)
    const augHolidays = await Holiday.find({
      isActive: true,
      date: { $regex: "^2026-08" },
    }).lean();
    assert("Month regex returns exactly 1 holiday for August", augHolidays.length === 1 && augHolidays[0].name === "Independence Day");

    // ── 10. Holiday update operations ────────────────────────────────────────
    console.log("\n[10] Holiday update operations");
    const updateAdminId = new mongoose.Types.ObjectId();
    const updatedH1 = await Holiday.findByIdAndUpdate(
      h1._id,
      {
        name: "Republic Day - 77th Celebration",
        type: "National",
        note: "Updated celebration notes",
        updatedBy: updateAdminId,
      },
      { returnDocument: "after" }
    );
    assert("Name updated", updatedH1.name === "Republic Day - 77th Celebration");
    assert("Type updated to National", updatedH1.type === "National");
    assert("Note updated", updatedH1.note === "Updated celebration notes");
    assert("updatedBy tracked", String(updatedH1.updatedBy) === String(updateAdminId));
    assert("updatedAt is updated Date", updatedH1.updatedAt > h1.createdAt);

    // ── 11. Deactivation (soft delete mirroring DELETE /admin/holidays/:id) ──
    console.log("\n[11] Deactivation (soft delete)");
    h3.isActive = false;
    h3.updatedBy = updateAdminId;
    await h3.save();

    const activeList = await Holiday.find({ isActive: true }).lean();
    assert("Active list excludes deactivated holiday", activeList.length === 2);
    const deactivatedDoc = await Holiday.findById(h3._id).lean();
    assert("Deactivated document preserved in database with isActive: false", deactivatedDoc && deactivatedDoc.isActive === false);

    // ── 12. Attendance calculation interaction (Holiday vs Working Day) ──────
    console.log("\n[12] Attendance calculation interaction (Holiday vs Working Day)");
    const holidayDocs = await Holiday.find({ isActive: true }).lean();
    const holidayMap = new Map(holidayDocs.map(h => [h.date, h]));

    // National holiday day check
    const nationalDayResult = determineDayStatus("2026-08-15", holidayMap);
    assert("National holiday classified as Holiday", nationalDayResult.status === "Holiday");
    assert("National holiday UI status is 'Holiday'", nationalDayResult.uiStatus === "Holiday");
    assert("National holiday isWorkingDay is false", nationalDayResult.isWorkingDay === false);
    assert("National holiday holidayName is populated", nationalDayResult.holidayName === "Independence Day");

    // Ordinary working day check
    const regularDayResult = determineDayStatus("2026-08-14", holidayMap);
    assert("Non-holiday classified as WorkingDay", regularDayResult.status === "WorkingDay");
    assert("Regular day isWorkingDay is true", regularDayResult.isWorkingDay === true);

    // Optional holiday check
    const optionalMap = new Map([["2026-11-01", { date: "2026-11-01", name: "Optional Day", type: "Optional" }]]);
    const optionalDayResult = determineDayStatus("2026-11-01", optionalMap);
    assert("Optional holiday does NOT close company (treated as WorkingDay unless opted)", optionalDayResult.status === "WorkingDay");
    assert("Optional holiday isWorkingDay is true", optionalDayResult.isWorkingDay === true);

    // ── 13. Weekly-off overlap behavior ──────────────────────────────────────
    console.log("\n[13] Weekly-off overlap behavior");
    // When a holiday coincides with a weekly-off (e.g., Sunday)
    const holidayOnSundayResult = determineDayStatus("2026-08-15", holidayMap, true);
    assert("Holiday takes precedence over Sunday/WeeklyOff in attendance display", holidayOnSundayResult.status === "Holiday");
    assert("holidayOnSunday isWorkingDay is false", holidayOnSundayResult.isWorkingDay === false);

    // Regular Sunday without holiday
    const regularSundayResult = determineDayStatus("2026-08-16", holidayMap, true);
    assert("Regular Sunday without holiday classified as WeeklyOff", regularSundayResult.status === "WeeklyOff");
    assert("regularSunday isWorkingDay is false", regularSundayResult.isWorkingDay === false);

    // ── 14. API response format compatibility ────────────────────────────────
    console.log("\n[14] API response format compatibility");
    const sampleApiDoc = activeList[0];
    assert("API document has string _id", typeof String(sampleApiDoc._id) === "string");
    assert("API document has date (YYYY-MM-DD)", /^\d{4}-\d{2}-\d{2}$/.test(sampleApiDoc.date));
    assert("API document has string name", typeof sampleApiDoc.name === "string");
    assert("API document has string type", typeof sampleApiDoc.type === "string");
    assert("API document has note string", typeof sampleApiDoc.note === "string");
    assert("API document has boolean isActive", typeof sampleApiDoc.isActive === "boolean");
    assert("API document has createdAt Date", sampleApiDoc.createdAt instanceof Date);
    assert("API document has updatedAt Date", sampleApiDoc.updatedAt instanceof Date);

  } finally {
    // ── Teardown ─────────────────────────────────────────────────────────────
    console.log("\n[Teardown] Cleaning up isolated database...");
    try {
      await mongoose.connection.db.dropDatabase();
      console.log(`Dropped test database: ${TEST_DB_NAME}`);
    } catch (dropErr) {
      console.warn("Could not drop test database:", dropErr.message);
    }
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n================================================================================");
  console.log(`ISOLATED INTEGRATION TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runIsolatedTests().catch(err => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});
