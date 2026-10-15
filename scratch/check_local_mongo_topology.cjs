const path = require('path');
process.env.NODE_PATH = path.resolve('backend/node_modules');
require('module').Module._initPaths();
const mongoose = require('mongoose');

async function checkLocalMongo() {
  const uri = 'mongodb://127.0.0.1:27017/admin';
  console.log('Connecting to local MongoDB on 127.0.0.1:27017...');

  try {
    const conn = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 3000,
      autoIndex: false,
    }).asPromise();

    console.log('Connected to local MongoDB.');

    // Run hello or isMaster command
    const hello = await conn.db.command({ hello: 1 });
    console.log('Topology details from hello command:');
    console.log(' - isWritablePrimary:', hello.isWritablePrimary);
    console.log(' - setName (replica set name):', hello.setName || 'NONE (Standalone)');
    console.log(' - hosts:', hello.hosts || 'NONE');
    console.log(' - msg:', hello.msg || 'NONE');

    // Check replSetGetStatus
    try {
      const rsStatus = await conn.db.command({ replSetGetStatus: 1 });
      console.log(' - replSetGetStatus OK:', rsStatus.ok);
    } catch (rsErr) {
      console.log(' - replSetGetStatus failed:', rsErr.message);
    }

    // Try starting a real transaction on a temporary test DB
    console.log('\nTesting transaction support on temporary database...');
    const testConn = conn.useDb(`test_tx_check_${Date.now()}`);
    const session = await conn.startSession();
    try {
      await session.withTransaction(async () => {
        const coll = testConn.collection('tx_test');
        await coll.insertOne({ test: 1 }, { session });
      });
      console.log(' - Transaction succeeded! (Replica set active)');
    } catch (txErr) {
      console.log(' - Transaction FAILED as expected on standalone:');
      console.log('   Code:', txErr.code);
      console.log('   CodeName:', txErr.codeName);
      console.log('   Message:', txErr.message);
    } finally {
      await session.endSession();
      await testConn.dropDatabase();
    }

    await conn.close();
  } catch (err) {
    console.error('Local Mongo connection error:', err);
  }
}

checkLocalMongo();

