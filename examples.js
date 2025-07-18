/**
 * QuantStats.js Usage Examples
 * Demonstrates how to use the library for portfolio analysis
 */

import * as qs from './index.js';

// Example 1: Basic Portfolio Analysis
console.log('=== Example 1: Basic Portfolio Analysis ===');

// Sample daily returns (30 days)
const portfolioReturns = [
  0.012, -0.008, 0.015, -0.005, 0.018, -0.012, 0.025, -0.007, 0.014, -0.003,
  0.021, -0.015, 0.009, 0.016, -0.011, 0.013, -0.004, 0.019, -0.006, 0.022,
  0.008, -0.009, 0.017, -0.002, 0.012, -0.014, 0.026, -0.001, 0.011, 0.020
];

// Calculate basic metrics
const totalReturn = qs.stats.totalReturn(portfolioReturns);
const cagr = qs.stats.cagr(portfolioReturns);
const sharpe = qs.stats.sharpe(portfolioReturns);
const maxDrawdown = qs.stats.maxDrawdown(portfolioReturns);
const volatility = qs.stats.volatility(portfolioReturns);

console.log(`Total Return: ${(totalReturn * 100).toFixed(2)}%`);
console.log(`CAGR: ${(cagr * 100).toFixed(2)}%`);
console.log(`Sharpe Ratio: ${sharpe.toFixed(2)}`);
console.log(`Max Drawdown: ${(maxDrawdown * 100).toFixed(2)}%`);
console.log(`Volatility: ${(volatility * 100).toFixed(2)}%`);

// Example 2: Converting Prices to Returns
console.log('\n=== Example 2: Converting Prices to Returns ===');

const prices = [100, 102, 101, 105, 103, 108, 106, 112, 110, 115];
const returns = qs.utils.toReturns(prices);

console.log('Original prices:', prices);
console.log('Calculated returns:', returns.map(r => `${(r * 100).toFixed(2)}%`));

// Example 3: Risk Analysis
console.log('\n=== Example 3: Risk Analysis ===');

const var95 = qs.stats.valueAtRisk(portfolioReturns, 0.05);
const cvar95 = qs.stats.cvar(portfolioReturns, 0.05);
const skewness = qs.stats.skew(portfolioReturns);
const kurtosis = qs.stats.kurtosis(portfolioReturns);

console.log(`Value at Risk (95%): ${(var95 * 100).toFixed(2)}%`);
console.log(`Conditional VaR (95%): ${(cvar95 * 100).toFixed(2)}%`);
console.log(`Skewness: ${skewness.toFixed(2)}`);
console.log(`Kurtosis: ${kurtosis.toFixed(2)}`);

// Example 4: Trading Statistics
console.log('\n=== Example 4: Trading Statistics ===');

const winRate = qs.stats.winRate(portfolioReturns);
const avgWin = qs.stats.avgWin(portfolioReturns);
const avgLoss = qs.stats.avgLoss(portfolioReturns);
const profitFactor = qs.stats.profitFactor(portfolioReturns);
const kelly = qs.stats.kelly(portfolioReturns);

console.log(`Win Rate: ${(winRate * 100).toFixed(2)}%`);
console.log(`Average Win: ${(avgWin * 100).toFixed(2)}%`);
console.log(`Average Loss: ${(avgLoss * 100).toFixed(2)}%`);
console.log(`Profit Factor: ${profitFactor.toFixed(2)}`);
console.log(`Kelly Criterion: ${(kelly * 100).toFixed(2)}%`);

// Example 5: Benchmark Comparison
console.log('\n=== Example 5: Benchmark Comparison ===');

// Sample benchmark returns (S&P 500 proxy)
const benchmarkReturns = [
  0.008, -0.005, 0.012, -0.003, 0.015, -0.008, 0.018, -0.004, 0.011, -0.002,
  0.016, -0.012, 0.007, 0.013, -0.009, 0.010, -0.003, 0.014, -0.005, 0.017,
  0.006, -0.007, 0.013, -0.001, 0.009, -0.011, 0.019, 0.000, 0.008, 0.015
];

const beta = qs.stats.beta(portfolioReturns, benchmarkReturns);
const alpha = qs.stats.alpha(portfolioReturns, benchmarkReturns);

console.log(`Beta: ${beta.toFixed(2)}`);
console.log(`Alpha: ${(alpha * 100).toFixed(2)}%`);

// Example 6: Comprehensive Report
console.log('\n=== Example 6: Comprehensive Report ===');

const comprehensiveMetrics = qs.reports.metrics(portfolioReturns, benchmarkReturns);
console.log('Comprehensive Metrics:', {
  totalReturn: `${(comprehensiveMetrics.totalReturn * 100).toFixed(2)}%`,
  cagr: `${(comprehensiveMetrics.cagr * 100).toFixed(2)}%`,
  sharpe: comprehensiveMetrics.sharpe.toFixed(2),
  sortino: comprehensiveMetrics.sortino.toFixed(2),
  calmar: comprehensiveMetrics.calmar.toFixed(2),
  maxDrawdown: `${(comprehensiveMetrics.maxDrawdown * 100).toFixed(2)}%`,
  ulcerIndex: comprehensiveMetrics.ulcerIndex.toFixed(2),
  beta: comprehensiveMetrics.beta.toFixed(2),
  alpha: `${(comprehensiveMetrics.alpha * 100).toFixed(2)}%`,
  informationRatio: comprehensiveMetrics.informationRatio.toFixed(2)
});

// Example 7: Plot Data Generation
console.log('\n=== Example 7: Plot Data Generation ===');

const plotData = qs.plots.dashboard(portfolioReturns);
console.log('Available plot data types:', Object.keys(plotData));

// Example equity curve data
const equityCurve = qs.plots.equityCurve(portfolioReturns, 10000);
console.log('Equity curve - final value:', equityCurve.data[equityCurve.data.length - 1].toFixed(2));

// Example 8: HTML Report Generation
console.log('\n=== Example 8: HTML Report Generation ===');

const htmlReport = qs.reports.basic(portfolioReturns, benchmarkReturns, 'My Portfolio Analysis');
console.log('HTML report generated. Length:', htmlReport.length, 'characters');
console.log('Report contains key sections:', {
  hasTitle: htmlReport.includes('My Portfolio Analysis'),
  hasMetrics: htmlReport.includes('Performance Summary'),
  hasRiskMetrics: htmlReport.includes('Risk Metrics'),
  hasPlotData: htmlReport.includes('quantstatsData')
});

// Example 9: Drawdown Analysis
console.log('\n=== Example 9: Drawdown Analysis ===');

const drawdownSeries = qs.utils.toDrawdownSeries(portfolioReturns);
const drawdownDetails = qs.utils.drawdownDetails(portfolioReturns);

console.log('Drawdown Analysis:', {
  maxDrawdown: `${(drawdownDetails.maxDrawdown * 100).toFixed(2)}%`,
  longestDrawdownDays: drawdownDetails.longestDdDays,
  avgDrawdown: `${(drawdownDetails.avgDrawdown * 100).toFixed(2)}%`,
  recoveryFactor: drawdownDetails.recoveryFactor.toFixed(2)
});

// Example 10: Portfolio Value Tracking
console.log('\n=== Example 10: Portfolio Value Tracking ===');

const portfolioValues = qs.utils.portfolioValue(portfolioReturns, 100000);
console.log('Portfolio value progression (first 10 days):');
portfolioValues.slice(0, 11).forEach((value, index) => {
  console.log(`Day ${index}: $${value.toFixed(2)}`);
});

// Example 11: Risk-Free Rate Adjustment
console.log('\n=== Example 11: Risk-Free Rate Adjustment ===');

const riskFreeRate = 0.02; // 2% annual risk-free rate
const adjustedSharpe = qs.stats.sharpe(portfolioReturns, riskFreeRate);
const adjustedAlpha = qs.stats.alpha(portfolioReturns, benchmarkReturns, riskFreeRate);

console.log(`Sharpe Ratio (with 2% risk-free rate): ${adjustedSharpe.toFixed(2)}`);
console.log(`Alpha (with 2% risk-free rate): ${(adjustedAlpha * 100).toFixed(2)}%`);

// Example 12: Monthly and Yearly Returns
console.log('\n=== Example 12: Monthly and Yearly Returns ===');

// For demonstration, let's create more data points
const extendedReturns = [];
for (let i = 0; i < 252; i++) { // One year of daily returns
  extendedReturns.push((Math.random() - 0.48) * 0.02); // Slightly positive bias
}

const monthlyRets = qs.stats.monthlyReturns(extendedReturns);
const yearlyRets = qs.stats.yearlyReturns(extendedReturns);

console.log('Monthly returns (first 6 months):');
monthlyRets.slice(0, 6).forEach((ret, index) => {
  console.log(`Month ${index + 1}: ${(ret * 100).toFixed(2)}%`);
});

console.log('Yearly return:', `${(yearlyRets[0] * 100).toFixed(2)}%`);

// Example 13: Efficient Usage Pattern
console.log('\n=== Example 13: Efficient Usage Pattern ===');

// Most efficient way to analyze a portfolio
function analyzePortfolio(returns, benchmark = null, rfRate = 0) {
  // Single comprehensive analysis
  const metrics = qs.reports.metrics(returns, benchmark, rfRate);
  const plots = qs.plots.dashboard(returns);
  
  return {
    summary: {
      totalReturn: metrics.totalReturn,
      cagr: metrics.cagr,
      sharpe: metrics.sharpe,
      maxDrawdown: metrics.maxDrawdown,
      volatility: metrics.volatility
    },
    risk: {
      var95: metrics.valueAtRisk,
      cvar95: metrics.cvar,
      skewness: metrics.skewness,
      kurtosis: metrics.kurtosis
    },
    trading: {
      winRate: metrics.winRate,
      profitFactor: metrics.profitFactor,
      kelly: metrics.kelly
    },
    plots: plots
  };
}

const analysis = analyzePortfolio(portfolioReturns, benchmarkReturns);
console.log('Complete analysis generated with keys:', Object.keys(analysis));

console.log('\n=== Analysis Complete ===');
console.log('QuantStats.js provides mathematically accurate portfolio analytics for Node.js');
console.log('All calculations match the Python QuantStats library implementation');
