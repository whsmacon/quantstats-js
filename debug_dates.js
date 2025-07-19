// Debug what dates are actually being used
import { basic } from './src/reports.js';
import fs from 'fs';

// Load the actual sample data
const rawData = JSON.parse(fs.readFileSync('./raw_data_comparison.json', 'utf8'));
const returns = rawData.returns.map(r => parseFloat(r));
const dates = rawData.dates.map(d => new Date(d));

const returnsData = {
  values: returns,
  index: dates
};

console.log('Input data check:');
console.log('First date:', dates[0].toISOString().split('T')[0]);
console.log('Last date:', dates[dates.length - 1].toISOString().split('T')[0]);

try {
  const htmlContent = basic(returnsData, null, 'Debug Test');
  
  // Extract the dates from the HTML
  const startMatch = htmlContent.match(/<tr><td>Start Period<\/td><td>([^<]+)<\/td><\/tr>/);
  const endMatch = htmlContent.match(/<tr><td>End Period<\/td><td>([^<]+)<\/td><\/tr>/);
  
  console.log('Dates found in HTML:');
  console.log('Start Period in HTML:', startMatch ? startMatch[1] : 'NOT FOUND');
  console.log('End Period in HTML:', endMatch ? endMatch[1] : 'NOT FOUND');
  
} catch (error) {
  console.error('Error:', error.message);
}
