const path = require('path');
process.env.NODE_PATH = path.resolve('backend/node_modules');
require('module').Module._initPaths();
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve('backend/.env') });

async function findV1Doc() {
  const conn = await mongoose.createConnection(process.env.MONGO_URI, {
    readPreference: 'secondaryPreferred',
  }).asPromise();

  const attendanceColl = conn.collection('attendance');
  const v1Doc = await attendanceColl.findOne({ totalWorkedMinutes: { $exists: false } });
  console.log('Document without totalWorkedMinutes:');
  console.log(JSON.stringify(v1Doc, null, 2));

  await conn.close();
}

findV1Doc();

