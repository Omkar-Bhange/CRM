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

async function runAtlasClientAudit() {
  console.log('Connecting to Atlas in strict read-only mode (autoIndex: false)...');
  const conn = await mongoose.createConnection(connUri, {
    readPreference: 'secondaryPreferred',
    autoIndex: false,
  }).asPromise();

  console.log('Connected to Atlas successfully. Database:', conn.name);
  const coll = conn.collection('clients');

  // 1. Total doc count
  const count = await coll.countDocuments({});
  console.log('Total client documents count on Atlas:', count);

  // 2. Indexes catalog
  const indexes = await coll.indexes();
  console.log('Indexes count:', indexes.length);
  indexes.forEach(idx => {
    console.log(`  Index: ${idx.name} -> keys: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
  });

  // 3. Document field distribution and sample
  const sampleDocs = await coll.find({}).limit(10).toArray();
  console.log(`\nSample docs count: ${sampleDocs.length}`);
  
  const statusCounts = {};
  const amcStatusCounts = {};
  let withGst = 0;
  let withProducts = 0;
  let withAssignedEmp = 0;

  const allDocs = await coll.find({}).toArray();
  allDocs.forEach(d => {
    statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    amcStatusCounts[d.amcStatus] = (amcStatusCounts[d.amcStatus] || 0) + 1;
    if (d.gstNo) withGst++;
    if (d.products && d.products.length > 0) withProducts++;
    if (d.assignedEmployeeId) withAssignedEmp++;
  });

  console.log('\nClient status distribution:', statusCounts);
  console.log('AMC status distribution:', amcStatusCounts);
  console.log(`Clients with GST No: ${withGst} / ${count}`);
  console.log(`Clients with products: ${withProducts} / ${count}`);
  console.log(`Clients with assigned employee: ${withAssignedEmp} / ${count}`);

  // Safe sample client representation (without sensitive data)
  if (allDocs.length > 0) {
    const s = allDocs[0];
    console.log('\nSample client field keys:', Object.keys(s));
    console.log('Sample clientCode format:', s.clientCode);
    console.log('Sample product count:', s.products ? s.products.length : 0);
  }

  await conn.close();
  console.log('\nAtlas client read-only audit complete. 0 writes executed.');
}

runAtlasClientAudit().catch(err => {
  console.error('Atlas client audit failed:', err);
  process.exit(1);
});
