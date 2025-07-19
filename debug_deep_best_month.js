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

console.log('=== BEST MONTH DEEP ANALYSIS ===');

const monthlyRets = stats.monthlyReturns(returns, false, dates, true);
const bestMonthValue = stats.best(monthlyRets);
const bestMonthIndex = monthlyRets.indexOf(bestMonthValue);

console.log(`Best month is index ${bestMonthIndex} with value: ${bestMonthValue}`);
console.log(`Python says best month is: ${parseFloat(pythonMetrics['Best Month'].replace('%', '')) / 100}`);

// Find the date range for this month
let monthStartIdx = 0;
let monthEndIdx = 0;

// Calculate cumulative indices to find which daily returns belong to this month
let cumulativeMonths = 0;
let currentMonth = dates[0].getMonth();
let currentYear = dates[0].getFullYear();

for (let i = 0; i < returns.length; i++) {
    const date = dates[i];
    const month = date.getMonth();
    const year = date.getFullYear();
    
    if (month !== currentMonth || year !== currentYear) {
        cumulativeMonths++;
        if (cumulativeMonths === bestMonthIndex) {
            monthStartIdx = i;
        } else if (cumulativeMonths === bestMonthIndex + 1) {
            monthEndIdx = i - 1;
            break;
        }
        currentMonth = month;
        currentYear = year;
    }
}

if (monthEndIdx === 0) monthEndIdx = returns.length - 1;

console.log(`Best month spans indices ${monthStartIdx} to ${monthEndIdx}`);
console.log(`Date range: ${dates[monthStartIdx].toISOString().substr(0, 10)} to ${dates[monthEndIdx].toISOString().substr(0, 10)}`);

// Extract the daily returns for this month
const monthDailyReturns = returns.slice(monthStartIdx, monthEndIdx + 1);
console.log(`Daily returns for best month (${monthDailyReturns.length} days):`, monthDailyReturns);

// Calculate compounded return manually
let compounded = 1;
for (const ret of monthDailyReturns) {
    compounded *= (1 + ret);
}
const manualCompounded = compounded - 1;

console.log(`Manual compounded calculation: ${manualCompounded}`);
console.log(`Monthly returns array value: ${monthlyRets[bestMonthIndex]}`);
console.log(`Match: ${Math.abs(manualCompounded - monthlyRets[bestMonthIndex]) < 1e-10}`);

// Let's also check if there's any rounding happening in Python
console.log(`\n=== ROUNDING ANALYSIS ===`);
const precisions = [2, 3, 4, 5, 6];
const pythonValue = parseFloat(pythonMetrics['Best Month'].replace('%', '')) / 100;

for (const precision of precisions) {
    const factor = Math.pow(10, precision);
    const jsRounded = Math.round(bestMonthValue * factor) / factor;
    const error = Math.abs((jsRounded - pythonValue) / pythonValue) * 100;
    console.log(`${precision} decimals: JS rounded = ${jsRounded}, error = ${error.toFixed(3)}%`);
}

// What if Python rounds the daily returns before compounding?
console.log(`\n=== ROUNDING DAILY RETURNS ANALYSIS ===`);
const roundedReturns = monthDailyReturns.map(ret => Math.round(ret * 10000) / 10000);
let roundedCompounded = 1;
for (const ret of roundedReturns) {
    roundedCompounded *= (1 + ret);
}
const roundedResult = roundedCompounded - 1;
console.log(`If daily returns rounded to 4 decimals: ${roundedResult}`);
console.log(`Error vs Python: ${Math.abs((roundedResult - pythonValue) / pythonValue) * 100}%`);
