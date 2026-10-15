const path = require('path');
process.env.NODE_PATH = path.resolve('backend/node_modules');
require('module').Module._initPaths();
const mongoose = require('mongoose');

async function initReplicaSet() {
  const uri = 'mongodb://127.0.0.1:27019/admin?directConnection=true';
  console.log('Connecting to mongod on 127.0.0.1:27019...');

  const conn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: false,
  }).asPromise();

  console.log('Connected to admin database.');

  // Check hello / replSetGetStatus
  try {
    const status = await conn.db.command({ replSetGetStatus: 1 });
    console.log('Replica set already initialized. Status ok:', status.ok);
  } catch (err) {
    if (err.message.includes('no replset config has been received')) {
      console.log('Initiating replica set rsTest...');
      const initResult = await conn.db.command({
        replSetInitiate: {
          _id: 'rsTest',
          members: [{ _id: 0, host: '127.0.0.1:27019' }]
        }
      });
      console.log('replSetInitiate result:', initResult);
    } else {
      console.error('replSetGetStatus error:', err);
    }
  }

  // Wait for primary
  console.log('Waiting for node to become PRIMARY...');
  let isPrimary = false;
  for (let i = 0; i < 30; i++) {
    const hello = await conn.db.command({ hello: 1 });
    if (hello.isWritablePrimary) {
      isPrimary = true;
      console.log(`Node is PRIMARY! (Attempt ${i + 1})`);
      console.log(' - setName:', hello.setName);
      console.log(' - isWritablePrimary:', hello.isWritablePrimary);
      console.log(' - me:', hello.me);
      break;
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  if (!isPrimary) {
    throw new Error('Node did not become primary within 30 seconds');
  }

  await conn.close();
  console.log('Admin connection closed.');
}

initReplicaSet().catch(err => {
  console.error('Replica set initiation error:', err);
  process.exit(1);
});

