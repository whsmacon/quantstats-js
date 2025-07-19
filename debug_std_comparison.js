import { readFileSync } from 'fs';

// Let's create a simple test with known returns to understand the std calculation difference
function testPythonVsJSStd() {
    console.log('=== Testing Standard Deviation Calculation Methods ===\n');
    
    // Test with simple known values
    const testReturns = [0.01, -0.02, 0.03, -0.01, 0.02, -0.015, 0.025, -0.005];
    console.log(`Test returns: [${testReturns.join(', ')}]`);
    console.log(`Length: ${testReturns.length}\n`);
    
    // Calculate mean
    const mean = testReturns.reduce((sum, ret) => sum + ret, 0) / testReturns.length;
    console.log(`Mean: ${mean}`);
    
    // Method 1: Sample standard deviation (N-1 denominator) - JavaScript default
    const sampleVariance = testReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (testReturns.length - 1);
    const sampleStd = Math.sqrt(sampleVariance);
    console.log(`Sample std (N-1): ${sampleStd}`);
    
    // Method 2: Population standard deviation (N denominator)
    const popVariance = testReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / testReturns.length;
    const popStd = Math.sqrt(popVariance);
    console.log(`Population std (N): ${popStd}`);
    
    // Method 3: What Python pandas typically uses (ddof=1, same as sample)
    // But let's also test ddof=0
    console.log(`\nPython pandas equivalents:`);
    console.log(`pandas.std(ddof=1) equivalent: ${sampleStd}`);
    console.log(`pandas.std(ddof=0) equivalent: ${popStd}`);
    
    // Calculate ratio
    const ratio = sampleStd / popStd;
    console.log(`\nRatio (sample/pop): ${ratio}`);
    console.log(`Square root of (N/(N-1)): ${Math.sqrt(testReturns.length / (testReturns.length - 1))}`);
    
    // Let's also test what happens with different sizes
    console.log(`\n=== Testing with different dataset sizes ===`);
    [10, 50, 100, 500, 1000].forEach(n => {
        // Generate some test data
        const data = Array.from({length: n}, (_, i) => Math.sin(i * 0.1) * 0.02);
        const dataMean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const sampleVar = data.reduce((sum, val) => sum + Math.pow(val - dataMean, 2), 0) / (data.length - 1);
        const popVar = data.reduce((sum, val) => sum + Math.pow(val - dataMean, 2), 0) / data.length;
        const sampleStdVal = Math.sqrt(sampleVar);
        const popStdVal = Math.sqrt(popVar);
        const ratioVal = sampleStdVal / popStdVal;
        const theoreticalRatio = Math.sqrt(n / (n - 1));
        
        console.log(`N=${n}: Sample/Pop ratio = ${ratioVal.toFixed(6)}, Theoretical = ${theoreticalRatio.toFixed(6)}`);
    });
}

// Also test with actual data from our files
function testWithRealData() {
    console.log(`\n=== Testing with Real Data ===`);
    
    try {
        // Try to load some returns data
        const testData = readFileSync('./complete_65_metric_test.js', 'utf8');
        
        // Let's manually create some returns data similar to what we use
        const returns = [];
        for (let i = 0; i < 252; i++) { // One year of trading days
            returns.push((Math.random() - 0.5) * 0.04); // Random returns between -2% and 2%
        }
        
        console.log(`Generated ${returns.length} returns for testing`);
        
        const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const sampleVar = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
        const popVar = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
        const sampleStd = Math.sqrt(sampleVar);
        const popStd = Math.sqrt(popVar);
        
        console.log(`Mean: ${mean.toFixed(6)}`);
        console.log(`Sample std: ${sampleStd.toFixed(6)}`);  
        console.log(`Population std: ${popStd.toFixed(6)}`);
        console.log(`Ratio: ${(sampleStd/popStd).toFixed(6)}`);
        console.log(`Theoretical ratio: ${Math.sqrt(returns.length/(returns.length-1)).toFixed(6)}`);
        
        // The key insight: if Python is using ddof=0 (population std) while we use ddof=1 (sample std),
        // then we need to convert: sampleStd * sqrt((N-1)/N) = popStd
        const convertedStd = sampleStd * Math.sqrt((returns.length - 1) / returns.length);
        console.log(`Converted to population std: ${convertedStd.toFixed(6)}`);
        console.log(`Difference from pop std: ${(convertedStd - popStd).toFixed(8)}`);
        
    } catch (error) {
        console.log(`Error loading real data: ${error.message}`);
    }
}

testPythonVsJSStd();
testWithRealData();
