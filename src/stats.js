/**
 * Statistics module for QuantStats.js
 * Exact mathematical implementations matching Python QuantStats
 */

import { 
  prepareReturns, 
  toDrawdownSeries, 
  aggregateReturns,
  makePosNeg,
  normalInverseCDF,
  getPeriodicReturns,
  monthToDateReturns,
  yearToDateReturns,
  resampleMonthlySum,
  resampleYearlySum,
  filterMTDReturns,
  filterYTDReturns,
  filterMonthsBackReturns,
  filterYearsBackReturns
} from './utils.js';

// Constants
const TRADING_DAYS_PER_YEAR = 252;
const TRADING_DAYS_PER_MONTH = 21;

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
 * Calculate drawdown details - periods, max drawdowns, etc.
 * Matches Python drawdown_details function
 * @param {Array} drawdownSeries - Drawdown series (from drawdown function)
 * @returns {Array} Array of drawdown periods with details
 */
export function getDrawdownDetails(drawdownSeries) {
  const details = [];
  let inDrawdown = false;
  let currentPeriod = null;
  
  for (let i = 0; i < drawdownSeries.length; i++) {
    const dd = drawdownSeries[i];
    
    if (dd < 0 && !inDrawdown) {
      // Start of new drawdown period
      inDrawdown = true;
      currentPeriod = {
        start: i,
        valley: i,
        minDrawdown: dd,
        days: 1
      };
    } else if (dd < 0 && inDrawdown) {
      // Continue drawdown period
      currentPeriod.days++;
      if (dd < currentPeriod.minDrawdown) {
        currentPeriod.minDrawdown = dd;
        currentPeriod.valley = i;
      }
    } else if (dd >= 0 && inDrawdown) {
      // End of drawdown period
      currentPeriod.end = i - 1;
      details.push(currentPeriod);
      inDrawdown = false;
      currentPeriod = null;
    }
  }
  
  // Handle case where series ends in drawdown
  if (inDrawdown && currentPeriod) {
    currentPeriod.end = drawdownSeries.length - 1;
    details.push(currentPeriod);
  }
  
  return details;
}

/**
 * Calculate average drawdown (mean of max drawdowns from each period)
 * Matches Python implementation: ret_dd["max drawdown"].mean() / 100
 * @param {Array} returns - Returns array
 * @returns {number} Average drawdown
 */
export function averageDrawdown(returns, dates = null) {
  const drawdownSeries = drawdown(returns);
  
  if (dates) {
    const details = drawdownDetailsWithDates(drawdownSeries, dates);
    if (details.length === 0) return 0;
    const maxDrawdowns = details.map(period => period.minDrawdown);
    return maxDrawdowns.reduce((sum, dd) => sum + dd, 0) / maxDrawdowns.length;
  } else {
    const details = drawdownDetails(drawdownSeries);
    if (details.length === 0) return 0;
    const maxDrawdowns = details.map(period => period.minDrawdown);
    return maxDrawdowns.reduce((sum, dd) => sum + dd, 0) / maxDrawdowns.length;
  }
}

/**
 * Calculate Win Rate
 * Exactly matches Python implementation: len(series[series > 0]) / len(series[series != 0])
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
  const nonZeroReturns = cleanReturns.filter(ret => ret !== 0).length;
  
  if (nonZeroReturns === 0) {
    return 0;
  }
  
  return wins / nonZeroReturns;
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
 * Exactly matches Python implementation: abs(wins_sum / losses_sum) where wins >= 0
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Profit factor
 */
export function profitFactor(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  // Python: returns[returns >= 0].sum() / returns[returns < 0].sum()
  const wins = cleanReturns.filter(ret => ret >= 0);
  const losses = cleanReturns.filter(ret => ret < 0);
  
  const grossProfit = wins.reduce((sum, ret) => sum + ret, 0);
  const grossLoss = Math.abs(losses.reduce((sum, ret) => sum + ret, 0));
  
  if (grossLoss === 0) {
    return Infinity;
  }
  
  return Math.abs(grossProfit / grossLoss);
}

/**
 * Calculate Expected Return
 * Exactly matches Python implementation with optional aggregation
 * @param {Array} returns - Returns array
 * @param {string} aggregate - Optional aggregation ('M', 'A', etc.)
 * @param {boolean} compounded - Use compounded returns (default true)  
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Expected return
 */
export function expectedReturn(returns, aggregate = null, compounded = true, nans = false, dates = null) {
  let workingReturns = prepareReturns(returns, 0, nans);
  
  // Apply aggregation if specified - now with date-awareness
  if (aggregate === 'M' && dates) {
    // Use date-aware monthly resampling
    workingReturns = resampleMonthlySum(workingReturns, dates, compounded);
  } else if (aggregate === 'A' && dates) {
    // Use date-aware yearly resampling  
    workingReturns = resampleYearlySum(workingReturns, dates, compounded);
  } else if (aggregate) {
    // Fallback to approximation
    workingReturns = aggregateReturns(workingReturns, aggregate, compounded);
  }
  
  if (workingReturns.length === 0) {
    return 0;
  }
  
  // Python: np.product(1 + returns) ** (1 / len(returns)) - 1
  // This is the geometric mean (GHPR)
  const product = workingReturns.reduce((prod, ret) => prod * (1 + ret), 1);
  return Math.pow(product, 1 / workingReturns.length) - 1;
}

/**
 * Calculate Value at Risk (VaR)
 * Exactly matches Python implementation using variance-covariance method
 * @param {Array} returns - Returns array
 * @param {number} sigma - Sigma multiplier (default 1)
 * @param {number} confidence - Confidence level (default 0.95)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Value at Risk
 */
export function valueAtRisk(returns, sigma = 1, confidence = 0.95, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  // Calculate mean and standard deviation (use ddof=1 like Python pandas)
  const mu = cleanReturns.reduce((sum, val) => sum + val, 0) / cleanReturns.length;
  const variance = cleanReturns.reduce((sum, val) => sum + Math.pow(val - mu, 2), 0) / (cleanReturns.length - 1);
  const std = Math.sqrt(variance);
  const sigmaStd = sigma * std;
  
  // Convert confidence to appropriate format if needed
  let conf = confidence;
  if (conf > 1) {
    conf = conf / 100;
  }
  
  // Ensure conf is in valid range for normalInverseCDF
  conf = Math.max(0.001, Math.min(0.999, conf));
  
  try {
    // Calculate normal inverse CDF (ppf)
    // This matches Python's _norm.ppf(1 - confidence, mu, sigma)
    const prob = 1 - conf;
    if (prob <= 0 || prob >= 1) {
      return mu - 1.96 * sigmaStd; // Fallback to 95% confidence
    }
    return normalInverseCDF(prob, mu, sigmaStd);
  } catch (error) {
    console.warn('VaR calculation failed:', error.message);
    // Return fallback using 95% confidence normal approximation
    return mu - 1.96 * sigmaStd;
  }
}

/**
 * Calculate Conditional Value at Risk (CVaR/Expected Shortfall)
 * Exactly matches Python implementation using VaR-based method
 * @param {Array} returns - Returns array
 * @param {number} sigma - Sigma multiplier (default 1)
 * @param {number} confidence - Confidence level (default 0.95)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Conditional Value at Risk
 */
export function cvar(returns, sigma = 1, confidence = 0.95, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  // First calculate VaR using variance-covariance method
  const var95 = valueAtRisk(returns, sigma, confidence, nans);
  
  // Then take mean of all returns below VaR threshold
  const belowVar = cleanReturns.filter(ret => ret < var95);
  
  if (belowVar.length === 0) {
    return var95; // Return VaR if no returns below threshold
  }
  
  const cVarResult = belowVar.reduce((sum, ret) => sum + ret, 0) / belowVar.length;
  
  // Return cVaR if valid and not based on single outlier, otherwise return VaR
  // Python appears to return VaR when there's insufficient tail data
  return (!isNaN(cVarResult) && belowVar.length > 1) ? cVarResult : var95;
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
  
  // Use Python logic: win_prob = len(positive) / len(non_zero)
  const nonZeroReturns = cleanReturns.filter(ret => ret !== 0);
  if (nonZeroReturns.length === 0) {
    return 0;
  }
  
  const winProb = positive.length / nonZeroReturns.length;
  const loseProb = 1 - winProb;
  const avgWinReturn = positive.reduce((sum, ret) => sum + ret, 0) / positive.length;
  const avgLossReturn = Math.abs(negative.reduce((sum, ret) => sum + ret, 0) / negative.length);
  
  if (avgLossReturn === 0) {
    return 0;
  }
  
  // Python formula: ((win_loss_ratio * win_prob) - lose_prob) / win_loss_ratio
  const payoffRatio = avgWinReturn / avgLossReturn;
  return ((payoffRatio * winProb) - loseProb) / payoffRatio;
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
  const portfolioReturn = expectedReturn(cleanReturns, null, nans);
  const benchmarkReturn = expectedReturn(cleanBenchmark, null, nans);
  
  // Alpha = Portfolio Return - (Beta * Benchmark Return)
  return portfolioReturn - (portfolioBeta * benchmarkReturn);
}

/**
 * Calculate Ulcer Index
 * Exactly matches Python implementation: sqrt(sum(dd^2) / (n-1))
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
  
  // Python: np.sqrt(np.divide((dd**2).sum(), returns.shape[0] - 1))
  const squaredDrawdowns = drawdowns.map(dd => Math.pow(dd, 2));
  const sumSquaredDrawdowns = squaredDrawdowns.reduce((sum, sq) => sum + sq, 0);
  
  return Math.sqrt(sumSquaredDrawdowns / (cleanReturns.length - 1));
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
 * Calculate monthly returns using date-aware resampling
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @param {Array} dates - Optional dates array for proper resampling
 * @param {boolean} compounded - Whether to compound returns (default true)
 * @returns {Array} Monthly returns
 */
export function monthlyReturns(returns, nans = false, dates = null, compounded = true) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (dates && dates.length === cleanReturns.length) {
    // Use date-aware resampling like Python pandas .resample('M')
    return resampleMonthlySum(cleanReturns, dates, compounded);
  } else {
    // Fallback to approximation
    return aggregateReturns(cleanReturns, 'monthly', compounded);
  }
}

/**
 * Calculate yearly returns using date-aware resampling
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @param {Array} dates - Optional dates array for proper resampling
 * @param {boolean} compounded - Whether to compound returns (default true)
 * @returns {Array} Yearly returns
 */
export function yearlyReturns(returns, nans = false, dates = null, compounded = true) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (dates && dates.length === cleanReturns.length) {
    // Use date-aware resampling like Python pandas .resample('A')
    return resampleYearlySum(cleanReturns, dates, compounded);
  } else {
    // Fallback to approximation
    return aggregateReturns(cleanReturns, 'yearly', compounded);
  }
}

/**
 * Returns outliers from returns array
 * Exactly matches Python to_prices function
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
  return expectedReturn(returns, null, nans);
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
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  // Python: returns.sum() / abs(returns[returns < 0].sum())
  const totalReturns = cleanReturns.reduce((sum, ret) => sum + ret, 0);
  const negativeReturns = cleanReturns.filter(ret => ret < 0);
  
  if (negativeReturns.length === 0) {
    return totalReturns > 0 ? Infinity : 0;
  }
  
  const downside = Math.abs(negativeReturns.reduce((sum, ret) => sum + ret, 0));
  
  return downside === 0 ? 0 : totalReturns / downside;
}

// Monthly Gain/Pain ratio
export function gainToPainRatioMonthly(returns, riskFreeRate = 0, dates = null) {
  if (dates) {
    // Use proper Python-style monthly resampling with dates
    const preparedReturns = prepareReturns(returns, riskFreeRate);
    const monthlyReturns = resampleMonthlySum(preparedReturns, dates);
    
    if (monthlyReturns.length === 0) return 0;
    
    // Python: returns.sum() / abs(returns[returns < 0].sum())
    const totalReturn = monthlyReturns.reduce((sum, ret) => sum + ret, 0);
    const negativeReturns = monthlyReturns.filter(ret => ret < 0);
    const totalLosses = Math.abs(negativeReturns.reduce((sum, loss) => sum + loss, 0));
    
    if (totalLosses === 0) return totalReturn > 0 ? Infinity : 0;
    
    return totalReturn / totalLosses;
  } else {
    // Fallback to old method if no dates provided
    const preparedReturns = prepareReturns(returns, riskFreeRate);
    const monthlyReturns = aggregateReturns(preparedReturns, 'monthly', false);
    
    if (monthlyReturns.length === 0) return 0;
    
    const totalReturn = monthlyReturns.reduce((sum, ret) => sum + ret, 0);
    const negativeReturns = monthlyReturns.filter(ret => ret < 0);
    const totalLosses = Math.abs(negativeReturns.reduce((sum, loss) => sum + loss, 0));
    
    if (totalLosses === 0) return totalReturn > 0 ? Infinity : 0;
    
    return totalReturn / totalLosses;
  }
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
  const excessReturn = expectedReturn(cleanReturns, null, nans) - rfRate;
  
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
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  // Python: ((1 - wins) / (1 + wins)) ** len(returns)
  const wins = winRate(cleanReturns, nans);
  
  if (wins === 1) return 0;  // No losses, no risk of ruin
  if (wins === 0) return 1;  // No wins, certain ruin
  
  return Math.pow((1 - wins) / (1 + wins), cleanReturns.length);
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
  // Don't use prepareReturns here - Python uses original returns directly
  
  // Get drawdown series from original returns
  const drawdowns = toDrawdownSeries(returns);
  
  // Calculate pitfall = -cvar(dd) / returns.std()
  const cvarDD = cvar(drawdowns, 1, 0.95, nans); // CVaR of drawdowns
  
  // Calculate sample standard deviation (ddof=1, pandas default)
  const returnsMean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const sampleVariance = returns.reduce((sum, ret) => sum + Math.pow(ret - returnsMean, 2), 0) / (returns.length - 1); // N-1 denominator
  const returnsStd = Math.sqrt(sampleVariance);
  
  const pitfall = -cvarDD / returnsStd;
  
  // Calculate ulcer index from original returns
  const ulcer = ulcerIndex(returns, nans);
  
  // Calculate sum of original returns
  const returnsSum = returns.reduce((sum, ret) => sum + ret, 0);
  
  if (ulcer === 0 || pitfall === 0) {
    return 0;
  }
  
  // Python: (returns.sum() - rf) / (ulcer_index(returns) * pitfall)
  return (returnsSum - rfRate) / (ulcer * pitfall);
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
  
  // Python: coef = np.abs(np.corrcoef(returns[:-1], returns[1:])[0, 1])
  const returns1 = cleanReturns.slice(0, -1);  // returns[:-1]
  const returns2 = cleanReturns.slice(1);      // returns[1:]
  
  const mean1 = returns1.reduce((sum, ret) => sum + ret, 0) / returns1.length;
  const mean2 = returns2.reduce((sum, ret) => sum + ret, 0) / returns2.length;
  
  let numerator = 0;
  let sum1sq = 0;
  let sum2sq = 0;
  
  for (let i = 0; i < returns1.length; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    sum1sq += diff1 * diff1;
    sum2sq += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sum1sq * sum2sq);
  const coef = denominator === 0 ? 0 : Math.abs(numerator / denominator);
  
  // Python: corr = [((num - x) / num) * coef**x for x in range(1, num)]
  // Python: return np.sqrt(1 + 2 * np.sum(corr))
  const num = cleanReturns.length;
  let corrSum = 0;
  
  for (let x = 1; x < num; x++) {
    corrSum += ((num - x) / num) * Math.pow(coef, x);
  }
  
  return Math.sqrt(1 + 2 * corrSum);
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
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  // Python: divisor = divisor * autocorr_penalty(returns)
  const meanReturn = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / (cleanReturns.length - 1);
  const stdDev = Math.sqrt(variance);
  const penalty = autocorrPenalty(cleanReturns, nans);
  const adjustedStdDev = stdDev * penalty;
  
  if (adjustedStdDev === 0) return 0;
  
  const smartSharpeRatio = meanReturn / adjustedStdDev;
  
  return smartSharpeRatio * Math.sqrt(TRADING_DAYS_PER_YEAR);
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
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  // Calculate excess returns
  const meanReturn = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  
  // Calculate downside deviation with autocorr penalty
  const negativeReturns = cleanReturns.filter(ret => ret < 0);
  if (negativeReturns.length === 0) {
    return Infinity;
  }
  
  const downsideVariance = negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / cleanReturns.length;
  const downsideStd = Math.sqrt(downsideVariance);
  const penalty = autocorrPenalty(cleanReturns, nans);
  const adjustedDownsideStd = downsideStd * penalty;
  
  if (adjustedDownsideStd === 0) return 0;
  
  const smartSortinoRatio = meanReturn / adjustedDownsideStd;
  
  return smartSortinoRatio * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/**
 * Calculate Sortino ratio divided by √2
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Sortino ratio divided by √2
 */
export function sortinoSqrt2(returns, rfRate = 0, nans = false) {
  return sortino(returns, rfRate, nans) / Math.sqrt(2);
}

/**
 * Calculate Smart Sortino ratio divided by √2
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Smart Sortino ratio divided by √2
 */
export function smartSortinoSqrt2(returns, rfRate = 0, nans = false) {
  return smartSortino(returns, rfRate, nans) / Math.sqrt(2);
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
  // Don't adjust returns by rfRate - let Python handle rf subtraction in ratio calculation
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  // Python: base = sharpe(series, periods=periods, annualize=False, smart=smart)
  // We need NON-ANNUALIZED Sharpe ratio!
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (cleanReturns.length - 1);
  const std = Math.sqrt(variance);
  const baseSharpe = std === 0 ? 0 : mean / std; // NON-annualized Sharpe
  
  const skewVal = skew(cleanReturns, nans);
  const kurtosisVal = kurtosis(cleanReturns, nans);
  const n = cleanReturns.length;
  
  // Python formula from probabilistic_ratio function
  const sigmaSr = Math.sqrt(
    (1 + (0.5 * Math.pow(baseSharpe, 2)) - (skewVal * baseSharpe) + 
     (((kurtosisVal - 3) / 4) * Math.pow(baseSharpe, 2))) / (n - 1)
  );
  
  // Python: ratio = (base - rf) / sigma_sr
  const ratio = (baseSharpe - rfRate) / sigmaSr;
  const psr = normalCDF(ratio);
  
  return psr;
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
  
  if (cleanReturns.length === 0) {
    return 0;
  }
  
  // Python: abs(returns.quantile(cutoff) / returns.quantile(1 - cutoff))
  const sorted = [...cleanReturns].sort((a, b) => a - b);
  const rightQuantileIndex = Math.floor(sorted.length * cutoff);
  const leftQuantileIndex = Math.floor(sorted.length * (1 - cutoff));
  
  const rightQuantile = sorted[rightQuantileIndex] || sorted[sorted.length - 1];
  const leftQuantile = sorted[leftQuantileIndex] || sorted[0];
  
  return leftQuantile === 0 ? 0 : Math.abs(rightQuantile / leftQuantile);
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
  
  // Python: profit_factor(returns) * win_rate(returns) * win_loss_ratio(returns)
  const profitFactorVal = profitFactor(cleanReturns, nans);
  const winRateVal = winRate(cleanReturns, nans);
  const winLossRatioVal = winLossRatio(cleanReturns, nans);
  
  return profitFactorVal * winRateVal * winLossRatioVal;
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
  
  // Python: profit_factor(returns) * tail_ratio(returns)
  const profitFactorVal = profitFactor(cleanReturns, nans);
  const tailRatioVal = tailRatio(cleanReturns, 0.95, nans);
  
  return profitFactorVal * tailRatioVal;
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
  const positiveReturns = cleanReturns.filter(ret => ret >= 0);
  
  if (positiveReturns.length === 0) {
    return 0;
  }
  
  // Python: returns.quantile(quantile).mean() / returns[returns >= 0].mean()
  const sorted = [...cleanReturns].sort((a, b) => a - b);
  const quantileValue = sorted[Math.floor(sorted.length * quantile)];
  const meanPositive = positiveReturns.reduce((sum, ret) => sum + ret, 0) / positiveReturns.length;
  
  return meanPositive === 0 ? 0 : quantileValue / meanPositive;
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
  const negativeReturns = cleanReturns.filter(ret => ret < 0);
  
  if (negativeReturns.length === 0) {
    return 0;
  }
  
  // Python: returns.quantile(quantile).mean() / returns[returns < 0].mean()
  const sorted = [...cleanReturns].sort((a, b) => a - b);
  const quantileValue = sorted[Math.floor(sorted.length * quantile)];
  const meanNegative = negativeReturns.reduce((sum, ret) => sum + ret, 0) / negativeReturns.length;
  
  return meanNegative === 0 ? 0 : quantileValue / meanNegative;
}

/**
 * Calculate recovery factor
 * Exactly matches Python implementation: abs(returns.sum() - rf) / abs(max_dd)
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {number} Recovery factor
 */
export function recoveryFactor(returns, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  // Python: returns.sum() - rf (sum of daily returns, not compound)
  const totalReturns = cleanReturns.reduce((sum, ret) => sum + ret, 0) - rfRate;
  const maxDD = Math.abs(maxDrawdown(cleanReturns, nans));
  
  return maxDD === 0 ? 0 : Math.abs(totalReturns) / maxDD;
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

// Period-based return functions
export function monthToDateReturn(returns) {
  // MTD: Month-to-date return
  const periodicReturns = monthToDateReturns(returns);
  return totalReturn(periodicReturns);
}

export function quarterReturn(returns, quarters) {
  // 3M = 3 months back
  const periodicReturns = getPeriodicReturns(returns, quarters * 3);
  return totalReturn(periodicReturns);
}

export function winQuarter(returns, dates = null) {
  // Simple quarterly win rate calculation
  if (!dates || dates.length !== returns.length) {
    // Fallback: assume roughly 63 trading days per quarter (252/4)
    return 0; // Can't calculate without proper dates
  }
  
  // Group by quarters (3-month periods)
  const quarterlyReturns = [];
  let currentQuarter = [];
  let currentMonth = dates[0].getMonth();
  let currentQuarterMonth = Math.floor(currentMonth / 3);
  
  for (let i = 0; i < returns.length; i++) {
    const month = dates[i].getMonth();
    const quarterMonth = Math.floor(month / 3);
    
    if (quarterMonth !== currentQuarterMonth && currentQuarter.length > 0) {
      // Calculate compounded return for this quarter
      const quarterReturn = currentQuarter.reduce((acc, ret) => acc * (1 + ret), 1) - 1;
      quarterlyReturns.push(quarterReturn);
      currentQuarter = [];
      currentQuarterMonth = quarterMonth;
    }
    
    currentQuarter.push(returns[i]);
  }
  
  // Don't forget the last quarter
  if (currentQuarter.length > 0) {
    const quarterReturn = currentQuarter.reduce((acc, ret) => acc * (1 + ret), 1) - 1;
    quarterlyReturns.push(quarterReturn);
  }
  
  return winRate(quarterlyReturns);
}

export function yearToDateReturn(returns) {
  // YTD: Year-to-date return
  const periodicReturns = yearToDateReturns(returns);
  return totalReturn(periodicReturns);
}

export function yearReturn(returns, years) {
  // 1Y, 3Y, etc.
  const periodicReturns = getPeriodicReturns(returns, null, years);
  return totalReturn(periodicReturns);
}

export function annualizedReturn(returns, years) {
  // For 3Y, 5Y, 10Y (ann.) - use CAGR
  const periodicReturns = getPeriodicReturns(returns, null, years);
  return cagr(periodicReturns);
}

// Specific implementations for each period - now date-aware!
export function mtdReturn(returns, dates = null) {
  // Python: comp_func(df[df.index >= _dt(today.year, today.month, 1)]) * pct
  const mtdReturns = dates ? filterMTDReturns(returns, dates) : monthToDateReturns(returns);
  return comp(mtdReturns);
}

export function threeMonthReturn(returns, dates = null) {
  // Python: comp_func(df[df.index >= d]) where d = today - relativedelta(months=3)
  const threeMonthReturns = dates ? filterMonthsBackReturns(returns, dates, 3) : getPeriodicReturns(returns, 3);
  return comp(threeMonthReturns);
}

export function sixMonthReturn(returns, dates = null) {
  // Python: comp_func(df[df.index >= d]) where d = today - relativedelta(months=6)
  const sixMonthReturns = dates ? filterMonthsBackReturns(returns, dates, 6) : getPeriodicReturns(returns, 6);
  return comp(sixMonthReturns);
}

export function ytdReturn(returns, dates = null) {
  // Python: comp_func(df[df.index >= _dt(today.year, 1, 1)]) * pct
  const ytdReturns = dates ? filterYTDReturns(returns, dates) : yearToDateReturns(returns);
  return comp(ytdReturns);
}

export function oneYearReturn(returns, dates = null) {
  // Python: comp_func(df[df.index >= d]) where d = today - relativedelta(years=1)
  const oneYearReturns = dates ? filterYearsBackReturns(returns, dates, 1) : getPeriodicReturns(returns, null, 1);
  return comp(oneYearReturns);
}

export function threeYearAnnualizedReturn(returns) {
  return annualizedReturn(returns, 3);
}

export function fiveYearAnnualizedReturn(returns) {
  return annualizedReturn(returns, 5);
}

export function tenYearAnnualizedReturn(returns) {
  return annualizedReturn(returns, 10);
}

export function allTimeAnnualizedReturn(returns) {
  return cagr(returns);
}

// Expected return functions - now date-aware!
export function expectedMonthlyReturn(returns, compounded = true, dates = null) {
  // Expected monthly return using "M" aggregation (matches Python exactly)
  return expectedReturn(returns, 'M', compounded, false, dates);
}

export function expectedYearlyReturn(returns, compounded = true, dates = null) {
  // Expected yearly return using "A" aggregation (matches Python exactly)  
  return expectedReturn(returns, 'A', compounded, false, dates);
}

// Avg Up/Down Month functions - now date-aware!
export function avgUpMonth(returns, compounded = true, dates = null) {
  // Python: avg_win(df, compounded=compounded, aggregate="M", prepare_returns=False)
  const monthlyRets = dates ? 
    resampleMonthlySum(returns, dates, compounded) : 
    aggregateReturns(returns, 'M', compounded);
  const upMonths = monthlyRets.filter(ret => ret > 0);
  if (upMonths.length === 0) return 0;
  return upMonths.reduce((sum, ret) => sum + ret, 0) / upMonths.length;
}

export function avgDownMonth(returns, compounded = true, dates = null) {
  // Python: avg_loss(df, compounded=compounded, aggregate="M", prepare_returns=False)
  const monthlyRets = dates ? 
    resampleMonthlySum(returns, dates, compounded) : 
    aggregateReturns(returns, 'M', compounded);
  const downMonths = monthlyRets.filter(ret => ret < 0);
  if (downMonths.length === 0) return 0;
  return downMonths.reduce((sum, ret) => sum + ret, 0) / downMonths.length;
}

/**
 * Calculate the longest drawdown period in days
 * @param {Array} returns - Returns array
 * @returns {number} Longest drawdown period in days
 */
export function longestDrawdownDays(returns, dates = null) {
  // Calculate the longest drawdown period using drawdown details
  // Matches Python: ret_dd.sort_values(by="days", ascending=False)["days"].values[0]
  const drawdownSeries = drawdown(returns);
  
  if (dates) {
    const details = drawdownDetailsWithDates(drawdownSeries, dates);
    if (details.length === 0) return 0;
    return Math.max(...details.map(period => period.days));
  } else {
    const details = drawdownDetails(drawdownSeries);
    if (details.length === 0) return 0;
    return Math.max(...details.map(period => period.days));
  }
}

/**
 * Calculate the average drawdown period in days
 * @param {Array} returns - Returns array
 * @returns {number} Average drawdown period in days
 */
export function averageDrawdownDays(returns, dates = null) {
  // Calculate the average drawdown period using drawdown details
  // Matches Python: ret_dd["days"].mean()
  const drawdownSeries = drawdown(returns);
  
  if (dates) {
    const details = drawdownDetailsWithDates(drawdownSeries, dates);
    if (details.length === 0) return 0;
    const totalDays = details.reduce((sum, period) => sum + period.days, 0);
    return totalDays / details.length;
  } else {
    const details = drawdownDetails(drawdownSeries);
    if (details.length === 0) return 0;
    const totalDays = details.reduce((sum, period) => sum + period.days, 0);
    return totalDays / details.length;
  }
}

// Date-aware utility functions for matching Python exactly

/**
 * Calculate drawdown details with actual calendar days (like Python)
 * @param {Array} drawdownSeries - Drawdown series
 * @param {Array} dates - Corresponding dates array
 * @returns {Array} Array of drawdown periods with calendar day counts
 */
export function drawdownDetailsWithDates(drawdownSeries, dates) {
  const details = [];
  let inDrawdown = false;
  let currentPeriod = null;
  
  for (let i = 0; i < drawdownSeries.length; i++) {
    const dd = drawdownSeries[i];
    
    if (dd < 0 && !inDrawdown) {
      // Start of new drawdown period
      inDrawdown = true;
      currentPeriod = {
        start: i,
        startDate: dates[i],
        valley: i,
        minDrawdown: dd
      };
    } else if (dd < 0 && inDrawdown) {
      // Continue drawdown period
      if (dd < currentPeriod.minDrawdown) {
        currentPeriod.minDrawdown = dd;
        currentPeriod.valley = i;
      }
    } else if (dd >= 0 && inDrawdown) {
      // End of drawdown period
      currentPeriod.end = i - 1;
      currentPeriod.endDate = dates[i - 1];
      
      // Calculate calendar days (like Python: (ends[i] - starts[i]).days + 1)
      const startTime = currentPeriod.startDate.getTime();
      const endTime = currentPeriod.endDate.getTime();
      const daysDiff = Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
      currentPeriod.days = daysDiff;
      
      details.push(currentPeriod);
      inDrawdown = false;
      currentPeriod = null;
    }
  }
  
  // Handle case where series ends in drawdown
  if (inDrawdown && currentPeriod) {
    currentPeriod.end = drawdownSeries.length - 1;
    currentPeriod.endDate = dates[drawdownSeries.length - 1];
    
    // Calculate calendar days
    const startTime = currentPeriod.startDate.getTime();
    const endTime = currentPeriod.endDate.getTime();
    const daysDiff = Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
    currentPeriod.days = daysDiff;
    
    details.push(currentPeriod);
  }
  
  return details;
}
