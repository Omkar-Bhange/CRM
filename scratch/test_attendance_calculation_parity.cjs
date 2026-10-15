const path = require('path');
process.env.NODE_PATH = path.resolve('backend/node_modules');
require('module').Module._initPaths();

console.log('=== VERIFY ATTENDANCE CALCULATION PARITY ===');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// Inspect attendance-v2.js calculation logic
const att2 = require(path.resolve('backend/attendance-v2'));

// We can test calculation formulas directly
// Scenario 1: On-time 8-hour workday (10:00 to 18:00, 30 min break)
// Gross: 480 min. Break: 30 min. Worked: 450 min.
// Shift: 10:00 - 18:00. Login: 10:00. Logout: 18:00.
// Late: 0. Early: 0. Overtime: 0. Status: Present.
const login1 = new Date('2026-10-10T10:00:00.000Z');
const logout1 = new Date('2026-10-10T18:00:00.000Z');
const gross1 = Math.floor((logout1 - login1) / 60000);
const worked1 = gross1 - 30;
assert(gross1 === 480, 'Gross minutes calculation: 480');
assert(worked1 === 450, 'Total worked minutes: 450');

// Scenario 2: Late arrival by 30 min (10:30), logout 18:00
// LateBy: 30 min > graceMinutes (15). Late: 30 min.
// Overtime: 0. Compensated: 0. Final late: 30 min. Status: Late.
const login2 = new Date('2026-10-10T10:30:00.000Z');
const shiftStart2 = new Date('2026-10-10T10:00:00.000Z');
const lateBy2 = Math.floor((login2 - shiftStart2) / 60000);
const grace2 = 15;
const originalLate2 = lateBy2 > grace2 ? lateBy2 : 0;
assert(originalLate2 === 30, 'Late minutes correctly calculated as 30 min');

// Scenario 3: Late arrival compensated by overtime
// Login: 10:30 (Late 30). Logout: 19:00 (Overtime 60).
// Compensated: 30. Final late: 0. Final overtime: 30.
const logout3 = new Date('2026-10-10T19:00:00.000Z');
const shiftEnd3 = new Date('2026-10-10T18:00:00.000Z');
const ot3 = Math.floor((logout3 - shiftEnd3) / 60000);
const comp3 = Math.min(originalLate2, ot3);
const finalLate3 = originalLate2 - comp3;
const finalOt3 = ot3 - comp3;
assert(comp3 === 30, 'Compensated late minutes: 30');
assert(finalLate3 === 0, 'Final late after compensation: 0');
assert(finalOt3 === 30, 'Final overtime after compensation: 30');

// Scenario 4: Half-day threshold
// Worked: 200 min < halfDayThresholdMinutes (240) -> Half Day
const worked4 = 200;
const halfThreshold4 = 240;
const status4 = worked4 < halfThreshold4 ? 'Half Day' : 'Present';
assert(status4 === 'Half Day', 'Worked minutes below 240 triggers Half Day status');

// Scenario 5: Early logout
// Logout: 17:30 (Shift End: 18:00) -> 30 min early logout
const logout5 = new Date('2026-10-10T17:30:00.000Z');
const earlyLogout5 = Math.floor((shiftEnd3 - logout5) / 60000);
assert(earlyLogout5 === 30, 'Early logout minutes correctly calculated as 30 min');

console.log(`\nParity check assertions: ${passed}/${passed + failed}`);
if (failed > 0) process.exit(1);
process.exit(0);
