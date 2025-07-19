import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';

// Load data  
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== TESTING DIFFERENT STD APPROACHES ===');

// Maybe the issue is that Python somehow treats the returns differently
console.log(`Returns length: ${returns.length}`);
console.log(`First few returns: ${returns.slice(0, 5).join(', ')}`);

// Let's try different ways to calculate std
const n = returns.length;
const mean = returns.reduce((sum, ret) => sum + ret, 0) / n;

// Method 1: Our current (sample std)
const var1 = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (n - 1);
const std1 = Math.sqrt(var1);

// Method 2: Maybe Python uses n instead of n-1?
const var2 = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / n;
const std2 = Math.sqrt(var2);

// Method 3: Maybe there's a different scaling?
const std3 = std1 * Math.sqrt(252); // Annualized
const std4 = std1 * Math.sqrt(n/(n-1)); // Bessel correction scaling

// Method 5: Let's try the exact value we need
const requiredStd = 0.054813840892766905;

console.log(`\nStandard deviation tests:`);
console.log(`Method 1 (n-1): ${std1}`);
console.log(`Method 2 (n): ${std2}`);
console.log(`Method 3 (annualized): ${std3}`);
console.log(`Method 4 (Bessel scaling): ${std4}`);
console.log(`Required std: ${requiredStd}`);

// Now let's see what happens if we modify our serenity function to use the required std
const drawdowns = utils.toDrawdownSeries(returns);
const cvarDD = stats.cvar(drawdowns, 1, 0.95, false);
const ulcer = stats.ulcerIndex(returns, false);
const returnsSum = returns.reduce((sum, ret) => sum + ret, 0);

function testSerenityWithStd(std, label) {
  const pitfall = -cvarDD / std;
  const serenity = returnsSum / (ulcer * pitfall);
  const error = ((serenity - 66.34) / 66.34 * 100);
  console.log(`${label}: ${serenity.toFixed(6)} (error: ${error.toFixed(2)}%)`);
  return serenity;
}

console.log(`\nSerenity results:`);
testSerenityWithStd(std1, "Method 1 (n-1)");
testSerenityWithStd(std2, "Method 2 (n)  ");
testSerenityWithStd(std3, "Method 3 (ann)");
testSerenityWithStd(std4, "Method 4 (Bes)");
testSerenityWithStd(requiredStd, "Required     ");

// Let's also check if there's something different about how Python handles the returns array
console.log(`\n=== RETURNS ANALYSIS ===`);
console.log(`Mean: ${mean}`);
console.log(`Min: ${Math.min(...returns)}`);
console.log(`Max: ${Math.max(...returns)}`);
console.log(`Has NaN: ${returns.some(r => isNaN(r))}`);
console.log(`Has Infinity: ${returns.some(r => !isFinite(r))}`);

// Let me try to get closer to the required std by testing scaling factors
const targetStd = requiredStd;
const currentStd = std1;
const scalingFactor = targetStd / currentStd;
console.log(`\nScaling factor needed: ${scalingFactor}`);
console.log(`Is it sqrt(252)? ${Math.abs(scalingFactor - Math.sqrt(252)) < 0.01}`);
console.log(`Is it sqrt(365)? ${Math.abs(scalingFactor - Math.sqrt(365)) < 0.01}`);
console.log(`Is it sqrt(n)? ${Math.abs(scalingFactor - Math.sqrt(n)) < 0.01}`);

// Maybe it's related to trading days per year?
const factor252 = Math.sqrt(252);
const factor365 = Math.sqrt(365);
const factorN = Math.sqrt(n);
console.log(`sqrt(252) = ${factor252}`);
console.log(`sqrt(365) = ${factor365}`);
console.log(`sqrt(n) = ${factorN}`);
console.log(`Actual scaling = ${scalingFactor}`);
