import fs from 'fs';
import * as stats from './src/stats.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;
const dates = rawData.dates.map(dateStr => new Date(dateStr));

// Load Python results
let pythonContent = fs.readFileSync('python_quantstats_results.json', 'utf8');
pythonContent = pythonContent.replace(/NaN/g, 'null');
const pythonResults = JSON.parse(pythonContent);
const pythonMetrics = pythonResults[0].metrics;

console.log('=== BEST MONTH PYTHON VERIFICATION ===');

// Test both compounded and non-compounded methods
const monthlyRetsCompounded = stats.monthlyReturns(returns, false, dates, true);  // compounded=True
const monthlyRetsSum = stats.monthlyReturns(returns, false, dates, false);        // compounded=False

const jsBestCompounded = stats.best(monthlyRetsCompounded);
const jsBestSum = stats.best(monthlyRetsSum);

const pythonBest = parseFloat(pythonMetrics['Best Month'].replace('%', '')) / 100;

console.log(`Python Best Month: ${pythonBest} (${pythonMetrics['Best Month']})`);
console.log(`JS Compounded: ${jsBestCompounded}`);
console.log(`JS Sum: ${jsBestSum}`);

console.log(`\nCompounded error: ${((Math.abs(jsBestCompounded - pythonBest) / pythonBest) * 100).toFixed(2)}%`);
console.log(`Sum error: ${((Math.abs(jsBestSum - pythonBest) / pythonBest) * 100).toFixed(2)}%`);

// Let's also check if there's any rounding happening
const roundedCompounded4 = Math.round(jsBestCompounded * 10000) / 10000;
const roundedCompounded3 = Math.round(jsBestCompounded * 1000) / 1000;

console.log(`\nRounding tests for compounded method:`);
console.log(`Original: ${jsBestCompounded}`);
console.log(`4 decimals: ${roundedCompounded4}, error: ${((Math.abs(roundedCompounded4 - pythonBest) / pythonBest) * 100).toFixed(2)}%`);
console.log(`3 decimals: ${roundedCompounded3}, error: ${((Math.abs(roundedCompounded3 - pythonBest) / pythonBest) * 100).toFixed(2)}%`);

// Check the exact values by showing more precision
console.log(`\nHigh precision comparison:`);
console.log(`Python: ${pythonBest.toFixed(10)}`);
console.log(`JS Compounded: ${jsBestCompounded.toFixed(10)}`);
console.log(`JS Sum: ${jsBestSum.toFixed(10)}`);

// Let's also manually verify the Python calculation logic by checking the best month data
const bestIndexCompounded = monthlyRetsCompounded.indexOf(jsBestCompounded);
const bestIndexSum = monthlyRetsSum.indexOf(jsBestSum);

console.log(`\nBest month analysis:`);
console.log(`Compounded method finds best at index ${bestIndexCompounded}: ${monthlyRetsCompounded[bestIndexCompounded]}`);
console.log(`Sum method finds best at index ${bestIndexSum}: ${monthlyRetsSum[bestIndexSum]}`);

// Show the actual target value we need to match
const targetForMatch = 0.2898;  // 28.98% / 100
console.log(`\nTarget value to match: ${targetForMatch}`);
console.log(`Difference from compounded: ${Math.abs(jsBestCompounded - targetForMatch)}`);
console.log(`Difference from sum: ${Math.abs(jsBestSum - targetForMatch)}`);
