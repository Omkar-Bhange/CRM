const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/attendance_schema_info.json', 'utf8'));
const s1 = data.Attendance;
const s2 = data.AttendanceV2;

const p1 = Object.keys(s1.paths);
const p2 = Object.keys(s2.paths);

const common = p1.filter(p => p2.includes(p));
const exclusive1 = p1.filter(p => !p2.includes(p));
const exclusive2 = p2.filter(p => !p1.includes(p));

console.log('=== COMMON FIELDS (' + common.length + ') ===');
console.log(common.join(', '));

console.log('\n=== EXCLUSIVE TO ATTENDANCE V1 (' + exclusive1.length + ') ===');
console.log(exclusive1.join(', ') || 'None');

console.log('\n=== EXCLUSIVE TO ATTENDANCE V2 (' + exclusive2.length + ') ===');
console.log(exclusive2.join(', '));

console.log('\n=== SAME-NAME FIELD CONFLICTS / DIFFERENCES ===');
common.forEach(f => {
  const f1 = s1.paths[f];
  const f2 = s2.paths[f];
  const diffs = [];
  if (f1.instance !== f2.instance) diffs.push('Type: V1=' + f1.instance + ' vs V2=' + f2.instance);
  if (f1.required !== f2.required) diffs.push('Required: V1=' + f1.required + ' vs V2=' + f2.required);
  if (f1.default !== f2.default) diffs.push('Default: V1=' + f1.default + ' vs V2=' + f2.default);
  if (JSON.stringify(f1.enumValues) !== JSON.stringify(f2.enumValues)) diffs.push('Enum: V1=' + JSON.stringify(f1.enumValues) + ' vs V2=' + JSON.stringify(f2.enumValues));
  if (f1.index !== f2.index) diffs.push('Field-Index: V1=' + f1.index + ' vs V2=' + f2.index);
  if (f1.ref !== f2.ref) diffs.push('Ref: V1=' + f1.ref + ' vs V2=' + f2.ref);
  if (diffs.length > 0) {
    console.log('- ' + f + ': ' + diffs.join('; '));
  }
});

console.log('\n=== INDEX COMPARISON ===');
console.log('Attendance V1 indexes:');
console.log(JSON.stringify(s1.indexes, null, 2));
console.log('Attendance V2 indexes:');
console.log(JSON.stringify(s2.indexes, null, 2));

console.log('\n=== OPTIONS ===');
console.log('V1 options:', s1.options);
console.log('V2 options:', s2.options);

