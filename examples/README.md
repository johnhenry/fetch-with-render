# Examples

This directory contains various examples demonstrating the capabilities of `fetch-with-render`.

## Running the Examples

First, make sure you've built the project:

```bash
npm install
npm run build
```

Then run any example using the npm scripts or directly with node:

```bash
# Quick demo (recommended to start)
npm run demo

# Or run directly
node examples/quick-demo.mjs
```

## Available Examples

### 1. Quick Demo (`quick-demo.mjs`)

**Run:** `npm run demo`

A fast, focused demonstration showing the core difference between `.text()` and `.render()`. This is the best starting point to understand what the library does.

**What it shows:**
- Standard fetch with `.text()` (no JS execution)
- Enhanced fetch with `.render()` (with JS execution)
- Proof that JavaScript is actually executed in the WebView
- Basic performance metrics

**Runtime:** ~10-15 seconds

---

### 2. Comparison Demo (`comparison-demo.mjs`)

**Run:** `npm run demo:comparison`

A comprehensive comparison testing multiple well-known websites, showing detailed statistics about what changes when JavaScript is executed.

**What it shows:**
- Tests 5+ different websites (static, SPAs, and mixed)
- Detailed HTML analysis (element counts, frameworks detected)
- Before/after comparisons with statistics
- Render timing information
- Colored terminal output for easy reading

**Websites tested:**
- example.com (static baseline)
- Wikipedia (progressive enhancement)
- GitHub (heavy client-side rendering)
- JSONPlaceholder (API docs with dynamic content)
- MDN Web Docs (modern documentation site)

**Runtime:** ~1-2 minutes

---

### 3. SPA Scraping Demo (`spa-scraping.mjs`)

**Run:** `npm run demo:spa`

Demonstrates the practical use case of scraping Single Page Applications where standard fetch fails to get meaningful content.

**What it shows:**
- How SPAs often return empty HTML shells to standard fetch
- How `.render()` extracts the actual content after JavaScript execution
- Content analysis (headings, paragraphs, articles detected)
- Clear verdicts on when each method is appropriate

**Runtime:** ~30-45 seconds

---

### 4. Basic Example (`basic.mjs`)

**Run:** `npm run demo:basic`

Simple, straightforward usage example - perfect for understanding the basic API.

**What it shows:**
- Simple fetch and render
- Basic status checking
- Output inspection

**Runtime:** ~5 seconds

---

### 5. Advanced Example (`advanced.mjs`)

**Run:** `npm run demo:advanced`

Shows advanced features and options of the `.render()` method.

**What it shows:**
- Using the `waitFor` option to wait for specific elements
- Using the `selector` option to extract only part of the page
- Using the `script` option to modify the page before capture
- Error handling
- Multiple rendering scenarios

**Runtime:** ~30-45 seconds

---

## Understanding the Output

### What to Look For

When comparing `.text()` vs `.render()`:

1. **HTML Length Difference**
   - Significant increase? Likely a SPA loading content via JS
   - Small/no difference? Likely server-rendered content

2. **Element Count Changes**
   - More `<div>` elements? Dynamic content was added
   - More `<a>` links? Navigation was rendered
   - More `<img>` tags? Lazy-loaded images

3. **Render Time**
   - 100-500ms: Simple page
   - 1-3s: Moderate complexity
   - 3-5s+: Heavy SPA or slow network

4. **Framework Detection**
   - "React", "Vue", "Angular" in output? Definitely needs `.render()`

### Common Patterns

**Pattern 1: SPA Shell**
```
Standard .text():  <div id="root"></div>
With .render():    <div id="root"><div class="app">...content...</div></div>
```

**Pattern 2: Progressive Enhancement**
```
Standard .text():  Basic content
With .render():    Basic content + interactive elements + dynamic features
```

**Pattern 3: Server-Rendered**
```
Standard .text():  Full content
With .render():    Nearly identical (may have slight enhancements)
```

## Customizing the Examples

All examples are written in plain JavaScript and easy to modify:

```javascript
// Change the URL
await testURL('https://your-site.com', {
  timeout: 10000,        // Wait up to 10 seconds
  waitFor: '.content',   // Wait for specific element
  selector: 'article',   // Extract only article element
  script: 'console.log("Hi!")' // Run custom JavaScript
});
```

## Troubleshooting

### "No display" errors on Linux

If you get display-related errors on a headless Linux server:

```bash
# Install xvfb
sudo apt-get install xvfb

# Run with virtual display
xvfb-run -a node examples/quick-demo.mjs
```

### WebView not found

Make sure you have the platform-specific WebView installed:

- **macOS**: Built-in (WKWebView)
- **Linux**: `sudo apt-get install libwebkit2gtk-4.0-dev`
- **Windows**: WebView2 Runtime (usually pre-installed)

### Timeout errors

Some sites are slow or complex:

```javascript
// Increase timeout
const html = await res.render({ timeout: 20000 }); // 20 seconds
```

### Network errors

If you're behind a proxy or have network restrictions:

```javascript
// The library respects Node's fetch configuration
// Set environment variables before running:
// HTTP_PROXY=http://proxy:8080 node examples/quick-demo.mjs
```

## Creating Your Own Examples

Use the examples as templates:

```javascript
import fetch from 'fetch-with-render';

async function myExample() {
  const res = await fetch('https://example.com');

  // Regular content
  const text = await res.clone().text();
  console.log('Standard:', text.length);

  // Rendered content
  const html = await res.render({
    timeout: 8000,
    waitFor: '.content'
  });
  console.log('Rendered:', html.length);
}

myExample().catch(console.error);
```

## Performance Notes

- First run is slower (WebView initialization)
- Subsequent runs are faster
- Complex SPAs take longer to render
- Network speed affects results
- Use `waitFor` to optimize timing

## Contributing Examples

Have a cool use case? Add an example:

1. Create `examples/your-example.mjs`
2. Add it to `package.json` scripts
3. Document it here
4. Submit a PR!

## Questions?

See the main [README](../README.md) for full API documentation or [CONTRIBUTING](../CONTRIBUTING.md) for development guidelines.
