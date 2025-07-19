import fs from 'fs';
import * as stats from './src/stats.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== SIMPLE PRECISION FIXES ===\n');

// The expected daily issue might be that Python rounds to 4 decimal places during calculation
console.log('=== EXPECTED DAILY PRECISION TEST ===');
const rawGeoMean = returns.reduce((prod, ret) => prod * (1 + ret), 1);
const expectedDaily = Math.pow(rawGeoMean, 1 / returns.length) - 1;

console.log(`Raw calculation: ${expectedDaily}`);
console.log(`Rounded to 4 decimals: ${Math.round(expectedDaily * 10000) / 10000}`);
console.log(`Python value: 0.0008`);

// Test different rounding approaches
const precisions = [3, 4, 5, 6, 7];
precisions.forEach(p => {
  const factor = Math.pow(10, p);
  const rounded = Math.round(expectedDaily * factor) / factor;
  console.log(`${p} decimals: ${rounded} (match Python: ${rounded === 0.0008})`);
});

// Check if the issue might be annualization
console.log('\n=== ANNUALIZATION CHECK ===');
const annualized = Math.pow(1 + expectedDaily, 252) - 1;
console.log(`Annualized: ${annualized}`);
console.log(`De-annualized back: ${Math.pow(1 + annualized, 1/252) - 1}`);

// Check if the issue is period-based calculation
console.log('\n=== PERIOD-BASED CHECK ===');
// Try using only specific periods or subsets
const tradingDays = returns.length;
console.log(`Trading days: ${tradingDays}`);
console.log(`If we use 252 instead: ${Math.pow(rawGeoMean, 1 / 252) - 1}`);
console.log(`If we use 365 instead: ${Math.pow(rawGeoMean, 1 / 365) - 1}`);

// Check if we should be using a different base calculation
console.log('\n=== AVERAGE VS GEOMETRIC ===');
const simpleAvg = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
console.log(`Simple average: ${simpleAvg}`);
console.log(`Geometric mean: ${expectedDaily}`);

// Test if Python might be using aggregate_returns differently
console.log('\n=== AGGREGATE BEHAVIOR TEST ===');
console.log(`All daily returns count: ${returns.length}`);
console.log(`Sum of returns: ${returns.reduce((sum, ret) => sum + ret, 0)}`);
console.log(`First return: ${returns[0]}`);
console.log(`Last return: ${returns[returns.length - 1]}`);

// Maybe Python is doing something with nan handling?
const nonNanReturns = returns.filter(ret => !isNaN(ret) && isFinite(ret));
console.log(`Non-NaN returns count: ${nonNanReturns.length}`);
if (nonNanReturns.length !== returns.length) {
  const cleanGeoMean = nonNanReturns.reduce((prod, ret) => prod * (1 + ret), 1);
  const cleanExpected = Math.pow(cleanGeoMean, 1 / nonNanReturns.length) - 1;
  console.log(`Clean geometric mean: ${cleanExpected}`);
}
