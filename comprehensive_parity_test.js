import fs from 'fs';
import * as stats from './src/stats.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

// Load Python results and fix NaN values
let pythonContent = fs.readFileSync('python_quantstats_results.json', 'utf8');
pythonContent = pythonContent.replace(/NaN/g, 'null');
const pythonResults = JSON.parse(pythonContent);
const pythonMetrics = pythonResults[0].metrics;

console.log('=== COMPREHENSIVE PARITY TEST: JavaScript vs Python QuantStats ===\n');
console.log(`Strategy: ${rawData.strategy_name}`);
console.log(`Strategy SID: ${rawData.strategy_sid}`);
console.log(`Data points: ${returns.length}`);
console.log(`First few returns: ${returns.slice(0, 5).map(r => r.toFixed(6)).join(', ')}`);
console.log(`Last few returns: ${returns.slice(-5).map(r => r.toFixed(6)).join(', ')}\n`);

// Helper function to parse percentage strings
function parsePercent(str) {
  if (typeof str === 'string' && str.endsWith('%')) {
    return parseFloat(str.replace('%', '')) / 100;
  }
  return parseFloat(str);
}

// Helper function to compare values with tolerance
function compareValue(jsValue, pythonValue, metric, tolerance = 0.001) {
  const diff = Math.abs(jsValue - pythonValue);
  const relativeError = Math.abs(diff / pythonValue);
  const status = relativeError < tolerance ? '✅ MATCH' : '❌ DIFF';
  
  console.log(`${metric.padEnd(35)} | JS: ${jsValue.toFixed(6).padStart(12)} | Python: ${pythonValue.toFixed(6).padStart(12)} | Diff: ${diff.toFixed(6).padStart(10)} | ${status}`);
  
  return relativeError < tolerance;
}

console.log('=== COMPREHENSIVE METRICS COMPARISON ===');
console.log('Metric'.padEnd(35) + ' | ' + 'JavaScript'.padStart(12) + ' | ' + 'Python'.padStart(12) + ' | ' + 'Difference'.padStart(10) + ' | Status');
console.log('-'.repeat(95));

let matchCount = 0;
let totalTests = 0;

// Test all available metrics
const testResults = [];

try {
  // 1. Basic Return Metrics
  if (pythonMetrics['Cumulative Return']) {
    const jsValue = stats.totalReturn(returns);
    const pythonValue = parsePercent(pythonMetrics['Cumulative Return']);
    const match = compareValue(jsValue, pythonValue, 'Total Return');
    testResults.push({ metric: 'Total Return', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['CAGR﹪']) {
    const jsValue = stats.cagr(returns);
    const pythonValue = parsePercent(pythonMetrics['CAGR﹪']);
    const match = compareValue(jsValue, pythonValue, 'CAGR');
    testResults.push({ metric: 'CAGR', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Volatility (ann.)']) {
    const jsValue = stats.volatility(returns);
    const pythonValue = parsePercent(pythonMetrics['Volatility (ann.)']);
    const match = compareValue(jsValue, pythonValue, 'Volatility');
    testResults.push({ metric: 'Volatility', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 2. Risk-Adjusted Return Metrics
  if (pythonMetrics['Sharpe']) {
    const jsValue = stats.sharpe(returns);
    const pythonValue = parseFloat(pythonMetrics['Sharpe']);
    const match = compareValue(jsValue, pythonValue, 'Sharpe Ratio');
    testResults.push({ metric: 'Sharpe Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Sortino']) {
    const jsValue = stats.sortino(returns);
    const pythonValue = parseFloat(pythonMetrics['Sortino']);
    const match = compareValue(jsValue, pythonValue, 'Sortino Ratio');
    testResults.push({ metric: 'Sortino Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Calmar']) {
    const jsValue = stats.calmar(returns);
    const pythonValue = parseFloat(pythonMetrics['Calmar']);
    const match = compareValue(jsValue, pythonValue, 'Calmar Ratio');
    testResults.push({ metric: 'Calmar Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Omega']) {
    const jsValue = stats.omega(returns);
    const pythonValue = parseFloat(pythonMetrics['Omega']);
    const match = compareValue(jsValue, pythonValue, 'Omega Ratio');
    testResults.push({ metric: 'Omega Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 3. Drawdown Metrics
  if (pythonMetrics['Max Drawdown']) {
    const jsValue = stats.maxDrawdown(returns);
    const pythonValue = parsePercent(pythonMetrics['Max Drawdown']);
    const match = compareValue(jsValue, pythonValue, 'Max Drawdown');
    testResults.push({ metric: 'Max Drawdown', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Avg. Drawdown']) {
    const drawdowns = stats.drawdown(returns);
    const avgDD = drawdowns.reduce((sum, dd) => sum + dd, 0) / drawdowns.length;
    const pythonValue = parsePercent(pythonMetrics['Avg. Drawdown']);
    const match = compareValue(avgDD, pythonValue, 'Avg Drawdown');
    testResults.push({ metric: 'Avg Drawdown', js: avgDD, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Recovery Factor']) {
    const jsValue = stats.recoveryFactor(returns);
    const pythonValue = parseFloat(pythonMetrics['Recovery Factor']);
    const match = compareValue(jsValue, pythonValue, 'Recovery Factor');
    testResults.push({ metric: 'Recovery Factor', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Ulcer Index']) {
    const jsValue = stats.ulcerIndex(returns);
    const pythonValue = parseFloat(pythonMetrics['Ulcer Index']);
    const match = compareValue(jsValue, pythonValue, 'Ulcer Index');
    testResults.push({ metric: 'Ulcer Index', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Serenity Index']) {
    const jsValue = stats.serenityIndex(returns);
    const pythonValue = parseFloat(pythonMetrics['Serenity Index']);
    const match = compareValue(jsValue, pythonValue, 'Serenity Index');
    testResults.push({ metric: 'Serenity Index', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 4. Distribution Metrics
  if (pythonMetrics['Skew']) {
    const jsValue = stats.skew(returns);
    const pythonValue = parseFloat(pythonMetrics['Skew']);
    const match = compareValue(jsValue, pythonValue, 'Skewness');
    testResults.push({ metric: 'Skewness', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Kurtosis']) {
    const jsValue = stats.kurtosis(returns);
    const pythonValue = parseFloat(pythonMetrics['Kurtosis']);
    const match = compareValue(jsValue, pythonValue, 'Kurtosis');
    testResults.push({ metric: 'Kurtosis', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 5. Risk Metrics
  if (pythonMetrics['Daily Value-at-Risk']) {
    const jsValue = stats.valueAtRisk(returns, 1, 0.95);
    const pythonValue = parsePercent(pythonMetrics['Daily Value-at-Risk']);
    const match = compareValue(jsValue, pythonValue, 'VaR (95%)');
    testResults.push({ metric: 'VaR (95%)', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Expected Shortfall (cVaR)']) {
    const jsValue = stats.cvar(returns, 1, 0.95);
    const pythonValue = parsePercent(pythonMetrics['Expected Shortfall (cVaR)']);
    const match = compareValue(jsValue, pythonValue, 'CVaR (95%)');
    testResults.push({ metric: 'CVaR (95%)', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 6. Performance Metrics
  if (pythonMetrics['Kelly Criterion']) {
    const jsValue = stats.kelly(returns);
    const pythonValue = parsePercent(pythonMetrics['Kelly Criterion']);
    const match = compareValue(jsValue, pythonValue, 'Kelly Criterion');
    testResults.push({ metric: 'Kelly Criterion', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Profit Factor']) {
    const jsValue = stats.profitFactor(returns);
    const pythonValue = parseFloat(pythonMetrics['Profit Factor']);
    const match = compareValue(jsValue, pythonValue, 'Profit Factor');
    testResults.push({ metric: 'Profit Factor', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Payoff Ratio']) {
    const jsValue = stats.payoffRatio(returns);
    const pythonValue = parseFloat(pythonMetrics['Payoff Ratio']);
    const match = compareValue(jsValue, pythonValue, 'Payoff Ratio');
    testResults.push({ metric: 'Payoff Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Win Days']) {
    const jsValue = stats.winRate(returns);
    const pythonValue = parsePercent(pythonMetrics['Win Days']);
    const match = compareValue(jsValue, pythonValue, 'Win Rate');
    testResults.push({ metric: 'Win Rate', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 7. Consecutive Metrics
  if (pythonMetrics['Max Consecutive Wins']) {
    const jsValue = stats.consecutiveWins(returns);
    const pythonValue = parseFloat(pythonMetrics['Max Consecutive Wins']);
    const match = compareValue(jsValue, pythonValue, 'Max Consecutive Wins');
    testResults.push({ metric: 'Max Consecutive Wins', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Max Consecutive Losses']) {
    const jsValue = stats.consecutiveLosses(returns);
    const pythonValue = parseFloat(pythonMetrics['Max Consecutive Losses']);
    const match = compareValue(jsValue, pythonValue, 'Max Consecutive Losses');
    testResults.push({ metric: 'Max Consecutive Losses', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 8. Best/Worst Metrics
  if (pythonMetrics['Best Day']) {
    const jsValue = stats.best(returns);
    const pythonValue = parsePercent(pythonMetrics['Best Day']);
    const match = compareValue(jsValue, pythonValue, 'Best Day');
    testResults.push({ metric: 'Best Day', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Worst Day']) {
    const jsValue = stats.worst(returns);
    const pythonValue = parsePercent(pythonMetrics['Worst Day']);
    const match = compareValue(jsValue, pythonValue, 'Worst Day');
    testResults.push({ metric: 'Worst Day', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 9. Gain/Pain Metrics
  if (pythonMetrics['Gain/Pain Ratio']) {
    const jsValue = stats.gainToPainRatio(returns);
    const pythonValue = parseFloat(pythonMetrics['Gain/Pain Ratio']);
    const match = compareValue(jsValue, pythonValue, 'Gain/Pain Ratio');
    testResults.push({ metric: 'Gain/Pain Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 10. Tail Ratio
  if (pythonMetrics['Tail Ratio']) {
    const jsValue = stats.tailRatio(returns);
    const pythonValue = parseFloat(pythonMetrics['Tail Ratio']);
    const match = compareValue(jsValue, pythonValue, 'Tail Ratio');
    testResults.push({ metric: 'Tail Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 11. Outlier Ratios
  if (pythonMetrics['Outlier Win Ratio']) {
    const jsValue = stats.outlierWinRatio(returns);
    const pythonValue = parseFloat(pythonMetrics['Outlier Win Ratio']);
    const match = compareValue(jsValue, pythonValue, 'Outlier Win Ratio');
    testResults.push({ metric: 'Outlier Win Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Outlier Loss Ratio']) {
    const jsValue = stats.outlierLossRatio(returns);
    const pythonValue = parseFloat(pythonMetrics['Outlier Loss Ratio']);
    const match = compareValue(jsValue, pythonValue, 'Outlier Loss Ratio');
    testResults.push({ metric: 'Outlier Loss Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 12. CPC Index
  if (pythonMetrics['CPC Index']) {
    const jsValue = stats.cpcIndex(returns);
    const pythonValue = parseFloat(pythonMetrics['CPC Index']);
    const match = compareValue(jsValue, pythonValue, 'CPC Index');
    testResults.push({ metric: 'CPC Index', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 13. Common Sense Ratio
  if (pythonMetrics['Common Sense Ratio']) {
    const jsValue = stats.commonSenseRatio(returns);
    const pythonValue = parseFloat(pythonMetrics['Common Sense Ratio']);
    const match = compareValue(jsValue, pythonValue, 'Common Sense Ratio');
    testResults.push({ metric: 'Common Sense Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 14. Risk of Ruin
  if (pythonMetrics['Risk of Ruin']) {
    const jsValue = stats.riskOfRuin(returns);
    const pythonValue = parsePercent(pythonMetrics['Risk of Ruin']);
    const match = compareValue(jsValue, pythonValue, 'Risk of Ruin');
    testResults.push({ metric: 'Risk of Ruin', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 15. Expected Returns
  if (pythonMetrics['Expected Daily']) {
    const jsValue = stats.expectedReturn(returns);
    const pythonValue = parsePercent(pythonMetrics['Expected Daily']);
    const match = compareValue(jsValue, pythonValue, 'Expected Daily');
    testResults.push({ metric: 'Expected Daily', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 16. Smart Ratios
  if (pythonMetrics['Smart Sharpe']) {
    const jsValue = stats.smartSharpe(returns);
    const pythonValue = parseFloat(pythonMetrics['Smart Sharpe']);
    const match = compareValue(jsValue, pythonValue, 'Smart Sharpe');
    testResults.push({ metric: 'Smart Sharpe', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Smart Sortino']) {
    const jsValue = stats.smartSortino(returns);
    const pythonValue = parseFloat(pythonMetrics['Smart Sortino']);
    const match = compareValue(jsValue, pythonValue, 'Smart Sortino');
    testResults.push({ metric: 'Smart Sortino', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 17. Probabilistic Ratios
  if (pythonMetrics['Prob. Sharpe Ratio']) {
    const jsValue = stats.probabilisticSharpeRatio(returns);
    const pythonValue = parsePercent(pythonMetrics['Prob. Sharpe Ratio']);
    const match = compareValue(jsValue, pythonValue, 'Prob. Sharpe Ratio');
    testResults.push({ metric: 'Prob. Sharpe Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 18. Information Ratio
  if (pythonMetrics['Information Ratio']) {
    const jsValue = stats.informationRatio(returns);
    const pythonValue = parseFloat(pythonMetrics['Information Ratio']);
    const match = compareValue(jsValue, pythonValue, 'Information Ratio');
    testResults.push({ metric: 'Information Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 19. Treynor Ratio
  if (pythonMetrics['Treynor Ratio']) {
    const jsValue = stats.treynorRatio(returns);
    const pythonValue = parseFloat(pythonMetrics['Treynor Ratio']);
    const match = compareValue(jsValue, pythonValue, 'Treynor Ratio');
    testResults.push({ metric: 'Treynor Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 20. UPI (Ulcer Performance Index)
  if (pythonMetrics['UPI']) {
    const jsValue = stats.upi(returns);
    const pythonValue = parseFloat(pythonMetrics['UPI']);
    const match = compareValue(jsValue, pythonValue, 'UPI');
    testResults.push({ metric: 'UPI', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 21. Risk Return Ratio
  if (pythonMetrics['Risk Return Ratio']) {
    const jsValue = stats.riskReturnRatio(returns);
    const pythonValue = parseFloat(pythonMetrics['Risk Return Ratio']);
    const match = compareValue(jsValue, pythonValue, 'Risk Return Ratio');
    testResults.push({ metric: 'Risk Return Ratio', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 22. RAR (Risk-Adjusted Return)
  if (pythonMetrics['RAR']) {
    const jsValue = stats.rar(returns);
    const pythonValue = parseFloat(pythonMetrics['RAR']);
    const match = compareValue(jsValue, pythonValue, 'RAR');
    testResults.push({ metric: 'RAR', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 23. Win/Loss Ratios
  if (pythonMetrics['Win Month']) {
    const monthlyRets = stats.monthlyReturns(returns);
    const jsValue = stats.winRate(monthlyRets);
    const pythonValue = parsePercent(pythonMetrics['Win Month']);
    const match = compareValue(jsValue, pythonValue, 'Win Month');
    testResults.push({ metric: 'Win Month', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Win Year']) {
    const yearlyRets = stats.yearlyReturns(returns);
    const jsValue = stats.winRate(yearlyRets);
    const pythonValue = parsePercent(pythonMetrics['Win Year']);
    const match = compareValue(jsValue, pythonValue, 'Win Year');
    testResults.push({ metric: 'Win Year', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 24. Average Loss/Win
  if (pythonMetrics['Avg Loss']) {
    const jsValue = stats.avgLoss(returns);
    const pythonValue = parsePercent(pythonMetrics['Avg Loss']);
    const match = compareValue(jsValue, pythonValue, 'Avg Loss');
    testResults.push({ metric: 'Avg Loss', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Avg Win']) {
    const jsValue = stats.avgWin(returns);
    const pythonValue = parsePercent(pythonMetrics['Avg Win']);
    const match = compareValue(jsValue, pythonValue, 'Avg Win');
    testResults.push({ metric: 'Avg Win', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 25. Best/Worst Months and Years
  if (pythonMetrics['Best Month']) {
    const monthlyRets = stats.monthlyReturns(returns);
    const jsValue = stats.best(monthlyRets);
    const pythonValue = parsePercent(pythonMetrics['Best Month']);
    const match = compareValue(jsValue, pythonValue, 'Best Month');
    testResults.push({ metric: 'Best Month', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Worst Month']) {
    const monthlyRets = stats.monthlyReturns(returns);
    const jsValue = stats.worst(monthlyRets);
    const pythonValue = parsePercent(pythonMetrics['Worst Month']);
    const match = compareValue(jsValue, pythonValue, 'Worst Month');
    testResults.push({ metric: 'Worst Month', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Best Year']) {
    const yearlyRets = stats.yearlyReturns(returns);
    const jsValue = stats.best(yearlyRets);
    const pythonValue = parsePercent(pythonMetrics['Best Year']);
    const match = compareValue(jsValue, pythonValue, 'Best Year');
    testResults.push({ metric: 'Best Year', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  if (pythonMetrics['Worst Year']) {
    const yearlyRets = stats.yearlyReturns(returns);
    const jsValue = stats.worst(yearlyRets);
    const pythonValue = parsePercent(pythonMetrics['Worst Year']);
    const match = compareValue(jsValue, pythonValue, 'Worst Year');
    testResults.push({ metric: 'Worst Year', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

  // 26. Exposure
  if (pythonMetrics['Time in Market']) {
    const jsValue = stats.exposure(returns);
    const pythonValue = parsePercent(pythonMetrics['Time in Market']);
    const match = compareValue(jsValue, pythonValue, 'Time in Market');
    testResults.push({ metric: 'Time in Market', js: jsValue, python: pythonValue, match });
    if (match) matchCount++;
    totalTests++;
  }

} catch (error) {
  console.error('Error during testing:', error.message);
}

console.log('-'.repeat(95));
console.log(`COMPREHENSIVE PARITY SCORE: ${matchCount}/${totalTests} (${(matchCount/totalTests*100).toFixed(1)}%)`);

if (matchCount === totalTests) {
  console.log('🎉 PERFECT PARITY ACHIEVED! All metrics match Python implementation!');
} else if (matchCount / totalTests > 0.9) {
  console.log('🔥 EXCELLENT PARITY! Over 90% of metrics match Python implementation!');
} else if (matchCount / totalTests > 0.75) {
  console.log('✅ GOOD PARITY! Over 75% of metrics match Python implementation!');
} else if (matchCount / totalTests > 0.5) {
  console.log('⚠️  PARTIAL PARITY - Need to fix more calculations');
} else {
  console.log('❌ LOW PARITY - Major calculation issues detected');
}

// Summary of results
console.log('\\n=== SUMMARY BY CATEGORY ===');
const categories = {
  'Basic Returns': ['Total Return', 'CAGR', 'Volatility'],
  'Risk-Adjusted': ['Sharpe Ratio', 'Sortino Ratio', 'Calmar Ratio', 'Omega Ratio', 'Smart Sharpe', 'Smart Sortino'],
  'Probabilistic': ['Prob. Sharpe Ratio'],
  'Advanced Ratios': ['Information Ratio', 'Treynor Ratio', 'UPI', 'Risk Return Ratio', 'RAR'],
  'Drawdown': ['Max Drawdown', 'Avg Drawdown', 'Recovery Factor', 'Ulcer Index', 'Serenity Index'],
  'Distribution': ['Skewness', 'Kurtosis'],
  'Risk': ['VaR (95%)', 'CVaR (95%)'],
  'Performance': ['Kelly Criterion', 'Profit Factor', 'Payoff Ratio', 'Win Rate'],
  'Win/Loss': ['Win Month', 'Win Year', 'Avg Loss', 'Avg Win'],
  'Time Periods': ['Best Month', 'Worst Month', 'Best Year', 'Worst Year', 'Time in Market'],
  'Other': ['Max Consecutive Wins', 'Max Consecutive Losses', 'Best Day', 'Worst Day', 'Gain/Pain Ratio', 'Tail Ratio', 'Outlier Win Ratio', 'Outlier Loss Ratio', 'CPC Index', 'Common Sense Ratio', 'Risk of Ruin', 'Expected Daily']
};

Object.entries(categories).forEach(([category, metrics]) => {
  const categoryResults = testResults.filter(r => metrics.includes(r.metric));
  const categoryMatches = categoryResults.filter(r => r.match).length;
  const categoryTotal = categoryResults.length;
  const categoryPct = categoryTotal > 0 ? (categoryMatches / categoryTotal * 100).toFixed(1) : '0.0';
  
  console.log(`${category.padEnd(20)}: ${categoryMatches}/${categoryTotal} (${categoryPct}%)`);
});

console.log('\\n=== FAILED METRICS (for debugging) ===');
const failedMetrics = testResults.filter(r => !r.match);
failedMetrics.forEach(result => {
  const diff = Math.abs(result.js - result.python);
  const relativeError = Math.abs(diff / result.python * 100);
  console.log(`${result.metric.padEnd(25)}: ${relativeError.toFixed(2)}% error (JS: ${result.js.toFixed(6)}, Python: ${result.python.toFixed(6)})`);
});
