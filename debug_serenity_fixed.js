import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';

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

console.log('Returns sum:', returnsSum);
console.log('Ulcer Index:', ulcer);

// Test both VaR approaches
const varParametric = stats.valueAtRisk(drawdowns, 1, 0.95);
const sortedDrawdowns = [...drawdowns].sort((a, b) => a - b);
const quantileIndex = Math.floor(drawdowns.length * 0.05);  // 5% quantile
const varEmpirical = sortedDrawdowns[quantileIndex];

console.log('VaR (parametric):', varParametric);
console.log('VaR (empirical):', varEmpirical);

// Test CVaR with both approaches
const belowVarParametric = drawdowns.filter(d => d < varParametric);
const cvarParametric = belowVarParametric.reduce((sum, d) => sum + d, 0) / belowVarParametric.length;

const belowVarEmpirical = drawdowns.filter(d => d < varEmpirical);
const cvarEmpirical = belowVarEmpirical.reduce((sum, d) => sum + d, 0) / belowVarEmpirical.length;

const cvarOurs = stats.cvar(drawdowns);

console.log('CVaR (parametric based):', cvarParametric);
console.log('CVaR (empirical based):', cvarEmpirical);
console.log('CVaR (our function):', cvarOurs);

console.log('Returns std (ddof=1):', returnStd);

// Test serenity with empirical CVaR
const pitfallEmpirical = -cvarEmpirical / returnStd;
const pitfallParametric = -cvarParametric / returnStd;
const pitfallOurs = -cvarOurs / returnStd;

console.log('Pitfall (empirical):', pitfallEmpirical);
console.log('Pitfall (parametric):', pitfallParametric);
console.log('Pitfall (ours):', pitfallOurs);

const denominatorEmpirical = ulcer * pitfallEmpirical;
const denominatorParametric = ulcer * pitfallParametric;
const denominatorOurs = ulcer * pitfallOurs;

console.log('Denominator (empirical):', denominatorEmpirical);
console.log('Denominator (parametric):', denominatorParametric);
console.log('Denominator (ours):', denominatorOurs);

const serenityEmpirical = returnsSum / denominatorEmpirical;
const serenityParametric = returnsSum / denominatorParametric;
const serenityOurs = returnsSum / denominatorOurs;

console.log('Serenity (empirical):', serenityEmpirical);
console.log('Serenity (parametric):', serenityParametric);
console.log('Serenity (ours):', serenityOurs);

const pythonValue = parseFloat(pythonResults[0].metrics["Serenity Index"]);
console.log('Error empirical vs Python:', ((serenityEmpirical - pythonValue) / pythonValue * 100).toFixed(2) + '%');
console.log('Error parametric vs Python:', ((serenityParametric - pythonValue) / pythonValue * 100).toFixed(2) + '%');
console.log('Error ours vs Python:', ((serenityOurs - pythonValue) / pythonValue * 100).toFixed(2) + '%');
