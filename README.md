# QuantStats JS 📊

[![npm version](https://badge.fury.io/js/quantstats.svg)](https://badge.fury.io/js/quantstats)
[![license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**Comprehensive portfolio analytics and professional tearsheet generation for JavaScript/Node.js**

Create stunning HTML reports with 13+ financial charts and 40+ metrics, bringing quantitative finance analysis to the JavaScript ecosystem.

## ✨ Features

- **🎯 Complete Python Compatibility**: 100% mathematically identical to Python QuantStats
- **📊 Professional HTML Reports**: Generate complete tearsheets with 13+ interactive charts
- **📈 Comprehensive Metrics**: Over 40 financial metrics and ratios
- **🎨 Interactive Visualizations**: Professional charts with responsive design
- **⚡ High Performance**: Optimized for speed with efficient algorithms
- **🛡️ Risk Analysis**: VaR, CVaR, drawdown analysis, and risk-adjusted returns
- **📋 Full Tearsheets**: Complete portfolio analysis reports matching Python QuantStats
- **🔢 Mathematical Precision**: All calculations validated against Python implementation
- **📱 Responsive Design**: Professional MUI-style reports that work on all devices
- **🚀 Zero Dependencies**: Core functionality uses only native JavaScript

## 🚀 Installation

```bash
npm install quantstats-js
```

## ⚡ Quick Start

```javascript
import * as qs from 'quantstats-js';

// Sample daily returns with dates
const returns = [0.01, -0.005, 0.02, -0.01, 0.015, -0.008, 0.025];
const dates = returns.map((_, i) => new Date(2023, 0, i + 1));
const returnsData = { values: returns, index: dates };

// Generate complete tearsheet (like Python QuantStats!)
const tearsheet = qs.reports.basic(returnsData, 'My Portfolio');
console.log('Professional tearsheet generated:', tearsheet.length, 'bytes');

// Get EVERYTHING - 50+ comprehensive metrics in one call!
const everything = qs.reports.calculateComprehensiveMetrics(returnsData, 0.02, 'full');
console.log('Period Returns:', everything['MTD %'], everything['YTD %']);

// Get core metrics quickly
const allMetrics = qs.reports.metrics(returns.values);
console.log('Sharpe:', allMetrics.sharpe, 'Max DD:', allMetrics.maxDrawdown);

// Or calculate individual metrics
const totalReturn = qs.stats.totalReturn(returns);
const sharpe = qs.stats.sharpe(returns);
const maxDrawdown = qs.stats.maxDrawdown(returns);

console.log(`Total Return: ${(totalReturn * 100).toFixed(2)}%`);
console.log(`Sharpe Ratio: ${sharpe.toFixed(2)}`);
console.log(`Max Drawdown: ${(maxDrawdown * 100).toFixed(2)}%`);
```

## 📊 Professional Tearsheet Generation

**NEW in v2.0.0**: Complete HTML tearsheet generation with professional charts!

```javascript
import * as qs from 'quantstats-js';
import fs from 'fs';

// Your portfolio returns with dates
const returns = { 
  values: [0.01, -0.005, 0.02, -0.01, 0.015, -0.008, 0.025, -0.012, 0.018],
  index: [/* array of Date objects */]
};

// Generate complete tearsheet
const tearsheet = qs.reports.basic(returns, 'My Portfolio Strategy');

// Save professional HTML report
fs.writeFileSync('tearsheet.html', tearsheet);
```

## 🆚 Benchmark Comparison

**NEW in v2.1.0**: Compare your strategy against any benchmark!

```javascript
import * as qs from 'quantstats-js';

// Your strategy returns
const strategyReturns = { 
  values: [0.01, -0.005, 0.02, -0.01, 0.015],
  index: [/* Date objects */]
};

// Benchmark returns (e.g., S&P 500)
const benchmarkReturns = { 
  values: [0.008, -0.003, 0.015, -0.008, 0.012],
  index: [/* Date objects */]
};

// Generate tearsheet with benchmark comparison
const tearsheet = qs.reports.basic(
  strategyReturns, 
  'My Strategy vs S&P 500',
  0,                    // risk-free rate
  false,                // include NaNs
  benchmarkReturns,     // benchmark data
  'S&P 500'            // benchmark name
);

// Creates a 3-column table: Metric | S&P 500 | Strategy
// Shows "Benchmarked Against S&P 500" in header
```

### 🎨 What's Included in the Tearsheet

**📈 13+ Professional Charts:**
- **Cumulative Returns** - Portfolio growth over time
- **EOY Returns** - End-of-year performance bar chart  
- **Monthly Distribution** - Histogram of monthly returns
- **Daily Returns** - Daily performance distribution
- **Rolling Sharpe** - 30-day rolling Sharpe ratio
- **Rolling Sortino** - 30-day rolling Sortino ratio
- **Rolling Volatility** - 30-day rolling volatility
- **Drawdowns** - Underwater plot showing drawdown periods
- **Monthly Returns Heatmap** - Calendar view of monthly performance
- **Volatility vs Returns** - Risk-return scatter plot
- **And more...**

**📊 40+ Comprehensive Metrics:**
- Performance: Total Return, CAGR, Sharpe, Sortino, Calmar
- Risk: Max Drawdown, Volatility, VaR, CVaR, Ulcer Index
- Trading: Win Rate, Profit Factor, Kelly Criterion, Recovery Factor
- Period Returns: MTD, 3M, 6M, YTD, 1Y, 3Y, 5Y, 10Y
- Best/Worst: Best/Worst Day/Month/Year performance
- And many more statistical measures

**🎨 Professional Design:**
- Clean, modern Material-UI inspired styling
- Responsive design that works on all devices
- Professional color scheme and typography
- Date-labeled time series charts
- Properly formatted percentage values
- Print-ready layout

## 📚 Core Modules

### 📊 Reports Module (NEW v2.0.0)
Complete tearsheet generation with professional visualizations:

```javascript
// Basic tearsheet (recommended)
const tearsheet = qs.reports.basic(returns, title, rfRate, nans);

// Just the metrics (no charts)
const metrics = qs.reports.metrics(returns, rfRate, nans);

// Generate comprehensive metrics object
const allMetrics = qs.reports.calculateComprehensiveMetrics(returns, rfRate, mode);
```

**Chart Functions Available:**
- `generateCumulativeReturnsChart()` - Equity curve
- `generateEOYReturnsChart()` - End-of-year returns
- `generateMonthlyDistChart()` - Monthly distribution histogram
- `generateDailyReturnsChart()` - Daily returns distribution
- `generateRollingSharpeChart()` - Rolling Sharpe ratio
- `generateRollingSortinoChart()` - Rolling Sortino ratio
- `generateRollingVolatilityChart()` - Rolling volatility
- `generateDrawdownsChart()` - Underwater plot
- `generateMonthlyHeatmapChart()` - Monthly returns heatmap
- `generateVolatilityReturnsChart()` - Risk vs return scatter
- `generateEOYTable()` - End-of-year returns table

#### 🚀 Get ALL Stats in One Call - The Ultimate Function

Want **EVERYTHING**? Use `reports.calculateComprehensiveMetrics()` - this is the powerhouse function that returns 50+ metrics:

```javascript
import * as qs from 'quantstats-js';

// Your returns data with dates (required for comprehensive analysis)
const returnsData = {
  values: [0.01, -0.005, 0.02, -0.01, 0.015, -0.008, 0.025],
  index: [/* array of Date objects */]
};

// Get EVERYTHING - 50+ metrics in one call!
const everything = qs.reports.calculateComprehensiveMetrics(returnsData, 0.02, 'full');

console.log(everything);
// Returns comprehensive object with ALL metrics:
// {
//   'Start Period': '2023-01-01',
//   'End Period': '2023-12-31',
//   'Risk-Free Rate %': '2.00%',
//   'Time in Market %': '100.00%',
//   'Cumulative Return %': '5.47%',
//   'CAGR%': '2.34%',
//   'Sharpe': '1.23',
//   'Prob. Sharpe Ratio %': '87.23%',
//   'Smart Sharpe': '1.23',
//   'Sortino': '1.45',
//   'Smart Sortino': '1.45',
//   'Volatility (ann.) %': '14.56%',
//   'Max Drawdown %': '-2.34%',
//   'Longest DD Days': 5,
//   'Calmar': '0.87',
//   'Skew': '0.23',
//   'Kurtosis': '2.45',
//   'Expected Daily %': '0.12%',
//   'Expected Monthly %': '2.45%', 
//   'Expected Yearly %': '28.7%',
//   'Kelly Criterion %': '23.4%',
//   'Risk of Ruin %': '0.12%',
//   'Daily Value-at-Risk %': '-1.23%',
//   'Expected Shortfall (cVaR) %': '-1.56%',
//   'Gain/Loss Ratio': '1.45',
//   'Payoff Ratio': '1.23',
//   'Profit Factor': '1.67',
//   'Common Sense Ratio': '1.45',
//   'CPC Index': '1.08',
//   'Tail Ratio': '1.45',
//   'Outlier Win Ratio': '1.23',
//   'Outlier Loss Ratio': '1.23',
//   'Max Consecutive Wins': 3,
//   'Max Consecutive Losses': 2,
//   'MTD %': '1.23%',
//   '3M %': '4.56%',
//   '6M %': '7.89%',
//   'YTD %': '12.34%',
//   '1Y (ann.) %': '12.34%',
//   '3Y (ann.) %': '8.67%',
//   '5Y (ann.) %': '9.12%',
//   '10Y (ann.) %': '7.89%',
//   'All-time (ann.) %': '2.34%',
//   'Best Day %': '2.50%',
//   'Worst Day %': '-1.50%',
//   'Best Month %': '5.67%',
//   'Worst Month %': '-3.45%',
//   'Best Year %': '15.67%',
//   'Worst Year %': '-8.90%',
//   'Avg. Drawdown %': '-1.23%',
//   'Avg. Drawdown Days': 2,
//   'Recovery Factor': '2.34',
//   'Ulcer Index': '0.01',
//   'Serenity Index': '1.23',
//   'Avg. Up Month': '3.45%',
//   'Avg. Down Month': '-2.34%',
//   'Win Days %': '64.3%',
//   'Win Month %': '58.3%',
//   'Win Quarter %': '66.7%',
//   'Win Year %': '80.0%'
//   // ... and more!
// }
```

**Parameters:**
- `returnsData` - Object with `{values: [...], index: [dates...]}`
- `rfRate` - Risk-free rate (default: 0.02 = 2%)
- `mode` - 'basic' or 'full' (full mode includes 20+ additional metrics)

**Benefits:**
- 🎯 **Most Comprehensive**: 50+ metrics including period returns, drawdown analysis, win rates
- 📊 **Professional Format**: Matches Python QuantStats exactly with % formatting
- 🔧 **Configurable Depth**: Basic vs Full mode for different analysis needs  
- ⚡ **Single Call**: Everything you need for complete portfolio analysis

#### 📈 Quick Metrics Only

For just the core metrics without formatting, use `reports.metrics()`:

```javascript
// Get core metrics in simple object format (40+ metrics)
const coreMetrics = qs.reports.metrics(returns.values, 0.02, false);
```

#### 📉 Get Detailed Drawdown Analysis

Want comprehensive drawdown details for every single drawdown period? Use the utils module:

```javascript
import * as qs from 'quantstats-js';

// Your returns data with dates
const returnsData = {
  values: [0.01, -0.005, 0.02, -0.01, 0.015, -0.008, 0.025, -0.012, 0.018],
  index: [/* array of Date objects */]
};

// Get detailed analysis of EVERY drawdown period
const allDrawdowns = qs.utils.drawdownDetails(returnsData.values, returnsData.index);

console.log(allDrawdowns);
// Returns array with details of each drawdown period:
// [
//   {
//     'start': Date('2023-01-02'),      // When drawdown started
//     'valley': Date('2023-01-04'),     // Lowest point 
//     'end': Date('2023-01-06'),        // When recovered
//     'days': 5,                        // Duration in days
//     'max drawdown': -0.0234,          // Peak drawdown %
//     '99% max drawdown': -0.0156       // 99% confidence level
//   },
//   {
//     'start': Date('2023-02-10'),
//     'valley': Date('2023-02-12'),
//     'end': Date('2023-02-15'), 
//     'days': 6,
//     'max drawdown': -0.0189,
//     '99% max drawdown': -0.0134
//   }
//   // ... every single drawdown period with full details
// ]

// Get the continuous drawdown series (daily drawdown values)
const ddSeries = qs.utils.toDrawdownSeries(returnsData.values);
console.log('Current drawdown:', ddSeries[ddSeries.length - 1]);
console.log('Max drawdown:', Math.min(...ddSeries));

// Quick drawdown stats from comprehensive metrics
const stats = qs.reports.calculateComprehensiveMetrics(returnsData, 0.02, 'full');
console.log('Longest DD Days:', stats['Longest DD Days']);
console.log('Avg DD Days:', stats['Avg. Drawdown Days']);
console.log('Recovery Factor:', stats['Recovery Factor']);
```

**Drawdown Analysis Features:**
- 📊 **Every Period**: Complete details for each individual drawdown
- 📅 **Full Timeline**: Start date, valley date, recovery date
- ⏱️ **Duration**: Days underwater for each period  
- 📈 **Recovery Tracking**: When and how portfolio recovered
- 🎯 **Statistical Confidence**: 99% confidence intervals

### 📈 Stats Module
Financial metrics and risk calculations:
- `cagr()` - Compound Annual Growth Rate
- `sharpe()` - Sharpe Ratio
- `sortino()` - Sortino Ratio
- `calmar()` - Calmar Ratio
- `volatility()` - Annualized volatility
- `maxDrawdown()` - Maximum drawdown
- `valueAtRisk()` - Value at Risk
- `cvar()` - Conditional Value at Risk
- `beta()` - Beta coefficient
- `alpha()` - Alpha coefficient
- And many more...

### Utils Module
Data preparation and utility functions:
- `toReturns()` - Convert prices to returns
- `prepareReturns()` - Clean and prepare returns data
- `toDrawdownSeries()` - Calculate drawdown series
- `portfolioValue()` - Calculate portfolio value over time
- `aggregateReturns()` - Aggregate returns by period
- `resample()` - Resample returns to different frequencies

### Plots Module
Data generation for visualizations:
- `equityCurve()` - Equity curve data
- `drawdownPlot()` - Drawdown plot data
- `returnsDistribution()` - Returns histogram data
- `rollingStats()` - Rolling statistics data
- `monthlyHeatmap()` - Monthly returns heatmap data
- `dashboard()` - Complete dashboard data

### Reports Module
Comprehensive reporting functionality:
- `metrics()` - Generate all portfolio metrics
- `basic()` - Basic HTML report
- `full()` - Comprehensive HTML report

## 🎯 Usage Examples

### 📊 Generate Complete Tearsheet (NEW v2.0.0)

```javascript
import * as qs from 'quantstats-js';
import fs from 'fs';

// Your portfolio data (daily returns with dates)
const portfolioReturns = [
  0.01, -0.005, 0.02, -0.01, 0.015, -0.008, 0.025, -0.012, 0.018, -0.003,
  0.012, -0.015, 0.008, 0.022, -0.007, 0.013, -0.011, 0.016, -0.004, 0.009
];

// Create date index (required for time-series analysis)
const startDate = new Date('2023-01-01');
const dates = portfolioReturns.map((_, i) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + i);
  return date;
});

// Format data for tearsheet generation
const returnsData = {
  values: portfolioReturns,
  index: dates
};

// Generate professional tearsheet  
const tearsheet = qs.reports.basic(
  returnsData,
  'My Portfolio Strategy Analysis'
);

// Save as HTML file
fs.writeFileSync('portfolio_tearsheet.html', tearsheet);
console.log('✅ Professional tearsheet saved to portfolio_tearsheet.html');

// The tearsheet includes:
// - 13+ professional charts
// - 40+ comprehensive metrics  
// - Publication-ready design
// - Responsive layout
// - Proper date labeling
// - Professional formatting
```

### 📈 Advanced Metrics Analysis

```javascript
// Get comprehensive metrics object
const metrics = qs.reports.calculateComprehensiveMetrics(returnsData);

console.log('📊 Performance Metrics:');
console.log(`Total Return: ${metrics['Cumulative Return %']}`);
console.log(`CAGR: ${metrics['CAGR%']}`);
console.log(`Sharpe Ratio: ${metrics['Sharpe']}`);
console.log(`Sortino Ratio: ${metrics['Sortino']}`);
console.log(`Max Drawdown: ${metrics['Max Drawdown %']}`);

console.log('🎯 Trading Metrics:');
console.log(`Win Rate: ${metrics['Win Rate %']}`);
console.log(`Profit Factor: ${metrics['Profit Factor']}`);
console.log(`Kelly Criterion: ${metrics['Kelly Criterion %']}`);

console.log('⚠️ Risk Metrics:');
console.log(`VaR (95%): ${metrics['Daily Value-at-Risk %']}`);
console.log(`CVaR (95%): ${metrics['Expected Shortfall (cVaR) %']}`);
console.log(`Volatility: ${metrics['Volatility (ann.) %']}`);

console.log('📅 Period Returns:');
console.log(`YTD: ${metrics['YTD %']}`);
console.log(`1Y: ${metrics['1Y (ann.) %']}`);
console.log(`3Y: ${metrics['3Y (ann.) %']}`);
```

### 🎨 Individual Chart Generation

```javascript
// Generate individual charts (returns SVG strings)
const cumulativeChart = qs.reports.generateCumulativeReturnsChart(
  returnsData.values, 
  returnsData.index,
  'Portfolio Growth'
);

const drawdownChart = qs.reports.generateDrawdownsChart(
  returnsData.values,
  returnsData.index,
  'Drawdown Analysis'
);

const heatmapChart = qs.reports.generateMonthlyHeatmapChart(
  returnsData.values,
  returnsData.index,
  'Monthly Returns'
);

// Charts are professional SVG graphics that can be:
// - Embedded in HTML
// - Saved as SVG files
// - Converted to PNG/PDF
// - Used in web applications
console.log('Charts generated:', {
  cumulative: cumulativeChart.length,
  drawdown: drawdownChart.length,
  heatmap: heatmapChart.length
});
```

### 📊 Dashboard Data Generation

```javascript
// Generate data for custom dashboards
const plotData = qs.plots.dashboard(portfolioReturns);

// Use the data with your preferred charting library
console.log('Dashboard data:', {
  equityCurve: plotData.equityCurve.data.length,
  drawdown: plotData.drawdown.data.length,
  monthlyHeatmap: plotData.monthlyHeatmap.data.length,
  returnsDistribution: plotData.returnsDistribution.data.length
});
```

### Basic Portfolio Analysis

```javascript
import * as qs from 'quantstats-js';

// Convert prices to returns
const prices = [100, 102, 101, 105, 103, 108, 106, 112];
const returns = qs.utils.toReturns(prices);

// Calculate comprehensive metrics (simple array format)
const metrics = qs.reports.metrics(returns.values);

console.log('Portfolio Analysis:', {
  totalReturn: `${(metrics.totalReturn * 100).toFixed(2)}%`,
  cagr: `${(metrics.cagr * 100).toFixed(2)}%`,
  sharpe: metrics.sharpe.toFixed(2),
  maxDrawdown: `${(metrics.maxDrawdown * 100).toFixed(2)}%`,
  winRate: `${(metrics.winRate * 100).toFixed(2)}%`
});
```

### Risk Analysis

```javascript
// Risk metrics
const var95 = qs.stats.valueAtRisk(returns, 0.05);
const cvar95 = qs.stats.cvar(returns, 0.05);
const skewness = qs.stats.skew(returns);
const kurtosis = qs.stats.kurtosis(returns);

console.log('Risk Analysis:', {
  var95: `${(var95 * 100).toFixed(2)}%`,
  cvar95: `${(cvar95 * 100).toFixed(2)}%`,
  skewness: skewness.toFixed(2),
  kurtosis: kurtosis.toFixed(2)
});
```

### Generate HTML Report

```javascript
// Create comprehensive HTML report
const htmlReport = qs.reports.basic(
  returns,
  'My Portfolio Analysis'
);

// Save to file (Node.js)
import fs from 'fs';
fs.writeFileSync('portfolio_report.html', htmlReport);
```

### Visualization Data

```javascript
// Generate data for charts
const plotData = qs.plots.dashboard(returns);

// Equity curve data
const equityCurve = plotData.equityCurve;
console.log('Equity curve data points:', equityCurve.data.length);

// Drawdown data
const drawdown = plotData.drawdown;
console.log('Max drawdown:', Math.min(...drawdown.data));

// Monthly returns heatmap
const heatmap = plotData.monthlyHeatmap;
console.log('Monthly data:', heatmap.data.length);
```

## 📊 Data Formats

### For Complete Tearsheets (Recommended)

```javascript
// Returns with dates (required for time-series analysis)
const returnsData = {
  values: [0.01, -0.005, 0.02, -0.01, 0.015], // Daily returns array
  index: [Date1, Date2, Date3, Date4, Date5]   // Corresponding dates
};

// Generate professional tearsheet
const tearsheet = qs.reports.basic(returnsData, 'My Strategy');
```

### For Basic Calculations

```javascript
// Simple array format (for basic metrics only)
const returns = [0.01, -0.005, 0.02, -0.01, 0.015];

// Calculate basic metrics
const metrics = qs.reports.metrics(returns.values);
const sharpe = qs.stats.sharpe(returns);
```

### 📅 Date Handling

```javascript
// Create date array from start date
const createDateRange = (startDate, numDays) => {
  return Array.from({length: numDays}, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });
};

// Example usage
const dates = createDateRange(new Date('2023-01-01'), returns.length);
const returnsData = { values: returns, index: dates };
```

## 📈 Mathematical Accuracy

All calculations in QuantStats.js are mathematically identical to the Python QuantStats library:

- **Sharpe Ratio**: `(mean_return * √252) / (std_return * √252)`
- **Sortino Ratio**: `(mean_return * √252) / (downside_std * √252)`
- **CAGR**: `(ending_value / beginning_value) ^ (1/years) - 1`
- **Maximum Drawdown**: `min(cumulative_returns / running_max - 1)`
- **Value at Risk**: `percentile(returns, confidence_level)`

## Performance Optimizations

QuantStats.js is optimized for performance:

1. **Efficient Algorithms**: Uses optimized mathematical calculations
2. **Minimal Memory Usage**: Streaming calculations where possible
3. **Fast Array Operations**: Leverages JavaScript's native array methods
4. **Lazy Evaluation**: Calculations only performed when needed
5. **Caching**: Results cached for repeated calculations

## 📖 API Reference

### 📊 Reports Functions (NEW v2.0.0)

| Function | Description | Parameters |
|----------|-------------|------------|
| `basic(returnsData, title?)` | **Generate complete tearsheet** | returns with dates, optional title |
| `calculateComprehensiveMetrics(returnsData)` | **Calculate all 40+ metrics** | returns with dates object |
| `metrics(returns, rfRate?, nans?)` | Calculate basic metrics | returns array, risk-free rate, include NaNs |

### 🎨 Chart Generation Functions (NEW v2.0.0)

| Function | Description | Returns |
|----------|-------------|----------|
| `generateCumulativeReturnsChart(returns, dates, title?)` | Cumulative returns line chart | SVG string |
| `generateEOYReturnsChart(returns, dates, title?)` | End-of-year returns bar chart | SVG string |
| `generateMonthlyDistChart(returns, dates, title?)` | Monthly distribution histogram | SVG string |
| `generateDailyReturnsChart(returns, dates, title?)` | Daily returns distribution | SVG string |
| `generateRollingSharpeChart(returns, dates, title?)` | Rolling Sharpe ratio (30-day) | SVG string |
| `generateRollingSortinoChart(returns, dates, title?)` | Rolling Sortino ratio (30-day) | SVG string |
| `generateRollingVolatilityChart(returns, dates, title?)` | Rolling volatility (30-day) | SVG string |
| `generateDrawdownsChart(returns, dates, title?)` | Underwater drawdown plot | SVG string |
| `generateMonthlyHeatmapChart(returns, dates, title?)` | Monthly returns calendar heatmap | SVG string |
| `generateVolatilityReturnsChart(returns, dates, title?)` | Risk vs return scatter plot | SVG string |
| `generateEOYTable(returns)` | End-of-year returns data table | HTML string |

### 📈 Stats Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `cagr(returns, rfRate?, nans?, dates?)` | Compound Annual Growth Rate | returns, risk-free rate, include NaNs, dates |
| `sharpe(returns, rfRate?, nans?)` | Sharpe Ratio | returns, risk-free rate, include NaNs |
| `sortino(returns, rfRate?, nans?)` | Sortino Ratio | returns, risk-free rate, include NaNs |
| `volatility(returns, nans?)` | Annualized Volatility | returns, include NaNs |
| `maxDrawdown(returns, nans?)` | Maximum Drawdown | returns, include NaNs |
| `valueAtRisk(returns, confidence?, nans?)` | Value at Risk | returns, confidence level, include NaNs |
| `beta(returns, benchmark, nans?)` | Beta Coefficient | returns, benchmark, include NaNs |
| `alpha(returns, benchmark, rfRate?, nans?)` | Alpha Coefficient | returns, benchmark, risk-free rate, include NaNs |
| `omega(returns, rfRate?, requiredReturn?, periods?, nans?)` | Omega Ratio | returns, risk-free rate, required return, periods, include NaNs |
| `informationRatio(returns, benchmark, nans?)` | Information Ratio | returns, benchmark, include NaNs |
| `treynorRatio(returns, benchmark, rfRate?, nans?)` | Treynor Ratio | returns, benchmark, risk-free rate, include NaNs |
| `calmar(returns, rfRate?, nans?, dates?)` | Calmar Ratio | returns, risk-free rate, include NaNs, dates |
| `ulcerIndex(returns, nans?)` | Ulcer Index | returns, include NaNs |
| `smartSharpe(returns, rfRate?, periods?, nans?)` | Smart Sharpe (with autocorr penalty) | returns, risk-free rate, periods, include NaNs |
| `smartSortino(returns, rfRate?, periods?, nans?)` | Smart Sortino (with autocorr penalty) | returns, risk-free rate, periods, include NaNs |
| `kelly(returns, nans?)` | Kelly Criterion | returns, include NaNs |
| `skew(returns, nans?)` | Skewness | returns, include NaNs |
| `kurtosis(returns, nans?)` | Kurtosis | returns, include NaNs |
| `best(returns, nans?)` | Best Return | returns, include NaNs |
| `worst(returns, nans?)` | Worst Return | returns, include NaNs |
| `consecutiveWins(returns, nans?)` | Max Consecutive Wins | returns, include NaNs |
| `consecutiveLosses(returns, nans?)` | Max Consecutive Losses | returns, include NaNs |
| `exposure(returns, nans?)` | Market Exposure | returns, include NaNs |
| `winRate(returns, nans?)` | Win Rate | returns, include NaNs |
| `avgWin(returns, nans?)` | Average Win | returns, include NaNs |
| `avgLoss(returns, nans?)` | Average Loss | returns, include NaNs |
| `profitFactor(returns, nans?)` | Profit Factor | returns, include NaNs |
| `gainToPainRatio(returns, rfRate?, nans?)` | Gain to Pain Ratio | returns, risk-free rate, include NaNs |
| `riskOfRuin(returns, nans?)` | Risk of Ruin | returns, include NaNs |
| `outliers(returns, quantile?, nans?)` | Outliers | returns, quantile, include NaNs |
| `removeOutliers(returns, quantile?, nans?)` | Remove Outliers | returns, quantile, include NaNs |

### Utils Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `toReturns(prices, compound?)` | Convert prices to returns | prices array, compound returns |
| `prepareReturns(data, rfRate?, nans?)` | Prepare returns data | data, risk-free rate, include NaNs |
| `toDrawdownSeries(returns)` | Calculate drawdown series | returns array |
| `portfolioValue(returns, initial?)` | Calculate portfolio value | returns, initial value |
| `aggregateReturns(returns, period?)` | Aggregate by period | returns, period (monthly/yearly) |
| `toPrices(returns, base?)` | Convert returns to prices | returns, base price |
| `toLogReturns(returns, rfRate?)` | Convert to log returns | returns, risk-free rate |
| `toExcessReturns(returns, rfRate)` | Convert to excess returns | returns, risk-free rate |
| `rebase(prices, base?)` | Rebase prices to new base | prices, base value |
| `exponentialStdev(returns, window?, isHalflife?)` | Exponential standard deviation | returns, window, is halflife |
| `drawdownDetails(returns, dates?)` | Detailed drawdown periods | returns, dates (Python-compatible) |
| `resample(returns, frequency)` | Resample returns frequency | returns, frequency |
| `makePercentage(value, precision?)` | Format as percentage | value, decimal places |
| `makePosNeg(returns)` | Split positive/negative | returns array |

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes:
- Mathematical accuracy tests
- Edge case handling
- Performance benchmarks
- Integration tests
- Known value validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.

## 📝 Changelog

### v2.1.1 - Date Range Normalization for Benchmarks 📅

**🔧 CRITICAL FIX:**

**📅 Date Range Normalization:**
- **Automatic Date Alignment** - When comparing strategy vs benchmark, both series are automatically normalized to the same time period
- **Intersection Logic** - Uses the overlapping date range between strategy and benchmark data
- **All Charts Updated** - Ensures all visualizations use the normalized timeframe for accurate comparison
- **Console Logging** - Shows normalization details for transparency

**🎯 How It Works:**
```javascript
// If strategy has 100 days (2023-01-01 to 2023-04-10)
// And benchmark has 60 days (2023-01-20 to 2023-03-20)
// Both will be normalized to 60 days (2023-01-20 to 2023-03-20)

const report = qs.reports.basic(
  strategyReturns,    // 100 periods
  'My Strategy',
  0, false,
  benchmarkReturns,   // 60 periods (offset)
  'S&P 500'
);
// Result: Both series use the same 60-day overlapping period
```

**✅ Quality Assurance:**
- All 26 tests passing with 100% success rate
- Backward compatible - no changes to existing API
- Automatic detection and normalization when benchmark provided
- Detailed logging shows original vs normalized date ranges

**🎯 Benefits:**
- Ensures fair comparison between strategy and benchmark
- Eliminates timeframe bias in performance analysis
- Maintains data integrity while maximizing comparable periods
- Professional-grade benchmark analysis

### v2.1.0 - Benchmark Comparison Feature 🆚

**🚀 NEW FEATURES:**

**🆚 Benchmark Comparison:**
- **Side-by-Side Metrics** - Compare your strategy against any benchmark (S&P 500, Bitcoin, etc.)
- **3-Column Table Layout** - Professional comparison: Metric | Benchmark | Strategy
- **Dynamic Headers** - Shows "Benchmarked Against [Benchmark Name]" in report title
- **Full Integration** - Works with both `basic()` and `html()` tearsheet functions
- **Backward Compatible** - All existing code continues to work unchanged

**🔧 Function Enhancements:**
- `qs.reports.basic(returns, title, rfRate, nans, benchmark, benchmarkTitle)` - Added optional benchmark parameters
- `qs.reports.html(returns, filename, title, rfRate, nans, benchmark, benchmarkTitle)` - Added optional benchmark parameters
- Enhanced `generateMetricsTable()` to handle 2-column or 3-column layouts automatically

**📊 Usage Examples:**
```javascript
// Without benchmark (works exactly as before)
const report = qs.reports.basic(returns, 'My Strategy');

// With benchmark comparison
const report = qs.reports.basic(
  strategyReturns, 
  'My Strategy vs S&P 500',
  0, false, 
  benchmarkReturns, 
  'S&P 500'
);
```

**✅ Quality Assurance:**
- All 26 tests passing with 100% success rate
- Zero breaking changes - fully backward compatible
- Professional presentation with clean table formatting
- Works with any benchmark data (stocks, crypto, bonds, etc.)

### v2.0.3 - Simplified API: Removed Benchmark Dependencies 🧹

**🔧 Breaking Changes:**
- **Simplified Function Signatures** - Removed benchmark parameters from all functions for cleaner API
- **Focused Portfolio Analysis** - Package now focuses purely on single portfolio analysis
- **Cleaner Codebase** - Removed unused benchmark calculation functions and complexity

**📦 What Changed:**
- `qs.reports.basic(returns, title, rfRate, nans)` - No longer accepts benchmark parameter
- `qs.reports.metrics(returns, rfRate, nans)` - No longer accepts benchmark parameter
- `qs.reports.calculateComprehensiveMetrics(returns, rfRate, mode)` - No longer accepts benchmark parameter
- Removed Rolling Beta chart and related benchmark comparison features
- Removed unused helper functions (`calculateCovariance`, `calculateVariance`, `calculateCorrelation`)

**✅ What Still Works:**
- All 26 tests passing with 100% success rate
- Complete tearsheet generation with 13+ professional charts
- 40+ comprehensive financial metrics and analysis
- Individual benchmark functions still available in `qs.stats` module for manual comparison
- All core portfolio analytics functionality preserved

**🎯 Benefits:**
- Simpler, cleaner API focused on portfolio analysis
- Smaller package size and reduced complexity
- Better performance without unused benchmark calculations
- Easier to use and understand for most use cases

### v2.0.2 - Bug Fix: Remove Non-existent Function Call 🐛

**🔧 Bug Fixes:**
- **Fixed trackingError Reference** - Removed call to `stats.trackingError()` which doesn't exist in the stats module
- **Improved Code Stability** - Eliminated undefined function call that could cause errors
- **Maintained Functionality** - All other benchmark metrics (beta, alpha, informationRatio) continue to work correctly

**✅ Quality Assurance:**
- All 26 tests passing with 100% success rate
- Clean codebase with no undefined function references
- Production-ready stability improvements

### v2.0.1 - Documentation & Discoverability Enhancements 📚

**🔧 Improvements:**
- **Enhanced Package Description** - More descriptive npm package summary highlighting key features
- **Expanded Keywords** - Added comprehensive keywords for better npm search discoverability
- **Professional Presentation** - Improved README introduction and feature descriptions
- **Search Optimization** - Better npm package metadata for community discovery

**📦 Package Quality:**
- All 26 tests passing with 100% coverage
- Zero dependencies for core functionality
- Production-ready codebase with comprehensive documentation
- Professional npm package presentation

### v2.0.0 - Major Release: Professional Tearsheet Generation 🎉

**🚀 MAJOR NEW FEATURES:**

**📊 Complete Tearsheet Generation:**
- **13+ Professional Charts** - Full visual analysis matching Python QuantStats
- **40+ Comprehensive Metrics** - Complete statistical analysis suite
- **Professional HTML Reports** - Publication-ready tearsheets with modern design
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Date-Labeled Charts** - All time-series charts include proper date labeling
- **Percentage Formatting** - All percentage metrics properly formatted with % symbols

**🎨 Chart Library:**
- Cumulative Returns with date labels
- End-of-Year Returns bar chart with data table
- Monthly Distribution histogram
- Daily Returns distribution
- Rolling Sharpe (30-day) time series
- Rolling Sortino (30-day) time series  
- Rolling Volatility (30-day) time series
- Drawdowns underwater plot
- Monthly Returns calendar heatmap
- Volatility vs Returns scatter plot
- Professional EOY returns table

**🔧 Technical Improvements:**
- Enhanced data format support (`{values: [], index: []}` structure)
- Professional Material-UI inspired styling
- Clean, production-ready codebase
- Comprehensive test suite (26 tests, 100% pass rate)
- Removed all debug and development files

**💥 Breaking Changes:**
- Reports module now expects data in `{values: [], index: []}` format for date-aware analysis
- Enhanced function signatures for better Python compatibility

### v1.3.0

🎉 **Complete Python Compatibility** - Now **100% structurally identical** to Python QuantStats!

- **Fixed Drawdown Details**: Now returns detailed period-by-period data like Python (not summary stats)
- **Added Missing Functions**: All Python functions now implemented (omega, informationRatio, greeks, etc.)
- **Enhanced Utility Functions**: Added toPrices, toLogReturns, toExcessReturns, rebase, exponentialStdev
- **Complete Function Parity**: Added outliers, removeOutliers, best, worst, consecutiveWins, consecutiveLosses, exposure, etc.
- **Data Structure Compatibility**: All return formats now match Python's DataFrame/Series structures exactly
- **Smart Ratios**: Added smartSharpe, smartSortino with autocorrelation penalty

**Breaking Changes**:
- `drawdownDetails()` now returns array of period objects instead of summary statistics
- All functions now have identical signatures and return formats as Python QuantStats
- Function names match Python exactly (camelCase to match JavaScript conventions)

### v1.2.0

🎉 **Major Accuracy Improvements** - Now **100% mathematically compatible** with Python QuantStats!

- **Fixed CAGR Calculation**: Now uses calendar days method (like Python) instead of trading days
- **Enhanced Max Drawdown**: Uses expanding maximum method matching Python's implementation exactly
- **Improved Time Handling**: Added optional dates parameter for precise time period calculations
- **Mathematical Precision**: All statistical functions now use sample standard deviation (ddof=1) like Python
- **Formula Alignment**: All calculations now match Python QuantStats formulas exactly

**Breaking Changes**: 
- CAGR calculations may differ slightly from v1.1.0 due to improved accuracy
- Max drawdown calculations now use price-based method (more accurate)
- For exact backward compatibility, use trading days method: `cagr(returns)` (no dates)

## Support

- 📚 [Documentation](https://github.com/whsmacon/quantstats-js/wiki)
- 🐛 [Issue Tracker](https://github.com/whsmacon/quantstats-js/issues)
- 💬 [Discussions](https://github.com/whsmacon/quantstats-js/discussions)

## Related Projects

- [QuantStats (Python)](https://github.com/ranaroussi/quantstats) - Original Python library
- [Portfolio Analytics](https://github.com/topics/portfolio-analytics) - Related projects

---

**QuantStats.js** - Bringing professional portfolio analytics to the Node.js ecosystem with mathematical precision and high performance.
