const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.env.HOME, 'Downloads', 'tasks1.xlsx');

console.log('📂 Reading file:', filePath);

const workbook = xlsx.read(fs.readFileSync(filePath));
const sheetName = workbook.SheetNames[0];
console.log('📋 Sheet:', sheetName);

const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log('\n📊 Total rows:', data.length);
console.log('\n🔍 First 3 rows:\n');
data.slice(0, 3).forEach((row, idx) => {
  console.log(`\n--- Row ${idx + 1} ---`);
  console.log(JSON.stringify(row, null, 2));
});

console.log('\n📝 All column names:');
if (data.length > 0) {
  Object.keys(data[0]).forEach(col => {
    console.log(`  - "${col}"`);
  });
}
