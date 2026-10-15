const path = require('path');
process.env.NODE_PATH = path.resolve('backend/node_modules');
require('module').Module._initPaths();
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve('backend/.env') });

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('ERROR: MONGO_URI not found');
  process.exit(1);
}

const connUri = mongoUri.includes('readPreference=')
  ? mongoUri
  : (mongoUri.includes('?') ? `${mongoUri}&readPreference=secondaryPreferred` : `${mongoUri}?readPreference=secondaryPreferred`);

async function runAtlasCheck() {
  console.log('Connecting to Atlas in strict read-only mode (autoIndex: false)...');
  const conn = await mongoose.createConnection(connUri, {
    readPreference: 'secondaryPreferred',
    autoIndex: false,
  }).asPromise();

  console.log('Connected to Atlas successfully. Database:', conn.name);
  const coll = conn.collection('attendance');

  // 1. Total doc count
  const count = await coll.countDocuments({});
  console.log('Total documents count:', count);
  if (count !== 42) {
    throw new Error(`Expected 42 documents, found ${count}`);
  }

  // 2. Indexes catalog
  const indexes = await coll.indexes();
  console.log('Indexes count:', indexes.length);
  const indexNames = indexes.map(i => i.name);
  console.log('Index names:', indexNames.join(', '));
  if (indexes.length !== 8) {
    throw new Error(`Expected exactly 8 indexes on Atlas, found ${indexes.length}`);
  }

  // 3. Register centralized models with autoIndex: false
  const AttendanceV1 = conn.model('Attendance', require(path.resolve('backend/models/Attendance')).schema);
  const AttendanceV2 = conn.model('AttendanceV2', require(path.resolve('backend/models/AttendanceV2')).schema);

  // 4. Read all records using centralized V1 model
  const docsV1 = await AttendanceV1.find({}).lean();
  console.log('Successfully read all documents via Attendance (V1):', docsV1.length);

  // 5. Read all records using centralized V2 model
  const docsV2 = await AttendanceV2.find({}).lean();
  console.log('Successfully read all documents via AttendanceV2 (V2):', docsV2.length);

  // 6. Verify legacy document
  const legacyDoc = docsV1.find(d => d.totalWorkedMinutes === undefined);
  if (!legacyDoc) {
    throw new Error('Legacy document without totalWorkedMinutes not found');
  }
  console.log('Legacy document verified: date is', legacyDoc.date, 'workingMinutes is', legacyDoc.workingMinutes);

  // 7. Verify modern documents
  const modernDocs = docsV2.filter(d => d.totalWorkedMinutes !== undefined);
  console.log('Modern documents with V2 fields count:', modernDocs.length);

  await conn.close();
  console.log('Atlas read-only verification completed with zero writes.');
}

runAtlasCheck().catch(err => {
  console.error('Atlas verification failed:', err);
  process.exit(1);
});
