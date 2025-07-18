/**
 * QuantStats.js - Portfolio analytics for quantitative trading
 * Node.js implementation of the popular Python QuantStats library
 */

import * as stats from './src/stats.js';
import * as utils from './src/utils.js';
import * as plots from './src/plots.js';
import * as reports from './src/reports.js';

// Export all modules
export { stats, utils, plots, reports };

// Also export commonly used functions at the top level for convenience
export {
  // Stats functions
  cagr,
  sharpe,
  sortino,
  calmar,
  volatility,
  maxDrawdown,
  drawdown,
  winRate,
  avgWin,
  avgLoss,
  profitFactor,
  expectedReturn,
  valueAtRisk,
  cvar,
  skew,
  kurtosis,
  kelly,
  totalReturn,
  compoundReturn,
  ulcerIndex,
  ulcerPerformanceIndex,
  beta,
  alpha,
  downsideDeviation,
  monthlyReturns,
  yearlyReturns
} from './src/stats.js';

export {
  // Utils functions
  prepareReturns,
  toReturns,
  groupReturns,
  aggregateReturns,
  makeDivisible,
  toDuration,
  toDrawdownSeries,
  toDrawdownsTable,
  drawdownDetails,
  makePosNeg,
  makePercentage,
  fillZeros,
  resample,
  isBusinessDay,
  portfolioValue,
  TRADING_DAYS_PER_YEAR,
  TRADING_DAYS_PER_MONTH,
  MONTHS_PER_YEAR
} from './src/utils.js';

export default {
  stats,
  utils,
  plots,
  reports
};
