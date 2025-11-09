import fetch from '../dist/index.js';

/**
 * Comparison Demo: .text() vs .render()
 *
 * This demo fetches pages from well-known domains and compares:
 * - .text(): Standard fetch response (initial HTML, no JS execution)
 * - .render(): Rendered with JavaScript execution in WebView
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function header(text) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

function subheader(text) {
  console.log(`\n${colors.bright}${colors.yellow}${text}${colors.reset}`);
  console.log(`${colors.yellow}${'-'.repeat(text.length)}${colors.reset}\n`);
}

function info(label, value) {
  console.log(`${colors.dim}${label}:${colors.reset} ${colors.bright}${value}${colors.reset}`);
}

function highlight(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function warning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

function error(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

/**
 * Analyze HTML to find dynamic content indicators
 */
function analyzeHTML(html, label) {
  const stats = {
    length: html.length,
    scriptTags: (html.match(/<script/g) || []).length,
    divs: (html.match(/<div/g) || []).length,
    links: (html.match(/<a /g) || []).length,
    images: (html.match(/<img /g) || []).length,
    hasReact: html.includes('react') || html.includes('React'),
    hasVue: html.includes('vue') || html.includes('Vue'),
    hasAngular: html.includes('angular') || html.includes('ng-'),
    hasDataAttributes: html.includes('data-'),
    title: (html.match(/<title>(.*?)<\/title>/i) || [])[1] || 'N/A',
  };

  info('  HTML Length', `${stats.length.toLocaleString()} characters`);
  info('  Script Tags', stats.scriptTags);
  info('  Div Elements', stats.divs);
  info('  Links', stats.links);
  info('  Images', stats.images);
  info('  Title', stats.title);

  const frameworks = [];
  if (stats.hasReact) frameworks.push('React');
  if (stats.hasVue) frameworks.push('Vue');
  if (stats.hasAngular) frameworks.push('Angular');

  if (frameworks.length > 0) {
    info('  Frameworks Detected', frameworks.join(', '));
  }

  return stats;
}

/**
 * Compare two HTML strings and show differences
 */
function compareHTML(beforeStats, afterStats) {
  const lengthDiff = afterStats.length - beforeStats.length;
  const lengthPercent = ((lengthDiff / beforeStats.length) * 100).toFixed(1);

  subheader('Comparison Results');

  if (lengthDiff > 0) {
    highlight(`Rendered HTML is ${lengthDiff.toLocaleString()} characters longer (+${lengthPercent}%)`);
  } else if (lengthDiff < 0) {
    warning(`Rendered HTML is ${Math.abs(lengthDiff).toLocaleString()} characters shorter (${lengthPercent}%)`);
  } else {
    info('Length Change', 'No difference');
  }

  const scriptDiff = afterStats.scriptTags - beforeStats.scriptTags;
  const divDiff = afterStats.divs - beforeStats.divs;
  const linkDiff = afterStats.links - beforeStats.links;

  if (divDiff > 0) {
    highlight(`Added ${divDiff} div elements (likely dynamic content)`);
  }

  if (linkDiff > 0) {
    highlight(`Added ${linkDiff} links (likely dynamic navigation)`);
  }

  if (scriptDiff !== 0) {
    info('  Script tags changed', scriptDiff > 0 ? `+${scriptDiff}` : scriptDiff);
  }

  if (beforeStats.title !== afterStats.title) {
    console.log(`\n  ${colors.yellow}Title Changed:${colors.reset}`);
    console.log(`    Before: "${beforeStats.title}"`);
    console.log(`    After:  "${afterStats.title}"`);
  }
}

/**
 * Test a single URL
 */
async function testURL(url, options = {}) {
  header(`Testing: ${url}`);

  try {
    // Fetch the page
    console.log(`${colors.dim}Fetching...${colors.reset}`);
    const res = await fetch(url);

    info('Status', `${res.status} ${res.statusText}`);
    info('URL', res.url);

    // Get regular HTML (no JS execution)
    subheader('1. Regular fetch (.text()) - No JavaScript Execution');
    const textHTML = await res.clone().text();
    const textStats = analyzeHTML(textHTML, 'text()');

    // Get rendered HTML (with JS execution)
    subheader('2. Rendered fetch (.render()) - With JavaScript Execution');
    console.log(`${colors.dim}Rendering in WebView (timeout: ${options.timeout || 5000}ms)...${colors.reset}\n`);

    const renderStart = Date.now();
    const renderedHTML = await res.render({
      timeout: options.timeout || 8000,
      waitFor: options.waitFor,
      ...options,
    });
    const renderTime = Date.now() - renderStart;

    const renderStats = analyzeHTML(renderedHTML, 'render()');
    info('  Render Time', `${renderTime}ms`);

    // Compare the results
    compareHTML(textStats, renderStats);

    // Show a sample of content
    if (options.showSample) {
      subheader('Sample Output (first 500 chars of rendered HTML)');
      console.log(colors.dim + renderedHTML.substring(0, 500) + '...' + colors.reset);
    }

  } catch (err) {
    error(`Failed: ${err.message}`);
    console.error(err);
  }
}

/**
 * Main demo
 */
async function main() {
  console.log(`
${colors.bright}${colors.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                   fetch-with-render Comparison Demo                      ║
║                                                                           ║
║  This demo shows the difference between:                                 ║
║  • .text()   - Standard fetch (initial HTML, no JS execution)           ║
║  • .render() - Rendered HTML after JavaScript execution in WebView       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝${colors.reset}
  `);

  // Test 1: Simple static site (minimal difference expected)
  await testURL('https://example.com', {
    timeout: 5000,
    showSample: false,
  });

  // Test 2: Wikipedia (some JavaScript enhancements)
  await testURL('https://en.wikipedia.org/wiki/Web_scraping', {
    timeout: 15000,
    waitFor: 'body',  // body always exists
    showSample: false,
  });

  // Test 3: GitHub (significant client-side rendering)
  await testURL('https://github.com/microsoft/typescript', {
    timeout: 20000,
    // No waitFor - just wait for page load event
    showSample: false,
  });

  // Test 4: JSONPlaceholder (API documentation site with dynamic content)
  await testURL('https://jsonplaceholder.typicode.com/', {
    timeout: 10000,
    showSample: true,
  });

  // Test 5: MDN Web Docs (progressive enhancement - very complex)
  await testURL('https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API', {
    timeout: 20000,
    waitFor: 'body',  // Use body which is guaranteed to exist
    showSample: false,
  });

  // Final summary
  header('Summary');
  console.log(`
${colors.bright}Key Observations:${colors.reset}

${colors.green}✓${colors.reset} Static sites (like example.com) show minimal differences
  └─ The initial HTML already contains most content

${colors.green}✓${colors.reset} Modern web apps show SIGNIFICANT differences
  └─ Content is added dynamically via JavaScript
  └─ Navigation elements, interactive features appear after render

${colors.green}✓${colors.reset} The .render() method captures the FINAL state
  └─ Sees what a real browser user would see
  └─ Perfect for scraping SPAs and dynamic content

${colors.yellow}⚠${colors.reset}  Render times vary by page complexity
  └─ Simple pages: ~100-500ms
  └─ Complex SPAs: ~1-5s

${colors.cyan}Use .render() when you need:${colors.reset}
  • Content loaded by JavaScript
  • Single Page Applications (React, Vue, Angular)
  • Dynamic navigation menus
  • Infinite scroll content
  • Client-side rendered data

${colors.cyan}Use regular .text() when:${colors.reset}
  • Content is in initial HTML
  • Speed is critical
  • Static/server-rendered sites
  • You don't need JavaScript execution
  `);
}

// Run the demo
main().catch(console.error);
