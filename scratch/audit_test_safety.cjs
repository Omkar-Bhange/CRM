const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '../backend');
const testFiles = fs.readdirSync(backendDir).filter(f => f.startsWith('test_') || f.startsWith('verify_'));

console.log(`Auditing ${testFiles.length} test/verify files for database safety...\n`);

const audit = [];

for (const file of testFiles) {
  const content = fs.readFileSync(path.join(backendDir, file), 'utf8');

  const connectsToDb = content.includes('mongoose.connect(');
  const usesAtlasOrEnv = /process\.env\.MONGODB_URI|process\.env\.MONGO_URI/.test(content);
  const testDbPattern = /TEST_URI|127\.0\.0\.1:27017|localhost:27017|test_db|crm_isolated/i.test(content);
  const dropsDb = content.includes('dropDatabase()');
  const modifiesData = /create\(|save\(|update|delete|insert/i.test(content);

  // Check for external communications
  const sendsEmail = /nodemailer|sendEmail|sendGrid|transporter/i.test(content);
  const sendsSms = /twilio|fast2sms|sendSms/i.test(content);
  const sendsWhatsapp = /whatsapp/i.test(content);

  // Check connection URI details
  let uriDetails = 'OFFLINE (No DB connection)';
  if (connectsToDb) {
    const match = content.match(/mongoose\.connect\(([^)]+)\)/);
    uriDetails = match ? match[1].trim() : 'CONNECTED';
  }

  audit.push({
    file,
    connectsToDb,
    uriDetails,
    usesAtlasOrEnv,
    testDbPattern,
    dropsDb,
    isOffline: !connectsToDb,
    externalCalls: sendsEmail || sendsSms
  });
}

console.log("=== TEST SAFETY AUDIT RESULTS ===");
for (const a of audit) {
  console.log(`File: ${a.file}`);
  console.log(`  - DB Connection: ${a.connectsToDb ? 'YES -> ' + a.uriDetails : 'NO (100% Offline / In-Memory Schema)'}`);
  console.log(`  - Uses Atlas/Production URI: ${a.usesAtlasOrEnv ? 'WARNING: YES' : 'NO'}`);
  console.log(`  - Isolated Temporary DB: ${a.testDbPattern ? 'YES' : 'N/A'}`);
  console.log(`  - Drops Temp DB in Teardown: ${a.dropsDb ? 'YES' : 'N/A'}`);
  console.log(`  - External Communications (SMS/Email): ${a.externalCalls ? 'WARNING: YES' : 'NONE'}`);
}

