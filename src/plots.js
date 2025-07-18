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
  
  if (filename) {
    // In Node.js environment, you might want to write to file
    console.log(`Plot data exported. Use fs.writeFileSync('${filename}', jsonData) to save.`);
  }
  
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

export default {
  equityCurve,
  drawdownPlot,
  returnsDistribution,
  rollingStats,
  monthlyHeatmap,
  yearlyReturnsChart,
  snapshot,
  dashboard,
  exportPlotData
};
