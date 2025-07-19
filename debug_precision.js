import fs from 'fs';
import * as stats from './src/stats.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

// Load Python results
let pythonContent = fs.readFileSync('python_quantstats_results.json', 'utf8');
pythonContent = pythonContent.replace(/NaN/g, 'null');
const pythonResults = JSON.parse(pythonContent);
const pythonMetrics = pythonResults[0].metrics;

console.log('=== PRECISION DEBUGGING ===');

// Expected Daily precision analysis
console.log('\n--- Expected Daily Analysis ---');
const jsExpectedDaily = stats.expectedReturn(returns, null, true, false);
const pythonExpectedDaily = parseFloat(pythonMetrics['Expected Daily'].replace('%', '')) / 100;

console.log(`JavaScript: ${jsExpectedDaily}`);
console.log(`Python: ${pythonExpectedDaily}`);
console.log(`Difference: ${Math.abs(jsExpectedDaily - pythonExpectedDaily)}`);
console.log(`Python exact string: "${pythonMetrics['Expected Daily']}"`);

// Try different precision calculations
const product = returns.reduce((prod, ret) => prod * (1 + ret), 1);
const n = returns.length;
const geomMean = Math.pow(product, 1 / n) - 1;
const returnSum = returns.reduce((sum, ret) => sum + ret, 0);
const arithMean = returnSum / n;

console.log(`Manual geometric mean: ${geomMean}`);
console.log(`Manual arithmetic mean: ${arithMean}`);
console.log(`Product: ${product}`);
console.log(`N: ${n}`);
console.log(`1/N: ${1/n}`);

// Check if Python is rounding to a specific precision
const rounded4 = Math.round(jsExpectedDaily * 10000) / 10000;
const rounded3 = Math.round(jsExpectedDaily * 1000) / 1000;
const truncated4 = Math.trunc(jsExpectedDaily * 10000) / 10000;

console.log(`Rounded to 4 decimals: ${rounded4}`);
console.log(`Rounded to 3 decimals: ${rounded3}`);
console.log(`Truncated to 4 decimals: ${truncated4}`);

// Check if 0.0008 is exactly represented
console.log(`Exact 0.0008: ${0.0008}`);
console.log(`Is Python exactly 0.0008? ${pythonExpectedDaily === 0.0008}`);

console.log('\n--- Ulcer Index Analysis ---');
const jsUlcer = stats.ulcerIndex(returns);
const pythonUlcer = parseFloat(pythonMetrics['Ulcer Index']);

console.log(`JavaScript Ulcer: ${jsUlcer}`);
console.log(`Python Ulcer: ${pythonUlcer}`);
console.log(`Python exact string: "${pythonMetrics['Ulcer Index']}"`);

// Try the Python calculation exactly
import * as utils from './src/utils.js';
const drawdowns = utils.toDrawdownSeries(returns);
const squaredDD = drawdowns.map(dd => dd * dd);
const sumSquaredDD = squaredDD.reduce((sum, sq) => sum + sq, 0);
const ulcerManual = Math.sqrt(sumSquaredDD / (returns.length - 1));

console.log(`Manual Ulcer calculation: ${ulcerManual}`);
console.log(`Sum of squared drawdowns: ${sumSquaredDD}`);
console.log(`N-1: ${returns.length - 1}`);

// Check if 0.03 is exactly what Python shows
console.log(`Is Python exactly 0.03? ${pythonUlcer === 0.03}`);
const rounded3Ulcer = Math.round(jsUlcer * 1000) / 1000;
const rounded2Ulcer = Math.round(jsUlcer * 100) / 100;
console.log(`Rounded to 3 decimals: ${rounded3Ulcer}`);
console.log(`Rounded to 2 decimals: ${rounded2Ulcer}`);
