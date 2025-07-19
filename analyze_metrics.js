import fs from 'fs';

// Load Python results to see all available metrics
let pythonContent = fs.readFileSync('python_quantstats_results.json', 'utf8');
pythonContent = pythonContent.replace(/NaN/g, 'null');
const pythonResults = JSON.parse(pythonContent);
const pythonMetrics = pythonResults[0].metrics;

console.log('=== ALL PYTHON METRICS ===');
console.log('Total metrics found:', Object.keys(pythonMetrics).length);
console.log('\nMetrics list:');

Object.keys(pythonMetrics).forEach((key, index) => {
  const value = pythonMetrics[key];
  if (value !== null && value !== '' && value !== undefined) {
    console.log(`${(index + 1).toString().padStart(2)}. "${key}": ${value}`);
  }
});

console.log('\n=== METRICS THAT NEED IMPLEMENTATION OR FIXING ===');
const problemMetrics = [
  'Prob. Sharpe Ratio',
  'Avg. Drawdown', 
  'Longest DD Days',
  'Avg. Drawdown Days',
  'Ulcer Index',
  'Serenity Index',
  'Expected Daily',
  'Expected Monthly', 
  'Gain/Pain (1M)',
  'MTD',
  'YTD',
  '1Y',
  'Best Month',
  'Best Year',
  'Worst Year',
  'Avg. Up Month',
  'Avg. Down Month'
];

problemMetrics.forEach(metric => {
  if (pythonMetrics[metric]) {
    console.log(`❌ ${metric}: Python=${pythonMetrics[metric]}`);
  }
});
