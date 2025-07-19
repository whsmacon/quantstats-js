import fs from 'fs';
import * as stats from './src/stats.js';
import * as utils from './src/utils.js';

// Load data  
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== REVERSE ENGINEERING PYTHON SERENITY ===');

// Known values
const drawdowns = utils.toDrawdownSeries(returns);
const cvarDD = stats.cvar(drawdowns, 1, 0.95, false);
const ulcer = stats.ulcerIndex(returns, false);
const returnsSum = returns.reduce((sum, ret) => sum + ret, 0);
const pythonSerenity = 66.340000;

console.log(`Known components:`);
console.log(`CVaR: ${cvarDD}`);
console.log(`Ulcer: ${ulcer}`);
console.log(`Returns sum: ${returnsSum}`);
console.log(`Python serenity target: ${pythonSerenity}`);

// Python formula: (returns.sum() - rf) / (ulcer_index(returns) * pitfall)
// Where: pitfall = -cvar(dd) / returns.std()
// So: serenity = returnsSum / (ulcer * (-cvarDD / std))
// Rearranging: std = -cvarDD / (pitfall)
// And: pitfall = returnsSum / (ulcer * serenity)

const requiredPitfall = returnsSum / (ulcer * pythonSerenity);
const requiredStd = -cvarDD / requiredPitfall;

console.log(`\nReverse calculation:`);
console.log(`Required pitfall: ${requiredPitfall}`);
console.log(`Required std: ${requiredStd}`);

// Our actual std
const actualMean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
const actualVariance = returns.reduce((sum, ret) => sum + Math.pow(ret - actualMean, 2), 0) / (returns.length - 1);
const actualStd = Math.sqrt(actualVariance);

console.log(`\nOur std: ${actualStd}`);
console.log(`Required std: ${requiredStd}`);
console.log(`Ratio: ${requiredStd / actualStd}`);

// Maybe Python uses a different mean calculation?
console.log(`\n=== Testing different mean calculations ===`);
const mean1 = returns.reduce((sum, ret) => sum + ret, 0) / returns.length; // arithmetic mean
const mean2 = 0; // zero mean

console.log(`Arithmetic mean: ${mean1}`);
console.log(`Zero mean: ${mean2}`);

// Test std with zero mean
const varianceZeroMean = returns.reduce((sum, ret) => sum + Math.pow(ret - 0, 2), 0) / (returns.length - 1);
const stdZeroMean = Math.sqrt(varianceZeroMean);
console.log(`Std with zero mean: ${stdZeroMean}`);

// Test serenity with zero mean std
const pitfallZeroMean = -cvarDD / stdZeroMean;
const serenityZeroMean = returnsSum / (ulcer * pitfallZeroMean);
console.log(`\nSerenity with zero mean std: ${serenityZeroMean}`);
console.log(`Error: ${((serenityZeroMean - 66.34) / 66.34 * 100).toFixed(2)}%`);

// Let's also try the exact required std
const pitfallRequired = -cvarDD / requiredStd;
const serenityRequired = returnsSum / (ulcer * pitfallRequired);
console.log(`\nSerenity with required std: ${serenityRequired}`);
console.log(`Should be exactly 66.34: ${Math.abs(serenityRequired - 66.34) < 0.001}`);
