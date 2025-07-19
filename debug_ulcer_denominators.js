import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== ULCER INDEX DEBUG ===');

const cleanReturns = utils.prepareReturns(returns, 0, false);
const drawdowns = utils.toDrawdownSeries(cleanReturns);

console.log(`Original returns length: ${returns.length}`);
console.log(`Clean returns length: ${cleanReturns.length}`);
console.log(`Drawdowns length: ${drawdowns.length}`);

// Manual calculation with different denominators
const squaredDrawdowns = drawdowns.map(dd => Math.pow(dd, 2));
const sumSquaredDrawdowns = squaredDrawdowns.reduce((sum, sq) => sum + sq, 0);

console.log(`Sum of squared drawdowns: ${sumSquaredDrawdowns}`);

// Test different denominators
const ulcer_n_minus_1 = Math.sqrt(sumSquaredDrawdowns / (cleanReturns.length - 1));
const ulcer_n = Math.sqrt(sumSquaredDrawdowns / cleanReturns.length);
const ulcer_returns_n_minus_1 = Math.sqrt(sumSquaredDrawdowns / (returns.length - 1));
const ulcer_returns_n = Math.sqrt(sumSquaredDrawdowns / returns.length);

console.log(`Ulcer with (cleanReturns.length - 1): ${ulcer_n_minus_1}`);
console.log(`Ulcer with cleanReturns.length: ${ulcer_n}`);
console.log(`Ulcer with (returns.length - 1): ${ulcer_returns_n_minus_1}`);
console.log(`Ulcer with returns.length: ${ulcer_returns_n}`);

console.log(`\nPython expected: 0.03`);
console.log(`Our function result: ${stats.ulcerIndex(returns)}`);

// Which one is closest to 0.03?
const target = 0.03;
console.log(`\nClosest to 0.03:`);
console.log(`ulcer_n_minus_1 diff: ${Math.abs(ulcer_n_minus_1 - target)}`);
console.log(`ulcer_n diff: ${Math.abs(ulcer_n - target)}`);
console.log(`ulcer_returns_n_minus_1 diff: ${Math.abs(ulcer_returns_n_minus_1 - target)}`);
console.log(`ulcer_returns_n diff: ${Math.abs(ulcer_returns_n - target)}`);

// Let's also check if there's rounding involved
console.log(`\nRounded values:`);
console.log(`ulcer_n_minus_1 rounded: ${Math.round(ulcer_n_minus_1 * 100) / 100}`);
console.log(`ulcer_n rounded: ${Math.round(ulcer_n * 100) / 100}`);
