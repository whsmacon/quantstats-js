import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';
import * as reports from './src/reports.js';

// Load the raw input data and Python results
const rawData = JSON.parse(fs.readFileSync('./raw_data_comparison_js.json', 'utf8'));

// Load Python results and handle NaN values
let pythonResultsText = fs.readFileSync('./python_quantstats_results.json', 'utf8');
pythonResultsText = pythonResultsText.replace(/:\s*NaN/g, ': null'); // Replace NaN with null
const pythonResults = JSON.parse(pythonResultsText);

console.log('=== PARITY TEST: JavaScript vs Python QuantStats ===\n');

// Use the exact same data points
const returns = rawData.returns;

console.log(`Strategy: ${rawData.strategy_name}`);
console.log(`Strategy SID: ${rawData.strategy_sid}`);
console.log(`Data points: ${returns.length}`);
console.log(`First few returns: ${returns.slice(0, 5).map(r => r.toFixed(6)).join(', ')}`);
console.log(`Last few returns: ${returns.slice(-5).map(r => r.toFixed(6)).join(', ')}\n`);

// Function to compare values with tolerance
function compareValue(jsValue, pythonValue, metric, tolerance = 0.0001) {
  const diff = Math.abs(jsValue - pythonValue);
  const relativeError = Math.abs(diff / pythonValue);
  const status = relativeError < tolerance ? '✅ MATCH' : '❌ DIFF';
  
  console.log(`${metric.padEnd(25)} | JS: ${jsValue.toFixed(6).padStart(12)} | Python: ${pythonValue.toFixed(6).padStart(12)} | Diff: ${diff.toFixed(6).padStart(10)} | ${status}`);
  
  return relativeError < tolerance;
}

console.log('=== CORE METRICS COMPARISON ===');
console.log('Metric'.padEnd(25) + ' | ' + 'JavaScript'.padStart(12) + ' | ' + 'Python'.padStart(12) + ' | ' + 'Difference'.padStart(10) + ' | Status');
console.log('-'.repeat(80));

try {
  // Find Python metrics - they're in the metrics object
  const pythonData = pythonResults[0];
  const pythonMetrics = pythonData.metrics;
  
  // Helper function to parse percentage strings
  function parsePercent(str) {
    if (typeof str !== 'string') return str;
    return parseFloat(str.replace('%', '')) / 100;
  }
  
  // Helper function to parse regular number strings
  function parseNumber(str) {
    if (typeof str !== 'string') return str;
    return parseFloat(str.replace('%', ''));
  }
  
  let matchCount = 0;
  let totalTests = 0;
  
  // Test each metric with proper parsing
  if (pythonMetrics['Cumulative Return']) {
    const jsValue = stats.compoundReturn(returns);
    const pythonValue = parsePercent(pythonMetrics['Cumulative Return']);
    if (compareValue(jsValue, pythonValue, 'Total Return')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['CAGR﹪']) {
    const jsValue = stats.cagr(returns);
    const pythonValue = parsePercent(pythonMetrics['CAGR﹪']);
    if (compareValue(jsValue, pythonValue, 'CAGR')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Volatility (ann.)']) {
    const jsValue = stats.volatility(returns);
    const pythonValue = parsePercent(pythonMetrics['Volatility (ann.)']);
    if (compareValue(jsValue, pythonValue, 'Volatility')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Sharpe']) {
    const jsValue = stats.sharpe(returns);
    const pythonValue = parseNumber(pythonMetrics['Sharpe']);
    if (compareValue(jsValue, pythonValue, 'Sharpe Ratio')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Sortino']) {
    const jsValue = stats.sortino(returns);
    const pythonValue = parseNumber(pythonMetrics['Sortino']);
    if (compareValue(jsValue, pythonValue, 'Sortino Ratio')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Max Drawdown']) {
    const jsValue = stats.maxDrawdown(returns);
    const pythonValue = parsePercent(pythonMetrics['Max Drawdown']);
    if (compareValue(jsValue, pythonValue, 'Max Drawdown')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Calmar']) {
    const jsValue = stats.calmar(returns);
    const pythonValue = parseNumber(pythonMetrics['Calmar']);
    if (compareValue(jsValue, pythonValue, 'Calmar Ratio')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Profit Factor']) {
    const jsValue = stats.profitFactor(returns);
    const pythonValue = parseNumber(pythonMetrics['Profit Factor']);
    if (compareValue(jsValue, pythonValue, 'Profit Factor')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Kelly Criterion']) {
    const jsValue = stats.kelly(returns);
    const pythonValue = parsePercent(pythonMetrics['Kelly Criterion']);
    if (compareValue(jsValue, pythonValue, 'Kelly Criterion')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Skew']) {
    const jsValue = stats.skew(returns);
    const pythonValue = parseNumber(pythonMetrics['Skew']);
    if (compareValue(jsValue, pythonValue, 'Skewness')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Kurtosis']) {
    const jsValue = stats.kurtosis(returns);
    const pythonValue = parseNumber(pythonMetrics['Kurtosis']);
    if (compareValue(jsValue, pythonValue, 'Kurtosis')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Daily Value-at-Risk']) {
    const jsValue = stats.valueAtRisk(returns, 1, 0.95);
    const pythonValue = parsePercent(pythonMetrics['Daily Value-at-Risk']);
    if (compareValue(jsValue, pythonValue, 'VaR (95%)')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Expected Shortfall (cVaR)']) {
    const jsValue = stats.cvar(returns, 1, 0.95);
    const pythonValue = parsePercent(pythonMetrics['Expected Shortfall (cVaR)']);
    if (compareValue(jsValue, pythonValue, 'CVaR (95%)')) matchCount++;
    totalTests++;
  }
  
  if (pythonMetrics['Omega']) {
    const jsValue = stats.omega(returns);
    const pythonValue = parseNumber(pythonMetrics['Omega']);
    if (compareValue(jsValue, pythonValue, 'Omega Ratio')) matchCount++;
    totalTests++;
  }
  
  console.log('-'.repeat(80));
  console.log(`PARITY SCORE: ${matchCount}/${totalTests} (${((matchCount/totalTests)*100).toFixed(1)}%)`);
  
  if (matchCount === totalTests) {
    console.log('🎉 PERFECT PARITY ACHIEVED!');
  } else {
    console.log('⚠️  PARITY ISSUES DETECTED - Need to fix calculations');
  }
  
  // Show all available Python metrics for reference
  console.log('\n=== AVAILABLE PYTHON METRICS ===');
  console.log('Python calculated these metrics:');
  Object.keys(pythonMetrics).forEach(key => {
    if (pythonMetrics[key] && pythonMetrics[key] !== '') {
      console.log(`  "${key}": ${pythonMetrics[key]}`);
    }
  });
  
} catch (error) {
  console.error('Error during calculation:', error);
  console.error('Stack:', error.stack);
}
