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

async function runAtlasProductSaleAudit() {
  console.log('Connecting to Atlas in strict read-only mode (autoIndex: false)...');
  const conn = await mongoose.createConnection(connUri, {
    readPreference: 'secondaryPreferred',
    autoIndex: false,
  }).asPromise();

  console.log('Connected to Atlas successfully. Database:', conn.name);
  const coll = conn.collection('productsales');

  // 1. Total doc count
  const count = await coll.countDocuments({});
  console.log('Total documents in productsales:', count);

  // 2. Indexes
  const indexes = await coll.indexes();
  console.log('Indexes in productsales:');
  indexes.forEach(idx => console.log(' -', idx.name, ':', JSON.stringify(idx.key)));

  // 3. Sample document structure (if any)
  if (count > 0) {
    const sample = await coll.findOne({});
    console.log('Sample document fields:', Object.keys(sample));
    if (sample.items && Array.isArray(sample.items) && sample.items.length > 0) {
      console.log('Sample items[0] fields:', Object.keys(sample.items[0]));
    }
    console.log('Sample saleCode format:', sample.saleCode ? sample.saleCode.replace(/./g, '*') : 'none');
    console.log('Sample paymentStatus:', sample.paymentStatus);
    console.log('Sample status:', sample.status);
  } else {
    console.log('No documents currently in productsales on Atlas.');
  }

  await conn.close();
  console.log('Atlas connection closed cleanly.');
}

runAtlasProductSaleAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

