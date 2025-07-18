# QuantStats.js

[![npm version](https://badge.fury.io/js/quantstats-js.svg)](https://badge.fury.io/js/quantstats-js)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**Portfolio analytics for quantitative trading in Node.js**

QuantStats.js is a comprehensive Node.js library for portfolio performance analysis, providing mathematically accurate implementations of key financial metrics. This library is a faithful port of the popular Python QuantStats library, ensuring identical calculations and results.

## Features

- **Mathematically Accurate**: All calculations match the Python QuantStats library exactly
- **High Performance**: Optimized for speed with efficient algorithms
- **Comprehensive Metrics**: Over 40 financial metrics and ratios
- **Risk Analysis**: VaR, CVaR, drawdown analysis, and risk-adjusted returns
- **Visualization Ready**: Generate plot data for charts and dashboards
- **HTML Reports**: Create professional portfolio analysis reports
- **TypeScript Ready**: Full TypeScript support with type definitions
- **Zero Dependencies**: Core functionality uses only native JavaScript

## Installation

```bash
npm install quantstats-js
```

## Quick Start

```javascript
import * as qs from 'quantstats-js';

// Sample daily returns
const returns = [0.01, -0.005, 0.02, -0.01, 0.015, -0.008, 0.025];

// Calculate key metrics
const totalReturn = qs.stats.totalReturn(returns);
const sharpe = qs.stats.sharpe(returns);
const maxDrawdown = qs.stats.maxDrawdown(returns);

console.log(`Total Return: ${(totalReturn * 100).toFixed(2)}%`);
console.log(`Sharpe Ratio: ${sharpe.toFixed(2)}`);
console.log(`Max Drawdown: ${(maxDrawdown * 100).toFixed(2)}%`);
```

## Core Modules

### Stats Module
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

## Usage Examples

### Basic Portfolio Analysis

```javascript
import * as qs from 'quantstats-js';

// Convert prices to returns
const prices = [100, 102, 101, 105, 103, 108, 106, 112];
const returns = qs.utils.toReturns(prices);

// Calculate comprehensive metrics
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

## Mathematical Accuracy

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

## API Reference

### Stats Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `cagr(returns, rfRate?, nans?)` | Compound Annual Growth Rate | returns, risk-free rate, include NaNs |
| `sharpe(returns, rfRate?, nans?)` | Sharpe Ratio | returns, risk-free rate, include NaNs |
| `sortino(returns, rfRate?, nans?)` | Sortino Ratio | returns, risk-free rate, include NaNs |
| `volatility(returns, nans?)` | Annualized Volatility | returns, include NaNs |
| `maxDrawdown(returns, nans?)` | Maximum Drawdown | returns, include NaNs |
| `valueAtRisk(returns, confidence?, nans?)` | Value at Risk | returns, confidence level, include NaNs |
| `beta(returns, benchmark, nans?)` | Beta Coefficient | returns, benchmark, include NaNs |
| `alpha(returns, benchmark, rfRate?, nans?)` | Alpha Coefficient | returns, benchmark, risk-free rate, include NaNs |

### Utils Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `toReturns(prices, compound?)` | Convert prices to returns | prices array, compound returns |
| `prepareReturns(data, rfRate?, nans?)` | Prepare returns data | data, risk-free rate, include NaNs |
| `toDrawdownSeries(returns)` | Calculate drawdown series | returns array |
| `portfolioValue(returns, initial?)` | Calculate portfolio value | returns, initial value |
| `aggregateReturns(returns, period?)` | Aggregate by period | returns, period (monthly/yearly) |

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

## Changelog

### v1.0.0
- Initial release
- Complete port of Python QuantStats library
- All core statistical functions implemented
- HTML report generation
- Comprehensive test suite
- Performance optimizations

## Support

- 📚 [Documentation](https://github.com/whsmacon/quantstats-js/wiki)
- 🐛 [Issue Tracker](https://github.com/whsmacon/quantstats-js/issues)
- 💬 [Discussions](https://github.com/whsmacon/quantstats-js/discussions)

## Related Projects

- [QuantStats (Python)](https://github.com/ranaroussi/quantstats) - Original Python library
- [Portfolio Analytics](https://github.com/topics/portfolio-analytics) - Related projects

---

**QuantStats.js** - Bringing professional portfolio analytics to the Node.js ecosystem with mathematical precision and high performance.
