import fetch from '../dist/index.js';

/**
 * Quick Demo: Shows the key difference between .text() and .render()
 */

console.log('🚀 fetch-with-render Quick Demo\n');

async function quickDemo() {
  const url = 'https://example.com';

  console.log(`Fetching: ${url}\n`);

  // Standard fetch
  console.log('1️⃣  Standard fetch with .text():');
  console.log('   (Gets initial HTML, no JavaScript execution)\n');

  const res1 = await fetch(url);
  const standardHTML = await res1.text();

  console.log(`   ✓ Status: ${res1.status}`);
  console.log(`   ✓ HTML length: ${standardHTML.length.toLocaleString()} chars`);
  console.log(`   ✓ Contains <script>: ${standardHTML.includes('<script>')}`);
  console.log(`   ✓ First 200 chars:\n`);
  console.log('   ' + standardHTML.substring(0, 200).replace(/\n/g, '\n   ') + '...\n');

  // Rendered fetch
  console.log('2️⃣  fetch-with-render with .render():');
  console.log('   (Renders in WebView, executes JavaScript)\n');

  const res2 = await fetch(url);

  // Add a custom script to demonstrate JavaScript execution
  const renderedHTML = await res2.render({
    timeout: 8000,
    script: `
      // Add a marker to prove JavaScript executed
      const marker = document.createElement('div');
      marker.id = 'js-executed-marker';
      marker.textContent = 'JavaScript was executed!';
      marker.style.display = 'none';
      document.body.appendChild(marker);
    `
  });

  console.log(`   ✓ Status: ${res2.status}`);
  console.log(`   ✓ HTML length: ${renderedHTML.length.toLocaleString()} chars`);
  console.log(`   ✓ Contains our JS marker: ${renderedHTML.includes('js-executed-marker')}`);
  console.log(`   ✓ JavaScript executed: ${renderedHTML.includes('JavaScript was executed!')}`);
  console.log(`   ✓ First 200 chars:\n`);
  console.log('   ' + renderedHTML.substring(0, 200).replace(/\n/g, '\n   ') + '...\n');

  // Comparison
  console.log('📊 Comparison:\n');

  const lengthDiff = renderedHTML.length - standardHTML.length;
  const percentDiff = ((lengthDiff / standardHTML.length) * 100).toFixed(2);

  console.log(`   Size difference: ${lengthDiff > 0 ? '+' : ''}${lengthDiff} chars (${percentDiff}%)`);
  console.log(`   JS execution verified: ${renderedHTML.includes('js-executed-marker') ? '✅ YES' : '❌ NO'}`);

  // Demonstrate waiting for content
  console.log('\n3️⃣  Advanced: Waiting for specific elements:\n');

  const res3 = await fetch('https://jsonplaceholder.typicode.com/');
  const advancedHTML = await res3.render({
    timeout: 10000,
    waitFor: 'body', // Wait for body to be ready
    script: `
      // Modify the page
      document.title = 'Modified by fetch-with-render';

      // Add custom content
      const notice = document.createElement('div');
      notice.className = 'custom-notice';
      notice.innerHTML = '<h1>This content was added by JavaScript!</h1>';
      document.body.insertBefore(notice, document.body.firstChild);
    `
  });

  console.log(`   ✓ Page title modified: ${advancedHTML.includes('Modified by fetch-with-render')}`);
  console.log(`   ✓ Custom content added: ${advancedHTML.includes('This content was added by JavaScript')}`);

  console.log('\n✨ Demo Complete!\n');
  console.log('Key Takeaways:');
  console.log('  • .text() gives you the initial HTML');
  console.log('  • .render() executes JavaScript and gives you the final DOM');
  console.log('  • Perfect for scraping SPAs and dynamic content');
  console.log('  • No Chromium needed - uses native WebView!\n');
}

// Run the demo
quickDemo().catch(err => {
  console.error('\n❌ Demo failed:', err.message);

  if (err.message.includes('DISPLAY') || err.message.includes('WebView')) {
    console.log('\n⚠️  Note: This demo requires a display/WebView environment.');
    console.log('   On headless servers, you may need xvfb or similar.');
    console.log('   The library works great in normal environments!\n');
  }

  process.exit(1);
});
