import { readFileSync } from 'fs';
import {
  cvar,
  ulcerIndex,
  serenityIndex
} from './src/stats.js';
import { toDrawdownSeries } from './src/utils.js';

// Test standard deviation calculation methods
function testStdDevMethods() {
    // Load Python results to get the exact returns Python used
    const pythonResults = JSON.parse(readFileSync('./python_quantstats_results.json', 'utf8'));
    
    // Use a subset of returns to analyze
    const returns = pythonResults.returns.slice(0, 100);
    console.log(`Testing with ${returns.length} returns`);
    
    // Method 1: N-1 denominator (sample standard deviation)
    const mean1 = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance1 = returns.reduce((sum, ret) => sum + Math.pow(ret - mean1, 2), 0) / (returns.length - 1);
    const std1 = Math.sqrt(variance1);
    
    // Method 2: N denominator (population standard deviation)  
    const variance2 = returns.reduce((sum, ret) => sum + Math.pow(ret - mean1, 2), 0) / returns.length;
    const std2 = Math.sqrt(variance2);
    
    // Method 3: Using built-in method from our utils
    // Let's manually calculate what Python pandas would do
    
    console.log(`\nStandard Deviation Analysis:`);
    console.log(`Sample std (N-1): ${std1}`);
    console.log(`Population std (N): ${std2}`);
    console.log(`Ratio (sample/pop): ${std1 / std2}`);
    
    // Test the actual serenity components
    console.log(`\n=== Serenity Components Analysis ===`);
    
    const drawdowns = toDrawdownSeries(returns);
    console.log(`Drawdowns length: ${drawdowns.length}`);
    console.log(`First 5 drawdowns: ${drawdowns.slice(0, 5).join(', ')}`);
    
    const cvarDD = cvar(drawdowns, 1, 0.95, false);
    console.log(`CVaR of drawdowns: ${cvarDD}`);
    
    const pitfall1 = -cvarDD / std1;  // Using sample std
    const pitfall2 = -cvarDD / std2;  // Using population std
    
    console.log(`Pitfall with sample std: ${pitfall1}`);
    console.log(`Pitfall with population std: ${pitfall2}`);
    
    const ulcer = ulcerIndex(returns, false);
    console.log(`Ulcer Index: ${ulcer}`);
    
    const returnsSum = returns.reduce((sum, ret) => sum + ret, 0);
    console.log(`Returns sum: ${returnsSum}`);
    
    const serenity1 = returnsSum / (ulcer * pitfall1);
    const serenity2 = returnsSum / (ulcer * pitfall2);
    
    console.log(`\nSerenity with sample std: ${serenity1}`);
    console.log(`Serenity with population std: ${serenity2}`);
    
    // Test our current function
    const ourSerenity = serenityIndex(returns, 0, false);
    console.log(`Our current serenity function: ${ourSerenity}`);
    
    // Now test with different subset sizes to see if ratio is consistent
    console.log(`\n=== Testing Different Subset Sizes ===`);
    [50, 100, 200, 300].forEach(size => {
        if (size <= pythonResults.returns.length) {
            const subset = pythonResults.returns.slice(0, size);
            const subMean = subset.reduce((sum, ret) => sum + ret, 0) / subset.length;
            const subVar1 = subset.reduce((sum, ret) => sum + Math.pow(ret - subMean, 2), 0) / (subset.length - 1);
            const subVar2 = subset.reduce((sum, ret) => sum + Math.pow(ret - subMean, 2), 0) / subset.length;
            const subStd1 = Math.sqrt(subVar1);
            const subStd2 = Math.sqrt(subVar2);
            
            console.log(`Size ${size}: Sample std = ${subStd1.toFixed(8)}, Pop std = ${subStd2.toFixed(8)}, Ratio = ${(subStd1/subStd2).toFixed(8)}`);
        }
    });
}

testStdDevMethods();
