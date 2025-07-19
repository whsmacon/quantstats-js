// Test HTML generation using real sample data from raw_data_comparison.json
import { basic, html } from './src/reports.js';
import fs from 'fs';

// Load the actual sample data
const rawData = JSON.parse(fs.readFileSync('./raw_data_comparison.json', 'utf8'));

// Extract returns and dates from the sample data (they're at root level)
const returns = rawData.returns.map(r => parseFloat(r));
const dates = rawData.dates.map(d => new Date(d));

// Create proper returns object with full dataset
const returnsData = {
  values: returns,
  index: dates
};

console.log('🧪 Testing HTML generation with real sample data...');
console.log(`📊 Data range: ${dates[0].toISOString().split('T')[0]} to ${dates[dates.length - 1].toISOString().split('T')[0]}`);
console.log(`📈 Total returns: ${returns.length} data points`);

try {
  // Test basic function with real data
  const htmlContent = basic(returnsData, null, 'Real Sample Data Strategy');
  
  console.log('✅ basic() function executed successfully');
  console.log(`📄 Generated HTML length: ${htmlContent.length} characters`);
  
  // Test html function  
  const reportContent = html(returnsData, 'sample_data_report.html', null, 'Sample Data Strategy Report');
  
  console.log('✅ html() function executed successfully');
  
  // Save the report
  fs.writeFileSync('sample_data_report.html', reportContent);
  console.log('✅ HTML report saved: sample_data_report.html');
  
  // Verify it contains key elements from Python template
  const checks = [
    { name: 'Title structure', test: htmlContent.includes('<h1>') },
    { name: 'Full date range', test: htmlContent.includes(`<dt>${dates[0].toISOString().split('T')[0]} - ${dates[dates.length - 1].toISOString().split('T')[0]}</dt>`) },
    { name: 'Left column div', test: htmlContent.includes('<div id="left">') },
    { name: 'Right column div', test: htmlContent.includes('<div id="right">') },
    { name: 'Metrics table', test: htmlContent.includes('Key Performance Metrics') },
    { name: 'EOY table', test: htmlContent.includes('End of Year Returns') },
    { name: 'Drawdown table', test: htmlContent.includes('Worst 30 Drawdowns') },
    { name: 'CSS styling', test: htmlContent.includes('#left {') },
    { name: 'Chart placeholders', test: htmlContent.includes('Returns Chart Placeholder') },
    { name: 'Comprehensive metrics', test: htmlContent.includes('Cumulative Return') && htmlContent.includes('Sharpe') && htmlContent.includes('Max Drawdown') }
  ];
  
  console.log('\n🔍 Template Structure Verification:');
  let passedChecks = 0;
  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}: PASSED`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}: FAILED`);
    }
  });
  
  console.log(`\n📊 Template Match: ${passedChecks}/${checks.length} checks passed`);
  
  if (passedChecks === checks.length) {
    console.log('🎉 SUCCESS: HTML template with real data generated successfully!');
    console.log(`📅 Using full dataset: ${dates[0].toISOString().split('T')[0]} to ${dates[dates.length - 1].toISOString().split('T')[0]}`);
  } else {
    console.log('⚠️  WARNING: Some template elements missing');
  }
  
} catch (error) {
  console.error('❌ Error during HTML generation test:', error.message);
  console.error(error.stack);
}

// Use the same sample data we've been testing with throughout the project
const sampleData = {
  index: [
    new Date('2023-01-03'),
    new Date('2023-01-04'),
    new Date('2023-01-05'),
    new Date('2023-01-06'),
    new Date('2023-01-09'),
    new Date('2023-01-10'),
    new Date('2023-01-11'),
    new Date('2023-01-12'),
    new Date('2023-01-13'),
    new Date('2023-01-17'),
    new Date('2023-01-18'),
    new Date('2023-01-19'),
    new Date('2023-01-20'),
    new Date('2023-01-23'),
    new Date('2023-01-24'),
    new Date('2023-01-25'),
    new Date('2023-01-26'),
    new Date('2023-01-27'),
    new Date('2023-01-30'),
    new Date('2023-01-31'),
    new Date('2023-02-01'),
    new Date('2023-02-02'),
    new Date('2023-02-03'),
    new Date('2023-02-06'),
    new Date('2023-02-07'),
    new Date('2023-02-08'),
    new Date('2023-02-09'),
    new Date('2023-02-10'),
    new Date('2023-02-13'),
    new Date('2023-02-14'),
    new Date('2023-02-15'),
    new Date('2023-02-16'),
    new Date('2023-02-17'),
    new Date('2023-02-21'),
    new Date('2023-02-22'),
    new Date('2023-02-23'),
    new Date('2023-02-24'),
    new Date('2023-02-27'),
    new Date('2023-02-28'),
    new Date('2023-03-01')
  ],
  values: [
    0.0002, -0.0003, 0.0005, -0.0001, 0.0008, -0.0002, 0.0004, 0.0001, -0.0006,
    0.0003, 0.0007, -0.0004, 0.0002, 0.0009, -0.0005, 0.0003, -0.0001, 0.0006,
    0.0002, -0.0003, 0.0004, 0.0001, -0.0007, 0.0005, 0.0008, -0.0002, 0.0001,
    0.0004, -0.0003, 0.0006, 0.0002, -0.0001, 0.0005, 0.0003, -0.0004, 0.0007,
    0.0001, 0.0002, -0.0005, 0.0008
  ]
};

console.log('🧪 Testing HTML generation with real sample data...');

try {
  // Generate HTML with actual data
  const htmlContent = basic(sampleData, null, 'Sample Strategy Performance', 0.02); // 2% risk-free rate
  
  console.log('✅ HTML generation successful');
  console.log(`📄 Generated HTML length: ${htmlContent.length} characters`);
  
  // Save the report
  fs.writeFileSync('sample_data_report.html', htmlContent);
  console.log('✅ HTML report saved: sample_data_report.html');
  
  // Extract and display the metrics table to verify we have comprehensive data
  const metricsStart = htmlContent.indexOf('<h3>Key Performance Metrics</h3>');
  const metricsEnd = htmlContent.indexOf('</table>', metricsStart) + 8;
  const metricsSection = htmlContent.substring(metricsStart, metricsEnd);
  
  console.log('\n📊 Generated Metrics Section Preview:');
  console.log(metricsSection);
  
  // Count metrics rows
  const metricRows = (metricsSection.match(/<tr>/g) || []).length;
  console.log(`\n📈 Total metrics rows: ${metricRows}`);
  
  if (metricRows > 50) {
    console.log('🎉 SUCCESS: Comprehensive metrics generated (50+ metrics)');
  } else if (metricRows > 30) {
    console.log('✅ Good: Substantial metrics generated (30+ metrics)');
  } else {
    console.log('⚠️  Limited metrics generated (under 30)');
  }
  
} catch (error) {
  console.error('❌ Error during HTML generation:', error.message);
  console.error(error.stack);
}
