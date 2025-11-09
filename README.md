# fetch-with-render

> `fetch`, but with real rendering.

A **drop-in replacement for Node's `fetch`** that adds a `.render()` method to execute JavaScript and return fully rendered HTML using native system WebViews.

## Features

- **Drop-in replacement**: Works exactly like Node's `fetch`, just with extra powers
- **Native WebView**: Uses system WebView (WebKit on macOS/Linux, WebView2 on Windows) via Rust
- **Zero Chromium**: No heavy browser dependencies
- **Full JavaScript execution**: Get the real, rendered DOM after all scripts run
- **Flexible waiting**: Wait for selectors, run custom scripts, or just grab everything
- **Fast**: Native performance with minimal overhead
- **TypeScript support**: Full type definitions included

## Installation

```bash
npm install fetch-with-render
```

## Quick Start

```js
import fetch from 'fetch-with-render';

// Use it just like regular fetch
const res = await fetch('https://example.com');
console.log(res.status); // 200

// Now render the page with JavaScript execution
const html = await res.render();
console.log(html); // Fully rendered HTML
```

## Try the Demos

See it in action! After building the project, run:

```bash
npm run demo
```

This runs a quick demonstration showing the difference between standard fetch and rendered fetch. For more comprehensive demos:

- `npm run demo:comparison` - Compare across multiple websites
- `npm run demo:spa` - See how it handles Single Page Apps
- `npm run demo:basic` - Simple usage example
- `npm run demo:advanced` - Advanced features

See [DEMOS.md](DEMOS.md) for detailed information about each demo.

## API

### `fetch(url, options)`

Works exactly like Node's native `fetch`. Returns a `RenderableResponse` instead of a standard `Response`.

### `response.render(options)`

Renders the page in a native WebView and returns the final HTML.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `5000` | Maximum time to wait for rendering (milliseconds) |
| `waitFor` | `string` | - | CSS selector to wait for before capturing HTML |
| `selector` | `string` | - | CSS selector to extract (returns only matching element) |
| `script` | `string` | - | JavaScript code to execute before capturing HTML |

**Returns:** `Promise<string>` - The rendered HTML

## Examples

### Basic Usage

```js
import fetch from 'fetch-with-render';

const res = await fetch('https://example.com');
const html = await res.render();
console.log(html);
```

### Wait for an Element

```js
const res = await fetch('https://spa-site.com');
const html = await res.render({
  timeout: 8000,
  waitFor: '.main-content' // Wait for this element to appear
});
```

### Extract Specific Element

```js
const res = await fetch('https://example.com');
const articleHtml = await res.render({
  selector: 'article.post' // Get only the article element
});
```

### Run Custom Script

```js
const res = await fetch('https://example.com');
const html = await res.render({
  script: `
    // Remove all iframes
    document.querySelectorAll('iframe').forEach(x => x.remove());

    // Expand all collapsed sections
    document.querySelectorAll('.collapsed').forEach(x => {
      x.classList.remove('collapsed');
    });
  `
});
```

### Complete Example

```js
import fetch from 'fetch-with-render';

const res = await fetch('https://news.ycombinator.com');

if (!res.ok) {
  throw new Error(`HTTP ${res.status}: ${res.statusText}`);
}

const html = await res.render({
  timeout: 10000,
  waitFor: '.itemlist',
  script: `
    // Click "More" button if it exists
    document.querySelector('.morelink')?.click();
  `
});

console.log(html.length); // Full rendered page length
```

## Architecture

```
┌─────────────────────────────────────────┐
│         JavaScript Layer (Node)         │
│  ┌───────────────────────────────────┐  │
│  │  fetch-with-render                │  │
│  │  • Wraps native fetch()           │  │
│  │  • Adds .render() method          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          Rust Layer (napi-rs)           │
│  ┌───────────────────────────────────┐  │
│  │  render_page(url, options)        │  │
│  │  • Create headless WebView (wry)  │  │
│  │  • Load URL & wait for load       │  │
│  │  • Execute scripts                │  │
│  │  • Extract outerHTML              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│       System WebView Engine             │
│  • macOS: WKWebView                     │
│  • Windows: WebView2                    │
│  • Linux: WebKitGTK                     │
└─────────────────────────────────────────┘
```

## Use Cases

### Web Scraping

Get the real rendered content of Single Page Applications (SPAs):

```js
const res = await fetch('https://react-app.com');
const html = await res.render({ waitFor: '#root' });
```

### Testing

Test how your site renders after JavaScript execution:

```js
const res = await fetch('http://localhost:3000');
const html = await res.render();
assert(html.includes('<div id="app">'));
```

### Content Extraction

Extract specific content after all scripts run:

```js
const res = await fetch('https://blog.com/post/123');
const content = await res.render({
  selector: 'article',
  script: 'document.querySelectorAll("script").forEach(s => s.remove())'
});
```

## Platform Support

| Platform | WebView Engine | Status |
|----------|---------------|---------|
| macOS | WKWebView | ✅ Supported |
| Linux | WebKitGTK | ✅ Supported |
| Windows | WebView2 | ✅ Supported |

## Comparison

### vs Puppeteer

| Feature | fetch-with-render | Puppeteer |
|---------|-------------------|-----------|
| Binary size | ~2MB | ~300MB |
| Startup time | ~100ms | ~1-2s |
| Memory usage | ~30MB | ~100MB+ |
| API complexity | Simple | Complex |
| Chromium bundled | ❌ | ✅ |

### vs Splash

| Feature | fetch-with-render | Splash |
|---------|-------------------|--------|
| Installation | npm install | Docker required |
| Language | JavaScript | Python/Lua |
| Integration | Native Node.js | HTTP API |
| Deployment | Simple | Complex |

## Building from Source

```bash
# Install dependencies
npm install

# Build Rust + JavaScript
npm run build

# Development build (faster, unoptimized)
npm run build:debug
```

## Requirements

- Node.js >= 18.0.0
- Rust toolchain (for building from source)
- Platform-specific WebView:
  - **macOS**: Built-in (WKWebView)
  - **Linux**: `webkit2gtk` package
  - **Windows**: WebView2 Runtime (usually pre-installed on Windows 10+)

### Linux Setup

On Ubuntu/Debian:
```bash
sudo apt-get install libwebkit2gtk-4.0-dev
```

On Fedora:
```bash
sudo dnf install webkit2gtk3-devel
```

## Error Handling

```js
try {
  const res = await fetch('https://example.com');
  const html = await res.render({ timeout: 5000 });
} catch (err) {
  if (err.message.includes('RenderTimeoutError')) {
    console.error('Page took too long to render');
  } else if (err.message.includes('NavigationFailed')) {
    console.error('Failed to load page');
  } else if (err.message.includes('ScriptError')) {
    console.error('Error executing custom script');
  }
}
```

## Performance Tips

1. **Set reasonable timeouts**: Don't wait longer than necessary
2. **Use `waitFor`**: More efficient than arbitrary delays
3. **Extract selectors**: If you only need part of the page, use `selector`
4. **Reuse connections**: The underlying fetch supports keep-alive

## Future Enhancements

- [ ] `.renderToImage()` - Screenshot support
- [ ] Persistent sessions - Cookie/localStorage caching
- [ ] Parallel render pool - Reuse WebView instances
- [ ] Streaming API - Stream DOM diffs as they load
- [ ] Network request interception
- [ ] Custom user agent and headers in WebView

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Built with:
- [napi-rs](https://napi.rs/) - Node.js native addon framework
- [wry](https://github.com/tauri-apps/wry) - Cross-platform WebView library
- [tokio](https://tokio.rs/) - Async runtime for Rust
