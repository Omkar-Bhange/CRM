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

async function checkAtlasPayments() {
  console.log('Connecting to Atlas in strict read-only mode (autoIndex: false)...');
  const conn = await mongoose.createConnection(connUri, {
    readPreference: 'secondaryPreferred',
    autoIndex: false,
  }).asPromise();

  console.log('Connected to Atlas successfully. Database:', conn.name);
  const collections = await conn.db.listCollections().toArray();
  const names = collections.map(c => c.name);

  console.log('Collections matching product*payment*:');
  names.filter(n => n.includes('payment') || n.includes('sale')).forEach(n => console.log(' -', n));

  const hasSingular = names.includes('productsalepayments');
  const hasPlural = names.includes('productsalespayments');

  console.log('\nExact check:');
  console.log(' - productsalepayments exists on Atlas:', hasSingular);
  console.log(' - productsalespayments exists on Atlas:', hasPlural);

  if (hasSingular) {
    const coll = conn.collection('productsalepayments');
    const count = await coll.countDocuments();
    const indexes = await coll.indexes();
    console.log(`\nproductsalepayments doc count: ${count}`);
    console.log('productsalepayments indexes:');
    indexes.forEach(idx => console.log('   *', idx.name, ':', JSON.stringify(idx.key)));
  }

  if (hasPlural) {
    const coll = conn.collection('productsalespayments');
    const count = await coll.countDocuments();
    console.log(`productsalespayments doc count: ${count}`);
  }

  await conn.close();
  console.log('Atlas connection closed cleanly.');
}

checkAtlasPayments().catch(err => {
  console.error('Atlas check failed:', err);
  process.exit(1);
});

