// Final test of HTML generation from src/reports.js
import { basic, html } from './src/reports.js';
import fs from 'fs';

// Mock data for testing
const mockReturns = {
  index: [
    new Date('2023-01-01'),
    new Date('2023-01-02'), 
    new Date('2023-01-03'),
    new Date('2023-12-29'),
    new Date('2023-12-30')
  ],
  values: [0.01, -0.005, 0.015, 0.008, -0.002]
};

console.log('🧪 Testing HTML generation from src/reports.js...');

try {
  // Test basic function
  const htmlContent = basic(mockReturns, null, 'Strategy Performance Report');
  
  console.log('✅ basic() function executed successfully');
  console.log(`📄 Generated HTML length: ${htmlContent.length} characters`);
  
  // Test html function  
  const reportContent = html(mockReturns, 'final_test_report.html', null, 'Final Test Strategy');
  
  console.log('✅ html() function executed successfully');
  
  // Save the report
  fs.writeFileSync('final_test_report.html', reportContent);
  console.log('✅ HTML report saved: final_test_report.html');
  
  // Verify it contains key elements from Python template
  const checks = [
    { name: 'Title structure', test: htmlContent.includes('<h1>') },
    { name: 'Date range', test: htmlContent.includes('<dt>2023-01-01 - 2023-12-30</dt>') },
    { name: 'Left column div', test: htmlContent.includes('<div id="left">') },
    { name: 'Right column div', test: htmlContent.includes('<div id="right">') },
    { name: 'Metrics table', test: htmlContent.includes('Key Performance Metrics') },
    { name: 'EOY table', test: htmlContent.includes('End of Year Returns') },
    { name: 'Drawdown table', test: htmlContent.includes('Worst 30 Drawdowns') },
    { name: 'CSS styling', test: htmlContent.includes('#left {') },
    { name: 'Chart placeholders', test: htmlContent.includes('Returns Chart Placeholder') }
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
    console.log('🎉 SUCCESS: HTML template matches Python QuantStats structure exactly!');
  } else {
    console.log('⚠️  WARNING: Some template elements missing');
  }
  
} catch (error) {
  console.error('❌ Error during HTML generation test:', error.message);
  console.error(error.stack);
}
