import fs from 'fs';
import { basic, html } from './src/reports.js';

console.log('🧪 Testing HTML Report Generation with Real Data...\n');

try {
  // Load the actual data we use for metric testing
  const rawData = JSON.parse(fs.readFileSync('raw_data_comparison_js.json', 'utf8'));
  const returns = rawData.returns;
  const dates = rawData.dates.map(dateStr => new Date(dateStr));
  
  console.log(`✅ Loaded ${returns.length} returns with dates from ${dates[0].toISOString().split('T')[0]} to ${dates[dates.length-1].toISOString().split('T')[0]}`);
  
  // Create the data structure expected by reports.js
  const reportData = {
    values: returns,
    index: dates
  };
  
  console.log('📊 Generating HTML reports...');
  
  // Generate JavaScript version
  const jsHtml = basic(reportData, null, 'JavaScript QuantStats Report');
  fs.writeFileSync('tearsheet_javascript.html', jsHtml);
  console.log('✅ JavaScript tearsheet saved: tearsheet_javascript.html');
  
  // Check if Python version exists for comparison
  if (fs.existsSync('tearsheet_python.html')) {
    console.log('✅ Python tearsheet found: tearsheet_python.html');
    
    // Basic comparison of key metrics
    const pythonHtml = fs.readFileSync('tearsheet_python.html', 'utf8');
    
    console.log('\n🔍 Basic Structure Comparison:');
    console.log(`JS HTML length: ${jsHtml.length} chars`);
    console.log(`Python HTML length: ${pythonHtml.length} chars`);
    
    // Check for key structural elements
    const keyElements = [
      'Key Performance Metrics',
      'End of Year Returns', 
      'Worst 30 Drawdowns',
      'Cumulative Return %',
      'CAGR﹪',
      'Sharpe',
      'Max Drawdown %'
    ];
    
    console.log('\n📋 Content Comparison:');
    keyElements.forEach(element => {
      const inJS = jsHtml.includes(element);
      const inPython = pythonHtml.includes(element);
      const status = inJS && inPython ? '✅' : inJS ? '🟡 JS only' : inPython ? '🟡 Python only' : '❌';
      console.log(`${status} ${element}: JS=${inJS}, Python=${inPython}`);
    });
    
  } else {
    console.log('⚠️  Python tearsheet not found for comparison');
  }
  
  console.log('\n✅ HTML report generation test completed successfully!');
  
} catch (error) {
  console.error('❌ Error during HTML report test:', error.message);
  console.error(error.stack);
}
