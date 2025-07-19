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

console.log('=== DECEMBER 2023 MONTH DEBUG ===');

// Find December 2023 data (the best month according to our previous debug)
const decemberStart = new Date('2023-12-01');
const decemberEnd = new Date('2023-12-31');

let decemberReturns = [];
let decemberDates = [];
let decemberIndices = [];

for (let i = 0; i < returns.length; i++) {
    const date = dates[i];
    if (date >= decemberStart && date <= decemberEnd) {
        decemberReturns.push(returns[i]);
        decemberDates.push(date);
        decemberIndices.push(i);
    }
}

console.log(`December 2023 found: ${decemberReturns.length} days`);
console.log(`First date: ${decemberDates[0].toISOString().substr(0, 10)}`);
console.log(`Last date: ${decemberDates[decemberDates.length-1].toISOString().substr(0, 10)}`);

// Calculate December returns using different methods
const decemberCompounded = decemberReturns.reduce((prod, ret) => prod * (1 + ret), 1) - 1;
const decemberSum = decemberReturns.reduce((sum, ret) => sum + ret, 0);

console.log(`December 2023 compounded: ${decemberCompounded}`);
console.log(`December 2023 sum: ${decemberSum}`);

// Compare with Python's expected value
const pythonBest = parseFloat(pythonMetrics['Best Month'].replace('%', '')) / 100;
console.log(`Python best: ${pythonBest}`);
console.log(`December compounded error: ${Math.abs((decemberCompounded - pythonBest) / pythonBest * 100).toFixed(2)}%`);
console.log(`December sum error: ${Math.abs((decemberSum - pythonBest) / pythonBest * 100).toFixed(2)}%`);

// Let's manually check the month grouping logic
console.log(`\n=== MONTH GROUPING ANALYSIS ===`);
const monthGroups = new Map();

for (let i = 0; i < returns.length; i++) {
    const date = dates[i];
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, []);
    }
    monthGroups.get(monthKey).push({
        return: returns[i],
        date: date.toISOString().substr(0, 10),
        index: i
    });
}

// Show all months and find the best one
const sortedMonths = Array.from(monthGroups.keys()).sort();
console.log(`\nFound ${sortedMonths.length} months:`);

let bestCompounded = -999;
let bestSum = -999;
let bestCompoundedMonth = '';
let bestSumMonth = '';

sortedMonths.forEach((monthKey) => {
    const monthData = monthGroups.get(monthKey);
    const compounded = monthData.reduce((prod, item) => prod * (1 + item.return), 1) - 1;
    const sum = monthData.reduce((sum, item) => sum + item.return, 0);
    
    if (compounded > bestCompounded) {
        bestCompounded = compounded;
        bestCompoundedMonth = monthKey;
    }
    
    if (sum > bestSum) {
        bestSum = sum;
        bestSumMonth = monthKey;
    }
    
    console.log(`${monthKey}: ${monthData.length} days, Comp: ${compounded.toFixed(6)}, Sum: ${sum.toFixed(6)}`);
});

console.log(`\nBest compounded month: ${bestCompoundedMonth} with ${bestCompounded.toFixed(6)}`);
console.log(`Best sum month: ${bestSumMonth} with ${bestSum.toFixed(6)}`);
console.log(`Python expects: ${pythonBest.toFixed(6)}`);

console.log(`\nErrors:`);
console.log(`Best compounded vs Python: ${Math.abs((bestCompounded - pythonBest) / pythonBest * 100).toFixed(2)}%`);
console.log(`Best sum vs Python: ${Math.abs((bestSum - pythonBest) / pythonBest * 100).toFixed(2)}%`);

// Check what our monthlyReturns function produces vs manual calculation
const monthlyRetsCompounded = stats.monthlyReturns(returns, false, dates, true);
const monthlyRetsSum = stats.monthlyReturns(returns, false, dates, false);

const jsMaxCompounded = Math.max(...monthlyRetsCompounded);
const jsMaxSum = Math.max(...monthlyRetsSum);

console.log(`\nJS monthlyReturns function:`);
console.log(`Max compounded: ${jsMaxCompounded.toFixed(6)}`);
console.log(`Max sum: ${jsMaxSum.toFixed(6)}`);

console.log(`\nManual vs Function match:`);
console.log(`Compounded match: ${Math.abs(bestCompounded - jsMaxCompounded) < 1e-10}`);
console.log(`Sum match: ${Math.abs(bestSum - jsMaxSum) < 1e-10}`);
