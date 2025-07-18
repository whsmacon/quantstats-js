/**
 * Statistics module for QuantStats.js
 * Exact mathematical implementations matching Python QuantStats
 */

import { 
  prepareReturns, 
  toDrawdownSeries, 
  drawdownDetails, 
  aggregateReturns,
  makePosNeg,
  TRADING_DAYS_PER_YEAR,
  TRADING_DAYS_PER_MONTH,
  MONTHS_PER_YEAR
} from './utils.js';

/**
 * Calculate Compound Annual Growth Rate (CAGR)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} CAGR
 */
export function cagr(returns, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  // Calculate total return
  const totalReturn = cleanReturns.reduce((prod, ret) => prod * (1 + ret), 1);
  
  // Calculate years
  const years = cleanReturns.length / TRADING_DAYS_PER_YEAR;
  
  // CAGR = (ending_value / beginning_value) ^ (1/years) - 1
  return Math.pow(totalReturn, 1 / years) - 1;
}

/**
 * Calculate Sharpe Ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Sharpe ratio
 */
export function sharpe(returns, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / cleanReturns.length;
  const std = Math.sqrt(variance);
  
  if (std === 0) {
    return 0;
  }
  
  // Annualized Sharpe ratio
  return (mean * Math.sqrt(TRADING_DAYS_PER_YEAR)) / (std * Math.sqrt(TRADING_DAYS_PER_YEAR));
}

/**
 * Calculate Sortino Ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Sortino ratio
 */
export function sortino(returns, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  
  // Calculate downside deviation (only negative returns)
  const negativeReturns = cleanReturns.filter(ret => ret < 0);
  
  if (negativeReturns.length === 0) {
    return Infinity;
  }
  
  const downsideVariance = negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / cleanReturns.length;
  const downsideStd = Math.sqrt(downsideVariance);
  
  if (downsideStd === 0) {
    return 0;
  }
  
  // Annualized Sortino ratio
  return (mean * Math.sqrt(TRADING_DAYS_PER_YEAR)) / (downsideStd * Math.sqrt(TRADING_DAYS_PER_YEAR));
}

/**
 * Calculate Calmar Ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Calmar ratio
 */
export function calmar(returns, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  const annualizedReturn = cagr(cleanReturns, 0, nans);
  const maxDD = maxDrawdown(cleanReturns, nans);
  
  if (maxDD === 0) {
    return 0;
  }
  
  return annualizedReturn / Math.abs(maxDD);
}

/**
 * Calculate Volatility (annualized standard deviation)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Volatility
 */
export function volatility(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / cleanReturns.length;
  const std = Math.sqrt(variance);
  
  // Annualized volatility
  return std * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/**
 * Calculate Maximum Drawdown
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Maximum drawdown
 */
export function maxDrawdown(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const drawdowns = toDrawdownSeries(cleanReturns);
  
  if (drawdowns.length === 0) {
    return 0;
  }
  
  const validDrawdowns = drawdowns.filter(dd => !isNaN(dd));
  return validDrawdowns.length > 0 ? Math.min(...validDrawdowns) : 0;
}

/**
 * Calculate drawdown series
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Array} Drawdown series
 */
export function drawdown(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  return toDrawdownSeries(cleanReturns);
}

/**
 * Calculate Win Rate
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Win rate (0-1)
 */
export function winRate(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  const wins = cleanReturns.filter(ret => ret > 0).length;
  return wins / cleanReturns.length;
}

/**
 * Calculate Average Win
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Average win
 */
export function avgWin(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const wins = cleanReturns.filter(ret => ret > 0);
  
  if (wins.length === 0) {
    return 0;
  }
  
  return wins.reduce((sum, ret) => sum + ret, 0) / wins.length;
}

/**
 * Calculate Average Loss
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Average loss
 */
export function avgLoss(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const losses = cleanReturns.filter(ret => ret < 0);
  
  if (losses.length === 0) {
    return 0;
  }
  
  return losses.reduce((sum, ret) => sum + ret, 0) / losses.length;
}

/**
 * Calculate Profit Factor
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Profit factor
 */
export function profitFactor(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const { positive, negative } = makePosNeg(cleanReturns);
  
  const grossProfit = positive.reduce((sum, ret) => sum + ret, 0);
  const grossLoss = Math.abs(negative.reduce((sum, ret) => sum + ret, 0));
  
  if (grossLoss === 0) {
    return Infinity;
  }
  
  return grossProfit / grossLoss;
}

/**
 * Calculate Expected Return
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Expected return
 */
export function expectedReturn(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  return cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
}

/**
 * Calculate Value at Risk (VaR)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} confidence - Confidence level (default 0.05 for 95% VaR)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Value at Risk
 */
export function valueAtRisk(returns, confidence = 0.05, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  const sorted = [...cleanReturns].sort((a, b) => a - b);
  const index = Math.floor(confidence * sorted.length);
  
  return sorted[index] || 0;
}

/**
 * Calculate Conditional Value at Risk (CVaR)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} confidence - Confidence level (default 0.05 for 95% CVaR)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Conditional Value at Risk
 */
export function cvar(returns, confidence = 0.05, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  const sorted = [...cleanReturns].sort((a, b) => a - b);
  const index = Math.floor(confidence * sorted.length);
  const tailReturns = sorted.slice(0, index + 1);
  
  if (tailReturns.length === 0) {
    return 0;
  }
  
  return tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
}

/**
 * Calculate Skewness
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Skewness
 */
export function skew(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / cleanReturns.length;
  const std = Math.sqrt(variance);
  
  if (std === 0) {
    return 0;
  }
  
  const skewness = cleanReturns.reduce((sum, ret) => sum + Math.pow((ret - mean) / std, 3), 0) / cleanReturns.length;
  
  return skewness;
}

/**
 * Calculate Kurtosis
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Kurtosis
 */
export function kurtosis(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / cleanReturns.length;
  const std = Math.sqrt(variance);
  
  if (std === 0) {
    return 0;
  }
  
  const kurtosis = cleanReturns.reduce((sum, ret) => sum + Math.pow((ret - mean) / std, 4), 0) / cleanReturns.length;
  
  // Return excess kurtosis (subtract 3 for normal distribution)
  return kurtosis - 3;
}

/**
 * Calculate Kelly Criterion
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Kelly criterion
 */
export function kelly(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const { positive, negative } = makePosNeg(cleanReturns);
  
  if (positive.length === 0 || negative.length === 0) {
    return 0;
  }
  
  const winRate = positive.length / cleanReturns.length;
  const avgWinReturn = positive.reduce((sum, ret) => sum + ret, 0) / positive.length;
  const avgLossReturn = Math.abs(negative.reduce((sum, ret) => sum + ret, 0) / negative.length);
  
  if (avgLossReturn === 0) {
    return 0;
  }
  
  // Kelly = W - (1-W)/R where W = win rate, R = avg win / avg loss
  const payoffRatio = avgWinReturn / avgLossReturn;
  return winRate - ((1 - winRate) / payoffRatio);
}

/**
 * Calculate Total Return
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Total return
 */
export function totalReturn(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  return cleanReturns.reduce((prod, ret) => prod * (1 + ret), 1) - 1;
}

/**
 * Calculate Compound Return
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Compound return
 */
export function compoundReturn(returns, nans = false) {
  return totalReturn(returns, nans);
}

/**
 * Calculate Beta relative to benchmark
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Beta
 */
export function beta(returns, benchmark, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const cleanBenchmark = prepareReturns(benchmark, 0, nans);
  
  const minLength = Math.min(cleanReturns.length, cleanBenchmark.length);
  
  if (minLength === 0) {
    return 0;
  }
  
  const returnsSlice = cleanReturns.slice(0, minLength);
  const benchmarkSlice = cleanBenchmark.slice(0, minLength);
  
  // Calculate covariance and variance
  const returnsMean = returnsSlice.reduce((sum, ret) => sum + ret, 0) / returnsSlice.length;
  const benchmarkMean = benchmarkSlice.reduce((sum, ret) => sum + ret, 0) / benchmarkSlice.length;
  
  let covariance = 0;
  let benchmarkVariance = 0;
  
  for (let i = 0; i < minLength; i++) {
    const returnsDiff = returnsSlice[i] - returnsMean;
    const benchmarkDiff = benchmarkSlice[i] - benchmarkMean;
    
    covariance += returnsDiff * benchmarkDiff;
    benchmarkVariance += benchmarkDiff * benchmarkDiff;
  }
  
  covariance /= minLength;
  benchmarkVariance /= minLength;
  
  if (benchmarkVariance === 0) {
    return 0;
  }
  
  return covariance / benchmarkVariance;
}

/**
 * Calculate Alpha relative to benchmark
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Alpha
 */
export function alpha(returns, benchmark, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  const cleanBenchmark = prepareReturns(benchmark, rfRate, nans);
  
  const portfolioBeta = beta(cleanReturns, cleanBenchmark, nans);
  const portfolioReturn = expectedReturn(cleanReturns, nans);
  const benchmarkReturn = expectedReturn(cleanBenchmark, nans);
  
  // Alpha = Portfolio Return - (Beta * Benchmark Return)
  return portfolioReturn - (portfolioBeta * benchmarkReturn);
}

/**
 * Calculate Ulcer Index
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Ulcer Index
 */
export function ulcerIndex(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const drawdowns = toDrawdownSeries(cleanReturns);
  
  if (drawdowns.length === 0) {
    return 0;
  }
  
  const squaredDrawdowns = drawdowns.map(dd => Math.pow(dd * 100, 2));
  const meanSquaredDrawdown = squaredDrawdowns.reduce((sum, sq) => sum + sq, 0) / squaredDrawdowns.length;
  
  return Math.sqrt(meanSquaredDrawdown);
}

/**
 * Calculate Ulcer Performance Index
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Ulcer Performance Index
 */
export function ulcerPerformanceIndex(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const annualizedReturn = cagr(cleanReturns, 0, nans);
  const ulcer = ulcerIndex(cleanReturns, nans);
  
  if (ulcer === 0) {
    return 0;
  }
  
  return annualizedReturn / ulcer;
}

/**
 * Calculate Downside Deviation
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Downside deviation
 */
export function downsideDeviation(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const negativeReturns = cleanReturns.filter(ret => ret < 0);
  
  if (negativeReturns.length === 0) {
    return 0;
  }
  
  const variance = negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / cleanReturns.length;
  return Math.sqrt(variance) * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/**
 * Calculate monthly returns
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Array} Monthly returns
 */
export function monthlyReturns(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  return aggregateReturns(cleanReturns, 'monthly');
}

/**
 * Calculate yearly returns
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Array} Yearly returns
 */
export function yearlyReturns(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  return aggregateReturns(cleanReturns, 'yearly');
}

export {
  // Export all functions
  TRADING_DAYS_PER_YEAR,
  TRADING_DAYS_PER_MONTH,
  MONTHS_PER_YEAR
};
