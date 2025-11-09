# Demo Guide

This document provides a quick reference for running and understanding the demonstration examples.

## Quick Start

```bash
# Build the library first
npm install
npm run build

# Run the quick demo (recommended)
npm run demo
```

## Available Demos

### 🚀 Quick Demo (Recommended First)

**Command:** `npm run demo`
**File:** `examples/quick-demo.mjs`
**Duration:** ~10-15 seconds

The fastest way to see fetch-with-render in action. Shows:
- Direct comparison of `.text()` vs `.render()`
- Proof that JavaScript is actually executed
- Custom script injection
- Basic metrics

**Perfect for:** Understanding the core concept quickly

---

### 📊 Comprehensive Comparison

**Command:** `npm run demo:comparison`
**File:** `examples/comparison-demo.mjs`
**Duration:** ~1-2 minutes

Tests multiple well-known websites with detailed analysis:
- example.com (static baseline)
- Wikipedia (progressive enhancement)
- GitHub (heavy client-side)
- JSONPlaceholder (API docs)
- MDN (modern documentation)

Shows:
- Detailed HTML statistics
- Framework detection
- Element count changes
- Colored terminal output

**Perfect for:** Seeing real-world differences across site types

---

### 🎨 SPA Scraping Demo

**Command:** `npm run demo:spa`
**File:** `examples/spa-scraping.mjs`
**Duration:** ~30-45 seconds

Practical demonstration of scraping Single Page Applications.

Shows:
- Why standard fetch fails for SPAs
- How `.render()` extracts actual content
- Content analysis (headings, paragraphs, etc.)
- Clear before/after comparisons

**Perfect for:** Understanding when you NEED `.render()`

---

### 📖 Basic Example

**Command:** `npm run demo:basic`
**File:** `examples/basic.mjs`
**Duration:** ~5 seconds

Minimal example showing simple usage.

**Perfect for:** Quick API reference, copy-paste starter code

---

### ⚡ Advanced Example

**Command:** `npm run demo:advanced`
**File:** `examples/advanced.mjs`
**Duration:** ~30-45 seconds

Demonstrates advanced features:
- `waitFor` option
- `selector` option
- `script` option
- Error handling
- Multiple scenarios

**Perfect for:** Learning all the options and features

---

## What The Demos Prove

### 1. JavaScript Is Actually Executed

The demos inject custom JavaScript that modifies the page, then verify those modifications appear in the output:

```javascript
const html = await res.render({
  script: `
    const marker = document.createElement('div');
    marker.id = 'proof-of-execution';
    document.body.appendChild(marker);
  `
});

// Verify it worked
console.log(html.includes('proof-of-execution')); // true
```

### 2. SPAs Return Empty Shells Without Rendering

Standard fetch on a React/Vue/Angular app:
```html
<div id="root"></div>
<!-- Nothing here! -->
```

After `.render()`:
```html
<div id="root">
  <div class="app">
    <nav>...</nav>
    <main>
      <article>Actual content!</article>
    </main>
  </div>
</div>
```

### 3. Measurable Performance Characteristics

The demos show real timing:
- Simple static pages: 100-500ms
- Complex SPAs: 1-5 seconds
- Network-dependent sites: varies

### 4. Cross-Platform Native WebView

No Chromium binary needed - uses system WebView:
- macOS: WKWebView (built-in)
- Linux: WebKitGTK (~20MB)
- Windows: WebView2 (Edge-based)

## Expected Output Examples

### Quick Demo Success

```
🚀 fetch-with-render Quick Demo

Fetching: https://example.com

1️⃣  Standard fetch with .text():
   ✓ Status: 200
   ✓ HTML length: 1,256 chars
   ✓ Contains <script>: false

2️⃣  fetch-with-render with .render():
   ✓ Status: 200
   ✓ HTML length: 1,389 chars
   ✓ Contains our JS marker: true
   ✓ JavaScript executed: true ✅

📊 Comparison:
   Size difference: +133 chars (10.59%)
   JS execution verified: ✅ YES
```

### SPA Demo Success

```
Testing: https://github.com/trending

📄 Method 1: Standard fetch (.text())
   Status: 200 OK
   HTML size: 47.23 KB

   Initial HTML Analysis:
     • Headings: 2
     • Paragraphs: 8
     ⚠️  Empty React root detected (SPA shell)

🎨 Method 2: fetch-with-render (.render())
   Status: 200 OK
   HTML size: 312.45 KB
   Render time: 2847ms

   Rendered HTML Analysis:
     • Headings: 47
     • Paragraphs: 156

📊 VERDICT:
   ✅ This is a Single Page App!
   ✅ .render() successfully extracted the dynamic content
   ✅ Found 47 headings and 156 paragraphs after rendering
   ❌ Standard .text() would have missed all this content!
```

## Interpreting Results

### When You See Large Differences

**HTML Size:** +200% or more
**Element Count:** 10x+ increase in divs/links
**Verdict:** Definitely a SPA - standard fetch would fail

### When You See Small Differences

**HTML Size:** <10% difference
**Element Count:** Minimal changes
**Verdict:** Server-rendered - standard fetch works fine

### When Render Times Are High

**>3 seconds:** Complex SPA, lots of JS execution
**1-3 seconds:** Moderate complexity
**<1 second:** Simple page or fast network

## Troubleshooting

### Linux: "No display" Error

```bash
# Install virtual display
sudo apt-get install xvfb

# Run with virtual display
xvfb-run -a npm run demo
```

### Timeout Errors

Some sites are slow:
```javascript
// Increase timeout in the demo files
const html = await res.render({ timeout: 20000 });
```

### Network Issues

Behind a proxy?
```bash
HTTP_PROXY=http://proxy:8080 npm run demo
```

## Creating Custom Demos

Use the examples as templates:

```javascript
import fetch from 'fetch-with-render';

const url = 'https://your-site.com';

// Standard fetch
const res1 = await fetch(url);
const text = await res1.text();
console.log('Standard:', text.length);

// With rendering
const res2 = await fetch(url);
const html = await res2.render({
  timeout: 10000,
  waitFor: '.content'
});
console.log('Rendered:', html.length);
```

## Understanding the Value

The demos prove that `fetch-with-render`:

1. ✅ **Actually works** - JS executes, content appears
2. ✅ **Solves real problems** - SPAs need it
3. ✅ **Is lightweight** - Native WebView, not Chromium
4. ✅ **Is fast enough** - Sub-second for simple sites
5. ✅ **Is necessary** - Standard fetch fails on modern web apps

## Next Steps

1. ✅ Run `npm run demo` to see it work
2. ✅ Try `npm run demo:spa` to see the SPA use case
3. ✅ Read the [API docs](README.md) for full details
4. ✅ Check [examples/README.md](examples/README.md) for more

## Sharing Results

Got interesting results? Share them:
- Open an issue with your findings
- Add your use case to the examples
- Help improve the library!

## Questions?

See the main [README.md](README.md) for API documentation.
