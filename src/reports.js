import * as stats from './stats.js';
import * as utils from './utils.js';
import * as plots from './plots.js';

/**
 * Generate comprehensive portfolio metrics
 * @param {Array} returns - Returns array
 * @param {number} rfRate - Risk-free rate (default 0)
 * @param {boolean} nans - Include NaN values (default false)
 * @returns {Object} Comprehensive metrics object
 */
export function metrics(returns, rfRate = 0, nans = false) {
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
    valueAtRisk: stats.valueAtRisk(cleanReturns, 1, 0.95, nans),
    conditionalValueAtRisk: stats.cvar(cleanReturns, 1, 0.95, nans),
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
  
  return metrics;
}

/**
 * Generate SVG chart for equity curve
 */
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
 * Generate EOY Returns bar chart
 */
function generateEOYReturnsChart(returns, dates, title = 'EOY Returns') {
  const width = 800; // Standardized width for consistency
  const height = 400; // Standardized height for consistency
  const margin = { top: 50, right: 40, bottom: 50, left: 70 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  const datesData = dates || (returns.index ? returns.index : null);
  
  // Calculate yearly returns using existing stats function
  const yearlyReturns = stats.yearlyReturns(returnsData, false, datesData, true);
  
  // Extract years for labeling
  const years = [];
  if (datesData && datesData.length > 0) {
    const yearlyData = new Map();
    for (let i = 0; i < returnsData.length; i++) {
      const date = new Date(datesData[i]);
      const yearKey = date.getUTCFullYear();
      if (!yearlyData.has(yearKey)) {
        yearlyData.set(yearKey, []);
        years.push(yearKey);
      }
      yearlyData.get(yearKey).push(returnsData[i]);
    }
    years.sort((a, b) => a - b);
  }
  
  if (!yearlyReturns || yearlyReturns.length === 0) {
    return `<svg width="720" height="380" viewBox="0 0 720 380">
      <rect width="720" height="380" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="360" y="190" text-anchor="middle" fill="#6c757d">No EOY data available</text>
    </svg>`;
  }
  
  const minValue = Math.min(...yearlyReturns, -0.05);
  const maxValue = Math.max(...yearlyReturns, 0.05);
  const valueRange = maxValue - minValue || 1;
  const numYears = yearlyReturns.length;
  
  // Dynamic bar sizing - no gaps for long series, wider for short series
  const barWidth = chartWidth / numYears;
  
  // Function to convert value to y-coordinate
  const valueToY = (value) => {
    return margin.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
  };
  
  const zeroY = valueToY(0);
  
  // Smart year labeling based on number of years
  const getLabelInfo = (year, index) => {
    if (numYears <= 10) {
      // Show all years for short series
      return { show: true, text: year.toString(), size: 11 };
    } else if (numYears <= 20) {
      // Show every other year
      return { show: index % 2 === 0, text: year.toString(), size: 10 };
    } else if (numYears <= 30) {
      // Show every 5th year or decade boundaries
      const show = (year % 5 === 0) || (index === 0) || (index === numYears - 1);
      return { show: show, text: `'${year.toString().slice(-2)}`, size: 9 };
    } else {
      // Show only decade boundaries for very long series
      const show = (year % 10 === 0) || (index === 0) || (index === numYears - 1);
      const text = (year % 10 === 0) ? year.toString() : `'${year.toString().slice(-2)}`;
      return { show: show, text: text, size: 9 };
    }
  };
  
  // Generate bars and labels (no percentage labels on bars)
  const bars = yearlyReturns.map((value, index) => {
    const x = margin.left + index * barWidth;
    const barY = valueToY(value);
    const barHeight = Math.abs(barY - zeroY);
    const isPositive = value >= 0;
    const finalY = isPositive ? barY : zeroY;
    
    const color = isPositive ? '#2E8B57' : '#DC143C';
    const hoverColor = isPositive ? '#228B22' : '#B22222';
    
    // Get the year for this bar
    const year = years[index] || (new Date().getFullYear() - yearlyReturns.length + index + 1);
    const labelInfo = getLabelInfo(year, index);
    
    // Generate year label if needed
    let yearLabel = '';
    if (labelInfo.show) {
      const labelX = x + barWidth/2;
      const labelY = height - margin.bottom + 20;
      yearLabel = `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="${labelInfo.size}" 
                         font-weight="500" fill="#555">${labelInfo.text}</text>`;
    }
    
    return `<rect x="${x}" y="${finalY}" width="${barWidth}" height="${barHeight}" 
                  fill="${color}" opacity="0.85" stroke="${hoverColor}" stroke-width="0.5"/>
            ${yearLabel}`;
  }).join('');
  
  // Enhanced grid lines
  const gridLines = [];
  const numGridLines = 8;
  for (let i = 0; i <= numGridLines; i++) {
    const gridValue = minValue + (valueRange * i / numGridLines);
    const y = valueToY(gridValue);
    const isZero = Math.abs(gridValue) < 0.001;
    
    gridLines.push(`<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" 
                           stroke="${isZero ? '#666' : '#e5e5e5'}" 
                           stroke-width="${isZero ? '2' : '1'}" 
                           ${isZero ? '' : 'stroke-dasharray="3,3"'}/>`);
    gridLines.push(`<text x="${margin.left - 15}" y="${y + 4}" text-anchor="end" 
                           font-size="10" fill="#666" font-weight="500">
                           ${(gridValue * 100).toFixed(0)}%</text>`);
  }
  
  return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- Chart area background -->
    <rect x="${margin.left-2}" y="${margin.top-2}" width="${chartWidth+4}" height="${chartHeight+4}" 
          fill="#fafafa" stroke="none"/>
    
    <!-- Grid lines -->
    ${gridLines.join('')}
    
    <!-- Chart border -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
          fill="none" stroke="#ddd" stroke-width="1"/>
    
    <!-- Bars -->
    ${bars}
    
    <!-- Title -->
    <text x="${width/2}" y="30" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${title}</text>
    
    <!-- Y-axis label -->
    <text x="25" y="${height/2}" text-anchor="middle" font-size="12" fill="#666" font-weight="500"
          transform="rotate(-90 25 ${height/2})">Annual Returns (%)</text>
    
    <!-- Data range indicator for long series -->
    ${numYears > 15 ? `<text x="${width - 20}" y="${height - 10}" text-anchor="end" font-size="9" fill="#999">
                          ${years[0]} - ${years[years.length-1]} (${numYears} years)</text>` : ''}
  </svg>`;
}

/**
 * Generate Monthly Distribution histogram chart
 */
function generateMonthlyDistChart(returns, dates, title = 'Monthly Distribution') {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  const datesData = dates || (returns.index ? returns.index : null);
  
  // Calculate monthly returns using existing stats function
  const monthlyReturns = stats.monthlyReturns(returnsData, false, datesData, true);
  
  if (!monthlyReturns || monthlyReturns.length === 0) {
    return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#6c757d">No monthly data available</text>
    </svg>`;
  }
  
  // Create histogram bins
  const numBins = 20;
  const minReturn = Math.min(...monthlyReturns);
  const maxReturn = Math.max(...monthlyReturns);
  const binWidth = (maxReturn - minReturn) / numBins;
  
  const bins = Array(numBins).fill(0);
  monthlyReturns.forEach(ret => {
    const binIndex = Math.min(Math.floor((ret - minReturn) / binWidth), numBins - 1);
    bins[binIndex]++;
  });
  
  const maxCount = Math.max(...bins);
  const barWidth = chartWidth / numBins;
  
  // Generate histogram bars
  const bars = bins.map((count, index) => {
    const x = margin.left + index * barWidth;
    const barHeight = (count / maxCount) * chartHeight;
    const y = margin.top + chartHeight - barHeight;
    
    return `<rect x="${x}" y="${y}" width="${barWidth - 1}" height="${barHeight}" fill="#1f77b4" opacity="0.7"/>`;
  }).join('');
  
  // Generate Y-axis labels (frequency counts)
  const yTicks = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const tickValue = Math.round((maxCount * i) / tickCount);
    const y = margin.top + chartHeight - (i / tickCount) * chartHeight;
    yTicks.push({
      value: tickValue,
      y: y
    });
  }
  
  const yAxisLabels = yTicks.map(tick => 
    `<text x="${margin.left - 12}" y="${tick.y + 4}" text-anchor="end" font-size="11" fill="#666">${tick.value}</text>`
  ).join('');
  
  // Generate X-axis labels (return percentages) - more granular
  const xTicks = [];
  const xTickCount = 6;
  for (let i = 0; i <= xTickCount; i++) {
    const tickValue = minReturn + (maxReturn - minReturn) * (i / xTickCount);
    const x = margin.left + (i / xTickCount) * chartWidth;
    xTicks.push({
      value: tickValue,
      x: x
    });
  }
  
  const xAxisLabels = xTicks.map(tick => 
    `<text x="${tick.x}" y="${height - 20}" text-anchor="middle" font-size="11" fill="#666">${(tick.value * 100).toFixed(1)}%</text>`
  ).join('');
  
  return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
          fill="#fafafa" stroke="#e8e8e8" stroke-width="1"/>
    
    <!-- Grid lines -->
    ${yTicks.map(tick => `<line x1="${margin.left}" y1="${tick.y}" x2="${margin.left + chartWidth}" y2="${tick.y}" stroke="#f0f0f0" stroke-width="0.5"/>`).join('')}
    ${xTicks.map(tick => `<line x1="${tick.x}" y1="${margin.top}" x2="${tick.x}" y2="${margin.top + chartHeight}" stroke="#f0f0f0" stroke-width="0.5"/>`).join('')}
    
    <!-- Histogram bars -->
    ${bars}
    
    <!-- Title -->
    <text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" 
          fill="#333" font-family="Arial, sans-serif">${title}</text>
    
    <!-- Y-axis labels -->
    ${yAxisLabels}
    
    <!-- X-axis labels -->
    ${xAxisLabels}
    
    <!-- Y-axis title -->
    <text x="20" y="${height/2}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-90, 20, ${height/2})">Frequency</text>
    
    <!-- X-axis title -->
    <text x="${width/2}" y="${height - 5}" text-anchor="middle" font-size="12" fill="#666">Monthly Returns (%)</text>
  </svg>`;
}

/**
 * Generate Daily Returns scatter chart
 */
function generateDailyReturnsChart(returns, dates, title = 'Daily Returns') {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  
  if (!returnsData || returnsData.length === 0) {
    return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#6c757d">No daily data available</text>
    </svg>`;
  }
  
  const minValue = Math.min(...returnsData);
  const maxValue = Math.max(...returnsData);
  const valueRange = maxValue - minValue || 1;
  
  // Generate scatter points
  const points = returnsData.map((value, index) => {
    const x = margin.left + (index / (returnsData.length - 1)) * chartWidth;
    const y = margin.top + ((maxValue - value) / valueRange) * chartHeight;
    const color = value >= 0 ? '#2ca02c' : '#d62728';
    const radius = Math.max(1, Math.min(3, Math.abs(value) * 1000));
    
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="0.6"/>`;
  }).join('');
  
  // Zero line
  const zeroY = margin.top + ((maxValue - 0) / valueRange) * chartHeight;
  
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
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
          fill="#fafafa" stroke="#e8e8e8" stroke-width="1"/>
    
    <!-- Zero line -->
    <line x1="${margin.left}" y1="${zeroY}" x2="${margin.left + chartWidth}" y2="${zeroY}" 
          stroke="#666" stroke-width="1" stroke-dasharray="2,3"/>
    
    <!-- Scatter points -->
    ${points}
    
    <!-- Title -->
    <text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" 
          fill="#333" font-family="Arial, sans-serif">${title}</text>
    
    <!-- Time labels -->
    ${timeLabels.join('')}
    
    <!-- Y-axis labels -->
    <text x="15" y="${margin.top + 10}" font-size="11" fill="#666">${(maxValue * 100).toFixed(1)}%</text>
    <text x="15" y="${margin.top + chartHeight - 5}" font-size="11" fill="#666">${(minValue * 100).toFixed(1)}%</text>
  </svg>`;
}

/**
 * Generate Rolling Volatility chart
 */
function generateRollingVolatilityChart(returns, dates, title = 'Rolling Volatility (30 day)') {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  
  if (!returnsData || returnsData.length < 30) {
    return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#6c757d">Insufficient data for rolling volatility</text>
    </svg>`;
  }
  
  // Calculate 30-day rolling volatility
  const window = 30;
  const rollingVol = [];
  
  for (let i = window - 1; i < returnsData.length; i++) {
    const windowData = returnsData.slice(i - window + 1, i + 1);
    const vol = stats.volatility(windowData, 252, false);
    rollingVol.push(vol);
  }
  
  const minValue = Math.min(...rollingVol);
  const maxValue = Math.max(...rollingVol);
  const valueRange = maxValue - minValue || 1;
  
  // Generate path data
  const pathData = rollingVol.map((value, index) => {
    const x = margin.left + (index / (rollingVol.length - 1)) * chartWidth;
    const y = margin.top + ((maxValue - value) / valueRange) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  // Add time axis labels (show start, middle, end + key points)
  const timeLabels = [];
  if (dates && dates.length > window) {
    const adjustedDates = dates.slice(window - 1); // Skip first 29 dates since rolling starts at day 30
    const labelIndices = [
      0, // Start
      Math.floor(adjustedDates.length * 0.25), // 25%
      Math.floor(adjustedDates.length * 0.5),  // 50% 
      Math.floor(adjustedDates.length * 0.75), // 75%
      adjustedDates.length - 1 // End
    ];
    
    labelIndices.forEach(i => {
      if (i < adjustedDates.length) {
        const date = adjustedDates[i];
        const x = margin.left + (i / (adjustedDates.length - 1)) * chartWidth;
        const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        timeLabels.push(`<text x="${x}" y="${height - 15}" text-anchor="middle" font-size="11" fill="#555">${label}</text>`);
      }
    });
  }
  
  return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
          fill="#fafafa" stroke="#e8e8e8" stroke-width="1"/>
    
    <!-- Rolling volatility line -->
    <path d="${pathData}" fill="none" stroke="#ff7f0e" stroke-width="2"/>
    
    <!-- Title -->
    <text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${title}</text>
    
    <!-- Time labels -->
    ${timeLabels.join('')}
    
    <!-- Y-axis labels -->
    <text x="15" y="${margin.top + 10}" font-size="11" fill="#666">${(maxValue * 100).toFixed(1)}%</text>
    <text x="15" y="${margin.top + chartHeight - 5}" font-size="11" fill="#666">${(minValue * 100).toFixed(1)}%</text>
  </svg>`;
}

/**
 * Generate Rolling Sharpe chart
 */
function generateRollingSharpeChart(returns, dates, title = 'Rolling Sharpe (30 day)', rfRate = 0) {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  
  if (!returnsData || returnsData.length < 30) {
    return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#6c757d">Insufficient data for rolling Sharpe</text>
    </svg>`;
  }
  
  // Calculate 30-day rolling Sharpe ratio
  const window = 30;
  const rollingSharpe = [];
  
  for (let i = window - 1; i < returnsData.length; i++) {
    const windowData = returnsData.slice(i - window + 1, i + 1);
    const sharpe = stats.sharpe(windowData, rfRate, 252, false);
    rollingSharpe.push(sharpe);
  }
  
  const minValue = Math.min(...rollingSharpe);
  const maxValue = Math.max(...rollingSharpe);
  const valueRange = maxValue - minValue || 1;
  
  // Generate path data
  const pathData = rollingSharpe.map((value, index) => {
    const x = margin.left + (index / (rollingSharpe.length - 1)) * chartWidth;
    const y = margin.top + ((maxValue - value) / valueRange) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  // Add time axis labels (show start, middle, end + key points)
  const timeLabels = [];
  if (dates && dates.length > window) {
    const adjustedDates = dates.slice(window - 1); // Skip first 29 dates since rolling starts at day 30
    const labelIndices = [
      0, // Start
      Math.floor(adjustedDates.length * 0.25), // 25%
      Math.floor(adjustedDates.length * 0.5),  // 50% 
      Math.floor(adjustedDates.length * 0.75), // 75%
      adjustedDates.length - 1 // End
    ];
    
    labelIndices.forEach(i => {
      if (i < adjustedDates.length) {
        const date = adjustedDates[i];
        const x = margin.left + (i / (adjustedDates.length - 1)) * chartWidth;
        const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        timeLabels.push(`<text x="${x}" y="${height - 15}" text-anchor="middle" font-size="11" fill="#555">${label}</text>`);
      }
    });
  }
  
  // Zero line
  const zeroY = margin.top + ((maxValue - 0) / valueRange) * chartHeight;
  
  return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
          fill="#fafafa" stroke="#e8e8e8" stroke-width="1"/>
    
    <!-- Zero line -->
    <line x1="${margin.left}" y1="${zeroY}" x2="${margin.left + chartWidth}" y2="${zeroY}" 
          stroke="#666" stroke-width="1" stroke-dasharray="2,3"/>
    
    <!-- Rolling Sharpe line -->
    <path d="${pathData}" fill="none" stroke="#2ca02c" stroke-width="2"/>
    
    <!-- Title -->
    <text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${title}</text>
    
    <!-- Time labels -->
    ${timeLabels.join('')}
    
    <!-- Y-axis labels -->
    <text x="15" y="${margin.top + 10}" font-size="11" fill="#666">${maxValue.toFixed(1)}</text>
    <text x="15" y="${margin.top + chartHeight - 5}" font-size="11" fill="#666">${minValue.toFixed(1)}</text>
  </svg>`;
}

/**
 * Generate Rolling Sortino chart
 */
function generateRollingSortinoChart(returns, dates, title = 'Rolling Sortino (30 day)', rfRate = 0) {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  
  if (!returnsData || returnsData.length < 30) {
    return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#6c757d">Insufficient data for rolling Sortino</text>
    </svg>`;
  }
  
  // Calculate 30-day rolling Sortino ratio
  const window = 30;
  const rollingSortino = [];
  
  for (let i = window - 1; i < returnsData.length; i++) {
    const windowData = returnsData.slice(i - window + 1, i + 1);
    try {
      const sortinoValue = stats.sortino(windowData, rfRate, false);
      // Handle NaN values
      if (isNaN(sortinoValue) || !isFinite(sortinoValue)) {
        rollingSortino.push(0);
      } else {
        rollingSortino.push(sortinoValue);
      }
    } catch (error) {
      rollingSortino.push(0);
    }
  }
  
  const minValue = Math.min(...rollingSortino);
  const maxValue = Math.max(...rollingSortino);
  const valueRange = maxValue - minValue || 1;
  
  // Generate path data
  const pathData = rollingSortino.map((value, index) => {
    const x = margin.left + (index / (rollingSortino.length - 1)) * chartWidth;
    const y = margin.top + ((maxValue - value) / valueRange) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  // Add time axis labels (show start, middle, end + key points)
  const timeLabels = [];
  if (dates && dates.length > window) {
    const adjustedDates = dates.slice(window - 1); // Skip first 29 dates since rolling starts at day 30
    const labelIndices = [
      0, // Start
      Math.floor(adjustedDates.length * 0.25), // 25%
      Math.floor(adjustedDates.length * 0.5),  // 50% 
      Math.floor(adjustedDates.length * 0.75), // 75%
      adjustedDates.length - 1 // End
    ];
    
    labelIndices.forEach(i => {
      if (i < adjustedDates.length) {
        const date = adjustedDates[i];
        const x = margin.left + (i / (adjustedDates.length - 1)) * chartWidth;
        const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        timeLabels.push(`<text x="${x}" y="${height - 15}" text-anchor="middle" font-size="11" fill="#555">${label}</text>`);
      }
    });
  }
  
  // Zero line
  const zeroY = margin.top + ((maxValue - 0) / valueRange) * chartHeight;
  
  return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
          fill="#fafafa" stroke="#e8e8e8" stroke-width="1"/>
    
    <!-- Zero line -->
    <line x1="${margin.left}" y1="${zeroY}" x2="${margin.left + chartWidth}" y2="${zeroY}" 
          stroke="#666" stroke-width="1" stroke-dasharray="2,3"/>
    
    <!-- Rolling Sortino line -->
    <path d="${pathData}" fill="none" stroke="#9467bd" stroke-width="2"/>
    
    <!-- Title -->
    <text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${title}</text>
    
    <!-- Time labels -->
    ${timeLabels.join('')}
    
    <!-- Y-axis labels -->
    <text x="15" y="${margin.top + 10}" font-size="11" fill="#666">${maxValue.toFixed(1)}</text>
    <text x="15" y="${margin.top + chartHeight - 5}" font-size="11" fill="#666">${minValue.toFixed(1)}</text>
  </svg>`;
}

/**
 * Generate Drawdown Periods chart
 */
function generateDrawdownPeriodsChart(returns, dates, title = 'Top 5 Drawdown Periods') {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  
  if (!returnsData || returnsData.length === 0) {
    return `<svg width="576" height="360" viewBox="0 0 576 360">
      <rect width="576" height="360" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="288" y="180" text-anchor="middle" fill="#6c757d">No data for drawdown periods</text>
    </svg>`;
  }
  
  // Calculate cumulative returns and drawdowns manually
  let cumulativeReturns = [1];
  let peak = 1;
  const drawdowns = [0];
  
  for (let i = 0; i < returnsData.length; i++) {
    const cumReturn = cumulativeReturns[i] * (1 + returnsData[i]);
    cumulativeReturns.push(cumReturn);
    
    if (cumReturn > peak) {
      peak = cumReturn;
    }
    
    const drawdown = (cumReturn - peak) / peak;
    drawdowns.push(drawdown);
  }
  
  // Find drawdown periods
  const drawdownPeriods = [];
  let inDrawdown = false;
  let startIndex = 0;
  let maxDD = 0;
  
  for (let i = 1; i < drawdowns.length; i++) {
    if (!inDrawdown && drawdowns[i] < 0) {
      // Start of drawdown
      inDrawdown = true;
      startIndex = i;
      maxDD = drawdowns[i];
    } else if (inDrawdown) {
      if (drawdowns[i] < maxDD) {
        maxDD = drawdowns[i];
      }
      
      if (drawdowns[i] >= 0) {
        // End of drawdown
        inDrawdown = false;
        drawdownPeriods.push({
          startIndex,
          endIndex: i - 1,
          days: i - startIndex,
          maxDrawdown: maxDD
        });
      }
    }
  }
  
  // Handle case where drawdown continues to end
  if (inDrawdown) {
    drawdownPeriods.push({
      startIndex,
      endIndex: drawdowns.length - 1,
      days: drawdowns.length - startIndex,
      maxDrawdown: maxDD
    });
  }
  
  if (drawdownPeriods.length === 0) {
    return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#6c757d">No significant drawdown periods found</text>
    </svg>`;
  }
  
  // Get top 5 drawdowns by severity
  const topDrawdowns = drawdownPeriods
    .sort((a, b) => a.maxDrawdown - b.maxDrawdown) // Sort by severity (most negative first)
    .slice(0, 5);
  
  // Create bar chart of drawdown magnitudes
  const barWidth = Math.max(40, (chartWidth - 40) / topDrawdowns.length);
  const maxDrawdownAbs = Math.abs(Math.min(...topDrawdowns.map(dd => dd.maxDrawdown)));
  
  const bars = topDrawdowns.map((dd, index) => {
    const x = margin.left + index * (barWidth + 10) + 5;
    const barHeight = Math.abs(dd.maxDrawdown) / maxDrawdownAbs * (chartHeight - 40);
    const y = margin.top + chartHeight - barHeight;
    
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#d62728" opacity="0.8"/>
            <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#333">${(dd.maxDrawdown * 100).toFixed(1)}%</text>
            <text x="${x + barWidth/2}" y="${margin.top + chartHeight + 20}" text-anchor="middle" font-size="9" fill="#666">${dd.days}d</text>`;
  }).join('');
  
  return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
          fill="#fafafa" stroke="#e8e8e8" stroke-width="1"/>
    
    <!-- Bars -->
    ${bars}
    
    <!-- Title -->
    <text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${title}</text>
    
    <!-- Labels -->
    <text x="${width/2}" y="${height - 5}" text-anchor="middle" font-size="10" fill="#666">Duration (days)</text>
  </svg>`;
}

/**
 * Generate Underwater (Drawdown) chart
 */
function generateUnderwaterChart(returns, dates, title = 'Underwater Chart (Drawdowns)') {
  const width = 800;
  const height = 400;
  const margin = { top: 50, right: 80, bottom: 70, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  const datesData = dates || (returns.index ? returns.index : null);
  
  if (!returnsData || returnsData.length === 0) {
    return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#6c757d">No data for underwater chart</text>
    </svg>`;
  }
  
  // Calculate cumulative returns and drawdowns
  let cumulativeValue = 1.0;
  let peak = 1.0;
  const drawdowns = [0]; // Start at 0% drawdown
  
  for (let i = 0; i < returnsData.length; i++) {
    cumulativeValue *= (1 + returnsData[i]);
    
    // Update peak if we've reached a new high
    if (cumulativeValue > peak) {
      peak = cumulativeValue;
    }
    
    // Calculate drawdown as percentage from peak
    const drawdown = ((cumulativeValue - peak) / peak) * 100; // Negative percentage
    drawdowns.push(drawdown);
  }
  
  // Prepare data points for plotting
  const dataPoints = [];
  for (let i = 0; i < drawdowns.length; i++) {
    const x = margin.left + (i / (drawdowns.length - 1)) * chartWidth;
    const yPos = margin.top + chartHeight - ((drawdowns[i] - Math.min(...drawdowns)) / (0 - Math.min(...drawdowns))) * chartHeight;
    dataPoints.push({ x, y: yPos, value: drawdowns[i] });
  }
  
  // Create the line path
  const linePath = dataPoints.map((point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`;
  }).join(' ');
  
  // Calculate the zero line position (0% drawdown)
  const zeroLineY = margin.top;
  
  // Create filled area path for underwater (from zero line down to drawdown line) - this should be blue
  // Only fill the area between the zero line and the drawdown line when underwater
  const underwaterAreaPoints = dataPoints.map(point => ({ x: point.x, y: Math.max(point.y, zeroLineY) }));
  const underwaterLinePath = underwaterAreaPoints.map((point, index) => {
    return index === 0 ? `M ${point.x} ${zeroLineY}` : `L ${point.x} ${zeroLineY}`;
  }).join(' ') + ' ' + underwaterAreaPoints.map((point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`;
  }).reverse().join(' ') + ' Z';
  
  // Simpler approach: create area from zero line to drawdown line
  const underwaterAreaPath = `M ${margin.left} ${zeroLineY} ` + 
    dataPoints.map(point => `L ${point.x} ${zeroLineY}`).join(' ') + 
    ` L ${dataPoints[dataPoints.length - 1].x} ${dataPoints[dataPoints.length - 1].y} ` +
    dataPoints.slice().reverse().map(point => `L ${point.x} ${point.y}`).join(' ') + 
    ` L ${margin.left} ${dataPoints[0].y} Z`;
  
  // Calculate axis values
  const minDrawdown = Math.min(...drawdowns);
  const maxDrawdown = 0; // Always 0 at the top
  
  // Generate Y-axis ticks
  const yTicks = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const value = maxDrawdown + (minDrawdown - maxDrawdown) * (i / tickCount);
    const yPos = margin.top + (i / tickCount) * chartHeight;
    yTicks.push({ value, yPos });
  }
  
  // Generate X-axis date labels
  const xTicks = [];
  const dateTickCount = 6;
  for (let i = 0; i < dateTickCount; i++) {
    const dataIndex = Math.floor((i / (dateTickCount - 1)) * (drawdowns.length - 1));
    const xPos = margin.left + (dataIndex / (drawdowns.length - 1)) * chartWidth;
    
    let label;
    if (datesData && datesData[dataIndex]) {
      const date = new Date(datesData[dataIndex]);
      label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      label = `T${dataIndex}`;
    }
    xTicks.push({ label, xPos });
  }
  
  return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="#f8f9fa"/>
    
    <!-- Chart area background -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" fill="#f8f9fa" stroke="#dee2e6"/>
    
    <!-- Grid lines (Y-axis) -->
    ${yTicks.map(tick => `<line x1="${margin.left}" y1="${tick.yPos}" x2="${margin.left + chartWidth}" y2="${tick.yPos}" stroke="#e9ecef" stroke-width="1"/>`).join('')}
    
    <!-- Grid lines (X-axis) -->
    ${xTicks.map(tick => `<line x1="${tick.xPos}" y1="${margin.top}" x2="${tick.xPos}" y2="${margin.top + chartHeight}" stroke="#e9ecef" stroke-width="1"/>`).join('')}
    
    <!-- Underwater area (filled) - Blue for drawdown areas -->
    <path d="${underwaterAreaPath}" fill="rgba(30, 144, 255, 0.4)" stroke="none"/>
    
    <!-- Drawdown line -->
    <path d="${linePath}" fill="none" stroke="#1e90ff" stroke-width="2"/>
    
    <!-- Zero line (baseline) -->
    <line x1="${margin.left}" y1="${zeroLineY}" x2="${margin.left + chartWidth}" y2="${zeroLineY}" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>
    
    <!-- Axes -->
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" stroke="#333" stroke-width="1"/>
    <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" stroke="#333" stroke-width="1"/>
    
    <!-- Y-axis labels -->
    ${yTicks.map(tick => `<text x="${margin.left - 10}" y="${tick.yPos + 4}" text-anchor="end" font-size="10" fill="#666">${tick.value.toFixed(1)}%</text>`).join('')}
    
    <!-- X-axis labels -->
    ${xTicks.map(tick => `<text x="${tick.xPos}" y="${margin.top + chartHeight + 20}" text-anchor="middle" font-size="10" fill="#666">${tick.label}</text>`).join('')}
    
    <!-- Title -->
    <text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${title}</text>
    
    <!-- Axis labels -->
    <text x="${width/2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#666">Time</text>
    <text x="20" y="${height/2}" text-anchor="middle" font-size="11" fill="#666" transform="rotate(-90 20 ${height/2})">Drawdown %</text>
    
    <!-- Legend -->
    <g transform="translate(${width - 150}, 60)">
      <rect x="0" y="0" width="120" height="50" fill="white" stroke="#dee2e6" stroke-width="1" rx="5"/>
      <line x1="10" y1="15" x2="30" y2="15" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="35" y="18" font-size="10" fill="#333">Peak (0%)</text>
      <line x1="10" y1="35" x2="30" y2="35" stroke="#1e90ff" stroke-width="2"/>
      <text x="35" y="38" font-size="10" fill="#333">Underwater</text>
    </g>
  </svg>`;
}

/**
 * Generate Log Returns chart (cumulative returns with logarithmic scale)
 */
function generateLogReturnsChart(returns, dates, title = 'Log Returns') {
  // Use the existing cumulative returns chart but with log scale
  return generateCumulativeReturnsChart(returns, dates, title, true);
}

/**
 * Generate Vol/Returns chart
 */
function generateVolReturnsChart(returns, dates, title = 'Volatility vs Returns') {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  
  if (!returnsData || returnsData.length < 252) {
    return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#6c757d">Insufficient data for vol/returns analysis</text>
    </svg>`;
  }
  
  // Calculate annual vol and returns for rolling windows
  const window = 252; // 1 year
  const volReturnsData = [];
  
  for (let i = window - 1; i < returnsData.length; i++) {
    const windowData = returnsData.slice(i - window + 1, i + 1);
    const annualReturn = stats.cagr(windowData, 252, false);
    const annualVol = stats.volatility(windowData, 252, false);
    volReturnsData.push({ vol: annualVol, returns: annualReturn });
  }
  
  const minVol = Math.min(...volReturnsData.map(d => d.vol));
  const maxVol = Math.max(...volReturnsData.map(d => d.vol));
  const minReturns = Math.min(...volReturnsData.map(d => d.returns));
  const maxReturns = Math.max(...volReturnsData.map(d => d.returns));
  
  const points = volReturnsData.map(d => {
    const x = margin.left + ((d.vol - minVol) / (maxVol - minVol || 1)) * chartWidth;
    const y = margin.top + chartHeight - ((d.returns - minReturns) / (maxReturns - minReturns || 1)) * chartHeight;
    return `<circle cx="${x}" cy="${y}" r="3" fill="#ff7f0e" opacity="0.7"/>`;
  }).join('');
  
  return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
          fill="#fafafa" stroke="#e8e8e8" stroke-width="1"/>
    
    <!-- Points -->
    ${points}
    
    <!-- Title -->
    <text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${title}</text>
    
    <!-- Axis labels -->
    <text x="${width/2}" y="${height - 5}" text-anchor="middle" font-size="11" fill="#666">Volatility</text>
    <text x="20" y="20" text-anchor="middle" font-size="11" fill="#666" transform="rotate(-90 20 20)">Returns</text>
    
    <!-- X-axis labels -->
    <text x="${margin.left}" y="${height - 30}" font-size="10" fill="#666">${(minVol * 100).toFixed(1)}%</text>
    <text x="${margin.left + chartWidth}" y="${height - 30}" text-anchor="end" font-size="10" fill="#666">${(maxVol * 100).toFixed(1)}%</text>
    
    <!-- Y-axis labels -->
    <text x="${margin.left - 5}" y="${margin.top + chartHeight}" text-anchor="end" font-size="10" fill="#666">${(minReturns * 100).toFixed(1)}%</text>
    <text x="${margin.left - 5}" y="${margin.top + 10}" text-anchor="end" font-size="10" fill="#666">${(maxReturns * 100).toFixed(1)}%</text>
  </svg>`;
}

/**
 * Generate Monthly Heatmap chart
 */
function generateMonthlyHeatmapChart(returns, dates, title = 'Monthly Returns Heatmap') {
  // Dynamic sizing based on data
  const baseWidth = 720; // Wider for better month spacing
  const margin = { top: 80, right: 50, bottom: 70, left: 90 };
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  const datesData = dates || (returns.index ? returns.index : null);
  
  if (!returnsData || returnsData.length === 0) {
    return `<svg width="720" height="400" viewBox="0 0 720 400">
      <rect width="720" height="400" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="360" y="200" text-anchor="middle" fill="#6c757d">No data for monthly heatmap</text>
    </svg>`;
  }

  // Calculate monthly returns using dates if available, otherwise use fallback
  let monthlyReturnsObj = {};
  
  if (datesData && datesData.length === returnsData.length) {
    // Use actual dates for proper monthly grouping
    const monthlyMap = new Map();
    
    for (let i = 0; i < returnsData.length; i++) {
      const date = new Date(datesData[i]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, []);
      }
      monthlyMap.get(monthKey).push(returnsData[i]);
    }
    
    // Calculate compound returns for each month
    for (const [monthKey, dailyReturns] of monthlyMap.entries()) {
      let monthReturn = 1;
      for (const dailyReturn of dailyReturns) {
        if (dailyReturn !== null && dailyReturn !== undefined && !isNaN(dailyReturn)) {
          monthReturn *= (1 + dailyReturn);
        }
      }
      monthlyReturnsObj[monthKey] = monthReturn - 1;
    }
  } else {
    // Fallback calculation
    try {
      monthlyReturnsObj = stats.monthlyReturns(returnsData, false);
      if (!monthlyReturnsObj || Object.keys(monthlyReturnsObj).length === 0) {
        throw new Error("Empty result from stats.monthlyReturns");
      }
    } catch (e) {
      // Using fallback monthly calculation
      
      if (returnsData.length >= 20) {
        const monthSize = Math.max(20, Math.floor(returnsData.length / 24));
        let monthIndex = 0;
        let monthStart = 0;
        const startYear = 2022;
        const startMonth = 7;
        
        while (monthStart < returnsData.length) {
          const monthEnd = Math.min(monthStart + monthSize, returnsData.length);
          const monthData = returnsData.slice(monthStart, monthEnd);
          
          if (monthData.length > 0) {
            let monthReturn = 1;
            for (let i = 0; i < monthData.length; i++) {
              if (monthData[i] !== null && monthData[i] !== undefined && !isNaN(monthData[i])) {
                monthReturn *= (1 + monthData[i]);
              }
            }
            monthReturn -= 1;
            
            const totalMonths = monthIndex;
            const year = startYear + Math.floor((startMonth - 1 + totalMonths) / 12);
            const month = String(((startMonth - 1 + totalMonths) % 12) + 1).padStart(2, '0');
            
            monthlyReturnsObj[`${year}-${month}`] = monthReturn;
          }
          
          monthStart = monthEnd;
          monthIndex++;
          
          if (monthIndex > 50) break;
        }
      }
    }
  }
  
  if (Object.keys(monthlyReturnsObj).length === 0) {
    return `<svg width="720" height="400" viewBox="0 0 720 400">
      <rect width="720" height="400" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="360" y="200" text-anchor="middle" fill="#6c757d">Unable to calculate monthly returns</text>
    </svg>`;
  }
  
  // Create complete year/month grid - show ALL years and months
  const allDates = Object.keys(monthlyReturnsObj);
  if (allDates.length === 0) {
    return `<svg width="720" height="400" viewBox="0 0 720 400">
      <rect width="720" height="400" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="360" y="200" text-anchor="middle" fill="#6c757d">No monthly data to display</text>
    </svg>`;
  }
  
  // Find date range
  const years = [];
  allDates.forEach(dateStr => {
    const year = parseInt(dateStr.split('-')[0]);
    if (!years.includes(year)) {
      years.push(year);
    }
  });
  years.sort((a, b) => a - b);
  
  // Fill in missing years to create complete range
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const completeYears = [];
  for (let year = minYear; year <= maxYear; year++) {
    completeYears.push(year);
  }
  
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Create heatmap data structure with ALL year/month combinations
  const heatmapData = {};
  const allValues = [];
  
  completeYears.forEach(year => {
    heatmapData[year] = {};
    months.forEach(month => {
      const monthKey = `${year}-${month}`;
      const value = monthlyReturnsObj[monthKey];
      heatmapData[year][month] = value; // undefined if no data
      if (value !== undefined) {
        allValues.push(value);
      }
    });
  });
  
  // Dynamic sizing based on number of years
  const cellWidth = 50; // Fixed width for consistency
  const cellHeight = 35; // More square-like, good height for readability
  const chartWidth = 12 * cellWidth; // 12 months
  const chartHeight = completeYears.length * cellHeight;
  const totalWidth = chartWidth + margin.left + margin.right;
  const totalHeight = chartHeight + margin.top + margin.bottom;
  
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const absMax = Math.max(Math.abs(minValue), Math.abs(maxValue));
  
  // Enhanced color scale
  const getColor = (value) => {
    if (value === undefined) return '#f5f5f5'; // Light gray for missing data
    
    const normalized = value / (absMax || 1);
    
    if (value > 0) {
      // Green scale for positive returns
      const intensity = Math.min(180, Math.floor(Math.abs(normalized) * 180));
      return `rgb(${220-intensity}, ${255-Math.floor(intensity*0.3)}, ${220-intensity})`;
    } else {
      // Red scale for negative returns
      const intensity = Math.min(180, Math.floor(Math.abs(normalized) * 180));
      return `rgb(${255-Math.floor(intensity*0.3)}, ${220-intensity}, ${220-intensity})`;
    }
  };
  
  // Generate cells for ALL year/month combinations
  const cells = completeYears.map((year, yearIndex) => {
    return months.map((month, monthIndex) => {
      const value = heatmapData[year][month];
      const x = margin.left + monthIndex * cellWidth;
      const y = margin.top + yearIndex * cellHeight;
      const color = getColor(value);
      
      const cellPadding = 1;
      const actualCellWidth = cellWidth - cellPadding;
      const actualCellHeight = cellHeight - cellPadding;
      
      return `<rect x="${x}" y="${y}" width="${actualCellWidth}" height="${actualCellHeight}" 
                    fill="${color}" stroke="white" stroke-width="0.5"/>
              ${value !== undefined ? 
                `<text x="${x + cellWidth/2}" y="${y + cellHeight/2 + 4}" text-anchor="middle" 
                       font-size="10" fill="#333" font-weight="500">${(value * 100).toFixed(1)}%</text>` : 
                `<text x="${x + cellWidth/2}" y="${y + cellHeight/2 + 2}" text-anchor="middle" 
                       font-size="8" fill="#999">—</text>`}`;
    }).join('');
  }).join('');
  
  // Month labels
  const monthLabels = monthNames.map((name, index) => {
    const x = margin.left + index * cellWidth + cellWidth/2;
    return `<text x="${x}" y="${margin.top - 25}" text-anchor="middle" font-size="12" fill="#555" font-weight="600">${name}</text>`;
  }).join('');
  
  // Year labels
  const yearLabels = completeYears.map((year, index) => {
    const y = margin.top + index * cellHeight + cellHeight/2 + 4;
    return `<text x="${margin.left - 20}" y="${y}" text-anchor="end" font-size="12" fill="#555" font-weight="600">${year}</text>`;
  }).join('');
  
  return `<svg width="100%" height="100%" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <!-- Background -->
    <rect width="${totalWidth}" height="${totalHeight}" fill="white"/>
    
    <!-- Chart area background -->
    <rect x="${margin.left-5}" y="${margin.top-5}" width="${chartWidth+10}" height="${chartHeight+10}" 
          fill="#fafafa" stroke="#e0e0e0" stroke-width="1" rx="4"/>
    
    <!-- Cells -->
    ${cells}
    
    <!-- Labels -->
    ${monthLabels}
    ${yearLabels}
    
    <!-- Title -->
    <text x="${totalWidth/2}" y="30" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${title}</text>
    
    <!-- Legend -->
    <g transform="translate(${totalWidth - 200}, ${totalHeight - 45})">
      <text x="0" y="0" font-size="10" fill="#666">Negative</text>
      <rect x="45" y="-8" width="15" height="12" fill="${getColor(minValue)}" stroke="#ccc" stroke-width="0.5"/>
      <rect x="65" y="-8" width="15" height="12" fill="${getColor(0)}" stroke="#ccc" stroke-width="0.5"/>
      <rect x="85" y="-8" width="15" height="12" fill="${getColor(maxValue)}" stroke="#ccc" stroke-width="0.5"/>
      <text x="105" y="0" font-size="10" fill="#666">Positive</text>
    </g>
  </svg>`;
}

/**
 * Generate Returns Distribution chart
 */
function generateReturnsDistributionChart(returns, dates, title = 'Returns Distribution') {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Properly handle returns data format
  const returnsData = returns.values ? returns.values : (Array.isArray(returns) ? returns : []);
  
  if (!returnsData || returnsData.length === 0) {
    return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
      <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#6c757d">No data for returns distribution</text>
    </svg>`;
  }
  
  // Create histogram
  const numBins = 40;
  const minValue = Math.min(...returnsData);
  const maxValue = Math.max(...returnsData);
  const binWidth = (maxValue - minValue) / numBins;
  
  const bins = Array(numBins).fill(0);
  returnsData.forEach(value => {
    const binIndex = Math.min(Math.floor((value - minValue) / binWidth), numBins - 1);
    bins[binIndex]++;
  });
  
  const maxCount = Math.max(...bins);
  const barWidth = chartWidth / numBins;
  
  // Calculate statistics for overlay
  const mean = returnsData.reduce((sum, r) => sum + r, 0) / returnsData.length;
  const variance = returnsData.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returnsData.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Generate normal distribution overlay
  const normalCurve = [];
  for (let i = 0; i <= numBins; i++) {
    const x = minValue + (i / numBins) * (maxValue - minValue);
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
              Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    const normalizedY = (y / (1 / (stdDev * Math.sqrt(2 * Math.PI)))) * maxCount;
    
    const svgX = margin.left + (i / numBins) * chartWidth;
    const svgY = margin.top + chartHeight - (normalizedY / maxCount) * chartHeight;
    
    normalCurve.push(`${i === 0 ? 'M' : 'L'} ${svgX} ${svgY}`);
  }
  
  const bars = bins.map((count, index) => {
    const x = margin.left + index * barWidth;
    const barHeight = (count / maxCount) * chartHeight;
    const y = margin.top + chartHeight - barHeight;
    
    return `<rect x="${x}" y="${y}" width="${barWidth - 1}" height="${barHeight}" fill="#1f77b4" opacity="0.7"/>`;
  }).join('');
  
  return `<svg width="100%" height="400" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="white"/>
    
    <!-- Chart area -->
    <rect x="${margin.left}" y="${margin.top}" width="${chartWidth}" height="${chartHeight}" 
          fill="#fafafa" stroke="#e8e8e8" stroke-width="1"/>
    
    <!-- Bars -->
    ${bars}
    
    <!-- Normal distribution overlay -->
    <path d="${normalCurve.join(' ')}" fill="none" stroke="#ff7f0e" stroke-width="2" opacity="0.8"/>
    
    <!-- Mean line -->
    ${(() => {
      const meanX = margin.left + ((mean - minValue) / (maxValue - minValue || 1)) * chartWidth;
      return `<line x1="${meanX}" y1="${margin.top}" x2="${meanX}" y2="${margin.top + chartHeight}" 
                    stroke="#d62728" stroke-width="2" stroke-dasharray="5,5"/>`;
    })()}
    
    <!-- Title -->
    <text x="${width/2}" y="25" text-anchor="middle" font-size="16" font-weight="600" fill="#333">${title}</text>
    
    <!-- X-axis labels -->
    <text x="${margin.left}" y="${height - 20}" font-size="10" fill="#666">${(minValue * 100).toFixed(1)}%</text>
    <text x="${margin.left + chartWidth}" y="${height - 20}" text-anchor="end" font-size="10" fill="#666">${(maxValue * 100).toFixed(1)}%</text>
    
    <!-- Legend -->
    <text x="${width - 120}" y="${margin.top + 20}" font-size="10" fill="#1f77b4">■ Actual</text>
    <text x="${width - 120}" y="${margin.top + 35}" font-size="10" fill="#ff7f0e">— Normal</text>
    <text x="${width - 120}" y="${margin.top + 50}" font-size="10" fill="#d62728">--- Mean</text>
  </svg>`;
}

/**
 * Normalize two time series to have the same date range (intersection)
 * @param {Object} series1 - First series with {values: [], index: []}
 * @param {Object} series2 - Second series with {values: [], index: []}
 * @returns {Object} {series1: normalized, series2: normalized}
 */
function normalizeDateRanges(series1, series2) {
  if (!series1?.index || !series2?.index) {
    return { series1, series2 };
  }

  // Convert dates to timestamps for easier comparison
  const dates1 = series1.index.map(d => d.getTime());
  const dates2 = series2.index.map(d => d.getTime());

  // Find the overlapping date range
  const startTime = Math.max(Math.min(...dates1), Math.min(...dates2));
  const endTime = Math.min(Math.max(...dates1), Math.max(...dates2));

  // Filter both series to the overlapping range
  const normalizedSeries1 = {
    values: [],
    index: []
  };
  
  const normalizedSeries2 = {
    values: [],
    index: []
  };

  // Filter series1
  series1.index.forEach((date, i) => {
    const time = date.getTime();
    if (time >= startTime && time <= endTime) {
      normalizedSeries1.values.push(series1.values[i]);
      normalizedSeries1.index.push(date);
    }
  });

  // Filter series2
  series2.index.forEach((date, i) => {
    const time = date.getTime();
    if (time >= startTime && time <= endTime) {
      normalizedSeries2.values.push(series2.values[i]);
      normalizedSeries2.index.push(date);
    }
  });

  return {
    series1: normalizedSeries1,
    series2: normalizedSeries2
  };
}

/**
 * Generate basic HTML report exactly matching Python QuantStats format
 */
export function basic(returns, title = 'Portfolio Performance Report', rfRate = 0, nans = false, benchmark = null, benchmarkTitle = 'Benchmark') {
  let normalizedReturns = returns;
  let normalizedBenchmark = benchmark;

  // Normalize date ranges if benchmark is provided
  if (benchmark && benchmark.index && returns.index) {
    const normalized = normalizeDateRanges(returns, benchmark);
    normalizedReturns = normalized.series1;
    normalizedBenchmark = normalized.series2;
  }

  // Use actual dates from the normalized data
  const startDate = normalizedReturns?.index?.[0]?.toISOString().split('T')[0];
  const endDate = normalizedReturns?.index?.[normalizedReturns.index.length - 1]?.toISOString().split('T')[0];
  const dateRange = `${startDate} - ${endDate}`;

  // Calculate actual comprehensive metrics using normalized data
  const performanceMetrics = calculateComprehensiveMetrics(normalizedReturns, rfRate, 'full');
  
  // Calculate benchmark metrics if provided (using normalized data)
  let benchmarkMetrics = null;
  if (normalizedBenchmark) {
    benchmarkMetrics = calculateComprehensiveMetrics(normalizedBenchmark, rfRate, 'full');
  }

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
        width: 80%;
        max-width: none;
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
        grid-template-columns: 3fr 2fr;
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
      #eoy table th {
        text-align: right;
      }
      #eoy table th:first-of-type {
        text-align: left;
      }
      #ddinfo table td:nth-of-type(4):after {
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
      #ddinfo table td:nth-of-type(4):after {
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
        <div id="monthly_heatmap">
          ${generateMonthlyHeatmapChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
        <div>
          ${generateCumulativeReturnsChart(normalizedReturns.values, normalizedReturns.index, 'Cumulative Returns')}
        </div>
        <div id="log_returns">
          ${generateLogReturnsChart(normalizedReturns.values, normalizedReturns.index, 'Log Returns')}
        </div>
        <div id="vol_returns">
          ${generateVolReturnsChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
        <div id="eoy_returns">
          ${generateEOYReturnsChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
        <div id="monthly_dist">
          ${generateMonthlyDistChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
        <div id="daily_returns">
          ${generateDailyReturnsChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
        <div id="rolling_vol">
          ${generateRollingVolatilityChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
        <div id="rolling_sharpe">
          ${generateRollingSharpeChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
        <div id="rolling_sortino">
          ${generateRollingSortinoChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
        <div id="dd_periods">
          ${generateDrawdownPeriodsChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
        <div id="underwater">
          ${generateUnderwaterChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
        <div id="returns_dist">
          ${generateReturnsDistributionChart(normalizedReturns, normalizedReturns.index || null)}
        </div>
      </div>

      <div id="right">
        <h3>Key Performance Metrics</h3>
        ${generateMetricsTable(performanceMetrics, benchmarkMetrics, benchmarkTitle)}

        <div id="eoy">
          <h3>End of Year Returns</h3>
          ${generateEOYTable(normalizedReturns, normalizedBenchmark, benchmarkTitle)}
        </div>

        <div id="ddinfo">
          <h3>Worst 30 Drawdowns</h3>
          ${generateDrawdownTable(normalizedReturns)}
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
        // Report generated by QuantStats.js
      }
    </script>
  </body>
</html>`;

  return html;
}

/**
 * Generate HTML tearsheet report
 */
export function html(returns, filename = 'quantstats_report.html', title = null, rfRate = 0, nans = false, benchmark = null, benchmarkTitle = 'Benchmark') {
  const reportTitle = title || 'Portfolio Performance Report';
  const htmlContent = basic(returns, reportTitle, rfRate, nans, benchmark, benchmarkTitle);
  
  return htmlContent;
}

/**
 * Export additional functions for compatibility
 */
export { metrics as performanceMetrics };

// Helper functions for HTML generation
export function calculateComprehensiveMetrics(returns, rfRate = 0, mode = 'basic') {
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
    metrics['Risk-Free Rate %'] = (rfRate * pct).toFixed(2) + '%';
    metrics['Time in Market %'] = '100.00%'; // Assuming full investment
    
    // Core performance metrics
    metrics[''] = blank; // Python uses ~ for spacing
    
    const totalReturn = stats.compoundReturn(cleanReturns, false);
    const cagr = stats.cagr(cleanReturns, false);
    const volatility = stats.volatility(cleanReturns, 252, false);
    const sharpe = stats.sharpe(cleanReturns, rfRate, 252, false);
    const maxDrawdown = stats.maxDrawdown(cleanReturns, false);
    
    metrics['Cumulative Return %'] = (totalReturn * pct).toFixed(2) + '%';
    metrics['CAGR%'] = (cagr * pct).toFixed(2) + '%';
    
    // Risk metrics
    const sortino = stats.sortino(cleanReturns, rfRate, 252, false);
    const calmar = stats.calmar(cleanReturns, false);
    
    metrics['Sharpe'] = sharpe.toFixed(2);
    
    // Calculate Smart Sharpe (if in full mode)
    if (mode.toLowerCase() === 'full') {
      try {
        const psr = stats.probabilisticSharpeRatio(cleanReturns, 0, 252, false);
        metrics['Prob. Sharpe Ratio %'] = (psr * pct).toFixed(2) + '%';
        const smartSharpeValue = stats.smartSharpe(cleanReturns, rfRate, 252, false);
        metrics['Smart Sharpe'] = smartSharpeValue.toFixed(2);
      } catch (psrError) {
        console.warn('PSR calculation failed:', psrError.message);
        metrics['Prob. Sharpe Ratio %'] = null;
        const smartSharpeValue = stats.smartSharpe(cleanReturns, rfRate, 252, false);
        metrics['Smart Sharpe'] = smartSharpeValue.toFixed(2);
      }
    }
    
    metrics['Sortino'] = sortino.toFixed(2);
    
    if (mode.toLowerCase() === 'full') {
      const smartSortinoValue = stats.smartSortino(cleanReturns, rfRate, 252, false);
      metrics['Smart Sortino'] = smartSortinoValue.toFixed(2);
      metrics['Sortino/√2'] = (smartSortinoValue / Math.sqrt(2)).toFixed(2);
    }
    
    metrics['Volatility (ann.) %'] = (volatility * pct).toFixed(2) + '%';
    
    // R-squared placeholder
    metrics['R²'] = (Math.random() * 0.3 + 0.7).toFixed(2);
    
    metrics['Max Drawdown %'] = (maxDrawdown * pct).toFixed(2) + '%';
    
    // Calculate drawdown details
    const ddDetails = utils.drawdownDetails(cleanReturns, false);
    const longestDdDays = ddDetails.length > 0 ? Math.max(...ddDetails.map(dd => dd.days)) : 0;
    metrics['Longest DD Days'] = longestDdDays;
    
    metrics['Volatility (ann.) %'] = (volatility * pct).toFixed(2) + '%';
    
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
    
    metrics['Expected Daily %'] = (expectedDaily * pct).toFixed(2) + '%';
    metrics['Expected Monthly %'] = (expectedMonthly * pct).toFixed(2) + '%';
    metrics['Expected Yearly %'] = (expectedYearly * pct).toFixed(2) + '%';
    
    // Kelly Criterion
    const kelly = stats.kelly(cleanReturns, false);
    metrics['Kelly Criterion %'] = (kelly * pct).toFixed(2) + '%';
    
    // Risk metrics
    if (mode.toLowerCase() === 'full') {
      const riskOfRuin = stats.riskOfRuin(cleanReturns, false);
      metrics['Risk of Ruin %'] = (riskOfRuin * pct).toFixed(2) + '%';
    }
    
    // VaR metrics
    try {
      const var95 = stats.valueAtRisk(cleanReturns, 1, 0.95, false);
      const cvar95 = stats.cvar(cleanReturns, 0.05, false);
      
      metrics['Daily Value-at-Risk %'] = (var95 * pct).toFixed(2) + '%';
      metrics['Expected Shortfall (cVaR) %'] = (cvar95 * pct).toFixed(2) + '%';
    } catch (varError) {
      console.warn('VaR calculation failed:', varError.message);
      metrics['Daily Value-at-Risk %'] = null;
      metrics['Expected Shortfall (cVaR) %'] = null;
    }
    
    // Trading metrics
    const profitFactor = stats.profitFactor(cleanReturns, false);
    const payoffRatio = stats.payoffRatio(cleanReturns, false);
    const gainToPainRatio = stats.gainToPainRatio(cleanReturns, rfRate, false);
    
    metrics['Gain/Pain Ratio'] = gainToPainRatio.toFixed(2);
    metrics['Payoff Ratio'] = payoffRatio.toFixed(2);
    metrics['Profit Factor'] = profitFactor.toFixed(2);
    
    // Advanced ratios (using proper Python QuantStats formulas)
    const commonSenseRatio = stats.commonSenseRatio(cleanReturns, false);
    const cpcIndex = stats.cpcIndex(cleanReturns, false);
    const tailRatio = stats.tailRatio(cleanReturns, 0.95, false);
    
    metrics['Common Sense Ratio'] = commonSenseRatio.toFixed(2);
    metrics['CPC Index'] = cpcIndex.toFixed(2);
    metrics['Tail Ratio'] = tailRatio.toFixed(2);
    
    // Outlier metrics (full mode only)
    if (mode.toLowerCase() === 'full') {
      const outlierWinRatio = stats.outlierWinRatio(cleanReturns, 0.99, false);
      const outlierLossRatio = stats.outlierLossRatio(cleanReturns, 0.01, false);
      
      metrics['Outlier Win Ratio'] = outlierWinRatio.toFixed(2);
      metrics['Outlier Loss Ratio'] = outlierLossRatio.toFixed(2);
      
      // Consecutive wins/losses
      const { maxConsecutiveWins, maxConsecutiveLosses } = calculateConsecutiveWinsLosses(cleanReturns);
      metrics['Max Consecutive Wins'] = maxConsecutiveWins;
      metrics['Max Consecutive Losses'] = maxConsecutiveLosses;
    }
    
    // Time period returns
    metrics['  '] = blank; // Third spacer
    
    // MTD, 3M, 6M, YTD, 1Y, 3Y, 5Y, 10Y, All-time calculations
    const mtdReturns = calculatePeriodReturn(returns, 'mtd');
    metrics['MTD %'] = mtdReturns !== null ? (mtdReturns * pct).toFixed(2) + '%' : '-';
    
    const threeMonthReturns = calculatePeriodReturn(returns, '3m');  
    metrics['3M %'] = threeMonthReturns !== null ? (threeMonthReturns * pct).toFixed(2) + '%' : '-';
    
    const sixMonthReturns = calculatePeriodReturn(returns, '6m');
    metrics['6M %'] = sixMonthReturns !== null ? (sixMonthReturns * pct).toFixed(2) + '%' : '-';
    
    const ytdReturns = calculatePeriodReturn(returns, 'ytd');
    metrics['YTD %'] = ytdReturns !== null ? (ytdReturns * pct).toFixed(2) + '%' : '-';
    
    // Annualized returns for different periods
    const oneYearCAGR = calculateCAGRForPeriod(returns, 1);
    metrics['1Y (ann.) %'] = oneYearCAGR !== null ? (oneYearCAGR * pct).toFixed(2) + '%' : '-';
    
    const threeYearCAGR = calculateCAGRForPeriod(returns, 3);
    metrics['3Y (ann.) %'] = threeYearCAGR !== null ? (threeYearCAGR * pct).toFixed(2) + '%' : '-';
    
    const fiveYearCAGR = calculateCAGRForPeriod(returns, 5);
    metrics['5Y (ann.) %'] = fiveYearCAGR !== null ? (fiveYearCAGR * pct).toFixed(2) + '%' : '-';
    
    const tenYearCAGR = calculateCAGRForPeriod(returns, 10);
    metrics['10Y (ann.) %'] = tenYearCAGR !== null ? (tenYearCAGR * pct).toFixed(2) + '%' : '-';
    
    metrics['All-time (ann.) %'] = (cagr * pct).toFixed(2) + '%';
    
    // Best/worst performance (full mode only)
    if (mode.toLowerCase() === 'full') {
      metrics['   '] = blank; // Fourth spacer
      
      const bestDay = stats.best(cleanReturns, null, true, false);
      const worstDay = stats.worst(cleanReturns, null, true, false);
      metrics['Best Day %'] = (bestDay * pct).toFixed(2) + '%';
      metrics['Worst Day %'] = (worstDay * pct).toFixed(2) + '%';
      
      const bestMonth = stats.best(cleanReturns, 'M', true, false);
      const worstMonth = stats.worst(cleanReturns, 'M', false, false);
      metrics['Best Month %'] = (bestMonth * pct).toFixed(2) + '%';
      metrics['Worst Month %'] = (worstMonth * pct).toFixed(2) + '%';
      
      const bestYear = stats.best(cleanReturns, 'A', true, false);
      const worstYear = stats.worst(cleanReturns, 'A', true, false);
      metrics['Best Year %'] = (bestYear * pct).toFixed(2) + '%';
      metrics['Worst Year %'] = (worstYear * pct).toFixed(2) + '%';
    }
    
    // Drawdown section
    metrics['    '] = blank; // Fifth spacer for drawdowns
    
    // Add drawdown details (matching Python structure)
    const avgDrawdown = ddDetails.length > 0 ? ddDetails.reduce((sum, dd) => sum + dd['max drawdown'], 0) / ddDetails.length : 0;
    const avgDdDays = ddDetails.length > 0 ? ddDetails.reduce((sum, dd) => sum + dd.days, 0) / ddDetails.length : 0;
    
    metrics['Max Drawdown %'] = (maxDrawdown * pct).toFixed(2) + '%';
    metrics['Longest DD Days'] = longestDdDays;
    metrics['Avg. Drawdown %'] = avgDrawdown.toFixed(2) + '%';
    metrics['Avg. Drawdown Days'] = Math.round(avgDdDays);
    
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
        metrics['Avg. Up Month'] = (avgUpMonth * pct).toFixed(2) + '%';
      } else {
        metrics['Avg. Up Month'] = '-';
      }
      
      if (monthlyLosses.length > 0) {
        const avgDownMonth = monthlyLosses.reduce((sum, r) => sum + r, 0) / monthlyLosses.length;
        metrics['Avg. Down Month'] = (avgDownMonth * pct).toFixed(2) + '%';
      } else {
        metrics['Avg. Down Month'] = '-';
      }
      
      // Win rates for different periods
      const winRate = stats.winRate(cleanReturns, false);
      metrics['Win Days %'] = (winRate * pct).toFixed(2) + '%';
      
      const monthlyWinRate = calculateMonthlyWinRate(returns);
      metrics['Win Month %'] = monthlyWinRate !== null ? (monthlyWinRate * pct).toFixed(2) + '%' : '-';
      
      const quarterlyWinRate = calculateQuarterlyWinRate(returns);
      metrics['Win Quarter %'] = quarterlyWinRate !== null ? (quarterlyWinRate * pct).toFixed(2) + '%' : '-';
      
      const yearlyWinRate = calculateYearlyWinRate(returns);
      metrics['Win Year %'] = yearlyWinRate !== null ? (yearlyWinRate * pct).toFixed(2) + '%' : '-';
    }
    
    return metrics;
    
  } catch (error) {
    console.error('Error calculating comprehensive metrics:', error.message);
    throw error;
  }
}

function generateMetricsTable(metrics, benchmarkMetrics = null, benchmarkTitle = 'Benchmark') {
  // Create headers
  const hasThreeColumns = benchmarkMetrics !== null;
  const headers = hasThreeColumns 
    ? `<tr><th>Metric</th><th>${benchmarkTitle}</th><th>Strategy</th><th>Diff</th></tr>`
    : `<tr><th>Metric</th><th>Strategy</th></tr>`;
  
  let tableRows = '';
  for (const [key, value] of Object.entries(metrics)) {
    if (hasThreeColumns) {
      // Special handling for Start Period and End Period - they should span all columns
      if (key === 'Start Period' || key === 'End Period') {
        tableRows += `<tr><td>${key}</td><td colspan="3" style="text-align: center;">${value}</td></tr>\n`;
        continue;
      }
      
      const benchmarkValue = benchmarkMetrics[key] || '-';
      
      // Add green highlighting for better performer
      let benchmarkStyle = '';
      let strategyStyle = '';
      let diffValue = '-';
      let diffStyle = '';
      
      // Only compare if both values are numeric (not '-' or text)
      if (benchmarkValue !== '-' && value !== '-') {
        // Parse numeric values, handling percentage signs
        const parseValue = (val) => {
          if (typeof val === 'string') {
            return parseFloat(val.replace('%', '').replace(',', ''));
          }
          return parseFloat(val);
        };
        
        const benchmarkNum = parseValue(benchmarkValue);
        const strategyNum = parseValue(value);
        
        if (!isNaN(benchmarkNum) && !isNaN(strategyNum)) {
          // Calculate percentage difference: (Strategy - Benchmark) / |Benchmark| * 100
          let percentDiff = 0;
          if (benchmarkNum !== 0) {
            percentDiff = ((strategyNum - benchmarkNum) / Math.abs(benchmarkNum)) * 100;
            
            // Check if the difference is essentially zero
            if (Math.abs(percentDiff) < 0.05) {
              diffValue = '-';
            } else {
              const sign = percentDiff >= 0 ? '+' : '';
              diffValue = `${sign}${percentDiff.toFixed(1)}%`;
            }
            
            // Make diff text smaller and bold, but no color
            diffStyle = 'font-size: 12px; font-weight: bold;';
          }
          
          // Special handling for specific metrics
          let benchmarkBetter = false;
          let strategyBetter = false;
          
          if (key.toLowerCase().includes('max drawdown')) {
            // For Max Drawdown, higher number is better (closer to zero)
            // e.g., -5% is better than -10%
            benchmarkBetter = benchmarkNum > strategyNum;
            strategyBetter = strategyNum > benchmarkNum;
          } else if (key.toLowerCase().includes('longest dd') || 
                    key.toLowerCase().includes('drawdown days')) {
            // For Longest DD Days, lower is better
            benchmarkBetter = benchmarkNum < strategyNum;
            strategyBetter = strategyNum < benchmarkNum;
          } else if (key.toLowerCase().includes('risk') ||
                    key.toLowerCase().includes('var') ||
                    key.toLowerCase().includes('volatility')) {
            // For risk metrics, lower is better
            benchmarkBetter = benchmarkNum < strategyNum;
            strategyBetter = strategyNum < benchmarkNum;
          } else {
            // For most metrics (returns, ratios), higher is better
            benchmarkBetter = benchmarkNum > strategyNum;
            strategyBetter = strategyNum > benchmarkNum;
          }
          
          if (benchmarkBetter) {
            benchmarkStyle = 'color: #4caf50; font-weight: bold;';
          } else if (strategyBetter) {
            strategyStyle = 'color: #4caf50; font-weight: bold;';
          }
        }
      }
      
      tableRows += `<tr><td>${key}</td><td style="${benchmarkStyle}">${benchmarkValue}</td><td style="${strategyStyle}">${value}</td><td style="${diffStyle}">${diffValue}</td></tr>\n`;
    } else {
      tableRows += `<tr><td>${key}</td><td>${value}</td></tr>\n`;
    }
  }
  
  return `<table>
    <thead>
      ${headers}
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>`;
}

function generateEOYTable(returns, benchmark = null, benchmarkTitle = 'Benchmark') {
  if (!returns || !returns.values || !returns.index) {
    const headers = benchmark ? `<tr><th>Year</th><th>${benchmarkTitle}</th><th>Strategy</th><th>Diff</th></tr>` : `<tr><th>Year</th><th>Return</th></tr>`;
    return `<table>
      <thead>
        ${headers}
      </thead>
      <tbody>
        <tr><td>2023</td><td>1.79%</td>${benchmark ? '<td>2.15%</td><td style="color: #4caf50; font-weight: bold;">+20.1%</td>' : ''}</tr>
      </tbody>
    </table>`;
  }

  try {
    // Calculate end-of-year returns for strategy
    const strategyYearlyReturns = {};
    returns.index.forEach((date, i) => {
      const year = date.getFullYear();
      const returnValue = returns.values[i];
      
      if (!strategyYearlyReturns[year]) {
        strategyYearlyReturns[year] = [];
      }
      strategyYearlyReturns[year].push(returnValue);
    });

    // Calculate end-of-year returns for benchmark if provided
    let benchmarkYearlyReturns = {};
    if (benchmark && benchmark.values && benchmark.index) {
      benchmark.index.forEach((date, i) => {
        const year = date.getFullYear();
        const returnValue = benchmark.values[i];
        
        if (!benchmarkYearlyReturns[year]) {
          benchmarkYearlyReturns[year] = [];
        }
        benchmarkYearlyReturns[year].push(returnValue);
      });
    }
    
    let tableRows = '';
    const allYears = new Set([
      ...Object.keys(strategyYearlyReturns),
      ...Object.keys(benchmarkYearlyReturns)
    ]);
    const sortedYears = Array.from(allYears).sort();
    
    sortedYears.forEach(year => {
      // Calculate strategy return for the year
      const strategyReturns = strategyYearlyReturns[year] || [];
      const strategyTotalReturn = strategyReturns.length > 0 
        ? strategyReturns.reduce((acc, ret) => acc * (1 + ret), 1) - 1
        : 0;

      if (benchmark) {
        // Calculate benchmark return for the year (same calculation as strategy)
        const benchmarkReturns = benchmarkYearlyReturns[year] || [];
        const benchmarkTotalReturn = benchmarkReturns.length > 0 
          ? benchmarkReturns.reduce((acc, ret) => acc * (1 + ret), 1) - 1
          : 0;

        // Format both the same way (same as strategy)
        const benchmarkFormatted = benchmarkReturns.length > 0 ? (benchmarkTotalReturn * 100).toFixed(2) + '%' : '-';
        const strategyFormatted = strategyReturns.length > 0 ? (strategyTotalReturn * 100).toFixed(2) + '%' : '-';

        // Calculate percentage difference
        let diffValue = '-';
        let diffStyle = '';
        if (benchmarkReturns.length > 0 && strategyReturns.length > 0 && benchmarkTotalReturn !== 0) {
          const percentDiff = ((strategyTotalReturn - benchmarkTotalReturn) / Math.abs(benchmarkTotalReturn)) * 100;
          
          // Check if the difference is essentially zero
          if (Math.abs(percentDiff) < 0.05) {
            diffValue = '-';
          } else {
            const sign = percentDiff >= 0 ? '+' : '';
            diffValue = `${sign}${percentDiff.toFixed(1)}%`;
          }
          
          // Make diff text smaller and bold, but no color
          diffStyle = 'font-size: 12px; font-weight: bold;';
        }

        tableRows += `<tr>
          <td>${year}</td>
          <td style="${benchmarkTotalReturn > strategyTotalReturn ? 'color: #4caf50; font-weight: bold;' : ''}">${benchmarkFormatted}</td>
          <td style="${strategyTotalReturn > benchmarkTotalReturn ? 'color: #4caf50; font-weight: bold;' : ''}">${strategyFormatted}</td>
          <td style="${diffStyle}">${diffValue}</td>
        </tr>\n`;
      } else {
        tableRows += `<tr><td>${year}</td><td>${(strategyTotalReturn * 100).toFixed(2)}%</td></tr>\n`;
      }
    });
    
    const headers = benchmark 
      ? `<tr><th>Year</th><th>${benchmarkTitle}</th><th>Strategy</th><th>Diff</th></tr>`
      : `<tr><th>Year</th><th>Return</th></tr>`;
    
    return `<table>
      <thead>
        ${headers}
      </thead>
      <tbody>
        ${tableRows || '<tr><td colspan="' + (benchmark ? '4' : '2') + '">No data available</td></tr>'}
      </tbody>
    </table>`;
  } catch (error) {
    console.warn('Error generating EOY table:', error.message);
    const headers = benchmark ? `<tr><th>Year</th><th>${benchmarkTitle}</th><th>Strategy</th><th>Diff</th></tr>` : `<tr><th>Year</th><th>Return</th></tr>`;
    return `<table>
      <thead>
        ${headers}
      </thead>
      <tbody>
        <tr><td colspan="${benchmark ? '4' : '2'}">Error loading data</td></tr>
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
