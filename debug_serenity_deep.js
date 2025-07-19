import fs from 'fs';
import * as stats from './src/stats.js';// Check CVaR calculation step by step
const sortedDrawdowns = [...drawdowns].sort((a, b) => a - b);

// Python uses empirical quantile, not parametric VaR
const quantileIndex = Math.floor(drawdowns.length * 0.05);  // 5% quantile
const var95Empirical = sortedDrawdowns[quantileIndex];
console.log('VaR (5%) parametric:', stats.valueAtRisk(drawdowns, 1, 0.95));
console.log('VaR (5%) empirical (quantile):', var95Empirical);

const belowVaR = drawdowns.filter(d => d < var95Empirical);
const cvarPython = belowVaR.reduce((sum, d) => sum + d, 0) / belowVaR.length;
const cvarOurs = stats.cvar(drawdowns);* as utils from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

// Load Python results and fix NaN values
let pythonContent = fs.readFileSync('python_quantstats_results.json', 'utf8');
pythonContent = pythonContent.replace(/NaN/g, 'null');
const pythonResults = JSON.parse(pythonContent);

// Python expects data as array
const data = returns.map(Number);

console.log('=== DETAILED SERENITY DEBUG ===');
console.log('Python Serenity Index:', pythonResults[0].metrics["Serenity Index"]);
console.log();

// Step by step calculation
const drawdowns = utils.toDrawdownSeries(data);
console.log('Drawdowns count:', drawdowns.length);
console.log('Min drawdown:', Math.min(...drawdowns));

// Calculate each component separately
const returnsSum = data.reduce((sum, ret) => sum + ret, 0);
const ulcer = stats.ulcerIndex(data);
// Calculate standard deviation manually (ddof=1)
const mean = data.reduce((sum, ret) => sum + ret, 0) / data.length;
const variance = data.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (data.length - 1);
const returnStd = Math.sqrt(variance);

const pitfall = -stats.cvar(drawdowns) / returnStd; // ddof=1

console.log('Returns sum:', returnsSum);
console.log('Ulcer Index:', ulcer);
console.log('CVaR of drawdowns:', stats.cvar(drawdowns));
console.log('Returns std (ddof=1):', returnStd);
console.log('Pitfall:', pitfall);

const denominator = ulcer * pitfall;
console.log('Denominator (ulcer * pitfall):', denominator);

const serenityJS = returnsSum / denominator;
console.log('JavaScript Serenity Index:', serenityJS);
console.log('Error vs Python:', ((serenityJS - parseFloat(pythonResults[0].metrics["Serenity Index"])) / parseFloat(pythonResults[0].metrics["Serenity Index"]) * 100).toFixed(2) + '%');

// Let's also check if we can replicate the exact Python components
console.log();
console.log('=== COMPONENT VERIFICATION ===');

// Check if we need to use different parameters
console.log('Python ulcer_index uses dd**2 sum divided by (n-1)');
const dd = drawdowns;
const squaredSum = dd.reduce((sum, d) => sum + d*d, 0);
const ulcerManual = Math.sqrt(squaredSum / (data.length - 1));
console.log('Manual ulcer calculation:', ulcerManual);
console.log('Our ulcer function:', ulcer);
console.log('Ulcer match:', Math.abs(ulcer - ulcerManual) < 1e-10 ? 'MATCH' : 'MISMATCH');

// Check CVaR calculation step by step
const sortedDrawdowns = [...drawdowns].sort((a, b) => a - b);
const var95 = stats.valueAtRisk(drawdowns, 0.05);
console.log('VaR (5%):', var95);

const belowVaR = drawdowns.filter(d => d < var95);
const cvarPython = belowVaR.reduce((sum, d) => sum + d, 0) / belowVaR.length;
const cvarOurs = stats.cvar(drawdowns);
console.log('CVaR Python style:', cvarPython);
console.log('CVaR our function:', cvarOurs);
console.log('CVaR match:', Math.abs(cvarPython - cvarOurs) < 1e-10 ? 'MATCH' : 'MISMATCH');
