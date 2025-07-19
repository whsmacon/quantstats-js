import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

// Load Python results
let pythonContent = fs.readFileSync('python_quantstats_results.json', 'utf8');
pythonContent = pythonContent.replace(/NaN/g, 'null');
const pythonResults = JSON.parse(pythonContent);
const pythonMetrics = pythonResults[0].metrics;

console.log('=== DEBUGGING SPECIFIC METRICS ===\n');

// Focus on Expected Daily
console.log('--- Expected Daily Debug ---');
const jsExpectedDaily = stats.expectedReturn(returns, null, true);
const pythonExpectedDaily = parseFloat(pythonMetrics['Expected Daily'].replace('%', '')) / 100;
console.log(`JS Expected Daily: ${jsExpectedDaily}`);
console.log(`Python Expected Daily: ${pythonExpectedDaily}`);
console.log(`Ratio: ${jsExpectedDaily / pythonExpectedDaily}`);

// Focus on Expected Monthly
console.log('\n--- Expected Monthly Debug ---');
const jsExpectedMonthly = stats.expectedMonthlyReturn(returns, true);
const pythonExpectedMonthly = parseFloat(pythonMetrics['Expected Monthly'].replace('%', '')) / 100;
console.log(`JS Expected Monthly: ${jsExpectedMonthly}`);
console.log(`Python Expected Monthly: ${pythonExpectedMonthly}`);
console.log(`Ratio: ${jsExpectedMonthly / pythonExpectedMonthly}`);

// Focus on Monthly returns aggregation
console.log('\n--- Monthly Returns Aggregation Debug ---');
const monthlyReturns = utils.aggregateReturns(returns, 'M', true);
console.log(`Monthly returns count: ${monthlyReturns.length}`);
console.log(`First 5 monthly returns: ${monthlyReturns.slice(0, 5).map(r => r.toFixed(6)).join(', ')}`);
console.log(`Last 5 monthly returns: ${monthlyReturns.slice(-5).map(r => r.toFixed(6)).join(', ')}`);

// Check simple average vs geometric mean
const simpleAvg = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
console.log(`\n--- Simple vs Geometric Averages ---`);
console.log(`Simple average daily: ${simpleAvg}`);
console.log(`Geometric average daily: ${jsExpectedDaily}`);
console.log(`Annual simple: ${simpleAvg * 252}`);
console.log(`Annual geometric: ${Math.pow(1 + jsExpectedDaily, 252) - 1}`);
