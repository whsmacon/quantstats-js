import fs from 'fs';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;
const dates = rawData.dates.map(dateStr => new Date(dateStr));

console.log('=== DATE INVESTIGATION ===');

// Find all December 2023 dates
console.log('All December 2023 dates in data:');
for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (date.getFullYear() === 2023 && date.getMonth() === 11) { // December is month 11
        console.log(`${i}: ${date.toISOString().substr(0, 10)} -> ${returns[i]}`);
    }
}

// Check the specific date ranges
const decemberStart = new Date('2023-12-01');
const decemberEnd = new Date('2023-12-31');

console.log('\nUsing date range filter (>= 2023-12-01 and <= 2023-12-31):');
for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (date >= decemberStart && date <= decemberEnd) {
        console.log(`${i}: ${date.toISOString().substr(0, 10)} -> ${returns[i]}`);
    }
}

// Check what the month grouping is doing
console.log('\nMonth grouping (using getMonth() === 11 and getFullYear() === 2023):');
for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthKey === '2023-12') {
        console.log(`${i}: ${date.toISOString().substr(0, 10)} (monthKey: ${monthKey}) -> ${returns[i]}`);
    }
}

// Find the missing day
console.log('\nLooking for 2023-12-30:');
for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (date.toISOString().substr(0, 10) === '2023-12-30') {
        console.log(`Found 2023-12-30 at index ${i}: ${returns[i]}`);
    }
}

// Calculate both ways
let manualCompounded = 1;
let groupingCompounded = 1;

// Manual way (range filter)
for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (date >= decemberStart && date <= decemberEnd) {
        manualCompounded *= (1 + returns[i]);
    }
}
manualCompounded -= 1;

// Grouping way
for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthKey === '2023-12') {
        groupingCompounded *= (1 + returns[i]);
    }
}
groupingCompounded -= 1;

console.log(`\nResults:`);
console.log(`Manual compounded (range filter): ${manualCompounded}`);
console.log(`Grouping compounded (monthKey): ${groupingCompounded}`);
console.log(`Difference: ${Math.abs(manualCompounded - groupingCompounded)}`);
