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

console.log('=== EXACT PYTHON REPLICATION TEST ===');
console.log('Python Serenity Index:', pythonResults[0].metrics["Serenity Index"]);
console.log();

// Replicate exact Python calculation:
// def serenity_index(returns, rf=0):
//     dd = to_drawdown_series(returns)
//     pitfall = -cvar(dd) / returns.std()
//     return (returns.sum() - rf) / (ulcer_index(returns) * pitfall)

const drawdowns = utils.toDrawdownSeries(data);
const returnsSum = data.reduce((sum, ret) => sum + ret, 0);
const ulcer = stats.ulcerIndex(data);

// Calculate returns.std() exactly like Python (ddof=1)
const mean = data.reduce((sum, ret) => sum + ret, 0) / data.length;
const variance = data.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (data.length - 1);
const returnsStd = Math.sqrt(variance);

// Calculate CVaR exactly like Python
// Python: c_var = returns[returns < var].values.mean()
const varValue = stats.valueAtRisk(drawdowns, 1, 0.95);
const belowVar = drawdowns.filter(d => d < varValue);
const cvarValue = belowVar.reduce((sum, d) => sum + d, 0) / belowVar.length;

console.log('Components:');
console.log('  Returns sum:', returnsSum);
console.log('  Returns std:', returnsStd);
console.log('  Ulcer Index:', ulcer);
console.log('  VaR:', varValue);
console.log('  CVaR:', cvarValue);

const pitfall = -cvarValue / returnsStd;
console.log('  Pitfall (-cvar/std):', pitfall);

const denominator = ulcer * pitfall;
console.log('  Denominator (ulcer * pitfall):', denominator);

const serenityManual = returnsSum / denominator;
console.log('Manual Serenity Index:', serenityManual);

// Compare with our function
const serenityFunction = stats.serenityIndex(data);
console.log('Our function result:', serenityFunction);

const pythonValue = parseFloat(pythonResults[0].metrics["Serenity Index"]);
console.log('Error manual vs Python:', ((serenityManual - pythonValue) / pythonValue * 100).toFixed(2) + '%');
console.log('Error function vs Python:', ((serenityFunction - pythonValue) / pythonValue * 100).toFixed(2) + '%');

// Check if our function matches manual calculation
console.log('Function vs Manual match:', Math.abs(serenityFunction - serenityManual) < 1e-10 ? 'MATCH' : 'MISMATCH');
