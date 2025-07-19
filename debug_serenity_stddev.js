import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== SERENITY STDDEV DEBUG ===');

// Test different standard deviation calculations
const n = returns.length;
console.log(`Returns length: ${n}`);

// Method 1: Our current method (sample std, ddof=1)
const mean1 = returns.reduce((sum, ret) => sum + ret, 0) / n;
const variance1 = returns.reduce((sum, ret) => sum + Math.pow(ret - mean1, 2), 0) / (n - 1);
const std1 = Math.sqrt(variance1);

// Method 2: Population std (ddof=0) 
const variance2 = returns.reduce((sum, ret) => sum + Math.pow(ret - mean1, 2), 0) / n;
const std2 = Math.sqrt(variance2);

// Method 3: Using our volatility function (might have different logic)
const std3 = stats.volatility(returns, false);

console.log(`\nStandard deviation methods:`);
console.log(`Method 1 (ddof=1): ${std1}`);
console.log(`Method 2 (ddof=0): ${std2}`);
console.log(`Method 3 (volatility): ${std3}`);

// Now let's test the full serenity calculation with each
const drawdowns = utils.toDrawdownSeries(returns);
const cvarDD = stats.cvar(drawdowns, 1, 0.95, false);
const ulcer = stats.ulcerIndex(returns, false);
const returnsSum = returns.reduce((sum, ret) => sum + ret, 0);

console.log(`\nShared components:`);
console.log(`CVaR: ${cvarDD}`);
console.log(`Ulcer: ${ulcer}`);
console.log(`Returns sum: ${returnsSum}`);

// Test serenity with each std method
function testSerenity(std, method) {
  const pitfall = -cvarDD / std;
  const serenity = returnsSum / (ulcer * pitfall);
  console.log(`\nSerenity with ${method}:`);
  console.log(`  Pitfall: ${pitfall}`);
  console.log(`  Serenity: ${serenity}`);
  console.log(`  Error vs Python: ${((serenity - 66.34) / 66.34 * 100).toFixed(2)}%`);
  return serenity;
}

testSerenity(std1, "ddof=1");
testSerenity(std2, "ddof=0");
testSerenity(std3, "volatility");

// Let's also check what our current function returns
const currentSerenity = stats.serenityIndex(returns, 0, false);
console.log(`\nCurrent function result: ${currentSerenity}`);
console.log(`Python expected: 66.340000`);

// Maybe try without any risk-free rate adjustment
console.log(`\n=== Testing risk-free rate impact ===`);
const testPitfall = -cvarDD / std1;
const testSerenityNoRf = returnsSum / (ulcer * testPitfall);
const testSerenityWithRf = (returnsSum - 0) / (ulcer * testPitfall);
console.log(`Without RF subtraction: ${testSerenityNoRf}`);
console.log(`With RF subtraction (0): ${testSerenityWithRf}`);
console.log(`Are they equal? ${testSerenityNoRf === testSerenityWithRf}`);
