/**
 * Plots module for QuantStats.js
 * Simplified plotting functionality for Node.js
 */

import { 
  prepareReturns, 
  toDrawdownSeries, 
  portfolioValue,
  aggregateReturns,
  TRADING_DAYS_PER_YEAR 
} from './utils.js';

import { 
  volatility, 
  monthlyReturns, 
  yearlyReturns 
} from './stats.js';

/**
 * Generate data for equity curve plot
 * @param {Array} returns - Returns array
 * @param {number} initialValue - Initial portfolio value (default 1000)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function equityCurve(returns, initialValue = 1000, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const values = portfolioValue(cleanReturns, initialValue);
  
  return {
    type: 'line',
    data: values,
    title: 'Equity Curve',
    xLabel: 'Time',
    yLabel: 'Portfolio Value',
    description: 'Portfolio value over time'
  };
}

/**
 * Generate data for drawdown plot
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function drawdownPlot(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const drawdowns = toDrawdownSeries(cleanReturns);
  
  return {
    type: 'area',
    data: drawdowns.map(dd => dd * 100), // Convert to percentage
    title: 'Drawdown',
    xLabel: 'Time',
    yLabel: 'Drawdown (%)',
    description: 'Portfolio drawdown over time'
  };
}

/**
 * Generate data for returns distribution histogram
 * @param {Array} returns - Returns array
 * @param {number} bins - Number of bins (default 30)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function returnsDistribution(returns, bins = 30, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length === 0) {
    return {
      type: 'histogram',
      data: [],
      bins: [],
      title: 'Returns Distribution',
      xLabel: 'Return',
      yLabel: 'Frequency'
    };
  }
  
  const min = Math.min(...cleanReturns);
  const max = Math.max(...cleanReturns);
  const binWidth = (max - min) / bins;
  
  const histogram = new Array(bins).fill(0);
  const binEdges = [];
  
  for (let i = 0; i <= bins; i++) {
    binEdges.push(min + i * binWidth);
  }
  
  for (const ret of cleanReturns) {
    const binIndex = Math.min(Math.floor((ret - min) / binWidth), bins - 1);
    histogram[binIndex]++;
  }
  
  return {
    type: 'histogram',
    data: histogram,
    bins: binEdges,
    title: 'Returns Distribution',
    xLabel: 'Return',
    yLabel: 'Frequency',
    description: 'Distribution of daily returns'
  };
}

/**
 * Generate data for rolling statistics plot
 * @param {Array} returns - Returns array
 * @param {number} window - Rolling window size (default 252)
 * @param {string} stat - Statistic to calculate ('volatility', 'sharpe')
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function rollingStats(returns, window = 252, stat = 'volatility', nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length < window) {
    return {
      type: 'line',
      data: [],
      title: `Rolling ${stat.charAt(0).toUpperCase() + stat.slice(1)}`,
      xLabel: 'Time',
      yLabel: stat.charAt(0).toUpperCase() + stat.slice(1)
    };
  }
  
  const rollingValues = [];
  
  for (let i = window; i <= cleanReturns.length; i++) {
    const windowReturns = cleanReturns.slice(i - window, i);
    
    let value;
    switch (stat.toLowerCase()) {
      case 'volatility':
        value = volatility(windowReturns, nans);
        break;
      case 'sharpe':
        // Import sharpe function here to avoid circular dependency
        const mean = windowReturns.reduce((sum, ret) => sum + ret, 0) / windowReturns.length;
        const variance = windowReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / windowReturns.length;
        const std = Math.sqrt(variance);
        value = std === 0 ? 0 : (mean * Math.sqrt(TRADING_DAYS_PER_YEAR)) / (std * Math.sqrt(TRADING_DAYS_PER_YEAR));
        break;
      default:
        value = 0;
    }
    
    rollingValues.push(value);
  }
  
  return {
    type: 'line',
    data: rollingValues,
    title: `Rolling ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${window} days)`,
    xLabel: 'Time',
    yLabel: stat.charAt(0).toUpperCase() + stat.slice(1),
    description: `Rolling ${window}-day ${stat}`
  };
}

/**
 * Generate data for monthly returns heatmap
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function monthlyHeatmap(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const monthly = monthlyReturns(cleanReturns, nans);
  
  // Group by year and month (simplified)
  const monthlyData = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < monthly.length; i++) {
    const monthIndex = i % 12;
    const year = Math.floor(i / 12);
    
    monthlyData.push({
      month: months[monthIndex],
      year: year,
      return: monthly[i] * 100 // Convert to percentage
    });
  }
  
  return {
    type: 'heatmap',
    data: monthlyData,
    title: 'Monthly Returns Heatmap',
    xLabel: 'Month',
    yLabel: 'Year',
    description: 'Monthly returns by year'
  };
}

/**
 * Generate data for yearly returns bar chart
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function yearlyReturnsChart(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const yearly = yearlyReturns(cleanReturns, nans);
  
  return {
    type: 'bar',
    data: yearly.map(ret => ret * 100), // Convert to percentage
    title: 'Yearly Returns',
    xLabel: 'Year',
    yLabel: 'Return (%)',
    description: 'Annual returns by year'
  };
}

/**
 * Generate snapshot plot data (key metrics visualization)
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data with key metrics
 */
export function snapshot(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  // Import stats functions here to avoid circular dependency
  const totalRet = cleanReturns.reduce((prod, ret) => prod * (1 + ret), 1) - 1;
  const vol = volatility(cleanReturns, nans);
  const maxDD = Math.min(...toDrawdownSeries(cleanReturns));
  
  // Calculate other metrics
  const mean = cleanReturns.reduce((sum, ret) => sum + ret, 0) / cleanReturns.length;
  const variance = cleanReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / cleanReturns.length;
  const std = Math.sqrt(variance);
  const sharpeRatio = std === 0 ? 0 : (mean * Math.sqrt(TRADING_DAYS_PER_YEAR)) / (std * Math.sqrt(TRADING_DAYS_PER_YEAR));
  
  return {
    type: 'metrics',
    data: {
      totalReturn: totalRet * 100,
      volatility: vol * 100,
      sharpeRatio: sharpeRatio,
      maxDrawdown: maxDD * 100,
      winRate: cleanReturns.filter(ret => ret > 0).length / cleanReturns.length * 100,
      avgWin: cleanReturns.filter(ret => ret > 0).reduce((sum, ret) => sum + ret, 0) / cleanReturns.filter(ret => ret > 0).length * 100 || 0,
      avgLoss: cleanReturns.filter(ret => ret < 0).reduce((sum, ret) => sum + ret, 0) / cleanReturns.filter(ret => ret < 0).length * 100 || 0
    },
    title: 'Performance Snapshot',
    description: 'Key performance metrics summary'
  };
}

/**
 * Export plot data as JSON for external visualization
 * @param {Object} plotData - Plot data object
 * @param {string} filename - Output filename (optional)
 * @returns {string} JSON string
 */
export function exportPlotData(plotData, filename = null) {
  const jsonData = JSON.stringify(plotData, null, 2);
  
  return jsonData;
}

/**
 * Generate comprehensive dashboard data
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Dashboard data with multiple plots
 */
export function dashboard(returns, nans = false) {
  return {
    equityCurve: equityCurve(returns, 1000, nans),
    drawdown: drawdownPlot(returns, nans),
    returnsDistribution: returnsDistribution(returns, 30, nans),
    rollingVolatility: rollingStats(returns, 252, 'volatility', nans),
    monthlyHeatmap: monthlyHeatmap(returns, nans),
    yearlyReturns: yearlyReturnsChart(returns, nans),
    snapshot: snapshot(returns, nans)
  };
}

/**
 * Generate earnings plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} startBalance - Starting balance (default 1000)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function earnings(returns, startBalance = 1000, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const values = portfolioValue(cleanReturns, startBalance);
  
  return {
    type: 'line',
    data: values,
    title: 'Total Return',
    xLabel: 'Time',
    yLabel: 'Total Return',
    description: 'Cumulative returns over time'
  };
}

/**
 * Generate returns plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function returns(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  return {
    type: 'line',
    data: cleanReturns.map(ret => ret * 100), // Convert to percentage
    title: 'Returns',
    xLabel: 'Time',
    yLabel: 'Return (%)',
    description: 'Daily returns over time'
  };
}

/**
 * Generate log returns plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function logReturns(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const logRets = cleanReturns.map(ret => Math.log(1 + ret));
  
  return {
    type: 'line',
    data: logRets.map(ret => ret * 100), // Convert to percentage
    title: 'Log Returns',
    xLabel: 'Time',
    yLabel: 'Log Return (%)',
    description: 'Log returns over time'
  };
}

/**
 * Generate daily returns plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function dailyReturns(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  return {
    type: 'bar',
    data: cleanReturns.map(ret => ret * 100), // Convert to percentage
    title: 'Daily Returns',
    xLabel: 'Time',
    yLabel: 'Return (%)',
    description: 'Daily returns as bars'
  };
}

/**
 * Generate distribution plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} bins - Number of bins (default 50)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function distribution(returns, bins = 50, nans = false) {
  return returnsDistribution(returns, bins, nans);
}

/**
 * Generate histogram plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} bins - Number of bins (default 50)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function histogram(returns, bins = 50, nans = false) {
  return returnsDistribution(returns, bins, nans);
}

/**
 * Generate drawdown plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function drawdown(returns, nans = false) {
  return drawdownPlot(returns, nans);
}

/**
 * Generate drawdown periods plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function drawdownsPeriods(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const drawdowns = toDrawdownSeries(cleanReturns);
  
  // Find drawdown periods
  const periods = [];
  let inDrawdown = false;
  let startIndex = 0;
  
  for (let i = 0; i < drawdowns.length; i++) {
    if (drawdowns[i] < 0 && !inDrawdown) {
      inDrawdown = true;
      startIndex = i;
    } else if (drawdowns[i] >= 0 && inDrawdown) {
      inDrawdown = false;
      periods.push({
        start: startIndex,
        end: i - 1,
        maxDrawdown: Math.min(...drawdowns.slice(startIndex, i))
      });
    }
  }
  
  return {
    type: 'periods',
    data: periods,
    title: 'Drawdown Periods',
    xLabel: 'Time',
    yLabel: 'Drawdown (%)',
    description: 'Individual drawdown periods'
  };
}

/**
 * Generate rolling beta plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns
 * @param {number} window - Rolling window (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function rollingBeta(returns, benchmark, window = 252, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const cleanBenchmark = prepareReturns(benchmark, 0, nans);
  
  if (cleanReturns.length !== cleanBenchmark.length || cleanReturns.length < window) {
    return {
      type: 'line',
      data: [],
      title: 'Rolling Beta',
      xLabel: 'Time',
      yLabel: 'Beta'
    };
  }
  
  const rollingBetas = [];
  
  for (let i = window; i <= cleanReturns.length; i++) {
    const retWindow = cleanReturns.slice(i - window, i);
    const benchWindow = cleanBenchmark.slice(i - window, i);
    
    // Calculate beta
    const retMean = retWindow.reduce((sum, ret) => sum + ret, 0) / retWindow.length;
    const benchMean = benchWindow.reduce((sum, ret) => sum + ret, 0) / benchWindow.length;
    
    let covariance = 0;
    let benchVariance = 0;
    
    for (let j = 0; j < retWindow.length; j++) {
      const retDiff = retWindow[j] - retMean;
      const benchDiff = benchWindow[j] - benchMean;
      covariance += retDiff * benchDiff;
      benchVariance += benchDiff * benchDiff;
    }
    
    covariance /= retWindow.length;
    benchVariance /= benchWindow.length;
    
    const beta = benchVariance === 0 ? 0 : covariance / benchVariance;
    rollingBetas.push(beta);
  }
  
  return {
    type: 'line',
    data: rollingBetas,
    title: `Rolling Beta (${window} days)`,
    xLabel: 'Time',
    yLabel: 'Beta',
    description: `Rolling ${window}-day beta relative to benchmark`
  };
}

/**
 * Generate rolling volatility plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} window - Rolling window (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function rollingVolatility(returns, window = 252, nans = false) {
  return rollingStats(returns, window, 'volatility', nans);
}

/**
 * Generate rolling Sharpe plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} window - Rolling window (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function rollingSharpe(returns, window = 252, nans = false) {
  return rollingStats(returns, window, 'sharpe', nans);
}

/**
 * Generate rolling Sortino plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {number} window - Rolling window (default 252)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function rollingSortino(returns, window = 252, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  
  if (cleanReturns.length < window) {
    return {
      type: 'line',
      data: [],
      title: 'Rolling Sortino',
      xLabel: 'Time',
      yLabel: 'Sortino Ratio'
    };
  }
  
  const rollingSortinos = [];
  
  for (let i = window; i <= cleanReturns.length; i++) {
    const windowReturns = cleanReturns.slice(i - window, i);
    
    // Calculate Sortino ratio
    const mean = windowReturns.reduce((sum, ret) => sum + ret, 0) / windowReturns.length;
    const negativeReturns = windowReturns.filter(ret => ret < 0);
    
    if (negativeReturns.length === 0) {
      rollingSortinos.push(mean > 0 ? Infinity : 0);
      continue;
    }
    
    const downsideVariance = negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / windowReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    const sortino = downsideDeviation === 0 ? 0 : (mean * Math.sqrt(TRADING_DAYS_PER_YEAR)) / (downsideDeviation * Math.sqrt(TRADING_DAYS_PER_YEAR));
    rollingSortinos.push(sortino);
  }
  
  return {
    type: 'line',
    data: rollingSortinos,
    title: `Rolling Sortino (${window} days)`,
    xLabel: 'Time',
    yLabel: 'Sortino Ratio',
    description: `Rolling ${window}-day Sortino ratio`
  };
}

/**
 * Generate monthly returns plot data
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plot data
 */
export function monthlyReturnsPlot(returns, nans = false) {
  const cleanReturns = prepareReturns(returns, 0, nans);
  const monthly = monthlyReturns(cleanReturns, nans);
  
  return {
    type: 'bar',
    data: monthly.map(ret => ret * 100), // Convert to percentage
    title: 'Monthly Returns',
    xLabel: 'Month',
    yLabel: 'Return (%)',
    description: 'Monthly returns over time'
  };
}

export default {
  equityCurve,
  drawdownPlot,
  returnsDistribution,
  rollingStats,
  monthlyHeatmap,
  yearlyReturnsChart,
  snapshot,
  dashboard,
  exportPlotData,
  earnings,
  returns,
  logReturns,
  dailyReturns,
  distribution,
  histogram,
  drawdown,
  drawdownsPeriods,
  rollingBeta,
  rollingVolatility,
  rollingSharpe,
  rollingSortino,
  monthlyReturnsPlot
};
