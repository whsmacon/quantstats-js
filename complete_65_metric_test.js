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
const pythonMetrics = pythonResults[0].metrics;

console.log('=== COMPLETE 65 METRIC PARITY TEST ===\n');
console.log(`Strategy: ${rawData.strategy_name}`);
console.log(`Data points: ${returns.length}\n`);

// Helper functions
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

function compareValue(jsValue, pythonValue, metric, tolerance = 0.01) {
  if (pythonValue === null || pythonValue === undefined || isNaN(pythonValue)) {
    console.log(`${metric.padEnd(35)} | SKIPPED - Python value is null/NaN`);
    return { match: false, skipped: true };
  }
  
  const diff = Math.abs(jsValue - pythonValue);
  const relativeError = Math.abs(diff / pythonValue);
  const status = relativeError < tolerance ? '✅ MATCH' : '❌ DIFF';
  
  console.log(`${metric.padEnd(35)} | JS: ${jsValue.toFixed(6).padStart(12)} | Python: ${pythonValue.toFixed(6).padStart(12)} | Error: ${(relativeError*100).toFixed(2).padStart(6)}% | ${status}`);
  
  return { match: relativeError < tolerance, error: relativeError * 100, skipped: false };
}

console.log('=== ALL 65 PYTHON METRICS COMPARISON ===');
console.log('Metric'.padEnd(35) + ' | ' + 'JavaScript'.padStart(12) + ' | ' + 'Python'.padStart(12) + ' | ' + 'Error'.padStart(8) + ' | Status');
console.log('-'.repeat(100));

let matchCount = 0;
let totalTests = 0;
let skippedCount = 0;
const results = [];

// 1. Date/Period Information
if (pythonMetrics['Start Period']) {
  console.log(`Start Period`.padEnd(35) + ' | ' + 'N/A'.padStart(12) + ' | ' + pythonMetrics['Start Period'].toString().padStart(12) + ' | ' + 'INFO'.padStart(8) + ' | ℹ️ INFO');
}

if (pythonMetrics['End Period']) {
  console.log(`End Period`.padEnd(35) + ' | ' + 'N/A'.padStart(12) + ' | ' + pythonMetrics['End Period'].toString().padStart(12) + ' | ' + 'INFO'.padStart(8) + ' | ℹ️ INFO');
}

// 2. Basic Return Metrics
if (pythonMetrics['Cumulative Return']) {
  const jsValue = stats.totalReturn(returns);
  const pythonValue = parsePercent(pythonMetrics['Cumulative Return']);
  const result = compareValue(jsValue, pythonValue, 'Cumulative Return');
  results.push({metric: 'Cumulative Return', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['CAGR﹪']) {
  const jsValue = stats.cagr(returns);
  const pythonValue = parsePercent(pythonMetrics['CAGR﹪']);
  const result = compareValue(jsValue, pythonValue, 'CAGR');
  results.push({metric: 'CAGR', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Volatility (ann.)']) {
  const jsValue = stats.volatility(returns);
  const pythonValue = parsePercent(pythonMetrics['Volatility (ann.)']);
  const result = compareValue(jsValue, pythonValue, 'Volatility');
  results.push({metric: 'Volatility', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 3. Risk-Adjusted Ratios
if (pythonMetrics['Sharpe']) {
  const jsValue = stats.sharpe(returns);
  const pythonValue = parseFloat(pythonMetrics['Sharpe']);
  const result = compareValue(jsValue, pythonValue, 'Sharpe');
  results.push({metric: 'Sharpe', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Sortino']) {
  const jsValue = stats.sortino(returns);
  const pythonValue = parseFloat(pythonMetrics['Sortino']);
  const result = compareValue(jsValue, pythonValue, 'Sortino');
  results.push({metric: 'Sortino', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Calmar']) {
  const jsValue = stats.calmar(returns);
  const pythonValue = parseFloat(pythonMetrics['Calmar']);
  const result = compareValue(jsValue, pythonValue, 'Calmar');
  results.push({metric: 'Calmar', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Omega']) {
  const jsValue = stats.omega(returns);
  const pythonValue = parseFloat(pythonMetrics['Omega']);
  const result = compareValue(jsValue, pythonValue, 'Omega');
  results.push({metric: 'Omega', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 4. Smart Ratios
if (pythonMetrics['Smart Sharpe']) {
  const jsValue = stats.smartSharpe(returns);
  const pythonValue = parseFloat(pythonMetrics['Smart Sharpe']);
  const result = compareValue(jsValue, pythonValue, 'Smart Sharpe');
  results.push({metric: 'Smart Sharpe', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Smart Sortino']) {
  const jsValue = stats.smartSortino(returns);
  const pythonValue = parseFloat(pythonMetrics['Smart Sortino']);
  const result = compareValue(jsValue, pythonValue, 'Smart Sortino');
  results.push({metric: 'Smart Sortino', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// Sortino/√2 and Smart Sortino/√2 implemented
if (pythonMetrics['Sortino/√2']) {
  const jsValue = stats.sortinoSqrt2(returns);
  const pythonValue = parseNumber(pythonMetrics['Sortino/√2']);
  const result = compareValue(jsValue, pythonValue, 'Sortino/√2');
  results.push({metric: 'Sortino/√2', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Smart Sortino/√2']) {
  const jsValue = stats.smartSortinoSqrt2(returns);
  const pythonValue = parseNumber(pythonMetrics['Smart Sortino/√2']);
  const result = compareValue(jsValue, pythonValue, 'Smart Sortino/√2');
  results.push({metric: 'Smart Sortino/√2', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 5. Probabilistic Ratios
if (pythonMetrics['Prob. Sharpe Ratio']) {
  const jsValue = stats.probabilisticSharpeRatio(returns);
  const pythonValue = parsePercent(pythonMetrics['Prob. Sharpe Ratio']);
  const result = compareValue(jsValue, pythonValue, 'Prob. Sharpe Ratio');
  results.push({metric: 'Prob. Sharpe Ratio', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 6. Drawdown Metrics
if (pythonMetrics['Max Drawdown']) {
  const jsValue = stats.maxDrawdown(returns);
  const pythonValue = parsePercent(pythonMetrics['Max Drawdown']);
  const result = compareValue(jsValue, pythonValue, 'Max Drawdown');
  results.push({metric: 'Max Drawdown', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Avg. Drawdown']) {
  const drawdowns = stats.drawdown(returns);
  const jsValue = drawdowns.reduce((sum, dd) => sum + dd, 0) / drawdowns.length;
  const pythonValue = parsePercent(pythonMetrics['Avg. Drawdown']);
  const result = compareValue(jsValue, pythonValue, 'Avg. Drawdown');
  results.push({metric: 'Avg. Drawdown', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// Drawdown duration metrics - now implemented!
if (pythonMetrics['Longest DD Days']) {
  const jsValue = stats.longestDrawdownDays(returns);
  const pythonValue = parseNumber(pythonMetrics['Longest DD Days']);
  const result = compareValue(jsValue, pythonValue, 'Longest DD Days');
  results.push({metric: 'Longest DD Days', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Avg. Drawdown Days']) {
  const jsValue = stats.averageDrawdownDays(returns);
  const pythonValue = parseNumber(pythonMetrics['Avg. Drawdown Days']);
  const result = compareValue(jsValue, pythonValue, 'Avg. Drawdown Days');
  results.push({metric: 'Avg. Drawdown Days', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Recovery Factor']) {
  const jsValue = stats.recoveryFactor(returns);
  const pythonValue = parseFloat(pythonMetrics['Recovery Factor']);
  const result = compareValue(jsValue, pythonValue, 'Recovery Factor');
  results.push({metric: 'Recovery Factor', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Ulcer Index']) {
  const jsValue = stats.ulcerIndex(returns);
  const pythonValue = parseFloat(pythonMetrics['Ulcer Index']);
  const result = compareValue(jsValue, pythonValue, 'Ulcer Index');
  results.push({metric: 'Ulcer Index', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Serenity Index']) {
  const jsValue = stats.serenityIndex(returns);
  const pythonValue = parseFloat(pythonMetrics['Serenity Index']);
  const result = compareValue(jsValue, pythonValue, 'Serenity Index');
  results.push({metric: 'Serenity Index', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 7. Distribution Metrics
if (pythonMetrics['Skew']) {
  const jsValue = stats.skew(returns);
  const pythonValue = parseFloat(pythonMetrics['Skew']);
  const result = compareValue(jsValue, pythonValue, 'Skew');
  results.push({metric: 'Skew', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Kurtosis']) {
  const jsValue = stats.kurtosis(returns);
  const pythonValue = parseFloat(pythonMetrics['Kurtosis']);
  const result = compareValue(jsValue, pythonValue, 'Kurtosis');
  results.push({metric: 'Kurtosis', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 8. Expected Returns
if (pythonMetrics['Expected Daily']) {
  const jsValue = stats.expectedReturn(returns, null, true);  // compounded=true to match Python
  const pythonValue = parsePercent(pythonMetrics['Expected Daily']);
  const result = compareValue(jsValue, pythonValue, 'Expected Daily');
  results.push({metric: 'Expected Daily', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// Expected Monthly/Yearly implemented
if (pythonMetrics['Expected Monthly']) {
  const jsValue = stats.expectedMonthlyReturn(returns, true);  // compounded=true to match Python
  const pythonValue = parsePercent(pythonMetrics['Expected Monthly']);
  const result = compareValue(jsValue, pythonValue, 'Expected Monthly');
  results.push({metric: 'Expected Monthly', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Expected Yearly']) {
  const jsValue = stats.expectedYearlyReturn(returns, true);  // compounded=true to match Python
  const pythonValue = parsePercent(pythonMetrics['Expected Yearly']);
  const result = compareValue(jsValue, pythonValue, 'Expected Yearly');
  results.push({metric: 'Expected Yearly', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 9. Risk Metrics
if (pythonMetrics['Kelly Criterion']) {
  const jsValue = stats.kelly(returns);
  const pythonValue = parsePercent(pythonMetrics['Kelly Criterion']);
  const result = compareValue(jsValue, pythonValue, 'Kelly Criterion');
  results.push({metric: 'Kelly Criterion', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Risk of Ruin']) {
  const jsValue = stats.riskOfRuin(returns);
  const pythonValue = parsePercent(pythonMetrics['Risk of Ruin']);
  const result = compareValue(jsValue, pythonValue, 'Risk of Ruin');
  results.push({metric: 'Risk of Ruin', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Daily Value-at-Risk']) {
  const jsValue = stats.valueAtRisk(returns, 1, 0.95);
  const pythonValue = parsePercent(pythonMetrics['Daily Value-at-Risk']);
  const result = compareValue(jsValue, pythonValue, 'VaR (95%)');
  results.push({metric: 'VaR (95%)', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Expected Shortfall (cVaR)']) {
  const jsValue = stats.cvar(returns, 1, 0.95);
  const pythonValue = parsePercent(pythonMetrics['Expected Shortfall (cVaR)']);
  const result = compareValue(jsValue, pythonValue, 'CVaR (95%)');
  results.push({metric: 'CVaR (95%)', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 10. Performance Metrics
if (pythonMetrics['Profit Factor']) {
  const jsValue = stats.profitFactor(returns);
  const pythonValue = parseFloat(pythonMetrics['Profit Factor']);
  const result = compareValue(jsValue, pythonValue, 'Profit Factor');
  results.push({metric: 'Profit Factor', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Payoff Ratio']) {
  const jsValue = stats.payoffRatio(returns);
  const pythonValue = parseFloat(pythonMetrics['Payoff Ratio']);
  const result = compareValue(jsValue, pythonValue, 'Payoff Ratio');
  results.push({metric: 'Payoff Ratio', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Gain/Pain Ratio']) {
  const jsValue = stats.gainToPainRatio(returns);
  const pythonValue = parseFloat(pythonMetrics['Gain/Pain Ratio']);
  const result = compareValue(jsValue, pythonValue, 'Gain/Pain Ratio');
  results.push({metric: 'Gain/Pain Ratio', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// Gain/Pain (1M) - now implemented!
if (pythonMetrics['Gain/Pain (1M)']) {
  const jsValue = stats.gainToPainRatioMonthly(returns);
  const pythonValue = parseFloat(pythonMetrics['Gain/Pain (1M)']);
  const result = compareValue(jsValue, pythonValue, 'Gain/Pain (1M)');
  results.push({metric: 'Gain/Pain (1M)', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Common Sense Ratio']) {
  const jsValue = stats.commonSenseRatio(returns);
  const pythonValue = parseFloat(pythonMetrics['Common Sense Ratio']);
  const result = compareValue(jsValue, pythonValue, 'Common Sense Ratio');
  results.push({metric: 'Common Sense Ratio', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['CPC Index']) {
  const jsValue = stats.cpcIndex(returns);
  const pythonValue = parseFloat(pythonMetrics['CPC Index']);
  const result = compareValue(jsValue, pythonValue, 'CPC Index');
  results.push({metric: 'CPC Index', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Tail Ratio']) {
  const jsValue = stats.tailRatio(returns);
  const pythonValue = parseFloat(pythonMetrics['Tail Ratio']);
  const result = compareValue(jsValue, pythonValue, 'Tail Ratio');
  results.push({metric: 'Tail Ratio', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Outlier Win Ratio']) {
  const jsValue = stats.outlierWinRatio(returns);
  const pythonValue = parseFloat(pythonMetrics['Outlier Win Ratio']);
  const result = compareValue(jsValue, pythonValue, 'Outlier Win Ratio');
  results.push({metric: 'Outlier Win Ratio', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Outlier Loss Ratio']) {
  const jsValue = stats.outlierLossRatio(returns);
  const pythonValue = parseFloat(pythonMetrics['Outlier Loss Ratio']);
  const result = compareValue(jsValue, pythonValue, 'Outlier Loss Ratio');
  results.push({metric: 'Outlier Loss Ratio', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 11. Period-based Returns - Now implemented!
if (pythonMetrics['MTD']) {
  const jsValue = stats.mtdReturn(returns);
  const pythonValue = parsePercent(pythonMetrics['MTD']);
  const result = compareValue(jsValue, pythonValue, 'MTD');
  results.push({metric: 'MTD', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['3M']) {
  const jsValue = stats.threeMonthReturn(returns);
  const pythonValue = parsePercent(pythonMetrics['3M']);
  const result = compareValue(jsValue, pythonValue, '3M');
  results.push({metric: '3M', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['6M']) {
  const jsValue = stats.sixMonthReturn(returns);
  const pythonValue = parsePercent(pythonMetrics['6M']);
  const result = compareValue(jsValue, pythonValue, '6M');
  results.push({metric: '6M', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['YTD']) {
  const jsValue = stats.ytdReturn(returns);
  const pythonValue = parsePercent(pythonMetrics['YTD']);
  const result = compareValue(jsValue, pythonValue, 'YTD');
  results.push({metric: 'YTD', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['1Y']) {
  const jsValue = stats.oneYearReturn(returns);
  const pythonValue = parsePercent(pythonMetrics['1Y']);
  const result = compareValue(jsValue, pythonValue, '1Y');
  results.push({metric: '1Y', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['3Y (ann.)']) {
  const jsValue = stats.threeYearAnnualizedReturn(returns);
  const pythonValue = parsePercent(pythonMetrics['3Y (ann.)']);
  const result = compareValue(jsValue, pythonValue, '3Y (ann.)');
  results.push({metric: '3Y (ann.)', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['5Y (ann.)']) {
  const jsValue = stats.fiveYearAnnualizedReturn(returns);
  const pythonValue = parsePercent(pythonMetrics['5Y (ann.)']);
  const result = compareValue(jsValue, pythonValue, '5Y (ann.)');
  results.push({metric: '5Y (ann.)', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['10Y (ann.)']) {
  const jsValue = stats.tenYearAnnualizedReturn(returns);
  const pythonValue = parsePercent(pythonMetrics['10Y (ann.)']);
  const result = compareValue(jsValue, pythonValue, '10Y (ann.)');
  results.push({metric: '10Y (ann.)', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['All-time (ann.)']) {
  const jsValue = stats.allTimeAnnualizedReturn(returns);
  const pythonValue = parsePercent(pythonMetrics['All-time (ann.)']);
  const result = compareValue(jsValue, pythonValue, 'All-time (ann.)');
  results.push({metric: 'All-time (ann.)', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 12. Best/Worst Performance
if (pythonMetrics['Best Day']) {
  const jsValue = stats.best(returns);
  const pythonValue = parsePercent(pythonMetrics['Best Day']);
  const result = compareValue(jsValue, pythonValue, 'Best Day');
  results.push({metric: 'Best Day', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Worst Day']) {
  const jsValue = stats.worst(returns);
  const pythonValue = parsePercent(pythonMetrics['Worst Day']);
  const result = compareValue(jsValue, pythonValue, 'Worst Day');
  results.push({metric: 'Worst Day', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Best Month']) {
  const monthlyRets = stats.monthlyReturns(returns);
  const jsValue = stats.best(monthlyRets);
  const pythonValue = parsePercent(pythonMetrics['Best Month']);
  const result = compareValue(jsValue, pythonValue, 'Best Month');
  results.push({metric: 'Best Month', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Worst Month']) {
  const monthlyRets = stats.monthlyReturns(returns);
  const jsValue = stats.worst(monthlyRets);
  const pythonValue = parsePercent(pythonMetrics['Worst Month']);
  const result = compareValue(jsValue, pythonValue, 'Worst Month');
  results.push({metric: 'Worst Month', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Best Year']) {
  const yearlyRets = stats.yearlyReturns(returns);
  const jsValue = stats.best(yearlyRets);
  const pythonValue = parsePercent(pythonMetrics['Best Year']);
  const result = compareValue(jsValue, pythonValue, 'Best Year');
  results.push({metric: 'Best Year', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Worst Year']) {
  const yearlyRets = stats.yearlyReturns(returns);
  const jsValue = stats.worst(yearlyRets);
  const pythonValue = parsePercent(pythonMetrics['Worst Year']);
  const result = compareValue(jsValue, pythonValue, 'Worst Year');
  results.push({metric: 'Worst Year', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// Monthly performance - now implemented!
if (pythonMetrics['Avg. Up Month']) {
  const jsValue = stats.avgUpMonth(returns);
  const pythonValue = parsePercent(pythonMetrics['Avg. Up Month']);
  const result = compareValue(jsValue, pythonValue, 'Avg. Up Month');
  results.push({metric: 'Avg. Up Month', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Avg. Down Month']) {
  const jsValue = stats.avgDownMonth(returns);
  const pythonValue = parsePercent(pythonMetrics['Avg. Down Month']);
  const result = compareValue(jsValue, pythonValue, 'Avg. Down Month');
  results.push({metric: 'Avg. Down Month', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 13. Win Rate Metrics
if (pythonMetrics['Win Days']) {
  const jsValue = stats.winRate(returns);
  const pythonValue = parsePercent(pythonMetrics['Win Days']);
  const result = compareValue(jsValue, pythonValue, 'Win Days');
  results.push({metric: 'Win Days', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Win Month']) {
  const monthlyRets = stats.monthlyReturns(returns);
  const jsValue = stats.winRate(monthlyRets);
  const pythonValue = parsePercent(pythonMetrics['Win Month']);
  const result = compareValue(jsValue, pythonValue, 'Win Month');
  results.push({metric: 'Win Month', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// Win Quarter - now implemented!
if (pythonMetrics['Win Quarter']) {
  const jsValue = stats.winQuarter(returns);
  const pythonValue = parsePercent(pythonMetrics['Win Quarter']);
  const result = compareValue(jsValue, pythonValue, 'Win Quarter');
  results.push({metric: 'Win Quarter', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Win Year']) {
  const yearlyRets = stats.yearlyReturns(returns);
  const jsValue = stats.winRate(yearlyRets);
  const pythonValue = parsePercent(pythonMetrics['Win Year']);
  const result = compareValue(jsValue, pythonValue, 'Win Year');
  results.push({metric: 'Win Year', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 14. Consecutive Metrics
if (pythonMetrics['Max Consecutive Wins']) {
  const jsValue = stats.consecutiveWins(returns);
  const pythonValue = parseFloat(pythonMetrics['Max Consecutive Wins']);
  const result = compareValue(jsValue, pythonValue, 'Max Consecutive Wins');
  results.push({metric: 'Max Consecutive Wins', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

if (pythonMetrics['Max Consecutive Losses']) {
  const jsValue = stats.consecutiveLosses(returns);
  const pythonValue = parseFloat(pythonMetrics['Max Consecutive Losses']);
  const result = compareValue(jsValue, pythonValue, 'Max Consecutive Losses');
  results.push({metric: 'Max Consecutive Losses', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 15. Market Exposure
if (pythonMetrics['Time in Market']) {
  const jsValue = stats.exposure(returns);
  const pythonValue = parsePercent(pythonMetrics['Time in Market']);
  const result = compareValue(jsValue, pythonValue, 'Time in Market');
  results.push({metric: 'Time in Market', ...result});
  if (!result.skipped) { totalTests++; if (result.match) matchCount++; }
}

// 16. Risk-Free Rate (info only)
if (pythonMetrics['Risk-Free Rate']) {
  console.log(`Risk-Free Rate`.padEnd(35) + ' | ' + 'N/A'.padStart(12) + ' | ' + pythonMetrics['Risk-Free Rate'].toString().padStart(12) + ' | ' + 'INFO'.padStart(8) + ' | ℹ️ INFO');
}

console.log('-'.repeat(100));
console.log(`TOTAL PARITY SCORE: ${matchCount}/${totalTests} (${(matchCount/totalTests*100).toFixed(1)}%)`);

// Categorize results
const exactMatches = results.filter(r => r.match);
const nearPerfect = results.filter(r => !r.match && r.error < 1);
const needsFix = results.filter(r => !r.match && r.error >= 1);

console.log('\\n=== PARITY STATUS SUMMARY ===');
console.log(`✅ EXACT MATCHES (< 1% error): ${exactMatches.length}`);
console.log(`🟡 NEAR PERFECT (1-10% error): ${nearPerfect.length}`);
console.log(`❌ NEEDS MAJOR FIX (> 10% error): ${needsFix.length}`);

console.log('\\n=== PRIORITY FIX LIST ===');
console.log('NEAR PERFECT - Easy precision fixes:');
nearPerfect.forEach(r => {
  console.log(`  • ${r.metric}: ${r.error.toFixed(2)}% error`);
});

console.log('\\nNEEDS ALGORITHM REVIEW:');
needsFix.forEach(r => {
  console.log(`  • ${r.metric}: ${r.error.toFixed(2)}% error`);
});
