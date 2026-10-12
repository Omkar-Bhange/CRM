const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const collections = ['clients', 'amccontracts', 'amcinvoices', 'amcpayments', 'productsales', 'productsalepayments', 'idempotencylogs', 'activitylogs'];
  let totalFound = 0;
  for (const c of collections) {
    const count = await mongoose.connection.collection(c).countDocuments({
      $or: [
        { clientCode: { $regex: 'TEST_ISSUE7', $options: 'i' } },
        { contractCode: { $regex: 'TEST_ISSUE7', $options: 'i' } },
        { invoiceCode: { $regex: 'TEST_ISSUE7', $options: 'i' } },
        { saleCode: { $regex: 'TEST_ISSUE7', $options: 'i' } },
        { idempotencyKey: { $regex: 'TEST_ISSUE7', $options: 'i' } },
        { entityCode: { $regex: 'TEST_ISSUE7', $options: 'i' } },
      ]
    });
    console.log(c + ':', count);
    totalFound += count;
  }
  console.log('Total TEST_ISSUE7 artifacts remaining:', totalFound);
  await mongoose.disconnect();
})();
