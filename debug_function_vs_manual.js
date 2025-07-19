import fs from 'fs';
import * as stats from './src/stats.js';
import { prepareReturns, toDrawdownSeries } from './src/utils.js';

// Load data exactly like our debug script
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== FUNCTION vs MANUAL COMPARISON ===');

// Method 1: Using our serenityIndex function
const functionResult = stats.serenityIndex(returns, 0, false);
console.log('Function result:', functionResult);

// Method 2: Manual calculation using the exact same steps as our function
const cleanReturns = prepareReturns(returns, 0, false);
console.log('Clean returns length:', cleanReturns.length);
console.log('Original returns length:', returns.length);
console.log('First 5 clean returns:', cleanReturns.slice(0, 5));
console.log('First 5 original returns:', returns.slice(0, 5));

// Get drawdown series
const drawdowns = toDrawdownSeries(cleanReturns);

// Calculate CVaR of drawdowns
const cvarDD = stats.cvar(drawdowns, 1, 0.95, false);

// Calculate standard deviation of returns
const returnsMean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - returnsMean, 2), 0) / (cleanReturns.length - 1);
const returnsStd = Math.sqrt(variance);

const pitfall = -cvarDD / returnsStd;

// Calculate ulcer index
const ulcer = stats.ulcerIndex(cleanReturns, false);

// Calculate sum of returns
const returnsSum = cleanReturns.reduce((sum, ret) => sum + ret, 0);

const manualResult = (returnsSum - 0) / (ulcer * pitfall);
console.log('Manual result:', manualResult);

console.log('Difference:', Math.abs(functionResult - manualResult));
console.log('Match:', Math.abs(functionResult - manualResult) < 1e-10 ? 'YES' : 'NO');

// Let's also test with the original returns (not cleaned)
console.log('\n=== TEST WITH ORIGINAL RETURNS ===');
const drawdowns2 = toDrawdownSeries(returns);
const cvarDD2 = stats.cvar(drawdowns2, 1, 0.95, false);
const returnsMean2 = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
const variance2 = returns.reduce((sum, ret) => sum + Math.pow(ret - returnsMean2, 2), 0) / (returns.length - 1);
const returnsStd2 = Math.sqrt(variance2);
const pitfall2 = -cvarDD2 / returnsStd2;
const ulcer2 = stats.ulcerIndex(returns, false);
const returnsSum2 = returns.reduce((sum, ret) => sum + ret, 0);
const directResult = (returnsSum2 - 0) / (ulcer2 * pitfall2);

console.log('Direct result (no prepareReturns):', directResult);
console.log('Matches manual debug script:', Math.abs(directResult - 54.10061968945785) < 1e-10 ? 'YES' : 'NO');
