import fs from 'fs';
import * as stats from './src/stats.js';
import { prepareReturns, toDrawdownSeries } from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== DRAWDOWN SERIES ANALYSIS ===');
console.log('First 10 returns:', returns.slice(0, 10));

const drawdowns = toDrawdownSeries(returns);
console.log('First 10 drawdowns:', drawdowns.slice(0, 10));
console.log('Last 10 drawdowns:', drawdowns.slice(-10));

// Python says 66.34, we get 54.10
// That's a ratio of 66.34/54.10 = 1.227
// Let's see if any component has this kind of ratio

const ratio = 66.34 / 54.10;
console.log(`Python/JS ratio: ${ratio.toFixed(6)}`);

// Check if any of our components might be off by this ratio
const returns_sum = returns.reduce((sum, ret) => sum + ret, 0);
const ulcer = stats.ulcerIndex(returns, false);
const var_dd = stats.valueAtRisk(drawdowns, 1, 0.95, false);
const cvar_dd = stats.cvar(drawdowns, 1, 0.95, false);

console.log('\n=== COMPONENT ANALYSIS ===');
console.log(`Returns sum: ${returns_sum}`);
console.log(`Ulcer index: ${ulcer}`);
console.log(`VaR: ${var_dd}`);
console.log(`CVaR: ${cvar_dd}`);

// Let's try different approaches to see if we can get closer to 66.34
// Maybe the issue is confidence level or some other parameter?

console.log('\n=== TESTING DIFFERENT PARAMETERS ===');

// Try different confidence levels
const confidences = [0.90, 0.95, 0.99];
confidences.forEach(conf => {
  const var_test = stats.valueAtRisk(drawdowns, 1, conf, false);
  const cvar_test = stats.cvar(drawdowns, 1, conf, false);
  
  const returnsMean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - returnsMean, 2), 0) / (returns.length - 1);
  const returnsStd = Math.sqrt(variance);
  
  const pitfall_test = -cvar_test / returnsStd;
  const serenity_test = returns_sum / (ulcer * pitfall_test);
  
  console.log(`Confidence ${conf}: Serenity = ${serenity_test.toFixed(2)} (error vs Python: ${Math.abs((serenity_test - 66.34)/66.34*100).toFixed(2)}%)`);
});

// Maybe check with different sigma values
console.log('\n=== TESTING DIFFERENT SIGMA ===');
const sigmas = [0.5, 1, 1.5, 2];
sigmas.forEach(sigma => {
  const var_test = stats.valueAtRisk(drawdowns, sigma, 0.95, false);
  const cvar_test = stats.cvar(drawdowns, sigma, 0.95, false);
  
  const returnsMean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - returnsMean, 2), 0) / (returns.length - 1);
  const returnsStd = Math.sqrt(variance);
  
  const pitfall_test = -cvar_test / returnsStd;
  const serenity_test = returns_sum / (ulcer * pitfall_test);
  
  console.log(`Sigma ${sigma}: Serenity = ${serenity_test.toFixed(2)} (error vs Python: ${Math.abs((serenity_test - 66.34)/66.34*100).toFixed(2)}%)`);
});
