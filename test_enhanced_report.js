import { basic } from './src/reports.js';
import { writeFileSync, readFileSync } from 'fs';

try {
  console.log('Starting enhanced MUI report test with real strategy data...');

  // Load real strategy data
  const rawData = JSON.parse(readFileSync('raw_data_comparison.json', 'utf8'));
  
  // Convert to the format expected by the reports function
  const mockReturns = {
    index: rawData.dates.map(dateStr => new Date(dateStr)),
    values: rawData.returns
  };

  console.log(`Using real strategy data: "${rawData.strategy_name}"`);
  console.log(`Date range: ${mockReturns.index[0].toDateString()} to ${mockReturns.index[mockReturns.index.length - 1].toDateString()}`);
  console.log(`Total data points: ${mockReturns.values.length}`);

  console.log('Generating enhanced MUI-style report...');
  const html = basic(mockReturns, null, rawData.strategy_name);
  console.log('Generated HTML length:', html.length);

  // Save to file
  writeFileSync('enhanced_mui_report.html', html);
  console.log('✅ Saved as enhanced_mui_report.html');
  
  // Show a preview of the content
  console.log('Preview (first 500 chars):');
  console.log(html.substring(0, 500));
  
} catch (error) {
  console.error('Error:', error);
}
