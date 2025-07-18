/**
 * Utilities module for QuantStats.js
 * Exact mathematical implementations matching Python QuantStats
 */

// Constants
const TRADING_DAYS_PER_YEAR = 252;
const TRADING_DAYS_PER_MONTH = 21;
const MONTHS_PER_YEAR = 12;

/**
 * Prepare returns data - exactly matches Python _prepare_returns
 * @param {Array|Object} data - Price or returns data
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Whether to include NaN values (default false)
 * @returns {Array} Prepared returns array
 */
export function prepareReturns(data, rfRate = 0, nans = false) {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }

  if (data.length === 0) {
    return [];
  }

  let returns = [...data];
  
  // If data looks like prices (always positive, large values), convert to returns
  const validValues = returns.filter(val => 
    val !== null && 
    val !== undefined && 
    !isNaN(val) && 
    isFinite(val) && 
    typeof val === 'number'
  );
  
  if (validValues.length > 1 && validValues.every(val => val > 0) && Math.min(...validValues) > 1) {
    returns = toReturns(returns);
  }

  // Remove NaN values unless explicitly requested
  if (!nans) {
    returns = returns.filter(val => 
      val !== null && 
      val !== undefined && 
      !isNaN(val) && 
      isFinite(val) && 
      typeof val === 'number'
    );
  }

  // Subtract risk-free rate
  if (rfRate !== 0) {
    const dailyRf = Math.pow(1 + rfRate, 1/TRADING_DAYS_PER_YEAR) - 1;
    returns = returns.map(ret => ret - dailyRf);
  }

  return returns;
}

/**
 * Convert prices to returns - exactly matches Python implementation
 * @param {Array} prices - Array of prices
 * @param {boolean} compound - Whether to use compound returns (default true)
 * @returns {Array} Array of returns
 */
export function toReturns(prices, compound = true) {
  if (!Array.isArray(prices) || prices.length < 2) {
    throw new Error('Prices must be an array with at least 2 values');
  }

  const returns = [];
  
  for (let i = 1; i < prices.length; i++) {
    const prevPrice = prices[i - 1];
    const currPrice = prices[i];
    
    if (prevPrice === 0 || isNaN(prevPrice) || isNaN(currPrice)) {
      returns.push(NaN);
      continue;
    }
    
    if (compound) {
      // Compound returns: (P1/P0) - 1
      returns.push((currPrice / prevPrice) - 1);
    } else {
      // Simple returns: (P1 - P0) / P0
      returns.push((currPrice - prevPrice) / prevPrice);
    }
  }
  
  return returns;
}

/**
 * Calculate drawdown series - exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @returns {Array} Drawdown series
 */
export function toDrawdownSeries(returns) {
  if (!Array.isArray(returns)) {
    throw new Error('Returns must be an array');
  }

  const cumReturns = [];
  let cumReturn = 1;
  
  // Calculate cumulative returns
  for (const ret of returns) {
    if (isNaN(ret)) {
      cumReturns.push(NaN);
      continue;
    }
    cumReturn *= (1 + ret);
    cumReturns.push(cumReturn);
  }
  
  // Calculate drawdowns
  const drawdowns = [];
  let peak = cumReturns[0] || 1;
  
  for (const cumRet of cumReturns) {
    if (isNaN(cumRet)) {
      drawdowns.push(NaN);
      continue;
    }
    
    if (cumRet > peak) {
      peak = cumRet;
    }
    
    const drawdown = (cumRet / peak) - 1;
    drawdowns.push(drawdown);
  }
  
  return drawdowns;
}

/**
 * Group returns by period - exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {string} period - Period ('monthly', 'quarterly', 'yearly')
 * @returns {Object} Grouped returns
 */
export function groupReturns(returns, period = 'monthly') {
  if (!Array.isArray(returns)) {
    throw new Error('Returns must be an array');
  }

  const grouped = {};
  let periodsPerYear;
  
  switch (period.toLowerCase()) {
    case 'monthly':
      periodsPerYear = MONTHS_PER_YEAR;
      break;
    case 'quarterly':
      periodsPerYear = 4;
      break;
    case 'yearly':
      periodsPerYear = 1;
      break;
    default:
      throw new Error('Period must be monthly, quarterly, or yearly');
  }
  
  const periodsPerGroup = Math.floor(TRADING_DAYS_PER_YEAR / periodsPerYear);
  
  for (let i = 0; i < returns.length; i += periodsPerGroup) {
    const periodReturns = returns.slice(i, i + periodsPerGroup);
    const periodKey = Math.floor(i / periodsPerGroup);
    
    // Calculate compound return for period
    let compoundReturn = 1;
    for (const ret of periodReturns) {
      if (!isNaN(ret)) {
        compoundReturn *= (1 + ret);
      }
    }
    
    grouped[periodKey] = compoundReturn - 1;
  }
  
  return grouped;
}

/**
 * Aggregate returns - exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {string} period - Aggregation period
 * @returns {Array} Aggregated returns
 */
export function aggregateReturns(returns, period = 'monthly') {
  const grouped = groupReturns(returns, period);
  return Object.values(grouped);
}

/**
 * Make value divisible by another value
 * @param {number} value - Value to make divisible
 * @param {number} divisor - Divisor
 * @returns {number} Divisible value
 */
export function makeDivisible(value, divisor) {
  return Math.floor(value / divisor) * divisor;
}

/**
 * Convert number to duration string
 * @param {number} days - Number of days
 * @returns {string} Duration string
 */
export function toDuration(days) {
  if (days < 30) {
    return `${Math.round(days)} days`;
  } else if (days < 365) {
    return `${Math.round(days / 30)} months`;
  } else {
    return `${Math.round(days / 365 * 10) / 10} years`;
  }
}

/**
 * Create drawdown details table - exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @returns {Array} Array of drawdown periods with details
 */
export function toDrawdownsTable(returns) {
  const drawdowns = toDrawdownSeries(returns);
  const drawdownPeriods = [];
  
  let inDrawdown = false;
  let startIdx = 0;
  let endIdx = 0;
  let maxDrawdown = 0;
  
  for (let i = 0; i < drawdowns.length; i++) {
    const dd = drawdowns[i];
    
    if (isNaN(dd)) continue;
    
    if (dd < 0 && !inDrawdown) {
      // Start of drawdown
      inDrawdown = true;
      startIdx = i;
      maxDrawdown = dd;
    } else if (dd < 0 && inDrawdown) {
      // Continuing drawdown
      if (dd < maxDrawdown) {
        maxDrawdown = dd;
      }
    } else if (dd >= 0 && inDrawdown) {
      // End of drawdown
      endIdx = i - 1;
      inDrawdown = false;
      
      drawdownPeriods.push({
        start: startIdx,
        end: endIdx,
        maxDrawdown: maxDrawdown,
        days: endIdx - startIdx + 1,
        recovery: i - endIdx
      });
    }
  }
  
  // Handle case where we end in a drawdown
  if (inDrawdown) {
    drawdownPeriods.push({
      start: startIdx,
      end: drawdowns.length - 1,
      maxDrawdown: maxDrawdown,
      days: drawdowns.length - startIdx,
      recovery: null // Still in drawdown
    });
  }
  
  return drawdownPeriods;
}

/**
 * Remove outliers from returns array - matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} quantile - Quantile threshold (default 0.95)
 * @returns {Array} Returns without outliers
 */
function removeOutliers(returns, quantile = 0.95) {
  const sorted = [...returns].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * quantile)];
  return returns.filter(ret => ret < threshold);
}

/**
 * Get drawdown details - exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} dates - Optional dates array
 * @returns {Array} Array of drawdown periods matching Python's DataFrame structure
 */
export function drawdownDetails(returns, dates = null) {
  const drawdowns = toDrawdownSeries(returns);
  
  // Create dates array if not provided
  if (!dates) {
    dates = Array.from({ length: returns.length }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (returns.length - 1 - i));
      return date;
    });
  }
  
  // Mark no drawdown periods
  const noDrawdown = drawdowns.map(dd => dd === 0);
  
  // Extract drawdown start dates
  const starts = [];
  for (let i = 1; i < noDrawdown.length; i++) {
    if (!noDrawdown[i] && noDrawdown[i - 1]) {
      starts.push(i);
    }
  }
  
  // Extract drawdown end dates
  const ends = [];
  for (let i = 0; i < noDrawdown.length - 1; i++) {
    if (noDrawdown[i] && !noDrawdown[i + 1]) {
      ends.push(i);
    }
  }
  
  // No drawdown periods
  if (starts.length === 0) {
    return [];
  }
  
  // Handle case where drawdown series begins in a drawdown
  if (ends.length > 0 && starts[0] > ends[0]) {
    starts.unshift(0);
  }
  
  // Handle case where series ends in a drawdown
  if (starts.length > ends.length) {
    ends.push(drawdowns.length - 1);
  }
  
  // Build drawdown periods data
  const periods = [];
  for (let i = 0; i < starts.length; i++) {
    const startIdx = starts[i];
    const endIdx = ends[i];
    
    // Get drawdown slice
    const ddSlice = drawdowns.slice(startIdx, endIdx + 1);
    
    // Find valley (minimum drawdown point)
    let valleyIdx = startIdx;
    let minDrawdown = ddSlice[0];
    for (let j = 1; j < ddSlice.length; j++) {
      if (ddSlice[j] < minDrawdown) {
        minDrawdown = ddSlice[j];
        valleyIdx = startIdx + j;
      }
    }
    
    // Calculate 99% max drawdown (remove outliers)
    const cleanDrawdown = removeOutliers(ddSlice.map(dd => -dd), 0.99);
    const maxDrawdown99 = cleanDrawdown.length > 0 ? -Math.min(...cleanDrawdown) : minDrawdown;
    
    // Calculate days
    const startDate = dates[startIdx];
    const endDate = dates[endIdx];
    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    periods.push({
      start: startDate.toISOString().split('T')[0],
      valley: dates[valleyIdx].toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      days: days,
      'max drawdown': minDrawdown * 100,
      '99% max drawdown': maxDrawdown99 * 100
    });
  }
  
  return periods;
}

/**
 * Calculate portfolio value from returns
 * @param {Array} returns - Returns array
 * @param {number} initialValue - Initial portfolio value (default 1000)
 * @returns {Array} Portfolio value series
 */
export function portfolioValue(returns, initialValue = 1000) {
  const values = [initialValue];
  let currentValue = initialValue;
  
  for (const ret of returns) {
    if (!isNaN(ret)) {
      currentValue *= (1 + ret);
    }
    values.push(currentValue);
  }
  
  return values;
}

/**
 * Resample returns to different frequency
 * @param {Array} returns - Returns array
 * @param {string} frequency - Target frequency ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')
 * @returns {Array} Resampled returns
 */
export function resample(returns, frequency) {
  const periodsMap = {
    daily: 1,
    weekly: 5,
    monthly: TRADING_DAYS_PER_MONTH,
    quarterly: TRADING_DAYS_PER_MONTH * 3,
    yearly: TRADING_DAYS_PER_YEAR
  };
  
  const period = periodsMap[frequency.toLowerCase()];
  if (!period) {
    throw new Error('Invalid frequency. Must be daily, weekly, monthly, quarterly, or yearly');
  }
  
  if (period === 1) {
    return [...returns]; // Already daily
  }
  
  const resampled = [];
  for (let i = 0; i < returns.length; i += period) {
    const periodReturns = returns.slice(i, i + period);
    
    // Calculate compound return for period
    let compoundReturn = 1;
    for (const ret of periodReturns) {
      if (!isNaN(ret)) {
        compoundReturn *= (1 + ret);
      }
    }
    
    resampled.push(compoundReturn - 1);
  }
  
  return resampled;
}

/**
 * Check if a date is a business day
 * @param {Date} date - Date to check
 * @returns {boolean} True if business day
 */
export function isBusinessDay(date) {
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday (0) or Saturday (6)
}

/**
 * Fill zeros in returns array
 * @param {Array} returns - Returns array
 * @param {number} fillValue - Value to fill zeros with (default 0)
 * @returns {Array} Filled returns array
 */
export function fillZeros(returns, fillValue = 0) {
  return returns.map(ret => ret === 0 ? fillValue : ret);
}

/**
 * Convert value to percentage
 * @param {number} value - Value to convert
 * @param {number} precision - Decimal places (default 2)
 * @returns {string} Percentage string
 */
export function makePercentage(value, precision = 2) {
  return (value * 100).toFixed(precision) + '%';
}

/**
 * Split returns into positive and negative
 * @param {Array} returns - Returns array
 * @returns {Object} Object with positive and negative returns
 */
export function makePosNeg(returns) {
  const positive = returns.filter(ret => ret > 0);
  const negative = returns.filter(ret => ret < 0);
  
  return { positive, negative };
}

/**
 * Convert returns to prices
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} base - Base price (default 100000)
 * @returns {Array} Price series
 */
export function toPrices(returns, base = 100000) {
  const cleanReturns = returns.map(ret => isNaN(ret) ? 0 : ret);
  const prices = [base];
  
  for (let i = 0; i < cleanReturns.length; i++) {
    const price = prices[prices.length - 1] * (1 + cleanReturns[i]);
    prices.push(price);
  }
  
  return prices;
}

/**
 * Convert prices to log returns
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @returns {Array} Log returns
 */
export function toLogReturns(returns, rfRate = 0) {
  const cleanReturns = prepareReturns(returns, rfRate);
  return cleanReturns.map(ret => Math.log(1 + ret));
}

/**
 * Convert to excess returns
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate
 * @returns {Array} Excess returns
 */
export function toExcessReturns(returns, rfRate) {
  const cleanReturns = prepareReturns(returns, 0);
  return cleanReturns.map(ret => ret - rfRate);
}

/**
 * Rebase prices to a different base
 * Exactly matches Python implementation
 * @param {Array} prices - Price series
 * @param {number} base - New base value (default 100)
 * @returns {Array} Rebased prices
 */
export function rebase(prices, base = 100) {
  if (prices.length === 0) return [];
  
  const factor = base / prices[0];
  return prices.map(price => price * factor);
}

/**
 * Calculate exponential standard deviation
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} window - Window size (default 30)
 * @param {boolean} isHalflife - Whether window is halflife (default false)
 * @returns {Array} Exponential standard deviation
 */
export function exponentialStdev(returns, window = 30, isHalflife = false) {
  const cleanReturns = prepareReturns(returns, 0);
  const result = [];
  
  const alpha = isHalflife ? 1 - Math.exp(Math.log(0.5) / window) : 2 / (window + 1);
  
  let ewma = 0;
  let ewmvar = 0;
  
  for (let i = 0; i < cleanReturns.length; i++) {
    const ret = cleanReturns[i];
    
    if (i === 0) {
      ewma = ret;
      ewmvar = 0;
    } else {
      ewma = alpha * ret + (1 - alpha) * ewma;
      ewmvar = alpha * Math.pow(ret - ewma, 2) + (1 - alpha) * ewmvar;
    }
    
    result.push(Math.sqrt(ewmvar));
  }
  
  return result;
}

/**
 * Multi-shift function for creating rolling windows
 * Exactly matches Python implementation
 * @param {Array} data - Data array
 * @param {number} shift - Number of shifts (default 3)
 * @returns {Array} Multi-shifted data
 */
export function multiShift(data, shift = 3) {
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = [];
    for (let j = 0; j < shift; j++) {
      const index = i - j;
      row.push(index >= 0 ? data[index] : NaN);
    }
    result.push(row);
  }
  
  return result;
}

/**
 * Log returns calculation
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {number} nperiods - Number of periods (default null)
 * @returns {Array} Log returns
 */
export function logReturns(returns, rfRate = 0, nperiods = null) {
  return toLogReturns(returns, rfRate);
}

/**
 * Group returns by specified grouping
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {string} groupby - Grouping method ('M' for monthly, 'Y' for yearly)
 * @param {boolean} compounded - Use compounded returns (default false)
 * @returns {Object} Grouped returns
 */
export function groupReturnsByPeriod(returns, groupby, compounded = false) {
  const grouped = {};
  let currentPeriod = 0;
  let currentGroup = [];
  
  // Simplified grouping logic
  const periodsPerGroup = groupby === 'M' ? TRADING_DAYS_PER_MONTH : 
                         groupby === 'Y' ? TRADING_DAYS_PER_YEAR : 
                         TRADING_DAYS_PER_MONTH;
  
  for (let i = 0; i < returns.length; i++) {
    currentGroup.push(returns[i]);
    
    if (currentGroup.length >= periodsPerGroup || i === returns.length - 1) {
      if (compounded) {
        grouped[currentPeriod] = currentGroup.reduce((acc, ret) => acc * (1 + ret), 1) - 1;
      } else {
        grouped[currentPeriod] = currentGroup.reduce((sum, ret) => sum + ret, 0);
      }
      
      currentGroup = [];
      currentPeriod++;
    }
  }
  
  return grouped;
}

/**
 * Prepare prices for analysis
 * Exactly matches Python implementation
 * @param {Array} data - Price data
 * @param {number} base - Base value (default 1.0)
 * @returns {Array} Prepared prices
 */
export function preparePrices(data, base = 1.0) {
  const cleanData = data.map(price => isNaN(price) ? 0 : price);
  
  if (cleanData.length === 0) return [];
  
  const factor = base / cleanData[0];
  return cleanData.map(price => price * factor);
}

/**
 * Round to closest value
 * Exactly matches Python implementation
 * @param {number} val - Value to round
 * @param {number} res - Resolution to round to
 * @param {number} decimals - Number of decimals (default null)
 * @returns {number} Rounded value
 */
export function roundToClosest(val, res, decimals = null) {
  const rounded = Math.round(val / res) * res;
  return decimals !== null ? parseFloat(rounded.toFixed(decimals)) : rounded;
}

/**
 * Count consecutive occurrences
 * Exactly matches Python implementation
 * @param {Array} data - Data array
 * @returns {Array} Consecutive counts
 */
export function countConsecutive(data) {
  const result = [];
  let currentCount = 0;
  let currentValue = null;
  
  for (const value of data) {
    if (value === currentValue) {
      currentCount++;
    } else {
      if (currentValue !== null) {
        result.push(currentCount);
      }
      currentValue = value;
      currentCount = 1;
    }
  }
  
  if (currentValue !== null) {
    result.push(currentCount);
  }
  
  return result;
}

/**
 * Make portfolio from returns
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} startBalance - Starting balance (default 100000)
 * @param {string} mode - Mode ('comp' or 'sum', default 'comp')
 * @param {number} roundTo - Round to value (default null)
 * @returns {Array} Portfolio values
 */
export function makePortfolio(returns, startBalance = 100000, mode = 'comp', roundTo = null) {
  const values = [startBalance];
  
  for (const ret of returns) {
    let newValue;
    if (mode === 'comp') {
      newValue = values[values.length - 1] * (1 + ret);
    } else {
      newValue = values[values.length - 1] + ret;
    }
    
    if (roundTo !== null) {
      newValue = roundToClosest(newValue, roundTo);
    }
    
    values.push(newValue);
  }
  
  return values;
}

/**
 * Create index from returns
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} base - Base value (default 1000)
 * @returns {Array} Index values
 */
export function makeIndex(returns, base = 1000) {
  return makePortfolio(returns, base, 'comp');
}

/**
 * Score to string conversion
 * Exactly matches Python implementation
 * @param {number} val - Value to convert
 * @returns {string} Score string
 */
export function scoreStr(val) {
  if (val > 0.99) return 'A+';
  if (val > 0.95) return 'A';
  if (val > 0.90) return 'A-';
  if (val > 0.85) return 'B+';
  if (val > 0.80) return 'B';
  if (val > 0.75) return 'B-';
  if (val > 0.70) return 'C+';
  if (val > 0.65) return 'C';
  if (val > 0.60) return 'C-';
  if (val > 0.55) return 'D+';
  if (val > 0.50) return 'D';
  if (val > 0.45) return 'D-';
  return 'F';
}

/**
 * Flatten dataframe-like structure
 * Exactly matches Python implementation
 * @param {Array} data - Data array
 * @param {number} setIndex - Index to set (default null)
 * @returns {Array} Flattened data
 */
export function flattenDataframe(data, setIndex = null) {
  const flattened = [];
  
  for (let i = 0; i < data.length; i++) {
    if (Array.isArray(data[i])) {
      flattened.push(...data[i]);
    } else {
      flattened.push(data[i]);
    }
  }
  
  return flattened;
}

export { TRADING_DAYS_PER_YEAR, TRADING_DAYS_PER_MONTH, MONTHS_PER_YEAR };
