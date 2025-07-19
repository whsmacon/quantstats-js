import fs from 'fs';
import * as stats from './src/stats.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;
const dates = rawData.dates.map(dateStr => new Date(dateStr));

console.log('=== DECEMBER 2023 DEBUG ===');

// Group returns by month manually like Python does
const monthlyGroups = new Map();

for (let i = 0; i < returns.length; i++) {
  const date = dates[i];
  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  
  if (!monthlyGroups.has(monthKey)) {
    monthlyGroups.set(monthKey, {
      returns: [],
      indices: [],
      dates: []
    });
  }
  
  monthlyGroups.get(monthKey).returns.push(returns[i]);
  monthlyGroups.get(monthKey).indices.push(i);
  monthlyGroups.get(monthKey).dates.push(dates[i].toISOString().split('T')[0]);
}

// Find December 2023
const dec2023 = monthlyGroups.get('2023-12');
if (dec2023) {
  console.log(`December 2023 data:`);
  console.log(`Days: ${dec2023.returns.length}`);
  console.log(`Date range: ${dec2023.dates[0]} to ${dec2023.dates[dec2023.dates.length-1]}`);
  console.log(`Daily returns:`, dec2023.returns);
  
  // Calculate compounded return
  let compounded = 1;
  for (const ret of dec2023.returns) {
    compounded *= (1 + ret);
  }
  const compoundedReturn = compounded - 1;
  
  console.log(`\nCompounded return: ${compoundedReturn}`);
  console.log(`Python target: 0.28982323678166`);
  console.log(`Match: ${Math.abs(compoundedReturn - 0.28982323678166) < 1e-10}`);
  console.log(`Difference: ${compoundedReturn - 0.28982323678166}`);
}

// Compare with what our monthlyReturns function gives us
const monthlyRets = stats.monthlyReturns(returns, false, dates, true);
const bestJS = stats.best(monthlyRets);

console.log(`\nOur monthlyReturns best: ${bestJS}`);
console.log(`Expected from Python recreation: 0.28982323678166`);

// Check if any other month is closer to our current result
console.log(`\nAll monthly returns from JS:`);
monthlyRets.forEach((ret, i) => {
  const monthKeys = Array.from(monthlyGroups.keys());
  console.log(`Month ${monthKeys[i]}: ${ret}`);
});

// Find which month gives us 0.2981038665685152
const targetValue = 0.2981038665685152;
let closestMonth = '';
let closestDiff = Infinity;

for (const [monthKey, data] of monthlyGroups) {
  let compounded = 1;
  for (const ret of data.returns) {
    compounded *= (1 + ret);
  }
  const monthReturn = compounded - 1;
  const diff = Math.abs(monthReturn - targetValue);
  
  if (diff < closestDiff) {
    closestDiff = diff;
    closestMonth = monthKey;
  }
  
  if (diff < 1e-10) {
    console.log(`\nFound exact match for ${targetValue} in ${monthKey}`);
    console.log(`Returns:`, data.returns);
  }
}
