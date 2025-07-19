import fs from 'fs';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const dates = rawData.dates.map(dateStr => new Date(dateStr));

console.log('=== DECEMBER 1ST DEBUG ===');

// Check index 343 specifically
const problemDate = dates[343];
console.log(`Index 343 date: ${problemDate}`);
console.log(`ISO string: ${problemDate.toISOString()}`);
console.log(`getFullYear(): ${problemDate.getFullYear()}`);
console.log(`getMonth(): ${problemDate.getMonth()}`);
console.log(`getDate(): ${problemDate.getDate()}`);

// Check the month key generation
const monthKey = `${problemDate.getFullYear()}-${String(problemDate.getMonth() + 1).padStart(2, '0')}`;
console.log(`Generated monthKey: ${monthKey}`);

// Check the original string
console.log(`Original date string: ${rawData.dates[343]}`);
console.log(`Parsed as Date: ${new Date(rawData.dates[343])}`);

// Compare with index 344
const nextDate = dates[344];
console.log(`\nIndex 344 date: ${nextDate}`);
console.log(`ISO string: ${nextDate.toISOString()}`);
console.log(`getFullYear(): ${nextDate.getFullYear()}`);
console.log(`getMonth(): ${nextDate.getMonth()}`);
console.log(`getDate(): ${nextDate.getDate()}`);

const nextMonthKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
console.log(`Generated monthKey: ${nextMonthKey}`);
console.log(`Original date string: ${rawData.dates[344]}`);

// Check if it's a timezone issue
console.log(`\n=== TIMEZONE CHECK ===`);
console.log(`Dec 1 UTC: ${problemDate.toUTCString()}`);
console.log(`Dec 1 Local: ${problemDate.toLocaleDateString()}`);
console.log(`Dec 4 UTC: ${nextDate.toUTCString()}`);
console.log(`Dec 4 Local: ${nextDate.toLocaleDateString()}`);

// Test the month calculation directly
console.log(`\n=== MONTH CALCULATION TEST ===`);
const testDate1 = new Date('2023-12-01');
const testDate2 = new Date('2023-12-01T00:00:00Z');
const testDate3 = new Date('2023-12-01T00:00:00.000Z');

console.log(`new Date('2023-12-01'): ${testDate1} -> month ${testDate1.getMonth()}`);
console.log(`new Date('2023-12-01T00:00:00Z'): ${testDate2} -> month ${testDate2.getMonth()}`);
console.log(`new Date('2023-12-01T00:00:00.000Z'): ${testDate3} -> month ${testDate3.getMonth()}`);

// Also test our actual raw date
const rawDateStr = rawData.dates[343];
const rawDateParsed = new Date(rawDateStr);
console.log(`Raw date '${rawDateStr}' -> ${rawDateParsed} -> month ${rawDateParsed.getMonth()}`);

// What if we check multiple dates around the boundary?
console.log(`\n=== BOUNDARY CHECK ===`);
for (let i = 340; i < 350; i++) {
    const date = dates[i];
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    console.log(`${i}: ${rawData.dates[i]} -> ${date.toISOString().substr(0, 10)} -> ${monthKey}`);
}
