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

console.log('=== FIXED IMPLEMENTATION TESTS ===\n');

function parsePercent(str) {
  if (typeof str === 'string' && str.endsWith('%')) {
    return parseFloat(str.replace('%', '')) / 100;
  }
  return parseFloat(str);
}

// 1. Fix Expected Daily - use raw returns without aggregation
console.log('=== EXPECTED DAILY FIX ===');
const rawExpectedDaily = returns.reduce((prod, ret) => prod * (1 + ret), 1);
const fixedExpectedDaily = Math.pow(rawExpectedDaily, 1 / returns.length) - 1;
const pythonExpectedDaily = parsePercent(pythonMetrics['Expected Daily']);

console.log(`JavaScript (original): ${stats.expectedReturn(returns, null, true, false)}`);
console.log(`JavaScript (fixed): ${fixedExpectedDaily}`);
console.log(`Python: ${pythonExpectedDaily}`);
console.log(`Fixed Error: ${((Math.abs(fixedExpectedDaily - pythonExpectedDaily) / pythonExpectedDaily) * 100).toFixed(2)}%`);

// 2. Fix Ulcer Index - try Python approach with base price
console.log('\n=== ULCER INDEX FIX ===');
// Python approach: base + base * compsum(returns)
const base = 100000; // Default base in Python
let cumRet = 0;
const prices = [];
for (const ret of returns) {
  cumRet += ret;
  const compoundRet = Math.exp(cumRet) - 1; // This mimics compsum behavior
  prices.push(base + base * compoundRet);
}

// Calculate drawdowns Python style
const drawdownsPython = [];
let peak = prices[0];
for (const price of prices) {
  if (price > peak) peak = price;
  const dd = (price / peak) - 1.0;
  drawdownsPython.push(dd);
}

// Calculate Ulcer Index
const squaredDD = drawdownsPython.map(dd => dd * dd);
const sumSquaredDD = squaredDD.reduce((sum, sq) => sum + sq, 0);
const fixedUlcer = Math.sqrt(sumSquaredDD / (returns.length - 1));

const jsUlcer = stats.ulcerIndex(returns);
const pythonUlcer = parseFloat(pythonMetrics['Ulcer Index']);

console.log(`JavaScript (original): ${jsUlcer}`);
console.log(`JavaScript (fixed): ${fixedUlcer}`);
console.log(`Python: ${pythonUlcer}`);
console.log(`Fixed Error: ${((Math.abs(fixedUlcer - pythonUlcer) / pythonUlcer) * 100).toFixed(2)}%`);

// Let me try a simpler approach - just cumulative returns
console.log('\n=== ULCER INDEX FIX (Simple) ===');
let cumReturn = 1;
const pricesSimple = [];
for (const ret of returns) {
  cumReturn *= (1 + ret);
  pricesSimple.push(cumReturn);
}

const drawdownsSimple = [];
let peakSimple = pricesSimple[0];
for (const price of pricesSimple) {
  if (price > peakSimple) peakSimple = price;
  const dd = (price / peakSimple) - 1.0;
  drawdownsSimple.push(dd);
}

const squaredDDSimple = drawdownsSimple.map(dd => dd * dd);
const sumSquaredDDSimple = squaredDDSimple.reduce((sum, sq) => sum + sq, 0);
const fixedUlcerSimple = Math.sqrt(sumSquaredDDSimple / (returns.length - 1));

console.log(`JavaScript (simple fixed): ${fixedUlcerSimple}`);
console.log(`Simple Fixed Error: ${((Math.abs(fixedUlcerSimple - pythonUlcer) / pythonUlcer) * 100).toFixed(2)}%`);

// 3. Check our existing toDrawdownSeries
console.log('\n=== COMPARE DRAWDOWN SERIES ===');
const ourDrawdowns = utils.toDrawdownSeries(returns);
console.log(`Our drawdowns length: ${ourDrawdowns.length}`);
console.log(`Python-style drawdowns length: ${drawdownsSimple.length}`);
console.log(`Our first 5: ${ourDrawdowns.slice(0, 5)}`);
console.log(`Python-style first 5: ${drawdownsSimple.slice(0, 5)}`);
console.log(`Our sum of squares: ${ourDrawdowns.map(dd => dd*dd).reduce((a,b) => a+b, 0)}`);
console.log(`Python-style sum of squares: ${sumSquaredDDSimple}`);
