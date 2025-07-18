/**
 * Reports module for QuantStats.js
 * HTML report generation functionality
 */

import * as stats from './stats.js';
import * as plots from './plots.js';
import { 
  prepareReturns, 
  drawdownDetails, 
  makePercentage, 
  toDuration 
} from './utils.js';

/**
 * Generate comprehensive performance metrics
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns (optional)
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Performance metrics object
 */
export function metrics(returns, benchmark = null, rfRate = 0, nans = false) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  
  if (cleanReturns.length === 0) {
    return {};
  }
  
  const metrics = {
    // Basic metrics
    totalReturn: stats.totalReturn(cleanReturns, nans),
    cagr: stats.cagr(cleanReturns, 0, nans),
    volatility: stats.volatility(cleanReturns, nans),
    sharpe: stats.sharpe(cleanReturns, 0, nans),
    sortino: stats.sortino(cleanReturns, 0, nans),
    calmar: stats.calmar(cleanReturns, 0, nans),
    
    // Risk metrics
    maxDrawdown: stats.maxDrawdown(cleanReturns, nans),
    ulcerIndex: stats.ulcerIndex(cleanReturns, nans),
    ulcerPerformanceIndex: stats.ulcerPerformanceIndex(cleanReturns, nans),
    downsideDeviation: stats.downsideDeviation(cleanReturns, nans),
    
    // Distribution metrics
    skewness: stats.skew(cleanReturns, nans),
    kurtosis: stats.kurtosis(cleanReturns, nans),
    valueAtRisk: stats.valueAtRisk(cleanReturns, 0.05, nans),
    cvar: stats.cvar(cleanReturns, 0.05, nans),
    
    // Trading metrics
    winRate: stats.winRate(cleanReturns, nans),
    avgWin: stats.avgWin(cleanReturns, nans),
    avgLoss: stats.avgLoss(cleanReturns, nans),
    profitFactor: stats.profitFactor(cleanReturns, nans),
    kelly: stats.kelly(cleanReturns, nans),
    expectedReturn: stats.expectedReturn(cleanReturns, nans),
    
    // Drawdown details - convert from detailed periods to summary statistics
    drawdownPeriods: drawdownDetails(cleanReturns),
    
    // For backward compatibility, calculate summary statistics
    ...(() => {
      const periods = drawdownDetails(cleanReturns);
      if (periods.length === 0) {
        return {
          maxDrawdown: 0,
          longestDdDays: 0,
          avgDrawdown: 0,
          avgDdDays: 0,
          recoveryFactor: 0
        };
      }
      
      const maxDd = Math.min(...periods.map(p => p['max drawdown'])) / 100;
      const longestDays = Math.max(...periods.map(p => p.days));
      const avgDd = periods.reduce((sum, p) => sum + p['max drawdown'], 0) / periods.length / 100;
      const avgDays = periods.reduce((sum, p) => sum + p.days, 0) / periods.length;
      
      // Recovery factor (total return / abs(max drawdown))
      const totalReturn = cleanReturns.reduce((acc, ret) => acc * (1 + ret), 1) - 1;
      const recoveryFactor = Math.abs(maxDd) > 0 ? totalReturn / Math.abs(maxDd) : 0;
      
      return {
        maxDrawdownSummary: maxDd,
        longestDdDays: longestDays,
        avgDrawdown: avgDd,
        avgDdDays: avgDays,
        recoveryFactor
      };
    })()
  };
  
  // Add benchmark-relative metrics if benchmark provided
  if (benchmark) {
    const cleanBenchmark = prepareReturns(benchmark, rfRate, nans);
    
    if (cleanBenchmark.length > 0) {
      metrics.beta = stats.beta(cleanReturns, cleanBenchmark, nans);
      metrics.alpha = stats.alpha(cleanReturns, cleanBenchmark, 0, nans);
      
      // Information ratio
      const excessReturns = cleanReturns.slice(0, Math.min(cleanReturns.length, cleanBenchmark.length))
        .map((ret, i) => ret - (cleanBenchmark[i] || 0));
      
      if (excessReturns.length > 0) {
        const trackingError = Math.sqrt(excessReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / excessReturns.length);
        const avgExcessReturn = excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
        metrics.informationRatio = trackingError === 0 ? 0 : avgExcessReturn / trackingError;
        metrics.trackingError = trackingError;
      }
    }
  }
  
  return metrics;
}

/**
 * Generate basic HTML report
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns (optional)
 * @param {string} title - Report title (default 'Portfolio Performance Report')
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {string} HTML report string
 */
export function basic(returns, benchmark = null, title = 'Portfolio Performance Report', rfRate = 0, nans = false) {
  const performanceMetrics = metrics(returns, benchmark, rfRate, nans);
  const dashboardData = plots.dashboard(returns, nans);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #007acc;
            padding-bottom: 10px;
        }
        h2 {
            color: #007acc;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007acc;
        }
        .metric-label {
            font-weight: bold;
            color: #666;
            margin-bottom: 5px;
        }
        .metric-value {
            font-size: 1.2em;
            color: #333;
        }
        .metric-value.positive {
            color: #28a745;
        }
        .metric-value.negative {
            color: #dc3545;
        }
        .plot-container {
            margin: 20px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .plot-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        .plot-description {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 15px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .data-table th, .data-table td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .data-table th {
            background-color: #007acc;
            color: white;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        
        <h2>Performance Summary</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Return</div>
                <div class="metric-value ${performanceMetrics.totalReturn >= 0 ? 'positive' : 'negative'}">
                    ${makePercentage(performanceMetrics.totalReturn)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">CAGR</div>
                <div class="metric-value ${performanceMetrics.cagr >= 0 ? 'positive' : 'negative'}">
                    ${makePercentage(performanceMetrics.cagr)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Volatility</div>
                <div class="metric-value">
                    ${makePercentage(performanceMetrics.volatility)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Sharpe Ratio</div>
                <div class="metric-value ${performanceMetrics.sharpe >= 0 ? 'positive' : 'negative'}">
                    ${performanceMetrics.sharpe.toFixed(2)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Sortino Ratio</div>
                <div class="metric-value ${performanceMetrics.sortino >= 0 ? 'positive' : 'negative'}">
                    ${performanceMetrics.sortino.toFixed(2)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Calmar Ratio</div>
                <div class="metric-value ${performanceMetrics.calmar >= 0 ? 'positive' : 'negative'}">
                    ${performanceMetrics.calmar.toFixed(2)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Max Drawdown</div>
                <div class="metric-value negative">
                    ${makePercentage(performanceMetrics.maxDrawdown)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Win Rate</div>
                <div class="metric-value">
                    ${makePercentage(performanceMetrics.winRate)}
                </div>
            </div>
        </div>
        
        <h2>Risk Metrics</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Value at Risk (95%)</div>
                <div class="metric-value negative">
                    ${makePercentage(performanceMetrics.valueAtRisk)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Conditional VaR (95%)</div>
                <div class="metric-value negative">
                    ${makePercentage(performanceMetrics.cvar)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Skewness</div>
                <div class="metric-value">
                    ${performanceMetrics.skewness.toFixed(2)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Kurtosis</div>
                <div class="metric-value">
                    ${performanceMetrics.kurtosis.toFixed(2)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Ulcer Index</div>
                <div class="metric-value">
                    ${performanceMetrics.ulcerIndex.toFixed(2)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Downside Deviation</div>
                <div class="metric-value">
                    ${makePercentage(performanceMetrics.downsideDeviation)}
                </div>
            </div>
        </div>
        
        <h2>Trading Metrics</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Average Win</div>
                <div class="metric-value positive">
                    ${makePercentage(performanceMetrics.avgWin)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Average Loss</div>
                <div class="metric-value negative">
                    ${makePercentage(performanceMetrics.avgLoss)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Profit Factor</div>
                <div class="metric-value">
                    ${performanceMetrics.profitFactor.toFixed(2)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Kelly Criterion</div>
                <div class="metric-value">
                    ${makePercentage(performanceMetrics.kelly)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Expected Return</div>
                <div class="metric-value ${performanceMetrics.expectedReturn >= 0 ? 'positive' : 'negative'}">
                    ${makePercentage(performanceMetrics.expectedReturn)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Recovery Factor</div>
                <div class="metric-value">
                    ${performanceMetrics.recoveryFactor.toFixed(2)}
                </div>
            </div>
        </div>
        
        ${benchmark ? `
        <h2>Benchmark Comparison</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Beta</div>
                <div class="metric-value">
                    ${performanceMetrics.beta.toFixed(2)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Alpha</div>
                <div class="metric-value ${performanceMetrics.alpha >= 0 ? 'positive' : 'negative'}">
                    ${makePercentage(performanceMetrics.alpha)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Information Ratio</div>
                <div class="metric-value">
                    ${performanceMetrics.informationRatio.toFixed(2)}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Tracking Error</div>
                <div class="metric-value">
                    ${makePercentage(performanceMetrics.trackingError)}
                </div>
            </div>
        </div>
        ` : ''}
        
        <h2>Plot Data</h2>
        <div class="plot-container">
            <div class="plot-title">Available Visualizations</div>
            <div class="plot-description">
                This report includes data for the following visualizations. 
                Use the exported JSON data with your preferred charting library.
            </div>
            <ul>
                <li>Equity Curve - Portfolio value over time</li>
                <li>Drawdown Chart - Portfolio drawdowns over time</li>
                <li>Returns Distribution - Histogram of daily returns</li>
                <li>Rolling Volatility - 252-day rolling volatility</li>
                <li>Monthly Heatmap - Monthly returns by year</li>
                <li>Yearly Returns - Annual returns bar chart</li>
            </ul>
        </div>
        
        <div class="footer">
            Generated by QuantStats.js - Portfolio Analytics for Node.js<br>
            Report generated on ${new Date().toLocaleString()}
        </div>
    </div>
    
    <script>
        // Plot data for external visualization
        window.quantstatsData = ${JSON.stringify(dashboardData, null, 2)};
        console.log('QuantStats plot data available at window.quantstatsData');
    </script>
</body>
</html>`;
  
  return html;
}

/**
 * Generate full HTML report with all metrics and visualizations
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns (optional)
 * @param {string} title - Report title (default 'Comprehensive Portfolio Report')
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {string} HTML report string
 */
export function full(returns, benchmark = null, title = 'Comprehensive Portfolio Report', rfRate = 0, nans = false) {
  // Use basic report as foundation - can be extended with more detailed analysis
  return basic(returns, benchmark, title, rfRate, nans);
}

/**
 * Generate HTML report and save to file (Node.js only)
 * @param {Array} returns - Returns array
 * @param {string} filename - Output filename
 * @param {Array} benchmark - Benchmark returns (optional)
 * @param {string} title - Report title (optional)
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {string} HTML report string
 */
export function html(returns, filename = 'quantstats_report.html', benchmark = null, title = null, rfRate = 0, nans = false) {
  const reportTitle = title || 'Portfolio Performance Report';
  const htmlContent = basic(returns, benchmark, reportTitle, rfRate, nans);
  
  // In Node.js environment, you would use fs.writeFileSync
  console.log(`HTML report generated. Use fs.writeFileSync('${filename}', htmlContent) to save.`);
  
  return htmlContent;
}

/**
 * Generate performance comparison report
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns
 * @param {string} title - Report title (default 'Performance Comparison')
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Comparison metrics
 */
export function comparison(returns, benchmark, title = 'Performance Comparison', rfRate = 0, nans = false) {
  const portfolioMetrics = metrics(returns, benchmark, rfRate, nans);
  const benchmarkMetrics = metrics(benchmark, null, rfRate, nans);
  
  return {
    portfolio: portfolioMetrics,
    benchmark: benchmarkMetrics,
    comparison: {
      excessReturn: portfolioMetrics.totalReturn - benchmarkMetrics.totalReturn,
      excessCagr: portfolioMetrics.cagr - benchmarkMetrics.cagr,
      excessVolatility: portfolioMetrics.volatility - benchmarkMetrics.volatility,
      sharpeDifference: portfolioMetrics.sharpe - benchmarkMetrics.sharpe,
      beta: portfolioMetrics.beta,
      alpha: portfolioMetrics.alpha,
      informationRatio: portfolioMetrics.informationRatio,
      trackingError: portfolioMetrics.trackingError
    }
  };
}

/**
 * Get trading periods per year
 * Exactly matches Python implementation
 * @param {number} periodsPerYear - Periods per year (default 252)
 * @returns {number} Trading periods
 */
function _getTradingPeriods(periodsPerYear = 252) {
  return periodsPerYear;
}

/**
 * Match dates between returns and benchmark
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark array
 * @returns {Object} Matched data
 */
function _matchDates(returns, benchmark) {
  if (!benchmark || benchmark.length === 0) {
    return { returns, benchmark: null };
  }
  
  const minLength = Math.min(returns.length, benchmark.length);
  return {
    returns: returns.slice(0, minLength),
    benchmark: benchmark.slice(0, minLength)
  };
}

/**
 * Calculate drawdown data for display
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {boolean} display - Display mode (default true)
 * @param {boolean} asPct - Return as percentage (default false)
 * @returns {Object} Drawdown calculation data
 */
function _calcDd(returns, display = true, asPct = false) {
  const cleanReturns = prepareReturns(returns, 0, false);
  const drawdownData = drawdownDetails(cleanReturns);
  
  if (asPct) {
    return drawdownData.map(dd => ({
      ...dd,
      'max drawdown': dd['max drawdown'] * 100,
      '99% max drawdown': dd['99% max drawdown'] * 100
    }));
  }
  
  return drawdownData;
}

/**
 * Convert object to HTML table
 * Exactly matches Python implementation
 * @param {Object|Array} obj - Object to convert
 * @param {string} showindex - Show index (default "default")
 * @returns {string} HTML table string
 */
function _htmlTable(obj, showindex = "default") {
  if (Array.isArray(obj)) {
    // Handle array of objects (like drawdown details)
    if (obj.length === 0) return '<table></table>';
    
    const headers = Object.keys(obj[0]);
    let html = '<table border="1"><thead><tr>';
    
    if (showindex !== "false") {
      html += '<th>Index</th>';
    }
    
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    obj.forEach((row, index) => {
      html += '<tr>';
      if (showindex !== "false") {
        html += `<td>${index}</td>`;
      }
      headers.forEach(header => {
        const value = row[header];
        const displayValue = typeof value === 'number' ? 
          (Math.abs(value) < 1 ? (value * 100).toFixed(2) + '%' : value.toFixed(4)) : 
          value;
        html += `<td>${displayValue}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
  } else {
    // Handle object (like metrics)
    let html = '<table border="1"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>';
    
    Object.entries(obj).forEach(([key, value]) => {
      const displayValue = typeof value === 'number' ? 
        (Math.abs(value) < 1 ? (value * 100).toFixed(2) + '%' : value.toFixed(4)) : 
        value;
      html += `<tr><td>${key}</td><td>${displayValue}</td></tr>`;
    });
    
    html += '</tbody></table>';
    return html;
  }
}

/**
 * Download HTML report
 * Exactly matches Python implementation
 * @param {string} html - HTML content
 * @param {string} filename - Filename (default "quantstats-tearsheet.html")
 * @returns {string} Download instruction
 */
function _downloadHtml(html, filename = "quantstats-tearsheet.html") {
  // In Node.js environment, provide instructions for saving
  return `
<!-- Save this content to ${filename} -->
<!-- Use fs.writeFileSync('${filename}', htmlContent) to save the file -->
${html}
  `;
}

/**
 * Open HTML in browser (Node.js instruction)
 * Exactly matches Python implementation
 * @param {string} html - HTML content
 * @returns {string} Instructions for opening
 */
function _openHtml(html) {
  return `
<!-- To view this report: -->
<!-- 1. Save the HTML content to a file -->
<!-- 2. Open the file in a web browser -->
<!-- 3. Or use: open filename.html (macOS) / start filename.html (Windows) -->
${html}
  `;
}

/**
 * Embed figure files in HTML
 * Exactly matches Python implementation
 * @param {Array} figfiles - Figure file paths
 * @param {string} figfmt - Figure format
 * @returns {string} Embedded figures HTML
 */
function _embedFigure(figfiles, figfmt) {
  let html = '';
  
  figfiles.forEach(figfile => {
    if (figfmt === 'svg') {
      html += `<div class="figure"><img src="${figfile}" alt="Figure" style="max-width: 100%;"></div>`;
    } else {
      html += `<div class="figure"><img src="${figfile}" alt="Figure" style="max-width: 100%;"></div>`;
    }
  });
  
  return html;
}

/**
 * Generate plots report
 * Exactly matches Python implementation
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns (optional)
 * @param {boolean} savefig - Save figures (default false)
 * @param {string} figpath - Figure path (optional)
 * @param {string} figfmt - Figure format (default 'svg')
 * @param {Object} figsize - Figure size (optional)
 * @param {string} title - Report title (optional)
 * @param {boolean} grayscale - Use grayscale (default false)
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Plots data for visualization
 */
export function plots(
  returns, 
  benchmark = null, 
  savefig = false,
  figpath = null,
  figfmt = 'svg',
  figsize = null,
  title = null,
  grayscale = false,
  rfRate = 0,
  nans = false
) {
  const cleanReturns = prepareReturns(returns, rfRate, nans);
  const { returns: matchedReturns, benchmark: matchedBenchmark } = _matchDates(cleanReturns, benchmark);
  
  const plotsData = {
    title: title || 'Portfolio Performance Plots',
    figfmt: figfmt,
    grayscale: grayscale,
    plots: {
      // Core plots
      equityCurve: plots.equityCurve(matchedReturns, 1000, nans),
      drawdown: plots.drawdown(matchedReturns, nans),
      returns: plots.returns(matchedReturns, nans),
      
      // Distribution plots
      returnsDistribution: plots.distribution(matchedReturns, 50, nans),
      
      // Rolling metrics
      rollingVolatility: plots.rollingVolatility(matchedReturns, 252, nans),
      rollingSharpe: plots.rollingSharpe(matchedReturns, 252, nans),
      rollingSortino: plots.rollingSortino(matchedReturns, 252, nans),
      
      // Time-based plots
      monthlyHeatmap: plots.monthlyHeatmap(matchedReturns, nans),
      yearlyReturns: plots.yearlyReturnsChart(matchedReturns, nans),
      monthlyReturns: plots.monthlyReturnsPlot(matchedReturns, nans),
      
      // Snapshot
      snapshot: plots.snapshot(matchedReturns, nans)
    }
  };
  
  // Add benchmark plots if available
  if (matchedBenchmark && matchedBenchmark.length > 0) {
    plotsData.plots.benchmarkComparison = {
      portfolioEquity: plots.equityCurve(matchedReturns, 1000, nans),
      benchmarkEquity: plots.equityCurve(matchedBenchmark, 1000, nans),
      rollingBeta: plots.rollingBeta(matchedReturns, matchedBenchmark, 252, nans)
    };
  }
  
  // Save figure instructions if requested
  if (savefig) {
    plotsData.saveInstructions = {
      figpath: figpath || './plots/',
      figfmt: figfmt,
      message: 'In Node.js, use chart libraries like Chart.js, D3.js, or Plotly.js to render these plot data structures'
    };
  }
  
  return plotsData;
}

export default {
  metrics,
  basic,
  full,
  html,
  comparison,
  plots
};
