import { readFileSync } from 'fs';
import {
  cvar,
  ulcerIndex,
  serenityIndex
} from './src/stats.js';
import { toDrawdownSeries } from './src/utils.js';

// Let's test what happens if we change the serenity index to use population std (ddof=0 equivalent)
function testSerenityWithPopStd() {
    console.log('=== Testing Serenity Index with Population Standard Deviation ===\n');
    
    // Create test data - let's use a simple pattern
    const returns = [];
    for (let i = 0; i < 252; i++) {
        // Create some realistic return pattern
        returns.push(0.001 * Math.sin(i * 0.1) + 0.0005 * (Math.random() - 0.5));
    }
    
    console.log(`Testing with ${returns.length} synthetic returns`);
    
    // Test our current serenity function
    const currentSerenity = serenityIndex(returns, 0, false);
    console.log(`Current serenity result: ${currentSerenity}`);
    
    // Now manually calculate with population std
    const drawdowns = toDrawdownSeries(returns);
    const cvarDD = cvar(drawdowns, 1, 0.95, false);
    
    // Calculate population standard deviation (ddof=0 equivalent)
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const popVariance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length; // N denominator
    const popStd = Math.sqrt(popVariance);
    
    // Calculate sample standard deviation (ddof=1 equivalent) 
    const sampleVariance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1); // N-1 denominator
    const sampleStd = Math.sqrt(sampleVariance);
    
    console.log(`\nStandard deviation comparison:`);
    console.log(`Sample std (N-1): ${sampleStd}`);
    console.log(`Population std (N): ${popStd}`);
    console.log(`Ratio: ${sampleStd / popStd}`);
    
    const pitfallSample = -cvarDD / sampleStd;
    const pitfallPop = -cvarDD / popStd;
    
    console.log(`\nPitfall comparison:`);
    console.log(`Pitfall with sample std: ${pitfallSample}`);
    console.log(`Pitfall with population std: ${pitfallPop}`);
    
    const ulcer = ulcerIndex(returns, false);
    const returnsSum = returns.reduce((sum, ret) => sum + ret, 0);
    
    const serenitySample = returnsSum / (ulcer * pitfallSample);
    const serenityPop = returnsSum / (ulcer * pitfallPop);
    
    console.log(`\nSerenity comparison:`);
    console.log(`Serenity with sample std: ${serenitySample}`);
    console.log(`Serenity with population std: ${serenityPop}`);
    console.log(`Our function result: ${currentSerenity}`);
    
    console.log(`\nDifference between sample and pop serenity: ${Math.abs(serenitySample - serenityPop)}`);
    console.log(`Ratio (sample/pop): ${serenitySample / serenityPop}`);
}

// Modified serenity function using population std
function serenityIndexWithPopStd(returns, rfRate = 0, nans = false) {
    const drawdowns = toDrawdownSeries(returns);
    const cvarDD = cvar(drawdowns, 1, 0.95, nans);
    
    // Use population standard deviation (ddof=0 equivalent)
    const returnsMean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const popVariance = returns.reduce((sum, ret) => sum + Math.pow(ret - returnsMean, 2), 0) / returns.length; // N denominator
    const returnsStd = Math.sqrt(popVariance);
    
    const pitfall = -cvarDD / returnsStd;
    const ulcer = ulcerIndex(returns, nans);
    const returnsSum = returns.reduce((sum, ret) => sum + ret, 0);
    
    if (ulcer === 0 || pitfall === 0) {
        return 0;
    }
    
    return (returnsSum - rfRate) / (ulcer * pitfall);
}

console.log('\n=== Testing Modified Function ===');
// Test with the same data
const testReturns = [];
for (let i = 0; i < 252; i++) {
    testReturns.push(0.001 * Math.sin(i * 0.1) + 0.0005 * (Math.random() - 0.5));
}

const originalResult = serenityIndex(testReturns, 0, false);
const modifiedResult = serenityIndexWithPopStd(testReturns, 0, false);

console.log(`Original serenity (sample std): ${originalResult}`);
console.log(`Modified serenity (pop std): ${modifiedResult}`);
console.log(`Ratio: ${originalResult / modifiedResult}`);

testSerenityWithPopStd();
