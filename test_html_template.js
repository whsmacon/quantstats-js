import fs from 'fs';
import { basic } from './src/reports.js';

// Create mock returns data
const mockReturns = {
  index: [
    new Date('2023-01-01'),
    new Date('2023-01-02'),
    new Date('2023-01-03'),
    new Date('2023-12-31')
  ],
  values: [0.01, -0.005, 0.02, 0.001]
};

console.log('Testing HTML template generation...');

async function testHtmlGeneration() {
  try {
    const htmlContent = await basic(mockReturns, null, 'Test Portfolio Report', 0.02);
    
    // Save to file to inspect
    fs.writeFileSync('test_template_output.html', htmlContent);
    console.log('✅ HTML template generated successfully');
    console.log('📄 Saved to test_template_output.html');
    
    // Check if it matches Python structure
    const hasLeftDiv = htmlContent.includes('<div id="left">');
    const hasRightDiv = htmlContent.includes('<div id="right">');
    const hasMetricsTable = htmlContent.includes('Key Performance Metrics');
    const hasEOYSection = htmlContent.includes('End of Year Returns');
    const hasDrawdownSection = htmlContent.includes('Worst 30 Drawdowns');
    const hasPythonCSS = htmlContent.includes('#left {') && htmlContent.includes('width: 620px');
    
    console.log('\n🔍 Structure Check:');
    console.log(`✅ Left div: ${hasLeftDiv}`);
    console.log(`✅ Right div: ${hasRightDiv}`);
    console.log(`✅ Metrics table: ${hasMetricsTable}`);
    console.log(`✅ EOY section: ${hasEOYSection}`);
    console.log(`✅ Drawdown section: ${hasDrawdownSection}`);
    console.log(`✅ Python CSS: ${hasPythonCSS}`);
    
    const allPassed = hasLeftDiv && hasRightDiv && hasMetricsTable && hasEOYSection && hasDrawdownSection && hasPythonCSS;
    console.log(`\n🎯 Overall Template Match: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
  } catch (error) {
    console.error('❌ Error generating HTML:', error.message);
  }
}

testHtmlGeneration();
