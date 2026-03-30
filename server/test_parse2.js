const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.env.HOME, 'Downloads', 'tasks1.xlsx');

console.log('📂 Reading file:', filePath);

const workbook = xlsx.read(fs.readFileSync(filePath), { header: 1 });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log('\n📊 Total rows:', data.length);
console.log('\n🔍 First 5 rows with column positions:\n');

data.slice(0, 5).forEach((row, idx) => {
  console.log(`\n--- Row ${idx + 1} ---`);
  console.log(`[0] ID: ${row[0]}`);
  console.log(`[1] Symbol: ${row[1]}`);
  console.log(`[2] Title: ${row[2]}`);
  console.log(`[3] Parent: ${row[3]}`);
  console.log(`[4] Links: ${row[4]}`);
  console.log(`[5] Description: ${row[5]}`);
  console.log(`[6] Status: ${row[6]}`);
});
