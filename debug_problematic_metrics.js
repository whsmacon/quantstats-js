import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;
const dates = rawData.dates.map(dateStr => new Date(dateStr));

// Load Python results
let pythonContent = fs.readFileSync('python_quantstats_results.json', 'utf8');
pythonContent = pythonContent.replace(/NaN/g, 'null');
const pythonResults = JSON.parse(pythonContent);
const pythonMetrics = pythonResults[0].metrics;

console.log('=== DEBUGGING PROBLEMATIC METRICS ===\n');

function parsePercent(str) {
  if (typeof str === 'string' && str.endsWith('%')) {
    return parseFloat(str.replace('%', '')) / 100;
  }
  return parseFloat(str);
}

function parseNumber(str) {
  if (typeof str === 'string') {
    return parseFloat(str.replace('%', ''));
  }
  return parseFloat(str);
}

// 1. Ulcer Index Analysis
console.log('=== ULCER INDEX DEBUG ===');
const drawdowns = utils.toDrawdownSeries(returns);
const jsUlcer = stats.ulcerIndex(returns);
const pythonUlcer = parseFloat(pythonMetrics['Ulcer Index']);

console.log(`JavaScript Ulcer: ${jsUlcer}`);
console.log(`Python Ulcer: ${pythonUlcer}`);
console.log(`Error: ${((Math.abs(jsUlcer - pythonUlcer) / pythonUlcer) * 100).toFixed(2)}%`);
console.log(`Drawdowns length: ${drawdowns.length}`);
console.log(`Returns length: ${returns.length}`);
console.log(`First 5 drawdowns: ${drawdowns.slice(0, 5)}`);
console.log(`Sum of squared drawdowns: ${drawdowns.map(dd => dd*dd).reduce((a,b) => a+b, 0)}`);
console.log(`Formula check: sqrt(${drawdowns.map(dd => dd*dd).reduce((a,b) => a+b, 0)} / ${returns.length - 1}) = ${Math.sqrt(drawdowns.map(dd => dd*dd).reduce((a,b) => a+b, 0) / (returns.length - 1))}`);

// 2. Serenity Index Analysis
console.log('\n=== SERENITY INDEX DEBUG ===');
const cvarDD = stats.cvar(drawdowns, 1, 0.95);
const returnsStd = stats.volatility(returns) / Math.sqrt(252); // Daily std
const pitfall = -cvarDD / returnsStd;
const ulcer = stats.ulcerIndex(returns);
const returnsSum = returns.reduce((sum, ret) => sum + ret, 0);
const jsSerenity = stats.serenityIndex(returns);
const pythonSerenity = parseFloat(pythonMetrics['Serenity Index']);

console.log(`JavaScript Serenity: ${jsSerenity}`);
console.log(`Python Serenity: ${pythonSerenity}`);
console.log(`Error: ${((Math.abs(jsSerenity - pythonSerenity) / pythonSerenity) * 100).toFixed(2)}%`);
console.log(`CVaR of drawdowns: ${cvarDD}`);
console.log(`Returns std (daily): ${returnsStd}`);
console.log(`Pitfall: ${pitfall}`);
console.log(`Ulcer Index: ${ulcer}`);
console.log(`Returns sum: ${returnsSum}`);
console.log(`Formula check: (${returnsSum} - 0) / (${ulcer} * ${pitfall}) = ${(returnsSum - 0) / (ulcer * pitfall)}`);

// 3. Expected Daily Analysis
console.log('\n=== EXPECTED DAILY DEBUG ===');
const jsExpectedDaily = stats.expectedReturn(returns, null, true, false, dates);
const pythonExpectedDaily = parsePercent(pythonMetrics['Expected Daily']);

console.log(`JavaScript Expected Daily: ${jsExpectedDaily}`);
console.log(`Python Expected Daily: ${pythonExpectedDaily}`);
console.log(`Error: ${((Math.abs(jsExpectedDaily - pythonExpectedDaily) / pythonExpectedDaily) * 100).toFixed(2)}%`);

// Check different calculation methods
const avgDaily = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
const compoundedDaily = Math.pow(returns.reduce((prod, ret) => prod * (1 + ret), 1), 1/returns.length) - 1;
console.log(`Simple average daily: ${avgDaily}`);
console.log(`Compounded daily: ${compoundedDaily}`);

// 4. Average Drawdown Days Analysis  
console.log('\n=== AVERAGE DRAWDOWN DAYS DEBUG ===');
const jsAvgDDDays = stats.averageDrawdownDays(returns, dates);
const pythonAvgDDDays = parseNumber(pythonMetrics['Avg. Drawdown Days']);

console.log(`JavaScript Avg DD Days: ${jsAvgDDDays}`);
console.log(`Python Avg DD Days: ${pythonAvgDDDays}`);
console.log(`Error: ${((Math.abs(jsAvgDDDays - pythonAvgDDDays) / pythonAvgDDDays) * 100).toFixed(2)}%`);

// 5. Best Month Analysis
console.log('\n=== BEST MONTH DEBUG ===');
const monthlyRets = stats.monthlyReturns(returns, false, dates, true);
const jsBestMonth = stats.best(monthlyRets);
const pythonBestMonth = parsePercent(pythonMetrics['Best Month']);

console.log(`JavaScript Best Month: ${jsBestMonth}`);
console.log(`Python Best Month: ${pythonBestMonth}`);
console.log(`Error: ${((Math.abs(jsBestMonth - pythonBestMonth) / pythonBestMonth) * 100).toFixed(2)}%`);
console.log(`Monthly returns count: ${monthlyRets.length}`);
console.log(`Max of monthly returns: ${Math.max(...monthlyRets)}`);
console.log(`First 5 monthly returns: ${monthlyRets.slice(0, 5)}`);
console.log(`Last 5 monthly returns: ${monthlyRets.slice(-5)}`);
