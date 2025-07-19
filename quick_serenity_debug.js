import fs from 'fs';
import * as stats from './src/stats.js';

// Load data
const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
const returns = rawData.returns;

console.log('=== QUICK SERENITY DEBUG ===');

// Our serenity calculation
const serenityJS = stats.serenityIndex(returns, 0, false);
console.log(`JavaScript Serenity: ${serenityJS}`);
console.log(`Python Expected: 66.340000`);
console.log(`Difference: ${serenityJS - 66.340000}`);
console.log(`Error: ${((serenityJS - 66.340000) / 66.340000 * 100).toFixed(2)}%`);

// Check individual components that might be different
console.log('\n=== COMPONENT CHECK ===');
const ulcer = stats.ulcerIndex(returns);
console.log(`Ulcer Index: ${ulcer} (expected: ~0.030000)`);

const drawdowns = returns; // temporary, will fix
// Let's just run the test to see current results
