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
const tearsheet = qs.reports.basic(returnsData, null, 'My Portfolio');
console.log('Professional tearsheet generated:', tearsheet.length, 'bytes');

// Calculate key metrics
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
const tearsheet = qs.reports.basic(returns, null, 'My Portfolio Strategy');

// Save professional HTML report
fs.writeFileSync('tearsheet.html', tearsheet);
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
const tearsheet = qs.reports.basic(returnsData, benchmarkData?, title?);

// Just the metrics (no charts)
const metrics = qs.reports.metrics(returns);

// Generate comprehensive metrics object
const allMetrics = qs.reports.calculateComprehensiveMetrics(returnsData);
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
- `comparison()` - Portfolio vs benchmark comparison

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

// Optional: benchmark data (e.g., S&P 500)
const benchmarkReturns = [
  0.008, -0.003, 0.015, -0.008, 0.012, -0.005, 0.018, -0.009, 0.014, -0.002,
  0.010, -0.012, 0.006, 0.019, -0.006, 0.011, -0.009, 0.013, -0.003, 0.007
];

const benchmarkData = {
  values: benchmarkReturns,
  index: dates
};

// Generate professional tearsheet
const tearsheet = qs.reports.basic(
  returnsData,
  benchmarkData,
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
console.log(`CAGR: ${metrics['CAGR﹪']}`);
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
const metrics = qs.reports.metrics(returns);

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

### Benchmark Comparison

```javascript
// Compare portfolio to benchmark
const portfolioReturns = [/* your portfolio returns */];
const benchmarkReturns = [/* benchmark returns */];

const beta = qs.stats.beta(portfolioReturns, benchmarkReturns);
const alpha = qs.stats.alpha(portfolioReturns, benchmarkReturns);

console.log('vs Benchmark:', {
  beta: beta.toFixed(2),
  alpha: `${(alpha * 100).toFixed(2)}%`
});
```

### Generate HTML Report

```javascript
// Create comprehensive HTML report
const htmlReport = qs.reports.basic(
  returns,
  benchmarkReturns,
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
const tearsheet = qs.reports.basic(returnsData, null, 'My Strategy');
```

### For Basic Calculations

```javascript
// Simple array format (for basic metrics only)
const returns = [0.01, -0.005, 0.02, -0.01, 0.015];

// Calculate basic metrics
const metrics = qs.reports.metrics(returns);
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
- **Beta**: `covariance(returns, benchmark) / variance(benchmark)`

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
| `basic(returnsData, benchmarkData?, title?)` | **Generate complete tearsheet** | returns with dates, optional benchmark, title |
| `calculateComprehensiveMetrics(returnsData)` | **Calculate all 40+ metrics** | returns with dates object |
| `metrics(returns, benchmark?, rfRate?, nans?)` | Calculate basic metrics | returns array, benchmark, risk-free rate, include NaNs |

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
