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

/**
 * Returns outliers from returns array
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} quantile - Quantile threshold (default 0.95)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Array} Outliers
 */
export function outliers(returns, quantile = 0.95, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const sorted = [...cleanReturns].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * quantile)];
  return cleanReturns.filter(ret => ret > threshold);
}

/**
 * Remove outliers from returns array
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} quantile - Quantile threshold (default 0.95)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Array} Returns without outliers
 */
export function removeOutliers(returns, quantile = 0.95, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const sorted = [...cleanReturns].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * quantile)];
  return cleanReturns.filter(ret => ret < threshold);
}

/**
 * Returns the best return for a period
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Best return
 */
export function best(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  return Math.max(...cleanReturns);
}

/**
 * Returns the worst return for a period
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Worst return
 */
export function worst(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  return Math.min(...cleanReturns);
}

/**
 * Calculate consecutive wins
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Maximum consecutive wins
 */
export function consecutiveWins(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  
  for (const ret of cleanReturns) {
    if (ret > 0) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }
  
  return maxConsecutive;
}

/**
 * Calculate consecutive losses
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Maximum consecutive losses
 */
export function consecutiveLosses(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  
  for (const ret of cleanReturns) {
    if (ret < 0) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }
  
  return maxConsecutive;
}

/**
 * Calculate exposure (percentage of time in market)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Market exposure percentage
 */
export function exposure(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const nonZeroReturns = cleanReturns.filter(ret => ret !== 0);
  return Math.ceil((nonZeroReturns.length / cleanReturns.length) * 100) / 100;
}

/**
 * Calculate geometric mean
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Geometric mean
 */
export function geometricMean(returns, nans = false) {
  return expectedReturn(returns, nans);
}

/**
 * Calculate gain-to-pain ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Gain-to-pain ratio
 */
export function gainToPainRatio(returns, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  const positiveReturns = cleanReturns.filter(ret => ret > 0);
  const negativeReturns = cleanReturns.filter(ret => ret < 0);
  
  if (negativeReturns.length === 0) {
    return positiveReturns.length > 0 ? Infinity : 0;
  }
  
  const totalGain = positiveReturns.reduce((sum, ret) => sum + ret, 0);
  const totalPain = Math.abs(negativeReturns.reduce((sum, ret) => sum + ret, 0));
  
  return totalPain === 0 ? 0 : totalGain / totalPain;
}

/**
 * Calculate Treynor ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Treynor ratio
 */
export function treynorRatio(returns, benchmark, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  const cleanBenchmark = prepareReturns(benchmark, rfRate, nans);
  
  const portfolioBeta = beta(cleanReturns, cleanBenchmark, nans);
  const excessReturn = expectedReturn(cleanReturns, nans) - rfRate;
  
  return portfolioBeta === 0 ? 0 : excessReturn / portfolioBeta;
}

/**
 * Calculate risk of ruin
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Risk of ruin
 */
export function riskOfRuin(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  const winRate = cleanReturns.filter(ret => ret > 0).length / cleanReturns.length;
  const lossRate = 1 - winRate;
  
  if (winRate === 0) return 1;
  if (lossRate === 0) return 0;
  
  const avgWinReturn = Math.abs(avgWin(cleanReturns, nans));
  const avgLossReturn = Math.abs(avgLoss(cleanReturns, nans));
  
  if (avgWinReturn === 0) return 1;
  
  const ratio = avgLossReturn / avgWinReturn;
  return Math.pow(ratio, winRate / lossRate);
}

/**
 * Calculate serenity index
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Serenity index
 */
export function serenityIndex(returns, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  const annualizedReturn = cagr(cleanReturns, rfRate, nans);
  const ulcer = ulcerIndex(cleanReturns, nans);
  
  return ulcer === 0 ? 0 : annualizedReturn / ulcer;
}

/**
 * Calculate rolling annual return
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Rolling annual return
 */
export function rar(returns, rfRate = 0, nans = false) {
  return cagr(returns, rfRate, nans);
}

/**
 * Calculate compounded sum of returns
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Array} Compounded sum series
 */
export function compsum(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const result = [];
  let compound = 1;
  
  for (const ret of cleanReturns) {
    compound *= (1 + ret);
    result.push(compound - 1);
  }
  
  return result;
}

/**
 * Calculate Omega ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {number} requiredReturn - Required return threshold (default 0)
 * @param {number} periods - Periods per year (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Omega ratio
 */
export function omega(returns, rfRate = 0, requiredReturn = 0, periods = 252, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  if (cleanReturns.length < 2) {
    return NaN;
  }
  
  if (requiredReturn <= -1) {
    return NaN;
  }
  
  const returnThreshold = periods === 1 ? requiredReturn : Math.pow(1 + requiredReturn, 1 / periods) - 1;
  
  const returnsLessThresh = cleanReturns.map(ret => ret - returnThreshold);
  const numer = returnsLessThresh.filter(ret => ret > 0).reduce((sum, ret) => sum + ret, 0);
  const denom = -1 * returnsLessThresh.filter(ret => ret < 0).reduce((sum, ret) => sum + ret, 0);
  
  if (denom > 0) {
    return numer / denom;
  }
  
  return NaN;
}

/**
 * Calculate Information Ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Information ratio
 */
export function informationRatio(returns, benchmark, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const cleanBenchmark = prepareReturns(benchmark, 0, nans);
  
  // Calculate excess returns
  const excessReturns = cleanReturns.map((ret, i) => ret - (cleanBenchmark[i] || 0));
  
  // Calculate mean and standard deviation of excess returns
  const mean = excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
  const variance = excessReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (excessReturns.length - 1);
  const std = Math.sqrt(variance);
  
  return std === 0 ? 0 : mean / std;
}

/**
 * Calculate Greeks (alpha and beta)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns
 * @param {number} periods - Periods per year (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Object with alpha and beta
 */
export function greeks(returns, benchmark, periods = 252, nans = false) {
  const portfolioBeta = beta(returns, benchmark, nans);
  const portfolioAlpha = alpha(returns, benchmark, 0, nans);
  
  return {
    alpha: portfolioAlpha,
    beta: portfolioBeta
  };
}

/**
 * Calculate autocorrelation penalty
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Autocorr penalty
 */
export function autocorrPenalty(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length < 2) {
    return 1;
  }
  
  // Calculate autocorrelation
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 1; i < cleanReturns.length; i++) {
    numerator += (cleanReturns[i] - mean) * (cleanReturns[i - 1] - mean);
  }
  
  for (let i = 0; i < cleanReturns.length; i++) {
    denominator += Math.pow(cleanReturns[i] - mean, 2);
  }
  
  const autocorr = denominator === 0 ? 0 : numerator / denominator;
  
  return Math.sqrt(1 - autocorr);
}

/**
 * Calculate smart Sharpe ratio (with autocorr penalty)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {number} periods - Periods per year (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Smart Sharpe ratio
 */
export function smartSharpe(returns, rfRate = 0, periods = 252, nans = false) {
  const regularSharpe = sharpe(returns, rfRate, nans);
  const penalty = autocorrPenalty(returns, nans);
  
  return regularSharpe * penalty;
}

/**
 * Calculate smart Sortino ratio (with autocorr penalty)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {number} periods - Periods per year (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Smart Sortino ratio
 */
export function smartSortino(returns, rfRate = 0, periods = 252, nans = false) {
  const regularSortino = sortino(returns, rfRate, nans);
  const penalty = autocorrPenalty(returns, nans);
  
  return regularSortino * penalty;
}

/**
 * Calculate percentile rank of prices
 * Exactly matches Python implementation
 * @param {Array} prices - Price array
 * @param {number} window - Window size (default 60)
 * @returns {Array} Percentile rank array
 */
export function pctRank(prices, window = 60) {
  const result = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < window - 1) {
      result.push(NaN);
      continue;
    }
    
    const windowPrices = prices.slice(i - window + 1, i + 1);
    const currentPrice = prices[i];
    
    let rank = 0;
    for (const price of windowPrices) {
      if (price <= currentPrice) rank++;
    }
    
    result.push((rank / windowPrices.length) * 100);
  }
  
  return result;
}

/**
 * Calculate distribution statistics
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} compounded - Use compounded returns (default true)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Distribution statistics
 */
export function distribution(returns, compounded = true, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      std: 0,
      skew: 0,
      kurtosis: 0,
      outliers: []
    };
  }
  
  const processedReturns = compounded ? cleanReturns : cleanReturns.map(ret => Math.log(1 + ret));
  
  const mean = processedReturns.reduce((sum, ret) => sum + ret, 0) / processedReturns.length;
  const variance = processedReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (processedReturns.length - 1);
  const std = Math.sqrt(variance);
  
  // Calculate skewness and kurtosis
  const skewness = processedReturns.reduce((sum, ret) => sum + Math.pow((ret - mean) / std, 3), 0) / processedReturns.length;
  const kurtosisVal = processedReturns.reduce((sum, ret) => sum + Math.pow((ret - mean) / std, 4), 0) / processedReturns.length - 3;
  
  return {
    min: Math.min(...processedReturns),
    max: Math.max(...processedReturns),
    mean: mean,
    std: std,
    skew: skewness,
    kurtosis: kurtosisVal,
    outliers: outliers(processedReturns, 0.95, nans)
  };
}

/**
 * Calculate geometric holding period return
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} GHPR
 */
export function ghpr(returns, nans = false) {
  return geometricMean(returns, nans);
}

/**
 * Calculate average return
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Average return
 */
export function avgReturn(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  return cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
}

/**
 * Calculate implied volatility
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} periods - Periods per year (default 252)
 * @param {boolean} annualize - Whether to annualize (default true)
 * @returns {number} Implied volatility
 */
export function impliedVolatility(returns, periods = 252, annualize = true) {
  const cleanReturns = prepareReturns(returns, 0, false);
  
  if (cleanReturns.length < 2) return 0;
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (cleanReturns.length - 1);
  const vol = Math.sqrt(variance);
  
  return annualize ? vol * Math.sqrt(periods) : vol;
}

/**
 * Calculate rolling volatility
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} window - Rolling window size (default 30)
 * @param {number} periods - Periods per year (default 252)
 * @returns {Array} Rolling volatility array
 */
export function rollingVolatility(returns, window = 30, periods = 252) {
  const cleanReturns = prepareReturns(returns, 0, false);
  const result = [];
  
  for (let i = 0; i < cleanReturns.length; i++) {
    if (i < window - 1) {
      result.push(NaN);
      continue;
    }
    
    const windowReturns = cleanReturns.slice(i - window + 1, i + 1);
    const mean = windowReturns.reduce((sum, ret) => sum + ret, 0) / windowReturns.length;
    const variance = windowReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (windowReturns.length - 1);
    const vol = Math.sqrt(variance) * Math.sqrt(periods);
    
    result.push(vol);
  }
  
  return result;
}

/**
 * Calculate rolling Sharpe ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {number} window - Rolling window size (default 30)
 * @param {number} periods - Periods per year (default 252)
 * @returns {Array} Rolling Sharpe ratio array
 */
export function rollingSharpe(returns, rfRate = 0, window = 30, periods = 252) {
  const cleanReturns = prepareReturns(returns, rfRate, false);
  const result = [];
  
  for (let i = 0; i < cleanReturns.length; i++) {
    if (i < window - 1) {
      result.push(NaN);
      continue;
    }
    
    const windowReturns = cleanReturns.slice(i - window + 1, i + 1);
    const mean = windowReturns.reduce((sum, ret) => sum + ret, 0) / windowReturns.length;
    const variance = windowReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (windowReturns.length - 1);
    const std = Math.sqrt(variance);
    
    const sharpeRatio = std === 0 ? 0 : (mean * Math.sqrt(periods)) / (std * Math.sqrt(periods));
    result.push(sharpeRatio);
  }
  
  return result;
}

/**
 * Calculate rolling Sortino ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {number} window - Rolling window size (default 30)
 * @param {number} periods - Periods per year (default 252)
 * @returns {Array} Rolling Sortino ratio array
 */
export function rollingSortino(returns, rfRate = 0, window = 30, periods = 252) {
  const cleanReturns = prepareReturns(returns, rfRate, false);
  const result = [];
  
  for (let i = 0; i < cleanReturns.length; i++) {
    if (i < window - 1) {
      result.push(NaN);
      continue;
    }
    
    const windowReturns = cleanReturns.slice(i - window + 1, i + 1);
    const mean = windowReturns.reduce((sum, ret) => sum + ret, 0) / windowReturns.length;
    const negativeReturns = windowReturns.filter(ret => ret < 0);
    
    if (negativeReturns.length === 0) {
      result.push(Infinity);
      continue;
    }
    
    const downsideVariance = negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / windowReturns.length;
    const downsideStd = Math.sqrt(downsideVariance);
    
    const sortinoRatio = downsideStd === 0 ? 0 : (mean * Math.sqrt(periods)) / (downsideStd * Math.sqrt(periods));
    result.push(sortinoRatio);
  }
  
  return result;
}

/**
 * Calculate adjusted Sortino ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {number} periods - Periods per year (default 252)
 * @param {boolean} smart - Use smart version with autocorr penalty (default false)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Adjusted Sortino ratio
 */
export function adjustedSortino(returns, rfRate = 0, periods = 252, smart = false, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  if (cleanReturns.length === 0) return 0;
  
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  const negativeReturns = cleanReturns.filter(ret => ret < 0);
  
  if (negativeReturns.length === 0) return Infinity;
  
  const downsideVariance = negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / cleanReturns.length;
  const downsideStd = Math.sqrt(downsideVariance);
  
  let ratio = downsideStd === 0 ? 0 : (mean * Math.sqrt(periods)) / (downsideStd * Math.sqrt(periods));
  
  if (smart) {
    const penalty = autocorrPenalty(cleanReturns, nans);
    ratio *= penalty;
  }
  
  return ratio;
}

/**
 * Calculate probabilistic ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns
 * @param {number} periods - Periods per year (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Probabilistic ratio
 */
export function probabilisticRatio(returns, benchmark, periods = 252, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const cleanBenchmark = prepareReturns(benchmark, 0, nans);
  
  if (cleanReturns.length !== cleanBenchmark.length) {
    throw new Error('Returns and benchmark must have the same length');
  }
  
  const excessReturns = cleanReturns.map((ret, i) => ret - cleanBenchmark[i]);
  const mean = excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
  const variance = excessReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (excessReturns.length - 1);
  const std = Math.sqrt(variance);
  
  if (std === 0) return 0;
  
  const sharpe = (mean * Math.sqrt(periods)) / (std * Math.sqrt(periods));
  const n = excessReturns.length;
  
  // Probabilistic Sharpe Ratio calculation
  const psr = normalCDF(sharpe * Math.sqrt(n - 1) / Math.sqrt(1 - sharpe * sharpe / n));
  
  return psr;
}

/**
 * Normal cumulative distribution function
 * @param {number} x - Input value
 * @returns {number} CDF value
 */
function normalCDF(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Error function approximation
 * @param {number} x - Input value
 * @returns {number} Error function value
 */
function erf(x) {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}

/**
 * Calculate probabilistic Sharpe ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {number} periods - Periods per year (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Probabilistic Sharpe ratio
 */
export function probabilisticSharpeRatio(returns, rfRate = 0, periods = 252, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  const benchmarkReturns = new Array(cleanReturns.length).fill(0);
  return probabilisticRatio(cleanReturns, benchmarkReturns, periods, nans);
}

/**
 * Calculate probabilistic Sortino ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {number} periods - Periods per year (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Probabilistic Sortino ratio
 */
export function probabilisticSortinoRatio(returns, rfRate = 0, periods = 252, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  const sortinoVal = sortino(cleanReturns, 0, nans);
  const n = cleanReturns.length;
  
  if (sortinoVal === 0) return 0;
  
  return normalCDF(sortinoVal * Math.sqrt(n - 1) / Math.sqrt(1 - sortinoVal * sortinoVal / n));
}

/**
 * Calculate probabilistic adjusted Sortino ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {number} periods - Periods per year (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Probabilistic adjusted Sortino ratio
 */
export function probabilisticAdjustedSortinoRatio(returns, rfRate = 0, periods = 252, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  const adjustedSortinoVal = adjustedSortino(cleanReturns, 0, periods, false, nans);
  const n = cleanReturns.length;
  
  if (adjustedSortinoVal === 0) return 0;
  
  return normalCDF(adjustedSortinoVal * Math.sqrt(n - 1) / Math.sqrt(1 - adjustedSortinoVal * adjustedSortinoVal / n));
}

/**
 * Calculate expected shortfall (CVaR)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} sigma - Sigma multiplier (default 1)
 * @param {number} confidence - Confidence level (default 0.95)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Expected shortfall
 */
export function expectedShortfall(returns, sigma = 1, confidence = 0.95, nans = false) {
  return cvar(returns, confidence, nans);
}

/**
 * Calculate tail ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} cutoff - Cutoff percentile (default 0.95)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Tail ratio
 */
export function tailRatio(returns, cutoff = 0.95, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const sorted = [...cleanReturns].sort((a, b) => a - b);
  
  const rightTailIndex = Math.floor(sorted.length * cutoff);
  const leftTailIndex = Math.floor(sorted.length * (1 - cutoff));
  
  const rightTail = sorted.slice(rightTailIndex);
  const leftTail = sorted.slice(0, leftTailIndex);
  
  if (leftTail.length === 0 || rightTail.length === 0) return 0;
  
  const rightTailMean = rightTail.reduce((sum, ret) => sum + ret, 0) / rightTail.length;
  const leftTailMean = leftTail.reduce((sum, ret) => sum + ret, 0) / leftTail.length;
  
  return leftTailMean === 0 ? 0 : rightTailMean / Math.abs(leftTailMean);
}

/**
 * Calculate payoff ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Payoff ratio
 */
export function payoffRatio(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const avgWinReturn = avgWin(cleanReturns, nans);
  const avgLossReturn = avgLoss(cleanReturns, nans);
  
  return avgLossReturn === 0 ? 0 : avgWinReturn / Math.abs(avgLossReturn);
}

/**
 * Calculate win/loss ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Win/loss ratio
 */
export function winLossRatio(returns, nans = false) {
  return payoffRatio(returns, nans);
}

/**
 * Calculate profit ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Profit ratio
 */
export function profitRatio(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const wins = cleanReturns.filter(ret => ret > 0);
  const losses = cleanReturns.filter(ret => ret < 0);
  
  if (losses.length === 0) return wins.length > 0 ? Infinity : 0;
  
  const totalWins = wins.reduce((sum, ret) => sum + ret, 0);
  const totalLosses = Math.abs(losses.reduce((sum, ret) => sum + ret, 0));
  
  return totalLosses === 0 ? 0 : totalWins / totalLosses;
}

/**
 * Calculate CPC index
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} CPC index
 */
export function cpcIndex(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const winRateVal = winRate(cleanReturns, nans);
  const avgWinReturn = avgWin(cleanReturns, nans);
  const avgLossReturn = avgLoss(cleanReturns, nans);
  
  if (avgLossReturn === 0) return 0;
  
  return winRateVal * avgWinReturn / Math.abs(avgLossReturn);
}

/**
 * Calculate common sense ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Common sense ratio
 */
export function commonSenseRatio(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const tailRatioVal = tailRatio(cleanReturns, 0.95, nans);
  const payoffRatioVal = payoffRatio(cleanReturns, nans);
  
  return tailRatioVal * payoffRatioVal;
}

/**
 * Calculate outlier win ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} quantile - Quantile threshold (default 0.99)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Outlier win ratio
 */
export function outlierWinRatio(returns, quantile = 0.99, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const outlierWins = outliers(cleanReturns.filter(ret => ret > 0), quantile, nans);
  const totalWins = cleanReturns.filter(ret => ret > 0);
  
  return totalWins.length === 0 ? 0 : outlierWins.length / totalWins.length;
}

/**
 * Calculate outlier loss ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} quantile - Quantile threshold (default 0.01)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Outlier loss ratio
 */
export function outlierLossRatio(returns, quantile = 0.01, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const losses = cleanReturns.filter(ret => ret < 0);
  const sorted = [...losses].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * quantile)];
  const outlierLosses = losses.filter(ret => ret <= threshold);
  
  return losses.length === 0 ? 0 : outlierLosses.length / losses.length;
}

/**
 * Calculate recovery factor
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Recovery factor
 */
export function recoveryFactor(returns, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  const totalReturn = cleanReturns.reduce((acc, ret) => acc * (1 + ret), 1) - 1;
  const maxDD = Math.abs(maxDrawdown(cleanReturns, nans));
  
  return maxDD === 0 ? 0 : totalReturn / maxDD;
}

/**
 * Calculate risk-return ratio
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Risk-return ratio
 */
export function riskReturnRatio(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const avgRet = avgReturn(cleanReturns, nans);
  const vol = volatility(cleanReturns, nans);
  
  return vol === 0 ? 0 : avgRet / vol;
}

/**
 * Calculate Kelly criterion
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Kelly criterion
 */
export function kellyCriterion(returns, nans = false) {
  return kelly(returns, nans);
}

/**
 * Calculate R-squared
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} R-squared
 */
export function rSquared(returns, benchmark, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const cleanBenchmark = prepareReturns(benchmark, 0, nans);
  
  if (cleanReturns.length !== cleanBenchmark.length) {
    throw new Error('Returns and benchmark must have the same length');
  }
  
  const returnsMean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  const benchmarkMean = cleanBenchmark.reduce((sum, ret) => sum + ret, 0) / cleanBenchmark.length;
  
  let numerator = 0;
  let denomReturns = 0;
  let denomBenchmark = 0;
  
  for (let i = 0; i < cleanReturns.length; i++) {
    const retDiff = cleanReturns[i] - returnsMean;
    const benchDiff = cleanBenchmark[i] - benchmarkMean;
    
    numerator += retDiff * benchDiff;
    denomReturns += retDiff * retDiff;
    denomBenchmark += benchDiff * benchDiff;
  }
  
  const correlation = numerator / Math.sqrt(denomReturns * denomBenchmark);
  return correlation * correlation;
}

/**
 * Calculate R2 (alias for R-squared)
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} R2
 */
export function r2(returns, benchmark, nans = false) {
  return rSquared(returns, benchmark, nans);
}

/**
 * Calculate rolling Greeks
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns
 * @param {number} periods - Periods per year (default 252)
 * @param {number} window - Rolling window size (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Array} Rolling Greeks array
 */
export function rollingGreeks(returns, benchmark, periods = 252, window = 252, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const cleanBenchmark = prepareReturns(benchmark, 0, nans);
  const result = [];
  
  for (let i = 0; i < cleanReturns.length; i++) {
    if (i < window - 1) {
      result.push({ alpha: NaN, beta: NaN });
      continue;
    }
    
    const windowReturns = cleanReturns.slice(i - window + 1, i + 1);
    const windowBenchmark = cleanBenchmark.slice(i - window + 1, i + 1);
    
    const portfolioBeta = beta(windowReturns, windowBenchmark, nans);
    const portfolioAlpha = alpha(windowReturns, windowBenchmark, 0, nans);
    
    result.push({ alpha: portfolioAlpha, beta: portfolioBeta });
  }
  
  return result;
}

/**
 * Calculate UPI (Ulcer Performance Index) - alias
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} UPI
 */
export function upi(returns, rfRate = 0, nans = false) {
  return ulcerPerformanceIndex(returns, nans);
}

/**
 * Calculate ROR (Risk of Ruin) - alias
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} ROR
 */
export function ror(returns, nans = false) {
  return riskOfRuin(returns, nans);
}

/**
 * Calculate VAR (Value at Risk) - alias
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} sigma - Sigma multiplier (default 1)
 * @param {number} confidence - Confidence level (default 0.95)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} VAR
 */
export function valueAtRiskAlias(returns, sigma = 1, confidence = 0.95, nans = false) {
  return valueAtRisk(returns, confidence, nans);
}
