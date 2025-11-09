import fetch from '../dist/index.js';

/**
 * Practical Example: Scraping a Single Page Application
 *
 * This demonstrates why .render() is essential for modern web apps.
 * Many sites load content dynamically with JavaScript - standard fetch
 * will only get you an empty shell.
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║         SPA Scraping Demo: The Power of .render()             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);

/**
 * Extract meaningful content from HTML
 */
function extractContent(html, label) {
  // Count meaningful content indicators
  const headings = (html.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || []).length;
  const paragraphs = (html.match(/<p[^>]*>.*?<\/p>/gi) || []).length;
  const articles = (html.match(/<article/gi) || []).length;
  const sections = (html.match(/<section/gi) || []).length;

  // Look for "empty" indicators
  const hasLoadingSpinner = html.includes('loading') || html.includes('spinner');
  const hasReactRoot = html.includes('root') && html.match(/<div[^>]*id=["']root["'][^>]*>\s*<\/div>/i);

  console.log(`\n${label}:`);
  console.log(`  Content elements found:`);
  console.log(`    • Headings: ${headings}`);
  console.log(`    • Paragraphs: ${paragraphs}`);
  console.log(`    • Articles: ${articles}`);
  console.log(`    • Sections: ${sections}`);

  if (hasLoadingSpinner) {
    console.log(`    ⚠️  Contains loading indicators`);
  }

  if (hasReactRoot) {
    console.log(`    ⚠️  Empty React root detected (SPA shell)`);
  }

  return {
    headings,
    paragraphs,
    articles,
    sections,
    hasContent: headings > 0 || paragraphs > 3,
    isEmpty: hasReactRoot || (headings === 0 && paragraphs < 3),
  };
}

/**
 * Test a URL with both methods
 */
async function testSite(url, options = {}) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`Testing: ${url}`);
  console.log('─'.repeat(70));

  try {
    // Method 1: Standard fetch
    console.log('\n📄 Method 1: Standard fetch (.text())');
    console.log('   Getting initial HTML without JavaScript execution...\n');

    const res1 = await fetch(url);
    const initialHTML = await res1.text();

    console.log(`   Status: ${res1.status} ${res1.statusText}`);
    console.log(`   HTML size: ${(initialHTML.length / 1024).toFixed(2)} KB`);

    const initialContent = extractContent(initialHTML, '   Initial HTML Analysis');

    // Method 2: Rendered fetch
    console.log('\n\n🎨 Method 2: fetch-with-render (.render())');
    console.log('   Rendering with JavaScript execution in native WebView...\n');

    const res2 = await fetch(url);
    const startTime = Date.now();

    const renderedHTML = await res2.render({
      timeout: options.timeout || 10000,
      waitFor: options.waitFor,
    });

    const renderTime = Date.now() - startTime;

    console.log(`   Status: ${res2.status} ${res2.statusText}`);
    console.log(`   HTML size: ${(renderedHTML.length / 1024).toFixed(2)} KB`);
    console.log(`   Render time: ${renderTime}ms`);

    const renderedContent = extractContent(renderedHTML, '   Rendered HTML Analysis');

    // Comparison
    console.log('\n\n📊 VERDICT:\n');

    if (initialContent.isEmpty && renderedContent.hasContent) {
      console.log('   ✅ This is a Single Page App!');
      console.log('   ✅ .render() successfully extracted the dynamic content');
      console.log(`   ✅ Found ${renderedContent.headings} headings and ${renderedContent.paragraphs} paragraphs after rendering`);
      console.log(`   ❌ Standard .text() would have missed all this content!`);
    } else if (renderedContent.hasContent > initialContent.hasContent) {
      console.log('   ✅ .render() extracted MORE content than standard fetch');
      console.log(`   📈 Content increase: ${renderedContent.paragraphs - initialContent.paragraphs} paragraphs`);
    } else {
      console.log('   ℹ️  This appears to be a server-rendered site');
      console.log('   ℹ️  Standard .text() works fine for this type of site');
    }

    // Show sample if requested
    if (options.showSample && renderedContent.hasContent) {
      // Try to extract a meaningful snippet
      const firstHeading = (renderedHTML.match(/<h1[^>]*>(.*?)<\/h1>/i) || [])[1];
      if (firstHeading) {
        console.log(`\n   Sample content: "${firstHeading.replace(/<[^>]+>/g, '').trim()}"`);
      }
    }

  } catch (err) {
    console.error(`\n   ❌ Error: ${err.message}`);
  }
}

/**
 * Main demo
 */
async function main() {
  console.log(`
This demo compares standard fetch vs. fetch-with-render on different
types of websites to show when JavaScript rendering is necessary.
`);

  // Test 1: Example.com - mostly static
  await testSite('https://example.com', {
    timeout: 5000,
  });

  // Test 2: GitHub - heavy client-side rendering
  await testSite('https://github.com/trending', {
    timeout: 12000,
    waitFor: '.Box',
    showSample: true,
  });

  // Test 3: API documentation (often has dynamic examples)
  await testSite('https://jsonplaceholder.typicode.com/', {
    timeout: 8000,
    showSample: true,
  });

  // Test 4: Wikipedia - progressive enhancement
  await testSite('https://en.wikipedia.org/wiki/JavaScript', {
    timeout: 8000,
    waitFor: '#content',
    showSample: true,
  });

  // Final summary
  console.log(`
\n${'═'.repeat(70)}
                          CONCLUSION
${'═'.repeat(70)}

When to use .render():

  ✅ Single Page Applications (React, Vue, Angular, Svelte)
  ✅ Sites with client-side routing
  ✅ Content loaded via AJAX/fetch
  ✅ Infinite scroll implementations
  ✅ Dynamic dashboards and admin panels
  ✅ Interactive web apps

When .text() is sufficient:

  ✅ Server-side rendered sites
  ✅ Static HTML pages
  ✅ Traditional CMS sites (WordPress, etc.)
  ✅ When you only need initial HTML structure
  ✅ When speed is more important than complete content

${'═'.repeat(70)}

💡 Pro tip: Try both methods! If .text() gives you empty divs or
   loading spinners, you need .render() to get the actual content.

`);
}

// Run the demo
main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
