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

console.log('=== SERENITY INDEX DEBUG ===');

// Get all intermediate values
const drawdowns = utils.toDrawdownSeries(returns);
const cvarDD = stats.cvar(drawdowns, 1, 0.95);
const returnsMean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - returnsMean, 2), 0) / (returns.length - 1);
const returnsStd = Math.sqrt(variance);
const pitfall = -cvarDD / returnsStd;
const ulcer = stats.ulcerIndex(returns); // Don't round for intermediate calculation
const returnsSum = returns.reduce((sum, ret) => sum + ret, 0);

console.log(`Drawdowns length: ${drawdowns.length}`);
console.log(`CVaR of drawdowns: ${cvarDD}`);
console.log(`Returns mean: ${returnsMean}`);
console.log(`Returns variance: ${variance}`);
console.log(`Returns std: ${returnsStd}`);
console.log(`Pitfall: ${pitfall}`);
console.log(`Ulcer Index: ${ulcer}`);
console.log(`Returns sum: ${returnsSum}`);

const serenityJS = (returnsSum - 0) / (ulcer * pitfall);
const serenityPython = parseFloat(pythonMetrics['Serenity Index']);

console.log(`\nSerenity Index calculation:`);
console.log(`Formula: (${returnsSum} - 0) / (${ulcer} * ${pitfall})`);
console.log(`JavaScript result: ${serenityJS}`);
console.log(`Python result: ${serenityPython}`);
console.log(`Error: ${((Math.abs(serenityJS - serenityPython) / serenityPython) * 100).toFixed(2)}%`);

// Try different CVaR calculations
const sortedDrawdowns = drawdowns.slice().sort((a, b) => a - b);
const index95 = Math.floor(0.05 * sortedDrawdowns.length); // 5% worst
const tail = sortedDrawdowns.slice(0, index95);
const cvarManual = tail.reduce((sum, val) => sum + val, 0) / tail.length;

console.log(`\nCVaR debugging:`);
console.log(`Sorted drawdowns length: ${sortedDrawdowns.length}`);
console.log(`5% index: ${index95}`);
console.log(`Tail length: ${tail.length}`);
console.log(`Manual CVaR: ${cvarManual}`);
console.log(`Stats CVaR: ${cvarDD}`);

// Try different pitfall calculations
const pitfallManual = -cvarManual / returnsStd;
console.log(`Manual pitfall: ${pitfallManual}`);

const serenityManual = (returnsSum - 0) / (ulcer * pitfallManual);
console.log(`Manual serenity: ${serenityManual}`);
