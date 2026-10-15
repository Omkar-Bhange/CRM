const path = require('path');
process.env.NODE_PATH = path.resolve('backend/node_modules');
require('module').Module._initPaths();
const mongoose = require('mongoose');
const assert = require('assert');

// Connection string to dedicated replica set on port 27019
const RS_URI = `mongodb://127.0.0.1:27019/crm_isolated_tx_proof_${Date.now()}?replicaSet=rsTest&directConnection=true`;

async function testRealTransactions() {
  console.log('=== REAL MULTI-DOCUMENT TRANSACTION PROOF ===');
  console.log('Connecting to dedicated replica set:', RS_URI);

  // FAIL-CLOSED SAFETY CHECKS
  assert(RS_URI.includes('127.0.0.1:27019'), 'Host must be exactly 127.0.0.1:27019');
  assert(RS_URI.includes('replicaSet=rsTest'), 'Replica set must be rsTest');
  assert(RS_URI.includes('crm_isolated_tx_'), 'Database prefix must be crm_isolated_tx_');

  const conn = await mongoose.createConnection(RS_URI, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  }).asPromise();

  // Verify server is replica set PRIMARY
  const hello = await conn.db.command({ hello: 1 });
  assert.strictEqual(hello.setName, 'rsTest', 'setName must be rsTest');
  assert.strictEqual(hello.isWritablePrimary, true, 'Must be isWritablePrimary');
  console.log('Safety check passed: Connected to rsTest PRIMARY on 127.0.0.1:27019\n');

  const collA = conn.collection('test_coll_a');
  const collB = conn.collection('test_coll_b');

  // TEST 1: SUCCESSFUL MULTI-DOCUMENT COMMIT
  console.log('--- Test 1: Successful Multi-Document Commit ---');
  const session1 = await conn.startSession();
  try {
    await session1.withTransaction(async () => {
      await collA.insertOne({ name: 'Alpha', value: 100 }, { session: session1 });
      await collB.insertOne({ name: 'Beta', value: 200 }, { session: session1 });
    });
  } finally {
    await session1.endSession();
  }

  const docA1 = await collA.findOne({ name: 'Alpha' });
  const docB1 = await collB.findOne({ name: 'Beta' });
  assert(docA1, 'Record in collA must exist after commit');
  assert(docB1, 'Record in collB must exist after commit');
  assert.strictEqual(docA1.value, 100);
  assert.strictEqual(docB1.value, 200);
  console.log('  ✓ Commit verified: Both records persisted to storage engine.');

  // TEST 2: FAILED MULTI-DOCUMENT TRANSACTION & ATOMIC ROLLBACK
  console.log('\n--- Test 2: Multi-Document Intentional Failure & Atomic Rollback ---');
  const session2 = await conn.startSession();
  let caughtError = null;
  try {
    await session2.withTransaction(async () => {
      // First insert succeeds
      await collA.insertOne({ name: 'RollbackAlpha', value: 999 }, { session: session2 });
      
      // Intentional failure before second insert commits
      throw new Error('INTENTIONAL_SIMULATED_ABORT');
      
      await collB.insertOne({ name: 'RollbackBeta', value: 888 }, { session: session2 });
    });
  } catch (err) {
    caughtError = err;
  } finally {
    await session2.endSession();
  }

  assert(caughtError, 'Transaction must throw on abort');
  assert.strictEqual(caughtError.message, 'INTENTIONAL_SIMULATED_ABORT');

  // Verify that RollbackAlpha was rolled back and DOES NOT EXIST
  const docA2 = await collA.findOne({ name: 'RollbackAlpha' });
  const docB2 = await collB.findOne({ name: 'RollbackBeta' });
  assert.strictEqual(docA2, null, 'Record in collA MUST NOT exist after rollback');
  assert.strictEqual(docB2, null, 'Record in collB MUST NOT exist after rollback');
  console.log('  ✓ Rollback verified: First insert was atomicity-reverted by MongoDB engine.');

  // CLEANUP
  await conn.dropDatabase();
  await conn.close();
  console.log('\nAll real transaction verification tests PASSED with zero mocks/monkey-patching!');
}

testRealTransactions().catch(err => {
  console.error('Real transaction proof failed:', err);
  process.exit(1);
});

