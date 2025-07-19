import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== CVAR PARAMETER TEST ===');

const cleanReturns = utils.prepareReturns(returns, 0, false);
const dd = utils.toDrawdownSeries(cleanReturns);

console.log(`Drawdowns length: ${dd.length}`);
console.log(`First few drawdowns: ${dd.slice(0, 5).map(d => d.toFixed(6)).join(', ')}`);

// Test CVaR with different parameters
const cvar_nans_false = stats.cvar(dd, 1, 0.95, false);
const cvar_nans_true = stats.cvar(dd, 1, 0.95, true);

console.log(`CVaR with nans=false: ${cvar_nans_false}`);
console.log(`CVaR with nans=true: ${cvar_nans_true}`);

// Test different confidence levels
console.log(`CVaR 90%: ${stats.cvar(dd, 1, 0.90, false)}`);
console.log(`CVaR 95%: ${stats.cvar(dd, 1, 0.95, false)}`);
console.log(`CVaR 99%: ${stats.cvar(dd, 1, 0.99, false)}`);

// Check VaR too
const var95 = stats.valueAtRisk(dd, 1, 0.95, false);
console.log(`VaR 95%: ${var95}`);

// Count how many values are below VaR
const belowVar = dd.filter(ret => ret < var95);
console.log(`Values below VaR: ${belowVar.length} out of ${dd.length}`);
console.log(`Percentage below: ${(belowVar.length / dd.length * 100).toFixed(1)}%`);

// Manual CVaR calculation
if (belowVar.length > 0) {
  const manualCVar = belowVar.reduce((sum, ret) => sum + ret, 0) / belowVar.length;
  console.log(`Manual CVaR calculation: ${manualCVar}`);
}
