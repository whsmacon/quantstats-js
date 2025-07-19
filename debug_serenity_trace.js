import { readFileSync } from 'fs';
import { cvar, ulcerIndex, serenityIndex } from './src/stats.js';
import { toDrawdownSeries } from './src/utils.js';

function debugSerenityStepByStep() {
    console.log('=== Step by Step Serenity Debug ===\n');
    
    // Let's use simple test data first
    const testReturns = [0.01, -0.02, 0.015, -0.008, 0.02, -0.01, 0.005, 0.012, -0.015, 0.008];
    console.log(`Test returns: [${testReturns.map(r => r.toFixed(4)).join(', ')}]`);
    console.log(`Length: ${testReturns.length}\n`);
    
    // Step 1: Get drawdown series
    const dd = toDrawdownSeries(testReturns);
    console.log(`Drawdown series: [${dd.slice(0, 5).map(d => d.toFixed(6)).join(', ')}...]`);
    console.log(`Drawdown length: ${dd.length}\n`);
    
    // Step 2: Calculate CVaR of drawdowns
    const cvarDD = cvar(dd, 1, 0.95, false);
    console.log(`CVaR of drawdowns: ${cvarDD}\n`);
    
    // Step 3: Calculate returns.std() - try both methods
    const mean = testReturns.reduce((sum, ret) => sum + ret, 0) / testReturns.length;
    console.log(`Returns mean: ${mean}`);
    
    // Sample std (ddof=1, pandas default)
    const sampleVar = testReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (testReturns.length - 1);
    const sampleStd = Math.sqrt(sampleVar);
    console.log(`Sample std (N-1): ${sampleStd}`);
    
    // Population std (ddof=0)
    const popVar = testReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / testReturns.length;
    const popStd = Math.sqrt(popVar);
    console.log(`Population std (N): ${popStd}\n`);
    
    // Step 4: Calculate pitfall with both methods
    const pitfallSample = -cvarDD / sampleStd;
    const pitfallPop = -cvarDD / popStd;
    console.log(`Pitfall (sample std): ${pitfallSample}`);
    console.log(`Pitfall (pop std): ${pitfallPop}\n`);
    
    // Step 5: Calculate ulcer index
    const ulcer = ulcerIndex(testReturns, false);
    console.log(`Ulcer index: ${ulcer}\n`);
    
    // Step 6: Calculate returns.sum()
    const returnsSum = testReturns.reduce((sum, ret) => sum + ret, 0);
    console.log(`Returns sum: ${returnsSum}\n`);
    
    // Step 7: Final serenity calculation
    const serenitySample = returnsSum / (ulcer * pitfallSample);
    const serenityPop = returnsSum / (ulcer * pitfallPop);
    
    console.log(`Serenity (sample std): ${serenitySample}`);
    console.log(`Serenity (pop std): ${serenityPop}`);
    
    // Test our function
    const ourResult = serenityIndex(testReturns, 0, false);
    console.log(`Our function result: ${ourResult}`);
    
    console.log(`\n=== Analysis ===`);
    console.log(`Difference (sample - our): ${Math.abs(serenitySample - ourResult)}`);
    console.log(`Difference (pop - our): ${Math.abs(serenityPop - ourResult)}`);
    
    // Let's also verify individual components step by step
    console.log(`\n=== Component Verification ===`);
    
    // Verify drawdown series calculation 
    console.log(`First few drawdowns: ${dd.slice(0, 3).map(d => d.toFixed(8)).join(', ')}`);
    
    // Manual drawdown calculation for verification
    let peak = testReturns[0];
    let running = testReturns[0];
    const manualDD = [0]; // First drawdown is always 0
    
    for (let i = 1; i < testReturns.length; i++) {
        running = (1 + running) * (1 + testReturns[i]) - 1;
        peak = Math.max(peak, running);
        const dd_val = (running - peak) / (1 + peak);
        manualDD.push(dd_val);
    }
    
    console.log(`Manual first few drawdowns: ${manualDD.slice(0, 3).map(d => d.toFixed(8)).join(', ')}`);
    console.log(`Drawdown series match: ${Math.abs(dd[2] - manualDD[2]) < 1e-10}`);
}

debugSerenityStepByStep();
