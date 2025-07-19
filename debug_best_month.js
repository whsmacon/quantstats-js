import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;
const dates = rawData.dates.map(dateStr => new Date(dateStr));

// Load Python results
let pythonContent = fs.readFileSync('python_quantstats_results.json', 'utf8');
pythonContent = pythonContent.replace(/NaN/g, 'null');
const pythonResults = JSON.parse(pythonContent);
const pythonMetrics = pythonResults[0].metrics;

console.log('=== BEST MONTH DEBUG ===');

// Get monthly returns with different methods
const monthlyRets1 = stats.monthlyReturns(returns, false, dates, true);  // Current method (compounded)
const monthlyRets2 = stats.monthlyReturns(returns, false, dates, false); // Non-compounded
const monthlyRets3 = utils.resampleMonthlySum(returns, dates);           // Direct sum method

console.log(`Monthly returns (compounded): ${monthlyRets1.length} months`);
console.log(`Monthly returns (sum): ${monthlyRets2.length} months`);
console.log(`Monthly returns (utils): ${monthlyRets3.length} months`);

const jsBest1 = stats.best(monthlyRets1);
const jsBest2 = stats.best(monthlyRets2);
const jsBest3 = Math.max(...monthlyRets3);

const pythonBest = parseFloat(pythonMetrics['Best Month'].replace('%', '')) / 100;

console.log(`\nBest Month Results:`);
console.log(`JS (compounded): ${jsBest1}`);
console.log(`JS (sum): ${jsBest2}`);
console.log(`JS (utils): ${jsBest3}`);
console.log(`Python: ${pythonBest}`);

console.log(`\nErrors:`);
console.log(`Compounded error: ${((Math.abs(jsBest1 - pythonBest) / pythonBest) * 100).toFixed(2)}%`);
console.log(`Sum error: ${((Math.abs(jsBest2 - pythonBest) / pythonBest) * 100).toFixed(2)}%`);
console.log(`Utils error: ${((Math.abs(jsBest3 - pythonBest) / pythonBest) * 100).toFixed(2)}%`);

// Find which monthly return is the best
console.log(`\nDetailed analysis:`);
const maxIndex1 = monthlyRets1.indexOf(jsBest1);
const maxIndex2 = monthlyRets2.indexOf(jsBest2);

console.log(`Best month (compounded) at index ${maxIndex1}: ${jsBest1}`);
console.log(`Best month (sum) at index ${maxIndex2}: ${jsBest2}`);

// Show first few monthly returns for comparison
console.log(`\nFirst 10 monthly returns (compounded): ${monthlyRets1.slice(0, 10)}`);
console.log(`First 10 monthly returns (sum): ${monthlyRets2.slice(0, 10)}`);
console.log(`First 10 monthly returns (utils): ${monthlyRets3.slice(0, 10)}`);

// Find the month with the highest return for each method
console.log(`\nHighest values:`);
console.log(`Compounded max: ${Math.max(...monthlyRets1)} at index ${monthlyRets1.indexOf(Math.max(...monthlyRets1))}`);
console.log(`Sum max: ${Math.max(...monthlyRets2)} at index ${monthlyRets2.indexOf(Math.max(...monthlyRets2))}`);
console.log(`Utils max: ${Math.max(...monthlyRets3)} at index ${monthlyRets3.indexOf(Math.max(...monthlyRets3))}`);

// Check if they're finding the same month
if (maxIndex1 !== maxIndex2) {
  console.log(`\nDifferent months found! Compounded: ${maxIndex1}, Sum: ${maxIndex2}`);
  console.log(`Month ${maxIndex1} compounded: ${monthlyRets1[maxIndex1]}, sum: ${monthlyRets2[maxIndex1] || 'N/A'}`);
  console.log(`Month ${maxIndex2} compounded: ${monthlyRets1[maxIndex2] || 'N/A'}, sum: ${monthlyRets2[maxIndex2]}`);
}

// Helper function
function parsePercent(str) {
  return parseFloat(str.replace('%', '')) / 100;
}

console.log('\n=== BEST MONTH DETAILED DEBUG ===');

const monthlyRets = stats.monthlyReturns(returns, false, dates, true);
const jsBestMonth = stats.best(monthlyRets);
const pythonBestMonth = parsePercent(pythonMetrics['Best Month']);

console.log(`JavaScript Best Month: ${jsBestMonth}`);
console.log(`Python Best Month: ${pythonBestMonth}`);
console.log(`Error: ${((Math.abs(jsBestMonth - pythonBestMonth) / pythonBestMonth) * 100).toFixed(2)}%`);

console.log(`\nMonthly returns analysis:`);
console.log(`Count: ${monthlyRets.length}`);
console.log(`Max value: ${Math.max(...monthlyRets)}`);

// Check different decimal precision to see if it's a rounding issue
console.log(`\nPrecision analysis:`);
for (let precision = 1; precision <= 6; precision++) {
  const factor = Math.pow(10, precision);
  const jsRounded = Math.round(jsBestMonth * factor) / factor;
  const pythonRounded = Math.round(pythonBestMonth * factor) / factor;
  const match = jsRounded === pythonRounded;
  console.log(`${precision} decimals - JS: ${jsRounded}, Python: ${pythonRounded}, Match: ${match}`);
}

// Check if the issue is 0.298104 vs 0.2898 - looks like a rounding to 4 decimals
const jsTo4Decimals = Math.round(jsBestMonth * 10000) / 10000;
const pythonTo4Decimals = Math.round(pythonBestMonth * 10000) / 10000;
console.log(`\nJS to 4 decimals: ${jsTo4Decimals}`);
console.log(`Python is: ${pythonBestMonth}`);
console.log(`Difference suggests Python might round during calculation`);

console.log(`\nFirst few monthly returns to check aggregation:`);
monthlyRets.slice(0, 10).forEach((ret, i) => {
  console.log(`Month ${i+1}: ${ret.toFixed(8)}`);
});
