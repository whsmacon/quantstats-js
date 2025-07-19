import fs from 'fs';
import * as stats from './src/stats.js';
import { prepareReturns, toDrawdownSeries } from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

// Load Python results
let pythonContent = fs.readFileSync('python_quantstats_results.json', 'utf8');
pythonContent = pythonContent.replace(/NaN/g, 'null');
const pythonResults = JSON.parse(pythonContent);
const pythonMetrics = pythonResults[0].metrics;

console.log('=== SERENITY INDEX DEBUG ===');

const pythonSerenity = parseFloat(pythonMetrics['Serenity Index']);
console.log(`Python Serenity Index: ${pythonSerenity}`);

// Calculate step by step following Python exactly
console.log('\n=== STEP BY STEP CALCULATION ===');

// Step 1: Get drawdown series (Python: dd = to_drawdown_series(returns))
const drawdowns = toDrawdownSeries(returns);
console.log(`Drawdowns count: ${drawdowns.length}`);
console.log(`Min drawdown: ${Math.min(...drawdowns)}`);

// Step 2: Calculate CVaR of drawdowns (Python: cvar(dd))
// Python uses: var = value_at_risk(dd), then cvar = dd[dd < var].mean()
const varDD = stats.valueAtRisk(drawdowns, 1, 0.95, false);
const belowVaR = drawdowns.filter(dd => dd < varDD);
const cvarDD_python_style = belowVaR.length > 0 ? belowVaR.reduce((sum, dd) => sum + dd, 0) / belowVaR.length : varDD;

console.log(`VaR of drawdowns: ${varDD}`);
console.log(`Values below VaR count: ${belowVaR.length}`);
console.log(`CVaR (Python style - mean of values < VaR): ${cvarDD_python_style}`);

// Compare with our function
const cvarDD_our_function = stats.cvar(drawdowns, 1, 0.95, false);
console.log(`CVaR (our function): ${cvarDD_our_function}`);
console.log(`CVaR match: ${Math.abs(cvarDD_python_style - cvarDD_our_function) < 1e-10 ? 'MATCH' : 'DIFFER'}`);

// Step 3: Calculate returns.std() (Python uses pandas std, which is ddof=1)
const cleanReturns = prepareReturns(returns, 0, false);
const returnsMean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - returnsMean, 2), 0) / (cleanReturns.length - 1);
const returnsStd = Math.sqrt(variance);
console.log(`Returns std (ddof=1): ${returnsStd}`);

// Step 4: Calculate pitfall (Python: pitfall = -cvar(dd) / returns.std())
const pitfall = -cvarDD_python_style / returnsStd;
console.log(`Pitfall: ${pitfall}`);

// Step 5: Calculate ulcer index (Python: ulcer_index(returns))
const ulcer = stats.ulcerIndex(cleanReturns, false);
console.log(`Ulcer Index: ${ulcer}`);

// Step 6: Calculate returns.sum() (Python: returns.sum() - rf)
const returnsSum = cleanReturns.reduce((sum, ret) => sum + ret, 0);
console.log(`Returns sum: ${returnsSum}`);

// Step 7: Final calculation (Python: (returns.sum() - rf) / (ulcer_index(returns) * pitfall))
const serenityIndex = (returnsSum - 0) / (ulcer * pitfall);
console.log(`\nFinal Serenity Index: ${serenityIndex}`);

// Compare with Python
const error = Math.abs((serenityIndex - pythonSerenity) / pythonSerenity) * 100;
console.log(`Error vs Python: ${error.toFixed(2)}%`);

// Also test our function
const jsSerenity = stats.serenityIndex(returns, 0, false);
console.log(`\nOur function result: ${jsSerenity}`);
console.log(`Function vs manual: ${Math.abs(jsSerenity - serenityIndex) < 1e-10 ? 'MATCH' : 'DIFFER'}`);

// Let's also check individual component errors
console.log(`\n=== COMPONENT COMPARISON ===`);
console.log(`CVaR difference: ${Math.abs(cvarDD_python_style - cvarDD_our_function)}`);
console.log(`Numerator (returns sum): ${returnsSum}`);
console.log(`Denominator (ulcer * pitfall): ${ulcer * pitfall}`);

// Debug if CVaR is the issue by trying both CVaR approaches
const serenity_with_our_cvar = (returnsSum - 0) / (ulcer * (-cvarDD_our_function / returnsStd));
console.log(`\nUsing our CVaR function: ${serenity_with_our_cvar}`);
console.log(`Error with our CVaR: ${Math.abs((serenity_with_our_cvar - pythonSerenity) / pythonSerenity) * 100}%`);
