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
 * Convert returns to prices
 * Exactly matches Python to_prices function
 * @param {Array} returns - Returns array
 * @param {number} base - Base price (default 100000)
 * @returns {Array} Price series
 */
function toPrices(returns, base = 100000) {
  if (returns.length === 0) {
    return [];
  }
  
  // Python: base + base * compsum(returns)
  // where compsum(returns) = returns.add(1).cumprod() - 1
  const prices = [base];
  let cumulative = 1;
  
  for (let i = 0; i < returns.length; i++) {
    cumulative *= (1 + returns[i]);
    prices.push(base + base * (cumulative - 1));
  }
  
  return prices.slice(1); // Remove the initial base value
}

/**
 * Calculate total compounded returns
 * Exactly matches Python comp() function
 * @param {Array} returns - Returns array
 * @returns {number} Total compounded return
 */
function comp(returns) {
  if (returns.length === 0) {
    return 0;
  }
  // Python: returns.add(1).prod() - 1
  return returns.reduce((prod, ret) => prod * (1 + ret), 1) - 1;
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @param {Array} dates - Optional dates array for proper time calculation
 * @returns {number} CAGR
 */
export function cagr(returns, rfRate = 0, nans = false, dates = null) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  // Calculate total return using comp() function to match Python
  const totalReturn = comp(cleanReturns);
  
  // Calculate years - match Python's method
  let years;
  if (dates && dates.length >= 2) {
    // Use actual calendar days like Python: (returns.index[-1] - returns.index[0]).days / 365
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    years = daysDiff / 365;
  } else {
    // Fallback to trading days method
    years = cleanReturns.length / TRADING_DAYS_PER_YEAR;
  }
  
  if (years === 0) {
    return 0;
  }
  
  // CAGR = abs(total + 1.0) ^ (1/years) - 1 (match Python exactly)
  return Math.pow(Math.abs(totalReturn + 1.0), 1 / years) - 1;
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
  
  if (cleanReturns.length === 1) {
    return 0; // Cannot calculate Sharpe ratio with single value
  }
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  
  // Use sample standard deviation (ddof=1) like Python
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (cleanReturns.length - 1);
  const std = Math.sqrt(variance);
  
  if (std === 0) {
    return 0;
  }
  
  // Correct annualized Sharpe ratio: (mean / std) * sqrt(252)
  return (mean / std) * Math.sqrt(TRADING_DAYS_PER_YEAR);
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
  
  if (cleanReturns.length === 1) {
    return 0; // Cannot calculate Sortino ratio with single value
  }
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  
  // Calculate downside deviation (only negative returns)
  const negativeReturns = cleanReturns.filter(ret => ret < 0);
  
  if (negativeReturns.length === 0) {
    return Infinity;
  }
  
  // Use sample standard deviation approach (ddof=1 equivalent)
  const downsideVariance = negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / (cleanReturns.length - 1);
  const downsideStd = Math.sqrt(downsideVariance);
  
  if (downsideStd === 0) {
    return 0;
  }
  
  // Correct annualized Sortino ratio: (mean / downside_std) * sqrt(252)
  return (mean / downsideStd) * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/**
 * Calculate Calmar Ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @param {Array} dates - Optional dates array for proper time calculation
 * @returns {number} Calmar ratio
 */
export function calmar(returns, rfRate = 0, nans = false, dates = null) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  const annualizedReturn = cagr(cleanReturns, 0, nans, dates);
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
  
  if (cleanReturns.length === 1) {
    return 0; // Cannot calculate volatility with single value
  }
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  
  // Use sample standard deviation (ddof=1) like Python
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (cleanReturns.length - 1);
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
/**
 * Calculate maximum drawdown
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Maximum drawdown
 */
export function maxDrawdown(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  // Convert returns to prices like Python's _prepare_prices
  const prices = toPrices(cleanReturns);
  
  // Calculate expanding max and drawdown like Python
  // Python: (prices / prices.expanding(min_periods=0).max()).min() - 1
  const expandingMax = [];
  let currentMax = prices[0];
  
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] > currentMax) {
      currentMax = prices[i];
    }
    expandingMax.push(currentMax);
  }
  
  // Calculate drawdown series
  const drawdowns = prices.map((price, i) => price / expandingMax[i] - 1);
  
  // Return minimum drawdown
  return Math.min(...drawdowns);
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
  const n = cleanReturns.length;
  
  if (n <= 1) {
    return 0;
  }
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / n;
  // Use sample standard deviation (divide by n-1)
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  
  if (std === 0) {
    return 0;
  }
  
  // Calculate sample skewness with bias correction
  const skewness = cleanReturns.reduce((sum, ret) => sum + Math.pow((ret - mean) / std, 3), 0) / n;
  
  // Apply bias correction factor (matches pandas)
  const biasCorrection = Math.sqrt(n * (n - 1)) / (n - 2);
  
  return n <= 2 ? 0 : skewness * biasCorrection;
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
  const n = cleanReturns.length;
  
  if (n <= 1) {
    return 0;
  }
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / n;
  // Use sample standard deviation (divide by n-1)
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  
  if (std === 0) {
    return 0;
  }
  
  // Calculate sample kurtosis with bias correction
  const kurtosis = cleanReturns.reduce((sum, ret) => sum + Math.pow((ret - mean) / std, 4), 0) / n;
  
  // Apply bias correction factor (matches pandas)
  const biasCorrection = (n - 1) * ((n + 1) * kurtosis - 3 * (n - 1)) / ((n - 2) * (n - 3));
  
  // Return excess kurtosis (pandas default)
  return n <= 3 ? 0 : biasCorrection;
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
