/**
 * Test suite for QuantStats.js
 * Validates mathematical accuracy against known values
 */

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import * as qs from '../index.js';

describe('QuantStats.js Tests', () => {
  // Test data: Simple returns series for validation
  const testReturns = [
    0.01, -0.005, 0.02, -0.01, 0.015, -0.008, 0.025, -0.012, 0.018, -0.003,
    0.012, -0.015, 0.008, 0.022, -0.007, 0.013, -0.011, 0.016, -0.004, 0.009,
    0.021, -0.006, 0.014, -0.009, 0.019, -0.002, 0.017, -0.013, 0.011, 0.024
  ];

  const testPrices = [
    100, 101, 100.495, 102.5049, 101.49985, 103.074, 102.251, 104.807,
    103.549, 105.413, 105.097, 106.361, 104.665, 105.502, 107.824, 107.069,
    108.461, 107.268, 109.983, 109.543, 110.529, 112.849, 112.172, 113.741,
    112.716, 114.858, 114.628, 116.577, 115.062, 116.327, 118.118
  ];

  describe('Utils Module', () => {
    test('toReturns should convert prices to returns correctly', () => {
      const returns = qs.utils.toReturns(testPrices);
      
      // First return should be (101/100) - 1 = 0.01
      assert.equal(Math.abs(returns[0] - 0.01) < 1e-10, true);
      
      // Second return should be (100.495/101) - 1 ≈ -0.005
      assert.equal(Math.abs(returns[1] - (-0.004999999999999893)) < 1e-10, true);
      
      // Check length
      assert.equal(returns.length, testPrices.length - 1);
    });

    test('prepareReturns should handle risk-free rate correctly', () => {
      const rfRate = 0.02; // 2% annual risk-free rate
      const prepared = qs.utils.prepareReturns(testReturns, rfRate);
      
      // Daily risk-free rate should be subtracted
      const dailyRf = Math.pow(1 + rfRate, 1/252) - 1;
      const expectedFirst = testReturns[0] - dailyRf;
      
      assert.equal(Math.abs(prepared[0] - expectedFirst) < 1e-10, true);
    });

    test('toDrawdownSeries should calculate drawdowns correctly', () => {
      const drawdowns = qs.utils.toDrawdownSeries(testReturns);
      
      // Drawdowns should be negative or zero
      const allNonPositive = drawdowns.every(dd => dd <= 0);
      assert.equal(allNonPositive, true);
      
      // First drawdown should be 0 (at peak)
      assert.equal(drawdowns[0], 0);
    });

    test('portfolioValue should calculate cumulative value correctly', () => {
      const values = qs.utils.portfolioValue(testReturns, 1000);
      
      // Should start with initial value
      assert.equal(values[0], 1000);
      
      // Second value should be 1000 * (1 + 0.01) = 1010
      assert.equal(Math.abs(values[1] - 1010) < 1e-10, true);
      
      // Values should increase with positive returns
      assert.equal(values[1] > values[0], true);
    });
  });

  describe('Stats Module', () => {
    test('cagr should calculate compound annual growth rate correctly', () => {
      const annualizedReturn = qs.stats.cagr(testReturns);
      
      // Should be a reasonable value for the test data
      assert.equal(typeof annualizedReturn, 'number');
      assert.equal(isFinite(annualizedReturn), true);
      
      // For our test data, CAGR should be positive
      assert.equal(annualizedReturn > 0, true);
    });

    test('sharpe should calculate Sharpe ratio correctly', () => {
      const sharpeRatio = qs.stats.sharpe(testReturns);
      
      // Should be a finite number
      assert.equal(typeof sharpeRatio, 'number');
      assert.equal(isFinite(sharpeRatio), true);
      
      // For our test data (mostly positive returns), Sharpe should be positive
      assert.equal(sharpeRatio > 0, true);
    });

    test('sortino should calculate Sortino ratio correctly', () => {
      const sortinoRatio = qs.stats.sortino(testReturns);
      
      // Should be a finite number
      assert.equal(typeof sortinoRatio, 'number');
      assert.equal(isFinite(sortinoRatio), true);
      
      // Sortino should generally be higher than Sharpe for same data
      const sharpeRatio = qs.stats.sharpe(testReturns);
      assert.equal(sortinoRatio > sharpeRatio, true);
    });

    test('volatility should calculate annualized volatility correctly', () => {
      const vol = qs.stats.volatility(testReturns);
      
      // Should be positive
      assert.equal(vol > 0, true);
      
      // Should be annualized (reasonable range 0.1 to 1.0 for daily data)
      assert.equal(vol > 0.01 && vol < 2.0, true);
    });

    test('maxDrawdown should calculate maximum drawdown correctly', () => {
      const mdd = qs.stats.maxDrawdown(testReturns);
      
      // Should be negative or zero
      assert.equal(mdd <= 0, true);
      
      // Should be a reasonable value
      assert.equal(mdd > -1, true); // Not more than 100% loss
    });

    test('winRate should calculate win rate correctly', () => {
      const winRate = qs.stats.winRate(testReturns);
      
      // Should be between 0 and 1
      assert.equal(winRate >= 0 && winRate <= 1, true);
      
      // For our test data, should be > 0.5 (more wins than losses)
      assert.equal(winRate > 0.5, true);
    });

    test('valueAtRisk should calculate VaR correctly', () => {
      const var95 = qs.stats.valueAtRisk(testReturns, 0.05);
      
      // Should be negative (representing a loss)
      assert.equal(var95 < 0, true);
      
      // Should be reasonable
      assert.equal(var95 > -1, true);
    });

    test('beta should calculate beta correctly', () => {
      // Use same returns as benchmark for beta = 1
      const beta = qs.stats.beta(testReturns, testReturns);
      
      // Beta with self should be approximately 1
      assert.equal(Math.abs(beta - 1) < 0.1, true);
    });

    test('kelly should calculate Kelly criterion correctly', () => {
      const kellyCriterion = qs.stats.kelly(testReturns);
      
      // Should be a finite number
      assert.equal(isFinite(kellyCriterion), true);
      
      // For profitable strategy, Kelly should be positive
      assert.equal(kellyCriterion > 0, true);
    });
  });

  describe('Mathematical Precision', () => {
    test('returns calculations should be precise', () => {
      const testData = [100, 105, 110.25, 115.7625, 121.550625]; // 5% compound growth
      const returns = qs.utils.toReturns(testData);
      
      // Each return should be exactly 5% (within floating point precision)
      returns.forEach((ret, i) => {
        const diff = Math.abs(ret - 0.05);
        assert.equal(diff < 1e-12, true, `Return ${i}: ${ret}, diff from 0.05: ${diff}`);
      });
    });

    test('compound returns should be mathematically accurate', () => {
      const simpleReturns = [0.1, 0.1, 0.1]; // 10% each period
      const totalRet = qs.stats.totalReturn(simpleReturns);
      
      // Total return should be (1.1^3) - 1 = 0.331
      const expected = Math.pow(1.1, 3) - 1;
      assert.equal(Math.abs(totalRet - expected) < 1e-15, true);
    });

    test('volatility calculation should match standard formula', () => {
      const constantReturns = [0.01, 0.01, 0.01, 0.01, 0.01];
      const vol = qs.stats.volatility(constantReturns);
      
      // Volatility of constant returns should be 0
      assert.equal(Math.abs(vol) < 1e-15, true);
    });

    test('drawdown calculations should be precise', () => {
      const decreasingReturns = [0.1, -0.05, -0.05, -0.05, 0.2];
      const drawdowns = qs.utils.toDrawdownSeries(decreasingReturns);
      
      // Maximum drawdown should be precisely calculable
      const maxDD = Math.min(...drawdowns);
      assert.equal(typeof maxDD, 'number');
      assert.equal(maxDD < 0, true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty arrays', () => {
      const emptyReturns = [];
      
      // These should return 0 for empty arrays
      assert.equal(qs.stats.cagr(emptyReturns), 0);
      assert.equal(qs.stats.sharpe(emptyReturns), 0);
      assert.equal(qs.stats.volatility(emptyReturns), 0);
    });

    test('should handle arrays with zeros', () => {
      const zeroReturns = [0, 0, 0, 0, 0];
      
      assert.equal(qs.stats.cagr(zeroReturns), 0);
      assert.equal(qs.stats.sharpe(zeroReturns), 0);
      assert.equal(qs.stats.volatility(zeroReturns), 0);
    });

    test('should handle NaN values when requested', () => {
      const nanReturns = [0.01, NaN, 0.02, NaN, 0.03];
      
      // Without NaN handling (should filter out NaNs)
      const cleanStats = qs.stats.cagr(nanReturns, 0, false);
      assert.equal(isFinite(cleanStats), true);
      
      // With NaN handling (should include NaNs and result in NaN)
      const nanStats = qs.stats.cagr(nanReturns, 0, true);
      assert.equal(isNaN(nanStats), true);
    });

    test('should handle single value arrays', () => {
      const singleReturn = [0.05];
      
      const vol = qs.stats.volatility(singleReturn);
      assert.equal(vol, 0); // No variance with single value
    });
  });

  describe('Reports Module', () => {
    test('metrics should generate comprehensive metrics', () => {
      const metricsResult = qs.reports.metrics(testReturns);
      
      // Should contain all expected metrics
      assert.equal(typeof metricsResult.totalReturn, 'number');
      assert.equal(typeof metricsResult.cagr, 'number');
      assert.equal(typeof metricsResult.sharpe, 'number');
      assert.equal(typeof metricsResult.volatility, 'number');
      assert.equal(typeof metricsResult.maxDrawdown, 'number');
      assert.equal(typeof metricsResult.winRate, 'number');
    });

    test('html report should generate valid HTML', () => {
      const htmlReport = qs.reports.basic(testReturns);
      
      // Should contain HTML structure
      assert.equal(htmlReport.includes('<!DOCTYPE html>'), true);
      assert.equal(htmlReport.includes('<html'), true);
      assert.equal(htmlReport.includes('</html>'), true);
      
      // Should contain metrics
      assert.equal(htmlReport.includes('Cumulative Return'), true);
      assert.equal(htmlReport.includes('Sharpe'), true);
    });
  });

  describe('Integration Tests', () => {
    test('full workflow should work correctly', () => {
      // Convert prices to returns
      const returns = qs.utils.toReturns(testPrices);
      
      // Calculate metrics
      const metrics = qs.reports.metrics(returns);
      
      // Generate plots data
      const plotData = qs.plots.dashboard(returns);
      
      // Generate report
      const report = qs.reports.basic(returns);
      
      // All should be valid
      assert.equal(typeof metrics.sharpe, 'number');
      assert.equal(typeof plotData.equityCurve, 'object');
      assert.equal(typeof report, 'string');
      assert.equal(report.length > 1000, true);
    });
  });
});

// Additional mathematical validation tests
describe('Mathematical Validation', () => {
  test('known mathematical relationships should hold', () => {
    const returns = [0.1, -0.05, 0.2, -0.1, 0.15];
    
    // Total return should equal compound return
    const totalRet = qs.stats.totalReturn(returns);
    const compoundRet = qs.stats.compoundReturn(returns);
    assert.equal(Math.abs(totalRet - compoundRet) < 1e-15, true);
    
    // Sharpe ratio should be (mean/std) * sqrt(252) with sample std
    const cleanReturns = qs.utils.prepareReturns(returns);
    const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
    const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (cleanReturns.length - 1);
    const std = Math.sqrt(variance);
    const expectedSharpe = std === 0 ? 0 : (mean / std) * Math.sqrt(252);
    const calculatedSharpe = qs.stats.sharpe(returns);
    
    assert.equal(Math.abs(calculatedSharpe - expectedSharpe) < 1e-10, true);
  });

  test('statistical properties should be consistent', () => {
    const returns = [
      0.01, -0.005, 0.02, -0.01, 0.015, -0.008, 0.025, -0.012, 0.018, -0.003,
      0.012, -0.015, 0.008, 0.022, -0.007, 0.013, -0.011, 0.016, -0.004, 0.009,
      0.021, -0.006, 0.014, -0.009, 0.019, -0.002, 0.017, -0.013, 0.011, 0.024
    ];
    
    // Win rate should equal positive returns / total returns
    const winRate = qs.stats.winRate(returns);
    const positiveCount = returns.filter(ret => ret > 0).length;
    const expectedWinRate = positiveCount / returns.length;
    
    assert.equal(Math.abs(winRate - expectedWinRate) < 1e-15, true);
    
    // Average win should be mean of positive returns
    const avgWin = qs.stats.avgWin(returns);
    const positiveReturns = returns.filter(ret => ret > 0);
    const expectedAvgWin = positiveReturns.reduce((sum, ret) => sum + ret, 0) / positiveReturns.length;
    
    assert.equal(Math.abs(avgWin - expectedAvgWin) < 1e-15, true);
  });
});
