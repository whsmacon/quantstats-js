import fs from 'fs';
import * as stats from './src/stats.js';
import { prepareReturns, toDrawdownSeries } from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== TIMEZONE INVESTIGATION ===');

// Test if the issue could be in data loading or processing
console.log('First 5 returns from raw data:', returns.slice(0, 5));

// Test drawdown calculation with raw vs prepared data
const drawdownsRaw = toDrawdownSeries(returns);
const preparedReturns = prepareReturns(returns, 0, false);
const drawdownsPrepared = toDrawdownSeries(preparedReturns);

console.log('Drawdowns count (raw):', drawdownsRaw.length);
console.log('Drawdowns count (prepared):', drawdownsPrepared.length);
console.log('First 5 drawdowns (raw):', drawdownsRaw.slice(0, 5));
console.log('First 5 drawdowns (prepared):', drawdownsPrepared.slice(0, 5));
console.log('Drawdowns match:', JSON.stringify(drawdownsRaw) === JSON.stringify(drawdownsPrepared));

// Calculate serenity with both approaches
const serenityRaw = stats.serenityIndex(returns, 0, false);
const serenityPrepared = stats.serenityIndex(preparedReturns, 0, false);

console.log('Serenity (raw data):', serenityRaw);
console.log('Serenity (prepared data):', serenityPrepared);
console.log('Serenity match:', Math.abs(serenityRaw - serenityPrepared) < 1e-10);

// Also check if there are any dates involved
if (rawData.dates) {
  console.log('First 5 dates:', rawData.dates.slice(0, 5));
  console.log('Last 5 dates:', rawData.dates.slice(-5));
  
  // Check if dates are being used anywhere in serenity calculation
  // by passing dates and seeing if it changes the result
  const datesArray = rawData.dates.map(d => new Date(d));
  // Our serenity function doesn't take dates, so this should be the same
  console.log('Serenity index function only uses returns, no date dependency');
}
