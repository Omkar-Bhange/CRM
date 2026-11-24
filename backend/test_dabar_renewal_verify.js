require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const assert = require('assert');

async function verifyDabarRenewal() {
  await mongoose.connect(process.env.MONGO_URI);
  const AmcContract = require('./models/AmcContract');
  const AmcInvoice = require('./models/AmcInvoice');

  const contract = await AmcContract.findById('6a609e76b5327b558d99149d');
  assert(contract, 'DABAR ERP contract exists');

  console.log('Testing DABAR contract renewal query logic...');
  console.log('Contract:', contract.contractCode, 'expiry:', contract.expiryDate, 'currentInvoiceId:', contract.currentInvoiceId);

  // Test 1: newStartDate is 2026-10-25 (same day as contract expiry)
  const newStartDateA = new Date('2026-10-25T00:00:00.000Z');
  const newExpiryDateA = new Date('2027-10-24T00:00:00.000Z');

  const overlapQueryA = {
    amcContractId: contract._id,
    isDeleted: false,
    status: { $in: ["Issued", "Draft"] },
    contractStartDate: { $lt: newExpiryDateA },
    contractExpiryDate: { $gt: newStartDateA },
  };

  if (contract.currentInvoiceId && contract.expiryDate) {
    const priorExpiry = new Date(contract.expiryDate);
    const boundaryTolerance = new Date(priorExpiry);
    boundaryTolerance.setDate(boundaryTolerance.getDate() - 1);

    if (newStartDateA >= boundaryTolerance) {
      overlapQueryA._id = { $ne: contract.currentInvoiceId };
    }
  }

  const overlapA = await AmcInvoice.findOne(overlapQueryA);
  console.log('Overlap result for 2026-10-25 to 2027-10-24:', overlapA ? overlapA.invoiceCode : 'NONE (Success)');
  assert(!overlapA, '2026-10-25 should NOT collide with existing expired invoice');

  // Test 2: newStartDate is 2026-10-26 (standard day after expiry)
  const newStartDateB = new Date('2026-10-26T00:00:00.000Z');
  const newExpiryDateB = new Date('2027-10-25T00:00:00.000Z');

  const overlapQueryB = {
    amcContractId: contract._id,
    isDeleted: false,
    status: { $in: ["Issued", "Draft"] },
    contractStartDate: { $lt: newExpiryDateB },
    contractExpiryDate: { $gt: newStartDateB },
  };

  if (contract.currentInvoiceId && contract.expiryDate) {
    const priorExpiry = new Date(contract.expiryDate);
    const boundaryTolerance = new Date(priorExpiry);
    boundaryTolerance.setDate(boundaryTolerance.getDate() - 1);

    if (newStartDateB >= boundaryTolerance) {
      overlapQueryB._id = { $ne: contract.currentInvoiceId };
    }
  }

  const overlapB = await AmcInvoice.findOne(overlapQueryB);
  console.log('Overlap result for 2026-10-26 to 2027-10-25:', overlapB ? overlapB.invoiceCode : 'NONE (Success)');
  assert(!overlapB, '2026-10-26 should NOT collide with existing expired invoice');

  console.log('✅ DABAR renewal query verification PASSED!');
  process.exit(0);
}

verifyDabarRenewal().catch(err => {
  console.error('❌ DABAR renewal verification FAILED:', err);
  process.exit(1);
});
