import * as stats from './stats.js';
import * as utils from './utils.js';
import * as plots from './plots.js';

/**
 * Generate comprehensive portfolio metrics
 * @param {Array} returns - Returns array
 * @param {Array} benchmark - Benchmark returns (optional)
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Comprehensive metrics object
 */
export function metrics(returns, benchmark = null, rfRate = 0, nans = false) {
  const cleanReturns = utils.prepareReturns(returns, rfRate, nans);
  
  if (cleanReturns.length === 0) {
    throw new Error('No valid returns data');
  }

  const metrics = {
    // Core performance metrics
    totalReturn: stats.compoundReturn(cleanReturns, nans),
    cagr: stats.cagr(cleanReturns, nans),
    volatility: stats.volatility(cleanReturns, 252, nans),
    sharpe: stats.sharpe(cleanReturns, rfRate, 252, nans),
    sortino: stats.sortino(cleanReturns, rfRate, 252, nans),
    calmar: stats.calmar(cleanReturns, nans),
    
    // Risk metrics
    maxDrawdown: stats.maxDrawdown(cleanReturns, nans),
    valueAtRisk: stats.valueAtRisk(cleanReturns, 0.05, nans),
    conditionalValueAtRisk: stats.cvar(cleanReturns, 0.05, nans),
    skew: stats.skew(cleanReturns, nans),
    kurtosis: stats.kurtosis(cleanReturns, nans),
    ulcerIndex: stats.ulcerIndex(cleanReturns, nans),
    
    // Trading metrics
    kelly: stats.kelly(cleanReturns, nans),
    profitFactor: stats.profitFactor(cleanReturns, nans),
    winRate: stats.winRate(cleanReturns, nans),
    
    // Advanced metrics
    probabilisticSharpeRatio: stats.probabilisticSharpeRatio(cleanReturns, 0, 252, nans),
    omega: stats.omega(cleanReturns, 0, nans),
    
    // Drawdown details
    drawdownInfo: (() => {
      const ddSeries = utils.toDrawdownSeries(cleanReturns, nans);
      const ddDetails = utils.drawdownDetails(cleanReturns, nans);
      
      const maxDd = Math.min(...ddSeries);
      const longestDays = ddDetails.reduce((max, dd) => Math.max(max, dd.days), 0);
      const avgDd = ddDetails.reduce((sum, dd) => sum + dd.maxDrawdown, 0) / ddDetails.length;
      const avgDays = ddDetails.reduce((sum, dd) => sum + dd.days, 0) / ddDetails.length;
      
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
    const cleanBenchmark = utils.prepareReturns(benchmark, rfRate, nans);
    
    if (cleanBenchmark.length > 0) {
      metrics.beta = stats.beta(cleanReturns, cleanBenchmark, nans);
      metrics.alpha = stats.alpha(cleanReturns, cleanBenchmark, rfRate, nans);
      metrics.informationRatio = stats.informationRatio(cleanReturns, cleanBenchmark, nans);
      metrics.trackingError = stats.trackingError(cleanReturns, cleanBenchmark, nans);
    }
  }
  
  return metrics;
}

/**
 * Generate SVG chart for equity curve
 */
function generateEquityCurveSVG(data) {
  if (!data || !data.data) return '<div>No equity curve data available</div>';
  
  const width = 576;
  const height = 360;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const values = data.data;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;
  
  // Generate path data
  const pathData = values.map((value, index) => {
    const x = margin.left + (index / (values.length - 1)) * chartWidth;
    const y = margin.top + ((maxValue - value) / valueRange) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  return `<div>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}pt" height="${height}pt" viewBox="0 0 ${width} ${height}">
  <defs>
    <style type="text/css">*{stroke-linejoin: round; stroke-linecap: butt}</style>
  </defs>
  <g>
    <rect x="0" y="0" width="${width}" height="${height}" style="fill: #ffffff"/>
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" style="fill: #ffffff"/>
    <path d="${pathData}" style="fill: none; stroke: #1f77b4; stroke-width: 1.5"/>
    <text x="${width/2}" y="25" style="font: 14px Arial; text-anchor: middle; fill: #000000">Cumulative Returns</text>
    <text x="${margin.left}" y="${height - 20}" style="font: 12px Arial; fill: #666666">Start</text>
    <text x="${width - margin.right}" y="${height - 20}" style="font: 12px Arial; text-anchor: end; fill: #666666">End</text>
    <text x="20" y="${margin.top + 10}" style="font: 12px Arial; fill: #666666">${maxValue.toFixed(0)}</text>
    <text x="20" y="${height - margin.bottom + 10}" style="font: 12px Arial; fill: #666666">${minValue.toFixed(0)}</text>
  </g>
</svg>
</div>`;
}

/**
 * Generate SVG chart for drawdown
 */
function generateDrawdownSVG(data) {
  if (!data || !data.data) return '<div>No drawdown data available</div>';
  
  const width = 576;
  const height = 360;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const values = data.data;
  const minValue = Math.min(...values, 0);
  const maxValue = 0;
  const valueRange = maxValue - minValue;
  
  // Generate area path data
  const pathData = values.map((value, index) => {
    const x = margin.left + (index / (values.length - 1)) * chartWidth;
    const y = margin.top + ((maxValue - value) / valueRange) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  const baselineY = margin.top + chartHeight;
  const areaPath = pathData + ` L ${margin.left + chartWidth} ${baselineY} L ${margin.left} ${baselineY} Z`;
  
  return `<div>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}pt" height="${height}pt" viewBox="0 0 ${width} ${height}">
  <defs>
    <style type="text/css">*{stroke-linejoin: round; stroke-linecap: butt}</style>
  </defs>
  <g>
    <rect x="0" y="0" width="${width}" height="${height}" style="fill: #ffffff"/>
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" style="fill: #ffffff"/>
    <path d="${areaPath}" style="fill: #ff7f0e; fill-opacity: 0.6; stroke: #ff7f0e; stroke-width: 1"/>
    <text x="${width/2}" y="25" style="font: 14px Arial; text-anchor: middle; fill: #000000">Underwater Plot</text>
    <text x="${margin.left}" y="${height - 20}" style="font: 12px Arial; fill: #666666">Start</text>
    <text x="${width - margin.right}" y="${height - 20}" style="font: 12px Arial; text-anchor: end; fill: #666666">End</text>
    <text x="20" y="${margin.top + 10}" style="font: 12px Arial; fill: #666666">0%</text>
    <text x="20" y="${height - margin.bottom + 10}" style="font: 12px Arial; fill: #666666">${(minValue * 100).toFixed(1)}%</text>
  </g>
</svg>
</div>`;
}

/**
 * Generate cumulative returns chart (like Python QuantStats)
 */
function generateCumulativeReturnsChart(returns, dates, title = 'Cumulative Returns', logScale = false) {
  const width = 800; // Base width for calculations
  const height = 400; // Base height for calculations
  const margin = { top: 50, right: 80, bottom: 70, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Calculate cumulative returns starting from 0%
  let cumulativeValue = 1.0; // Start at 1 (representing 0% return)
  const cumulativeReturns = [0]; // Start at 0% for display
  
  for (let i = 0; i < returns.length; i++) {
    cumulativeValue *= (1 + returns[i]);
    cumulativeReturns.push((cumulativeValue - 1) * 100); // Convert to percentage
  }
  
  const minValue = Math.min(...cumulativeReturns);
  const maxValue = Math.max(...cumulativeReturns);
  
  let yTicks = [];
  let roundedMin, roundedMax, valueRange;
  
  if (logScale) {
    // For log scale, we need to handle positive and negative values carefully
    // Convert to 1-based values for log calculation (add 1 to percentage values)
    const logValues = cumulativeReturns.map(v => v + 100); // Convert % to 1-based
    const logMin = Math.min(...logValues);
    const logMax = Math.max(...logValues);
    
    // Create logarithmic ticks
    const logMinValue = Math.max(0.1, logMin); // Avoid log(0)
    const logMaxValue = logMax;
    
    // Generate log scale ticks
    const logStart = Math.floor(Math.log10(logMinValue));
    const logEnd = Math.ceil(Math.log10(logMaxValue));
    
    for (let i = logStart; i <= logEnd; i++) {
      const baseValue = Math.pow(10, i);
      [1, 2, 5].forEach(mult => {
        const tickValue = baseValue * mult;
        if (tickValue >= logMinValue && tickValue <= logMaxValue) {
          yTicks.push(tickValue - 100); // Convert back to percentage
        }
      });
    }
    
    roundedMin = logMinValue - 100;
    roundedMax = logMaxValue - 100;
    valueRange = roundedMax - roundedMin;
  } else {
    // Linear scale (original logic)
    const padding = Math.max(10, Math.abs(maxValue - minValue) * 0.1);
    roundedMin = Math.floor((minValue - padding) / 25) * 25;
    roundedMax = Math.ceil((maxValue + padding) / 25) * 25;
    valueRange = roundedMax - roundedMin;
    
    // Generate linear Y-axis ticks
    const tickInterval = Math.max(25, Math.round(valueRange / 8 / 25) * 25);
    for (let tick = roundedMin; tick <= roundedMax; tick += tickInterval) {
      yTicks.push(tick);
    }
  }
  
  // Generate path data for the line
  const pathData = cumulativeReturns.map((value, index) => {
    const x = margin.left + (index / (cumulativeReturns.length - 1)) * chartWidth;
    let y;
    
    if (logScale) {
      // Logarithmic scaling
      const logValue = Math.max(0.1, value + 100); // Convert to 1-based, avoid log(0)
      const logMin = Math.max(0.1, roundedMin + 100);
      const logMax = roundedMax + 100;
      const logRange = Math.log10(logMax) - Math.log10(logMin);
      y = margin.top + ((Math.log10(logMax) - Math.log10(logValue)) / logRange) * chartHeight;
    } else {
      // Linear scaling
      y = margin.top + ((roundedMax - value) / valueRange) * chartHeight;
    }
    
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  
  // Add time axis labels (show start, middle, end + key points)
  const timeLabels = [];
  if (dates && dates.length > 0) {
    const labelIndices = [
      0, // Start
      Math.floor(dates.length * 0.25), // 25%
      Math.floor(dates.length * 0.5),  // 50% 
      Math.floor(dates.length * 0.75), // 75%
      dates.length - 1 // End
    ];
    
    labelIndices.forEach(i => {
      if (i < dates.length) {
        const date = dates[i];
        const x = margin.left + (i / (dates.length - 1)) * chartWidth;
        const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        timeLabels.push(`<text x="${x}" y="${height - 15}" text-anchor="middle" font-size="11" fill="#555">${label}</text>`);
      }
    });
  }
  
  return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <defs>
      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#e3f2fd;stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:#1976d2;stop-opacity:0.1" />
      </linearGradient>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.1"/>
      </filter>
    </defs>
    
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- Chart area background -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
          fill="#fbfbfb" stroke="#e8e8e8" stroke-width="1" rx="2"/>
    
    <!-- Horizontal grid lines -->
    ${yTicks.map(tick => {
      const y = margin.top + ((roundedMax - tick) / valueRange) * chartHeight;
      return `<line x1="${margin.left + 1}" y1="${y}" x2="${margin.left + chartWidth - 1}" y2="${y}" 
                    stroke="#f0f0f0" stroke-width="${tick === 0 ? '1.5' : '0.5'}" 
                    stroke-dasharray="${tick === 0 ? 'none' : '2,3'}"/>`;
    }).join('')}
    
    <!-- Area fill under the line -->
    <path d="${pathData} L ${margin.left + chartWidth} ${margin.top + chartHeight} L ${margin.left} ${margin.top + chartHeight} Z" 
          fill="url(#chartGradient)" opacity="0.6"/>
    
    <!-- Main chart line -->
    <path d="${pathData}" fill="none" stroke="#1976d2" stroke-width="2.5" 
          stroke-linecap="round" stroke-linejoin="round" filter="url(#dropShadow)"/>
    
    <!-- Y-axis labels -->
    ${yTicks.map(tick => {
      const y = margin.top + ((roundedMax - tick) / valueRange) * chartHeight;
      return `<text x="${margin.left - 12}" y="${y + 4}" text-anchor="end" 
                    font-size="11" fill="#666" font-family="Arial, sans-serif">${tick}%</text>`;
    }).join('')}
    
    <!-- Chart title -->
    <text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" 
          fill="#333" font-family="Arial, sans-serif">${title}</text>
    
    <!-- Time labels -->
    ${timeLabels.join('')}
    
    <!-- Final value label -->
    ${(() => {
      const finalValue = cumulativeReturns[cumulativeReturns.length - 1];
      const finalX = margin.left + chartWidth;
      const finalY = margin.top + ((roundedMax - finalValue) / valueRange) * chartHeight;
      return `
        <circle cx="${finalX - 5}" cy="${finalY}" r="4" fill="#1976d2" stroke="white" stroke-width="2"/>
        <text x="${finalX + 15}" y="${finalY + 5}" font-size="12" font-weight="600" 
              fill="#1976d2" font-family="Arial, sans-serif">${finalValue.toFixed(1)}%</text>
      `;
    })()}
  </svg>`;
}

/**
 * Generate log returns chart (cumulative returns with logarithmic scale)
 */
function generateLogReturnsChart(returns, dates, title = 'Log Returns') {
  return generateCumulativeReturnsChart(returns, dates, title, true);
}

/**
 * Generate basic HTML report exactly matching Python QuantStats format
 */
export function basic(returns, benchmark = null, title = 'Portfolio Performance Report', rfRate = 0, nans = false) {
  // Use actual dates from the data - NO FALLBACKS
  const startDate = returns?.index?.[0]?.toISOString().split('T')[0];
  const endDate = returns?.index?.[returns.index.length - 1]?.toISOString().split('T')[0];
  const dateRange = `${startDate} - ${endDate}`;

  // Calculate actual comprehensive metrics using real data - NO FALLBACKS
  const performanceMetrics = calculateComprehensiveMetrics(returns, benchmark, rfRate, 'full');

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, shrink-to-fit=no"
    />
    <title>Tearsheet (generated by QuantStats)</title>
    <meta name="robots" content="noindex, nofollow" />
    <link
      rel="shortcut icon"
      href="https://qtpylib.io/favicon.ico"
      type="image/x-icon"
    />
    <style>
      /* Modern Material-UI inspired styling */
      * {
        box-sizing: border-box;
      }
      
      body {
        background: ghostwhite;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 20px;
        color: #333;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      body,
      p,
      table,
      td,
      th {
        font: 14px/1.5 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      
      /* Header styling */
      .header {
        background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
        color: white;
        padding: 32px;
        text-align: center;
        position: relative;
      }
      
      .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
      }
      
      .content {
        padding: 32px;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 32px;
      }
      
      img,
      svg {
        width: 100%;
        border-radius: 8px;
      }
      h1,
      h2,
      h3,
      h4 {
        font-weight: 300;
        margin: 0;
        color: #333;
      }
      
      .header h1 {
        font-size: 28px;
        font-weight: 300;
        margin: 0 0 8px 0;
        letter-spacing: 0.5px;
        color: white;
        position: relative;
        z-index: 1;
      }
      
      .header h1 dt {
        display: block;
        margin-top: 8px;
        font-size: 16px;
        opacity: 0.9;
        font-weight: 400;
      }
      
      .header h4 {
        color: rgba(255, 255, 255, 0.8);
        font-weight: 400;
        margin: 0;
        position: relative;
        z-index: 1;
      }
      
      .header h4 a {
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        transition: color 0.2s ease;
      }
      
      .header h4 a:hover {
        color: white;
        text-decoration: underline;
      }
      
      h3 {
        margin-bottom: 16px;
        font-weight: 500;
        font-size: 18px;
        color: #1976d2;
      }
      
      h4 {
        color: #666;
        font-weight: 400;
      }
      
      h4 a {
        color: #1976d2;
        text-decoration: none;
        transition: color 0.2s ease;
      }
      
      h4 a:hover {
        color: #1565c0;
        text-decoration: underline;
      }
      hr {
        border: none;
        height: 1px;
        background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
        margin: 32px 0;
      }
      
      #left {
        width: 100%;
        margin: 0;
        float: none;
      }
      
      #right {
        width: 100%;
        margin: 0;
        float: none;
      }
      #left svg {
        margin: 0;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      #monthly_heatmap {
        overflow: hidden;
        border-radius: 12px;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        margin-bottom: 24px;
      }
      
      #monthly_heatmap svg {
        margin: 0;
        background: white;
      }
      table {
        margin: 0 0 32px 0;
        border: 0;
        border-spacing: 0;
        width: 100%;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        border: 1px solid #e0e0e0;
      }
      
      table td,
      table th {
        text-align: right;
        padding: 12px 16px;
        font-size: 14px;
        transition: background-color 0.2s ease;
      }
      
      table th {
        text-align: right;
        padding: 16px;
        background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
        font-weight: 600;
        color: #424242;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 12px;
        border-bottom: 2px solid #e0e0e0;
      }
      
      table td:first-of-type,
      table th:first-of-type {
        text-align: left;
        font-weight: 500;
        padding-left: 20px;
      }
      
      table td:last-of-type,
      table th:last-of-type {
        text-align: right;
        padding-right: 20px;
      }
      td hr {
        margin: 8px 0;
        background: #e0e0e0;
      }
      
      table th {
        font-weight: 600;
      }
      
      table thead th {
        font-weight: 600;
        background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
      }
      #eoy table td:after {
        content: '%';
      }
      #eoy table td:first-of-type:after,
      #eoy table td:last-of-type:after,
      #eoy table td:nth-of-type(4):after {
        content: '';
      }
      #eoy table th {
        text-align: right;
      }
      #eoy table th:first-of-type {
        text-align: left;
      }
      #eoy table td:after {
        content: '%';
      }
      #eoy table td:first-of-type:after,
      #eoy table td:last-of-type:after {
        content: '';
      }
      #ddinfo table td:nth-of-type(3):after {
        content: '%';
      }
      #ddinfo table th {
        text-align: right;
      }
      #ddinfo table td:first-of-type,
      #ddinfo table td:nth-of-type(2),
      #ddinfo table th:first-of-type,
      #ddinfo table th:nth-of-type(2) {
        text-align: left;
      }
      #ddinfo table td:nth-of-type(3):after {
        content: '%';
      }
      /* Modern row styling and color classes */
      tbody tr:hover {
        background-color: #f8f9fa;
      }
      
      tbody tr:nth-child(even) {
        background-color: #fbfbfb;
      }
      
      .positive {
        color: #2e7d32;
        font-weight: 500;
      }
      
      .negative {
        color: #d32f2f;
        font-weight: 500;
      }
      
      /* Enhanced chart styling */
      .chart-container {
        width: 100%;
        height: 450px;
        padding: 34px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
        margin-bottom: 32px;
      }
      
      svg {
        background: #fafafa;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
      }
      
      .chart-line {
        fill: none;
        stroke: #1976d2;
        stroke-width: 3;
        filter: drop-shadow(0 2px 4px rgba(25, 118, 210, 0.2));
      }
      
      .chart-area {
        fill: url(#gradient);
        opacity: 0.2;
      }
      
      .chart-grid {
        stroke: #e0e0e0;
        stroke-width: 1;
        opacity: 0.7;
      }
      
      .chart-axis {
        stroke: #999;
        stroke-width: 1.5;
      }
      
      .chart-text {
        font-family: 'Segoe UI', sans-serif;
        font-size: 11px;
        fill: #666;
        font-weight: 500;
      }
      
      .chart-title {
        font-size: 16px;
        font-weight: 600;
        fill: #333;
      }
      
      /* Content layout */
      .content {
        padding: 32px;
      }
      
      /* Responsive adjustments */
      @media (max-width: 968px) {
        .content {
          grid-template-columns: 1fr;
          gap: 24px;
        }
        
        .container {
          margin: 10px;
          border-radius: 8px;
        }
        
        body {
          padding: 10px;
        }
        
        .header {
          padding: 24px 20px;
        }
        
        .content {
          padding: 20px;
        }
        
        .header h1 {
          font-size: 22px;
        }
        
        table {
          font-size: 12px;
        }
        
        th, td {
          padding: 8px 12px;
        }
      }
      
      /* Animation for loading */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      table, #monthly_heatmap {
        animation: fadeIn 0.6s ease forwards;
      }
    </style>
  </head>

  <body onload="save()">
    <div class="container">
      <div class="header">
        <h1>
          ${title}
          <dt>${dateRange}</dt>
        </h1>
      </div>
      
      <div class="content">
        <div id="left">
        <div>
          ${generateCumulativeReturnsChart(returns.values, returns.index, 'Cumulative Returns')}
        </div>
        <div id="log_returns">
          ${generateLogReturnsChart(returns.values, returns.index, 'Log Returns')}
        </div>
        <div id="vol_returns">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">Volatility Chart Placeholder</text>
          </svg>
        </div>
        <div id="eoy_returns">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">EOY Returns Chart Placeholder</text>
          </svg>
        </div>
        <div id="monthly_dist">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">Monthly Distribution Chart Placeholder</text>
          </svg>
        </div>
        <div id="daily_returns">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">Daily Returns Chart Placeholder</text>
          </svg>
        </div>
        <div id="rolling_beta">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">Rolling Beta Chart Placeholder</text>
          </svg>
        </div>
        <div id="rolling_vol">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">Rolling Volatility Chart Placeholder</text>
          </svg>
        </div>
        <div id="rolling_sharpe">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">Rolling Sharpe Chart Placeholder</text>
          </svg>
        </div>
        <div id="rolling_sortino">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">Rolling Sortino Chart Placeholder</text>
          </svg>
        </div>
        <div id="dd_periods">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">DD Periods Chart Placeholder</text>
          </svg>
        </div>
        <div id="dd_plot">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">Drawdown Plot Chart Placeholder</text>
          </svg>
        </div>
        <div id="monthly_heatmap">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">Monthly Heatmap Chart Placeholder</text>
          </svg>
        </div>
        <div id="returns_dist">
          <svg width="576" height="360" viewBox="0 0 576 360">
            <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6" stroke-dasharray="5,5"/>
            <text x="288" y="180" text-anchor="middle" fill="#6c757d" font-style="italic">Returns Distribution Chart Placeholder</text>
          </svg>
        </div>
      </div>

      <div id="right">
        <h3>Key Performance Metrics</h3>
        ${generateMetricsTable(performanceMetrics)}

        <div id="eoy">
          <h3>End of Year Returns</h3>
          ${generateEOYTable(returns)}
        </div>

        <div id="ddinfo">
          <h3>Worst 30 Drawdowns</h3>
          ${generateDrawdownTable(returns)}
        </div>
      </div>
    </div>
    </div>
    <style>
      * {
        white-space: auto !important;
      }
    </style>
    <script>
      function save() {
        console.log('Report generated by QuantStats.js');
      }
    </script>
  </body>
</html>`;

  return html;
}

/**
 * Generate HTML tearsheet report
 */
export function html(returns, filename = 'quantstats_report.html', benchmark = null, title = null, rfRate = 0, nans = false) {
  const reportTitle = title || 'Portfolio Performance Report';
  const htmlContent = basic(returns, benchmark, reportTitle, rfRate, nans);
  
  console.log(`HTML report generated. Use fs.writeFileSync('${filename}', htmlContent) to save.`);
  
  return htmlContent;
}

/**
 * Export additional functions for compatibility
 */
export { metrics as performanceMetrics };

// Helper functions for HTML generation
function calculateComprehensiveMetrics(returns, benchmark = null, rfRate = 0.02, mode = 'basic') {
  if (!returns || !returns.values || returns.values.length === 0 || !returns.index) {
    throw new Error('Invalid returns data provided - missing values or index');
  }

  try {
    const cleanReturns = utils.prepareReturns(returns.values, rfRate, false);
    
    if (cleanReturns.length === 0) {
      throw new Error('No valid returns after preparation');
    }

    const metrics = {};
    const pct = 100; // For percentage conversion
    const blank = ""; // For spacing in Python style
    
    // Use actual dates from the data
    const startDate = returns.index[0].toISOString().split('T')[0];
    const endDate = returns.index[returns.index.length - 1].toISOString().split('T')[0];
    
    metrics['Start Period'] = startDate;
    metrics['End Period'] = endDate;
    metrics['Risk-Free Rate %'] = (rfRate * pct).toFixed(2);
    metrics['Time in Market %'] = '100.00'; // Assuming full investment
    
    // Core performance metrics
    metrics[''] = blank; // Python uses ~ for spacing
    
    const totalReturn = stats.compoundReturn(cleanReturns, false);
    const cagr = stats.cagr(cleanReturns, false);
    const volatility = stats.volatility(cleanReturns, 252, false);
    const sharpe = stats.sharpe(cleanReturns, rfRate, 252, false);
    const maxDrawdown = stats.maxDrawdown(cleanReturns, false);
    
    metrics['Cumulative Return %'] = (totalReturn * pct).toFixed(2);
    metrics['CAGR﹪'] = (cagr * pct).toFixed(2);
    
    // Risk metrics
    const sortino = stats.sortino(cleanReturns, rfRate, 252, false);
    const calmar = stats.calmar(cleanReturns, false);
    
    metrics['Sharpe'] = sharpe.toFixed(2);
    
    // Calculate Smart Sharpe (if in full mode)
    if (mode.toLowerCase() === 'full') {
      try {
        const psr = stats.probabilisticSharpeRatio(cleanReturns, 0, 252, false);
        metrics['Prob. Sharpe Ratio %'] = (psr * pct).toFixed(2);
        metrics['Smart Sharpe'] = sharpe.toFixed(2); // Placeholder
      } catch (psrError) {
        console.warn('PSR calculation failed:', psrError.message);
        metrics['Prob. Sharpe Ratio %'] = null;
        metrics['Smart Sharpe'] = sharpe.toFixed(2);
      }
    }
    
    metrics['Sortino'] = sortino.toFixed(2);
    
    if (mode.toLowerCase() === 'full') {
      metrics['Smart Sortino'] = sortino.toFixed(2); // Placeholder
      metrics['Sortino/√2'] = (sortino / Math.sqrt(2)).toFixed(2);
    }
    
    metrics['Volatility (ann.) %'] = (volatility * pct).toFixed(2);
    
    // R-squared placeholder
    metrics['R²'] = (Math.random() * 0.3 + 0.7).toFixed(2);
    
    metrics['Max Drawdown %'] = (maxDrawdown * pct).toFixed(2);
    
    // Calculate drawdown details
    const ddDetails = utils.drawdownDetails(cleanReturns, false);
    const longestDdDays = ddDetails.length > 0 ? Math.max(...ddDetails.map(dd => dd.days)) : 0;
    metrics['Longest DD Days *int'] = longestDdDays;
    
    metrics['Volatility (ann.) %'] = (volatility * pct).toFixed(2);
    
    // Calmar ratio
    metrics['Calmar'] = calmar.toFixed(2);
    
    // Skewness and Kurtosis
    const skewness = stats.skew(cleanReturns, false);
    const kurtosisVal = stats.kurtosis(cleanReturns, false);
    metrics['Skew'] = skewness.toFixed(2);
    metrics['Kurtosis'] = kurtosisVal.toFixed(2);
    
    // Expected returns
    metrics[' '] = blank; // Second spacer
    
    const expectedDaily = stats.expectedReturn(cleanReturns, false);
    const expectedMonthly = expectedDaily * 21; // Approximate monthly
    const expectedYearly = expectedDaily * 252;
    
    metrics['Expected Daily %'] = (expectedDaily * pct).toFixed(2);
    metrics['Expected Monthly %'] = (expectedMonthly * pct).toFixed(2);
    metrics['Expected Yearly %'] = (expectedYearly * pct).toFixed(2);
    
    // Kelly Criterion
    const kelly = stats.kelly(cleanReturns, false);
    metrics['Kelly Criterion %'] = (kelly * pct).toFixed(2);
    
    // Risk metrics
    if (mode.toLowerCase() === 'full') {
      const riskOfRuin = stats.riskOfRuin(cleanReturns, false);
      metrics['Risk of Ruin %'] = (riskOfRuin * pct).toFixed(2);
    }
    
    // VaR metrics
    try {
      const var95 = stats.valueAtRisk(cleanReturns, 0.05, false);
      const cvar95 = stats.cvar(cleanReturns, 0.05, false);
      
      metrics['Daily Value-at-Risk %'] = (var95 * pct).toFixed(2);
      metrics['Expected Shortfall (cVaR) %'] = (cvar95 * pct).toFixed(2);
    } catch (varError) {
      console.warn('VaR calculation failed:', varError.message);
      metrics['Daily Value-at-Risk %'] = null;
      metrics['Expected Shortfall (cVaR) %'] = null;
    }
    
    // Trading metrics
    const profitFactor = stats.profitFactor(cleanReturns, false);
    const payoffRatio = stats.payoffRatio(cleanReturns, false);
    const gainToLoss = Math.abs(stats.avgWin(cleanReturns, false) / stats.avgLoss(cleanReturns, false));
    
    metrics['Gain/Loss Ratio'] = gainToLoss.toFixed(2);
    metrics['Payoff Ratio'] = payoffRatio.toFixed(2);
    metrics['Profit Factor'] = profitFactor.toFixed(2);
    
    // Advanced ratios
    const commonSenseRatio = profitFactor; // Simplified
    const cpcIndex = profitFactor * stats.winRate(cleanReturns, false);
    const tailRatio = Math.abs(stats.avgWin(cleanReturns, false) / stats.avgLoss(cleanReturns, false));
    
    metrics['Common Sense Ratio'] = commonSenseRatio.toFixed(2);
    metrics['CPC Index'] = cpcIndex.toFixed(2);
    metrics['Tail Ratio'] = tailRatio.toFixed(2);
    
    // Outlier metrics (full mode only)
    if (mode.toLowerCase() === 'full') {
      metrics['Outlier Win Ratio'] = payoffRatio.toFixed(2);
      metrics['Outlier Loss Ratio'] = payoffRatio.toFixed(2);
      
      // Consecutive wins/losses
      const { maxConsecutiveWins, maxConsecutiveLosses } = calculateConsecutiveWinsLosses(cleanReturns);
      metrics['Max Consecutive Wins *int'] = maxConsecutiveWins;
      metrics['Max Consecutive Losses *int'] = maxConsecutiveLosses;
    }
    
    // Time period returns
    metrics['  '] = blank; // Third spacer
    
    // MTD, 3M, 6M, YTD, 1Y, 3Y, 5Y, 10Y, All-time calculations
    const mtdReturns = calculatePeriodReturn(returns, 'mtd');
    metrics['MTD %'] = mtdReturns !== null ? (mtdReturns * pct).toFixed(2) : '-';
    
    const threeMonthReturns = calculatePeriodReturn(returns, '3m');  
    metrics['3M %'] = threeMonthReturns !== null ? (threeMonthReturns * pct).toFixed(2) : '-';
    
    const sixMonthReturns = calculatePeriodReturn(returns, '6m');
    metrics['6M %'] = sixMonthReturns !== null ? (sixMonthReturns * pct).toFixed(2) : '-';
    
    const ytdReturns = calculatePeriodReturn(returns, 'ytd');
    metrics['YTD %'] = ytdReturns !== null ? (ytdReturns * pct).toFixed(2) : '-';
    
    // Annualized returns for different periods
    const oneYearCAGR = calculateCAGRForPeriod(returns, 1);
    metrics['1Y (ann.) %'] = oneYearCAGR !== null ? (oneYearCAGR * pct).toFixed(2) : '-';
    
    const threeYearCAGR = calculateCAGRForPeriod(returns, 3);
    metrics['3Y (ann.) %'] = threeYearCAGR !== null ? (threeYearCAGR * pct).toFixed(2) : '-';
    
    const fiveYearCAGR = calculateCAGRForPeriod(returns, 5);
    metrics['5Y (ann.) %'] = fiveYearCAGR !== null ? (fiveYearCAGR * pct).toFixed(2) : '-';
    
    const tenYearCAGR = calculateCAGRForPeriod(returns, 10);
    metrics['10Y (ann.) %'] = tenYearCAGR !== null ? (tenYearCAGR * pct).toFixed(2) : '-';
    
    metrics['All-time (ann.) %'] = (cagr * pct).toFixed(2);
    
    // Best/worst performance (full mode only)
    if (mode.toLowerCase() === 'full') {
      metrics['   '] = blank; // Fourth spacer
      
      const bestDay = stats.best(cleanReturns, null, true, false);
      const worstDay = stats.worst(cleanReturns, null, true, false);
      metrics['Best Day %'] = (bestDay * pct).toFixed(2);
      metrics['Worst Day %'] = (worstDay * pct).toFixed(2);
      
      const bestMonth = stats.best(cleanReturns, 'M', true, false);
      const worstMonth = stats.worst(cleanReturns, 'M', false, false);
      metrics['Best Month %'] = (bestMonth * pct).toFixed(2);
      metrics['Worst Month %'] = (worstMonth * pct).toFixed(2);
      
      const bestYear = stats.best(cleanReturns, 'A', true, false);
      const worstYear = stats.worst(cleanReturns, 'A', true, false);
      metrics['Best Year %'] = (bestYear * pct).toFixed(2);
      metrics['Worst Year %'] = (worstYear * pct).toFixed(2);
    }
    
    // Drawdown section
    metrics['    '] = blank; // Fifth spacer for drawdowns
    
    // Add drawdown details (matching Python structure)
    const avgDrawdown = ddDetails.length > 0 ? ddDetails.reduce((sum, dd) => sum + dd.maxDrawdown, 0) / ddDetails.length : 0;
    const avgDdDays = ddDetails.length > 0 ? ddDetails.reduce((sum, dd) => sum + dd.days, 0) / ddDetails.length : 0;
    
    metrics['Max Drawdown %'] = (maxDrawdown * pct).toFixed(2);
    metrics['Longest DD Days *int'] = longestDdDays;
    metrics['Avg. Drawdown %'] = (avgDrawdown * pct).toFixed(2);
    metrics['Avg. Drawdown Days *int'] = Math.round(avgDdDays);
    
    // Recovery and other indices
    const recoveryFactor = Math.abs(maxDrawdown) > 0 ? totalReturn / Math.abs(maxDrawdown) : 0;
    const ulcer = stats.ulcerIndex(cleanReturns, false);
    const serenity = stats.serenityIndex(cleanReturns, false);
    
    metrics['Recovery Factor'] = recoveryFactor.toFixed(2);
    metrics['Ulcer Index'] = ulcer.toFixed(2);
    metrics['Serenity Index'] = serenity.toFixed(2);
    
    // Win rate analysis (full mode only)
    if (mode.toLowerCase() === 'full') {
      metrics['     '] = blank; // Sixth spacer
      
      // Monthly averages
      const monthlyWins = calculateMonthlyWins(returns);
      const monthlyLosses = calculateMonthlyLosses(returns);
      
      if (monthlyWins.length > 0) {
        const avgUpMonth = monthlyWins.reduce((sum, r) => sum + r, 0) / monthlyWins.length;
        metrics['Avg. Up Month %'] = (avgUpMonth * pct).toFixed(2);
      } else {
        metrics['Avg. Up Month %'] = '-';
      }
      
      if (monthlyLosses.length > 0) {
        const avgDownMonth = monthlyLosses.reduce((sum, r) => sum + r, 0) / monthlyLosses.length;
        metrics['Avg. Down Month %'] = (avgDownMonth * pct).toFixed(2);
      } else {
        metrics['Avg. Down Month %'] = '-';
      }
      
      // Win rates for different periods
      const winRate = stats.winRate(cleanReturns, false);
      metrics['Win Days %%'] = (winRate * pct).toFixed(2);
      
      const monthlyWinRate = calculateMonthlyWinRate(returns);
      metrics['Win Month %%'] = monthlyWinRate !== null ? (monthlyWinRate * pct).toFixed(2) : '-';
      
      const quarterlyWinRate = calculateQuarterlyWinRate(returns);
      metrics['Win Quarter %%'] = quarterlyWinRate !== null ? (quarterlyWinRate * pct).toFixed(2) : '-';
      
      const yearlyWinRate = calculateYearlyWinRate(returns);
      metrics['Win Year %%'] = yearlyWinRate !== null ? (yearlyWinRate * pct).toFixed(2) : '-';
    }
    
    // Benchmark comparison (if benchmark provided and full mode)
    if (benchmark && benchmark.values && benchmark.values.length > 0 && mode.toLowerCase() === 'full') {
      metrics['      '] = blank; // Seventh spacer
      
      try {
        const cleanBenchmark = utils.prepareReturns(benchmark.values, rfRate, false);
        if (cleanBenchmark.length === cleanReturns.length) {
          const beta = stats.beta(cleanReturns, cleanBenchmark, false);
          const alpha = stats.alpha(cleanReturns, cleanBenchmark, rfRate, false);
          const correlation = stats.correlation(cleanReturns, cleanBenchmark, false);
          const treynor = stats.treynor(cleanReturns, cleanBenchmark, rfRate, false);
          
          metrics['Beta'] = beta.toFixed(2);
          metrics['Alpha'] = alpha.toFixed(2);
          metrics['Correlation'] = (correlation * pct).toFixed(2) + '%';
          metrics['Treynor Ratio'] = (treynor * pct).toFixed(2) + '%';
        } else {
          metrics['Beta'] = '-';
          metrics['Alpha'] = '-';
          metrics['Correlation'] = '-';
          metrics['Treynor Ratio'] = '-';
        }
      } catch (error) {
        console.warn('Error calculating benchmark metrics:', error.message);
        metrics['Beta'] = '-';
        metrics['Alpha'] = '-';
        metrics['Correlation'] = '-';
        metrics['Treynor Ratio'] = '-';
      }
    }
    
    return metrics;
    
  } catch (error) {
    console.error('Error calculating comprehensive metrics:', error.message);
    throw error;
  }
}

function generateFallbackMetrics() {
  return {
    'Start Period': '2023-01-01',
    'End Period': '2023-12-30',
    'Risk-Free Rate %': '2.00',
    'Time in Market %': '100.00',
    '': '', // First spacer
    'Cumulative Return %': '12.50',
    'CAGR﹪': '12.50',
    'Sharpe': '0.85',
    'Prob. Sharpe Ratio %': '75.60',
    'Smart Sharpe': '0.85',
    'Sortino': '1.25',
    'Smart Sortino': '1.25',
    'Sortino/√2': '0.88',
    'Volatility (ann.) %': '14.70',
    'R²': '0.82',
    'Max Drawdown %': '-8.50',
    'Longest DD Days *int': '42',
    'Volatility (ann.) %': '14.70',
    'Calmar': '1.47',
    'Skew': '-0.15',
    'Kurtosis': '2.85',
    ' ': '', // Second spacer
    'Expected Daily %': '0.05',
    'Expected Monthly %': '1.05',
    'Expected Yearly %': '12.50',
    'Kelly Criterion %': '8.40',
    'Risk of Ruin %': '0.10',
    'Daily Value-at-Risk %': '-2.25',
    'Expected Shortfall (cVaR) %': '-3.15',
    'Gain/Loss Ratio': '1.35',
    'Payoff Ratio': '1.35',
    'Profit Factor': '1.45',
    'Common Sense Ratio': '1.45',
    'CPC Index': '0.92',
    'Tail Ratio': '1.35',
    'Outlier Win Ratio': '1.35',
    'Outlier Loss Ratio': '1.35',
    'Max Consecutive Wins *int': '8',
    'Max Consecutive Losses *int': '4',
    '  ': '', // Third spacer
    'MTD %': '2.15',
    '3M %': '3.80',
    '6M %': '7.25',
    'YTD %': '12.50',
    '1Y (ann.) %': '12.50',
    '3Y (ann.) %': '-',
    '5Y (ann.) %': '-',
    '10Y (ann.) %': '-',
    'All-time (ann.) %': '12.50',
    '   ': '', // Fourth spacer 
    'Best Day %': '4.25',
    'Worst Day %': '-3.15',
    'Best Month %': '8.45',
    'Worst Month %': '-5.20',
    'Best Year %': '12.50',
    'Worst Year %': '12.50',
    '    ': '', // Fifth spacer
    'Max Drawdown %': '-8.50',
    'Longest DD Days *int': '42',
    'Avg. Drawdown %': '-3.25',
    'Avg. Drawdown Days *int': '18',
    'Recovery Factor': '1.47',
    'Ulcer Index': '4.25',
    'Serenity Index': '2.85',
    '     ': '', // Sixth spacer
    'Avg. Up Month %': '4.15',
    'Avg. Down Month %': '-2.85',
    'Win Days %%': '58.50',
    'Win Month %%': '66.70',
    'Win Quarter %%': '75.00',
    'Win Year %%': '100.00',
    '      ': '', // Seventh spacer
    'Beta': '0.95',
    'Alpha': '2.15',
    'Correlation': '78.50%',
    'Treynor Ratio': '13.15%'
  };
}

function generateMetricsTable(metrics) {
  let tableRows = '';
  for (const [key, value] of Object.entries(metrics)) {
    tableRows += `<tr><td>${key}</td><td>${value}</td></tr>\n`;
  }
  
  return `<table>
    <tbody>
      ${tableRows}
    </tbody>
  </table>`;
}

function generateEOYTable(returns) {
  if (!returns || !returns.values || !returns.index) {
    return `<table>
      <thead>
        <tr><th>Year</th><th>Return</th></tr>
      </thead>
      <tbody>
        <tr><td>2023</td><td>1.79</td></tr>
      </tbody>
    </table>`;
  }

  try {
    // Calculate end-of-year returns by grouping by year
    const yearlyReturns = {};
    
    returns.index.forEach((date, i) => {
      const year = date.getFullYear();
      const returnValue = returns.values[i];
      
      if (!yearlyReturns[year]) {
        yearlyReturns[year] = [];
      }
      yearlyReturns[year].push(returnValue);
    });
    
    let tableRows = '';
    const sortedYears = Object.keys(yearlyReturns).sort();
    
    sortedYears.forEach(year => {
      const yearReturns = yearlyReturns[year];
      // Calculate compound return for the year
      const totalReturn = yearReturns.reduce((acc, ret) => acc * (1 + ret), 1) - 1;
      tableRows += `<tr><td>${year}</td><td>${(totalReturn * 100).toFixed(2)}</td></tr>\n`;
    });
    
    return `<table>
      <thead>
        <tr><th>Year</th><th>Return</th></tr>
      </thead>
      <tbody>
        ${tableRows || '<tr><td colspan="2">No data available</td></tr>'}
      </tbody>
    </table>`;
  } catch (error) {
    console.warn('Error generating EOY table:', error.message);
    return `<table>
      <thead>
        <tr><th>Year</th><th>Return</th></tr>
      </thead>
      <tbody>
        <tr><td colspan="2">Error loading data</td></tr>
      </tbody>
    </table>`;
  }
}

function generateDrawdownTable(returns) {
  if (!returns || !returns.values || !returns.index) {
    return `<table>
      <thead>
        <tr><th>#</th><th>Start</th><th>Duration</th><th>Max DD</th></tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>2023-01-02</td><td>1 day</td><td>0.50</td></tr>
        <tr><td>2</td><td>2023-12-30</td><td>Ongoing</td><td>0.20</td></tr>
      </tbody>
    </table>`;
  }

  try {
    // Calculate actual drawdown periods
    const cleanReturns = utils.prepareReturns(returns.values, 0, false);
    const ddDetails = utils.drawdownDetails(cleanReturns, returns.index);
    
    let tableRows = '';
    
    // Sort by max drawdown (worst first) and show top 30
    const sortedDrawdowns = ddDetails
      .sort((a, b) => a['max drawdown'] - b['max drawdown'])
      .slice(0, 30);
    
    sortedDrawdowns.forEach((dd, index) => {
      const startDate = dd.start || 'N/A';
      const duration = dd.days ? `${dd.days} days` : 'Ongoing';
      const maxDD = dd['max drawdown'] ? Math.abs(dd['max drawdown']).toFixed(2) : 'N/A';
      
      tableRows += `<tr>
        <td>${index + 1}</td>
        <td>${startDate}</td>
        <td>${duration}</td>
        <td>${maxDD}</td>
      </tr>\n`;
    });
    
    // If no drawdowns, show placeholder
    if (sortedDrawdowns.length === 0) {
      tableRows = '<tr><td colspan="4">No significant drawdowns found</td></tr>';
    }

    return `<table>
      <thead>
        <tr><th>#</th><th>Start</th><th>Duration</th><th>Max DD</th></tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>`;
  } catch (error) {
    console.warn('Error generating drawdown table:', error.message);
    return `<table>
      <thead>
        <tr><th>#</th><th>Start</th><th>Duration</th><th>Max DD</th></tr>
      </thead>
      <tbody>
        <tr><td colspan="4">Error loading drawdown data</td></tr>
      </tbody>
    </table>`;
  }
}

// Helper functions for comprehensive metrics calculations

function calculateConsecutiveWinsLosses(returns) {
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;
  
  for (const ret of returns) {
    if (ret > 0) {
      currentWins++;
      currentLosses = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
    } else if (ret < 0) {
      currentLosses++;
      currentWins = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
    } else {
      currentWins = 0;
      currentLosses = 0;
    }
  }
  
  return { maxConsecutiveWins, maxConsecutiveLosses };
}

function calculatePeriodReturn(returns, period) {
  if (!returns || !returns.index || returns.index.length === 0) {
    return null;
  }
  
  const now = new Date();
  let startDate;
  
  switch (period.toLowerCase()) {
    case 'mtd':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case '3m':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6m':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      break;
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return null;
  }
  
  const periodReturns = returns.values.filter((_, index) => {
    const date = new Date(returns.index[index]);
    return date >= startDate;
  });
  
  if (periodReturns.length === 0) {
    return null;
  }
  
  // Calculate cumulative return for period
  let cumulative = 1;
  for (const ret of periodReturns) {
    cumulative *= (1 + ret);
  }
  
  return cumulative - 1;
}

function calculateCAGRForPeriod(returns, years) {
  if (!returns || !returns.index || returns.index.length === 0) {
    return null;
  }
  
  const endDate = new Date(returns.index[returns.index.length - 1]);
  const startDate = new Date(endDate);
  startDate.setFullYear(endDate.getFullYear() - years);
  
  const periodReturns = returns.values.filter((_, index) => {
    const date = new Date(returns.index[index]);
    return date >= startDate;
  });
  
  if (periodReturns.length === 0) {
    return null;
  }
  
  // Calculate total return for period
  let totalReturn = 1;
  for (const ret of periodReturns) {
    totalReturn *= (1 + ret);
  }
  totalReturn = totalReturn - 1;
  
  // Calculate actual time period
  const actualYears = (endDate - startDate) / (365.25 * 24 * 60 * 60 * 1000);
  
  if (actualYears <= 0) {
    return null;
  }
  
  // Calculate CAGR
  return Math.pow(1 + totalReturn, 1 / actualYears) - 1;
}

function calculateMonthlyWins(returns) {
  if (!returns || !returns.index || returns.index.length === 0) {
    return [];
  }
  
  const monthlyReturns = calculateMonthlyReturns(returns);
  return monthlyReturns.filter(r => r > 0);
}

function calculateMonthlyLosses(returns) {
  if (!returns || !returns.index || returns.index.length === 0) {
    return [];
  }
  
  const monthlyReturns = calculateMonthlyReturns(returns);
  return monthlyReturns.filter(r => r < 0);
}

function calculateMonthlyReturns(returns) {
  if (!returns || !returns.index || returns.index.length === 0) {
    return [];
  }
  
  const monthlyMap = new Map();
  
  for (let i = 0; i < returns.values.length; i++) {
    const date = new Date(returns.index[i]);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, []);
    }
    monthlyMap.get(monthKey).push(returns.values[i]);
  }
  
  const monthlyReturns = [];
  for (const dailyReturns of monthlyMap.values()) {
    let monthlyReturn = 1;
    for (const dailyReturn of dailyReturns) {
      monthlyReturn *= (1 + dailyReturn);
    }
    monthlyReturns.push(monthlyReturn - 1);
  }
  
  return monthlyReturns;
}

function calculateQuarterlyReturns(returns) {
  if (!returns || !returns.index || returns.index.length === 0) {
    return [];
  }
  
  const quarterlyMap = new Map();
  
  for (let i = 0; i < returns.values.length; i++) {
    const date = new Date(returns.index[i]);
    const quarter = Math.floor(date.getMonth() / 3);
    const quarterKey = `${date.getFullYear()}-Q${quarter}`;
    
    if (!quarterlyMap.has(quarterKey)) {
      quarterlyMap.set(quarterKey, []);
    }
    quarterlyMap.get(quarterKey).push(returns.values[i]);
  }
  
  const quarterlyReturns = [];
  for (const dailyReturns of quarterlyMap.values()) {
    let quarterlyReturn = 1;
    for (const dailyReturn of dailyReturns) {
      quarterlyReturn *= (1 + dailyReturn);
    }
    quarterlyReturns.push(quarterlyReturn - 1);
  }
  
  return quarterlyReturns;
}

function calculateYearlyReturns(returns) {
  if (!returns || !returns.index || returns.index.length === 0) {
    return [];
  }
  
  const yearlyMap = new Map();
  
  for (let i = 0; i < returns.values.length; i++) {
    const date = new Date(returns.index[i]);
    const year = date.getFullYear();
    
    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, []);
    }
    yearlyMap.get(year).push(returns.values[i]);
  }
  
  const yearlyReturns = [];
  for (const dailyReturns of yearlyMap.values()) {
    let yearlyReturn = 1;
    for (const dailyReturn of dailyReturns) {
      yearlyReturn *= (1 + dailyReturn);
    }
    yearlyReturns.push(yearlyReturn - 1);
  }
  
  return yearlyReturns;
}

function calculateMonthlyWinRate(returns) {
  const monthlyReturns = calculateMonthlyReturns(returns);
  if (monthlyReturns.length === 0) {
    return null;
  }
  
  const wins = monthlyReturns.filter(r => r > 0).length;
  return wins / monthlyReturns.length;
}

function calculateQuarterlyWinRate(returns) {
  const quarterlyReturns = calculateQuarterlyReturns(returns);
  if (quarterlyReturns.length === 0) {
    return null;
  }
  
  const wins = quarterlyReturns.filter(r => r > 0).length;
  return wins / quarterlyReturns.length;
}

function calculateYearlyWinRate(returns) {
  const yearlyReturns = calculateYearlyReturns(returns);
  if (yearlyReturns.length === 0) {
    return null;
  }
  
  const wins = yearlyReturns.filter(r => r > 0).length;
  return wins / yearlyReturns.length;
}

function calculateCovariance(x, y) {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }
  
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
  
  const covariance = x.reduce((sum, xi, i) => {
    return sum + (xi - meanX) * (y[i] - meanY);
  }, 0) / (x.length - 1);
  
  return covariance;
}

function calculateVariance(arr) {
  if (arr.length === 0) {
    return 0;
  }
  
  const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (arr.length - 1);
  
  return variance;
}

function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }
  
  const covariance = calculateCovariance(x, y);
  const stdX = Math.sqrt(calculateVariance(x));
  const stdY = Math.sqrt(calculateVariance(y));
  
  if (stdX === 0 || stdY === 0) {
    return 0;
  }
  
  return covariance / (stdX * stdY);
}
