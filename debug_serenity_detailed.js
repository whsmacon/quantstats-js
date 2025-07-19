import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== SERENITY INDEX DEEP DEBUG ===');

// Step 1: Clean returns (Python doesn't explicitly do this, but we do)
const cleanReturns = utils.prepareReturns(returns, 0, false);
console.log(`Original returns length: ${returns.length}`);
console.log(`Clean returns length: ${cleanReturns.length}`);
console.log(`First few clean returns: ${cleanReturns.slice(0, 5).map(r => r.toFixed(6)).join(', ')}`);

// Step 2: dd = to_drawdown_series(returns) 
const dd = utils.toDrawdownSeries(cleanReturns);
console.log(`\nDrawdown series length: ${dd.length}`);
console.log(`First few drawdowns: ${dd.slice(0, 5).map(d => d.toFixed(6)).join(', ')}`);
console.log(`Min drawdown: ${Math.min(...dd)}`);
console.log(`Max drawdown: ${Math.max(...dd)}`);

// Step 3: cvar(dd) - Python uses default confidence=0.05 (5% worst)
const cvarDD = stats.cvar(dd, 1, 0.95, false); // 95% confidence = 5% tail
console.log(`\nCVaR of drawdowns (95% conf): ${cvarDD}`);

// Let's also try with different confidence levels to see if that's the issue
const cvar90 = stats.cvar(dd, 1, 0.90, false);
const cvar99 = stats.cvar(dd, 1, 0.99, false);
console.log(`CVaR 90%: ${cvar90}`);
console.log(`CVaR 99%: ${cvar99}`);

// Step 4: returns.std() - This is critical!
// Python pandas .std() uses ddof=1 by default (Bessel's correction)
const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (cleanReturns.length - 1); // ddof=1
const stddev = Math.sqrt(variance);
console.log(`\nReturns mean: ${mean}`);
console.log(`Returns variance: ${variance}`);
console.log(`Returns std (ddof=1): ${stddev}`);

// Let's also try ddof=0 to see if that's the issue
const varianceDdof0 = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / cleanReturns.length;
const stddevDdof0 = Math.sqrt(varianceDdof0);
console.log(`Returns std (ddof=0): ${stddevDdof0}`);

// Step 5: pitfall = -cvar(dd) / returns.std()
const pitfall = -cvarDD / stddev;
console.log(`\nPitfall: ${pitfall}`);

// Step 6: ulcer_index(returns)
const ulcer = stats.ulcerIndex(cleanReturns, false);
console.log(`\nUlcer Index: ${ulcer}`);

// Step 7: returns.sum()
const returnsSum = cleanReturns.reduce((sum, ret) => sum + ret, 0);
console.log(`\nReturns sum: ${returnsSum}`);

// Step 8: Final calculation
const serenity = (returnsSum - 0) / (ulcer * pitfall);
console.log(`\n=== FINAL CALCULATION ===`);
console.log(`(${returnsSum} - 0) / (${ulcer} * ${pitfall})`);
console.log(`= ${returnsSum} / ${ulcer * pitfall}`);
console.log(`= ${serenity}`);

console.log(`\n=== COMPARISON ===`);
console.log(`JavaScript result: ${serenity}`);
console.log(`Python expected: 66.340000`);
console.log(`Difference: ${serenity - 66.340000}`);
console.log(`Error: ${((serenity - 66.340000) / 66.340000 * 100).toFixed(2)}%`);

// Test our function
const functionResult = stats.serenityIndex(returns, 0, false);
console.log(`\nOur function result: ${functionResult}`);
console.log(`Manual calc matches function: ${Math.abs(serenity - functionResult) < 0.0001}`);
