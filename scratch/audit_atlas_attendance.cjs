const path = require('path');
process.env.NODE_PATH = path.resolve('backend/node_modules');
require('module').Module._initPaths();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: path.resolve('backend/.env') });

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('ERROR: MONGO_URI not found in backend/.env');
  process.exit(1);
}

// Ensure readPreference is secondaryPreferred or readOnly
const connUri = mongoUri.includes('readPreference=')
  ? mongoUri
  : (mongoUri.includes('?') ? `${mongoUri}&readPreference=secondaryPreferred` : `${mongoUri}?readPreference=secondaryPreferred`);

async function runAudit() {
  console.log('Connecting to operational MongoDB Atlas in READ-ONLY mode...');
  const conn = await mongoose.createConnection(connUri, {
    readPreference: 'secondaryPreferred',
  }).asPromise();

  console.log('Connected successfully. Database:', conn.name);
  const attendanceColl = conn.collection('attendance');

  // 1. Total count
  const totalCount = await attendanceColl.countDocuments({});
  console.log('Total documents in attendance collection:', totalCount);

  // 2. Indexes
  const indexes = await attendanceColl.indexes();
  console.log('Actual MongoDB collection indexes:');
  console.log(JSON.stringify(indexes, null, 2));

  // 3. Sample inspect documents & field presence
  const sample = await attendanceColl.find({}).limit(500).toArray();
  const fieldCounts = {};
  const workStatusValues = {};
  const statusValues = {};
  const dateFormats = {};
  const duplicateMap = {};
  let duplicates = 0;

  sample.forEach(doc => {
    Object.keys(doc).forEach(k => {
      fieldCounts[k] = (fieldCounts[k] || 0) + 1;
    });

    const ws = doc.workStatus !== undefined ? String(doc.workStatus) : 'UNDEFINED';
    workStatusValues[ws] = (workStatusValues[ws] || 0) + 1;

    const st = doc.status !== undefined ? String(doc.status) : 'UNDEFINED';
    statusValues[st] = (statusValues[st] || 0) + 1;

    const dt = doc.date !== undefined ? typeof doc.date : 'UNDEFINED';
    dateFormats[dt] = (dateFormats[dt] || 0) + 1;

    const dupKey = `${doc.employeeId}_${doc.date}`;
    duplicateMap[dupKey] = (duplicateMap[dupKey] || 0) + 1;
    if (duplicateMap[dupKey] === 2) {
      duplicates++;
    }
  });

  // Aggregation over the entire collection for field presence
  const pipeline = [
    {
      $project: {
        hasTotalWorkedMinutes: { $cond: [{ $ifNull: ["$totalWorkedMinutes", false] }, 1, 0] },
        hasTotalBreakMinutes: { $cond: [{ $ifNull: ["$totalBreakMinutes", false] }, 1, 0] },
        hasIsDeleted: { $cond: [{ $ifNull: ["$isDeleted", false] }, 1, 0] },
        hasShiftStart: { $cond: [{ $ifNull: ["$shiftStart", false] }, 1, 0] },
        hasGraceMinutes: { $cond: [{ $ifNull: ["$graceMinutes", false] }, 1, 0] },
        hasAutoClosedReason: { $cond: [{ $ifNull: ["$autoClosedReason", false] }, 1, 0] },
        isFreeWorkStatus: { $cond: [{ $eq: ["$workStatus", "Free"] }, 1, 0] },
        workStatus: 1,
        status: 1,
        date: 1
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        withTotalWorkedMinutes: { $sum: "$hasTotalWorkedMinutes" },
        withTotalBreakMinutes: { $sum: "$hasTotalBreakMinutes" },
        withIsDeleted: { $sum: "$hasIsDeleted" },
        withShiftStart: { $sum: "$hasShiftStart" },
        withGraceMinutes: { $sum: "$hasGraceMinutes" },
        freeWorkStatusCount: { $sum: "$isFreeWorkStatus" },
      }
    }
  ];

  const fullStats = await attendanceColl.aggregate(pipeline).toArray();

  // Check distinct workStatus and status across full collection
  const distinctWorkStatus = await attendanceColl.distinct("workStatus");
  const distinctStatus = await attendanceColl.distinct("status");

  // Check duplicates in entire collection
  const dupPipeline = [
    {
      $group: {
        _id: { employeeId: "$employeeId", date: "$date" },
        count: { $sum: 1 }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    },
    {
      $count: "duplicateGroups"
    }
  ];
  const fullDups = await attendanceColl.aggregate(dupPipeline).toArray();

  const auditReport = {
    totalDocuments: totalCount,
    indexes,
    fieldCountsInSample: fieldCounts,
    sampleSize: sample.length,
    workStatusValuesInSample: workStatusValues,
    statusValuesInSample: statusValues,
    dateFormatsInSample: dateFormats,
    fullStats: fullStats[0] || {},
    distinctWorkStatus,
    distinctStatus,
    duplicateEmployeeDateGroups: fullDups.length > 0 ? fullDups[0].duplicateGroups : 0,
  };

  fs.writeFileSync('scratch/atlas_attendance_audit.json', JSON.stringify(auditReport, null, 2));
  console.log('Atlas Audit complete! Saved to scratch/atlas_attendance_audit.json');

  await conn.close();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

