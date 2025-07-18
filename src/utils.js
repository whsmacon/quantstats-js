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
  if (returns.length > 1 && returns.every(val => val > 0) && Math.min(...returns) > 1) {
    returns = toReturns(returns);
  }

  // Remove NaN values unless explicitly requested
  if (!nans) {
    returns = returns.filter(val => !isNaN(val) && isFinite(val));
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
 * Get drawdown details - exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @returns {Object} Drawdown statistics
 */
export function drawdownDetails(returns) {
  const drawdownPeriods = toDrawdownsTable(returns);
  
  if (drawdownPeriods.length === 0) {
    return {
      maxDrawdown: 0,
      longestDdDays: 0,
      avgDrawdown: 0,
      avgDdDays: 0,
      recoveryFactor: 0
    };
  }
  
  const maxDrawdown = Math.min(...drawdownPeriods.map(dd => dd.maxDrawdown));
  const longestDdDays = Math.max(...drawdownPeriods.map(dd => dd.days));
  const avgDrawdown = drawdownPeriods.reduce((sum, dd) => sum + dd.maxDrawdown, 0) / drawdownPeriods.length;
  const avgDdDays = drawdownPeriods.reduce((sum, dd) => sum + dd.days, 0) / drawdownPeriods.length;
  
  // Recovery factor: total return / max drawdown
  const totalReturn = returns.reduce((prod, ret) => prod * (1 + ret), 1) - 1;
  const recoveryFactor = Math.abs(totalReturn / maxDrawdown);
  
  return {
    maxDrawdown,
    longestDdDays,
    avgDrawdown,
    avgDdDays,
    recoveryFactor
  };
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

export { TRADING_DAYS_PER_YEAR, TRADING_DAYS_PER_MONTH, MONTHS_PER_YEAR };
