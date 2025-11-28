# fetch-with-render

> `fetch`, but with real rendering.

A **drop-in replacement for Node's `fetch`** that adds a `.render()` method to execute JavaScript and return fully rendered HTML using native system WebViews. Also includes a powerful CLI tool for web scraping and API testing.

## Features

- **Drop-in replacement**: Works exactly like Node's `fetch`, just with extra powers
- **Native WebView**: Uses system WebView (WebKit on macOS/Linux, WebView2 on Windows) via Rust
- **Zero Chromium**: No heavy browser dependencies
- **Full JavaScript execution**: Get the real, rendered DOM after all scripts run
- **Flexible waiting**: Wait for selectors, run custom scripts, or just grab everything
- **Fast**: Native performance with minimal overhead
- **TypeScript support**: Full type definitions included
- **CLI tool**: Powerful command-line interface for web scraping and API testing

## Installation

### As a Library

```bash
npm install fetch-with-render
```

### As a CLI Tool

```bash
npm install -g fetch-with-render
```

Then use the `fetch-with-render` command:

```bash
fetch-with-render https://example.com
```

### Platform Support

**Fully tested platforms:**
- macOS (Intel & Apple Silicon)
- Windows

**Note:** Linux builds are provided and basic functionality works, but render testing in headless CI environments has limitations. The library should work fine in desktop Linux environments with a display.

---

## Library Usage

### Quick Start

```js
import fetch from 'fetch-with-render';

// Use it just like regular fetch
const res = await fetch('https://example.com');
console.log(res.status); // 200

// Now render the page with JavaScript execution
const html = await res.render();
console.log(html); // Fully rendered HTML
```

### API

#### `fetch(url, options)`

Works exactly like Node's native `fetch`. Returns a `RenderableResponse` instead of a standard `Response`.

#### `response.render(options)`

Renders the page in a native WebView and returns the final HTML.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `5000` | Maximum time to wait for rendering (milliseconds) |
| `waitFor` | `string` | - | CSS selector to wait for before capturing HTML |
| `selector` | `string` | - | CSS selector to extract (returns only matching element) |
| `script` | `string` | - | JavaScript code to execute before capturing HTML |

**Returns:** `Promise<string>` - The rendered HTML

### Examples

#### Basic Usage

```js
import fetch from 'fetch-with-render';

const res = await fetch('https://example.com');
const html = await res.render();
console.log(html);
```

#### Wait for an Element

```js
const res = await fetch('https://spa-site.com');
const html = await res.render({
  timeout: 8000,
  waitFor: '.main-content' // Wait for this element to appear
});
```

#### Extract Specific Element

```js
const res = await fetch('https://example.com');
const articleHtml = await res.render({
  selector: 'article.post' // Get only the article element
});
```

#### Run Custom Script

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

---

## CLI Usage

The `fetch-with-render` CLI tool provides a curl/wget-like interface that automatically renders HTML pages with JavaScript execution.

### Basic Commands

```bash
# Fetch and render HTML page (automatic)
fetch-with-render https://example.com

# Fetch API endpoint (returns JSON as-is)
fetch-with-render https://api.example.com/data

# Wait for element before capturing
fetch-with-render -w ".content" https://spa-site.com

# Extract specific element
fetch-with-render -s "article" https://blog.com/post

# Show help
fetch-with-render --help
```

### CLI Options

**Basic:**
- `-h, --help` - Show help message
- `-v, --version` - Show version
- `--verbose` - Enable debug output
- `--config <file>` - Load configuration from file

**Rendering:**
- `-t, --timeout <ms>` - Rendering timeout (default: 5000)
- `-w, --wait-for <sel>` - Wait for CSS selector
- `-s, --selector <sel>` - Extract specific element
- `--script <code>` - Execute JavaScript before capturing

**Output:**
- `-q, --quiet` - Suppress progress indicators
- `-o, --output <file>` - Write output to file

**HTTP:**
- `-X, --method <method>` - HTTP method (GET, POST, PUT, DELETE, etc.)
- `-d, --data <data>` - Request body data
- `-H, --header <header>` - Add custom header
- `-A, --user-agent <ua>` - Set custom User-Agent
- `--cookie <cookie>` - Send cookies
- `--no-redirect` - Don't follow redirects

### CLI Examples

#### Web Scraping

```bash
# Fetch and render HTML page
fetch-with-render https://example.com

# Wait for element before capturing
fetch-with-render -w ".content" https://spa-site.com

# Extract specific element
fetch-with-render -s "article" https://blog.com/post

# Execute JavaScript before capturing
fetch-with-render --script "document.querySelectorAll('.ad').forEach(x => x.remove())" https://news.com

# Save to file
fetch-with-render https://example.com -o page.html

# Custom timeout
fetch-with-render -t 10000 https://slow-site.com
```

#### API Testing

```bash
# POST JSON data
fetch-with-render -X POST \
  -d '{"name":"John","email":"john@example.com"}' \
  -H "Content-Type: application/json" \
  https://api.example.com/users

# PUT request
fetch-with-render -X PUT \
  -d '{"status":"updated"}' \
  -H "Content-Type: application/json" \
  https://api.example.com/items/123

# DELETE request
fetch-with-render -X DELETE https://api.example.com/items/123

# With authentication
fetch-with-render -H "Authorization: Bearer token123" https://api.example.com/protected
```

#### Configuration File

Create `config.json`:

```json
{
  "timeout": 10000,
  "userAgent": "MyBot/1.0",
  "headers": {
    "Accept": "text/html"
  }
}
```

Use it:

```bash
fetch-with-render --config config.json https://example.com
```

#### Verbose Mode

```bash
# Debug requests
fetch-with-render --verbose https://example.com

# Shows:
# - Request URL and options
# - Response headers and status
# - Timing information
# - Content length
```

---

## Use Cases

### Web Scraping

Get the real rendered content of Single Page Applications (SPAs):

```js
const res = await fetch('https://react-app.com');
const html = await res.render({ waitFor: '#root' });
```

Or via CLI:
```bash
fetch-with-render -w "#root" https://react-app.com
```

### API Testing

Test endpoints with different HTTP methods:

```bash
# Create
fetch-with-render -X POST -d '{"title":"New Post"}' -H "Content-Type: application/json" https://api.example.com/posts

# Read
fetch-with-render https://api.example.com/posts/1

# Update
fetch-with-render -X PUT -d '{"title":"Updated"}' -H "Content-Type: application/json" https://api.example.com/posts/1

# Delete
fetch-with-render -X DELETE https://api.example.com/posts/1
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

Or via CLI:
```bash
fetch-with-render -s "article" --script "document.querySelectorAll('script').forEach(s => s.remove())" https://blog.com/post/123
```

### Monitoring

```bash
# Check if element exists
fetch-with-render -w ".status-ok" https://status.example.com && echo "Up"

# Get API response
fetch-with-render https://api.example.com/health | jq .status
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│         JavaScript Layer (Node)         │
│  ┌───────────────────────────────────┐  │
│  │  fetch-with-render                │  │
│  │  • Wraps native fetch()           │  │
│  │  │  Adds .render() method          │  │
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

---

## Comparison

### vs Puppeteer

| Feature | fetch-with-render | Puppeteer |
|---------|-------------------|-----------|
| Binary size | ~2MB | ~300MB |
| Startup time | ~100ms | ~1-2s |
| Memory usage | ~30MB | ~100MB+ |
| API complexity | Simple | Complex |
| Chromium bundled | ❌ | ✅ |

### vs curl/wget

| Feature | curl/wget | fetch-with-render |
|---------|-----------|-------------------|
| Fetch raw HTML | ✅ | ✅ |
| Render JavaScript | ❌ | ✅ (automatic for HTML) |
| Wait for elements | ❌ | ✅ |
| Execute scripts | ❌ | ✅ |
| Auto-detect content type | ❌ | ✅ |
| Extract elements | ❌ | ✅ |

---

## Building from Source

```bash
# Install dependencies
npm install

# Build Rust + JavaScript
npm run build

# Development build (faster, unoptimized)
npm run build:debug

# Run tests
npm test

# Run demos
npm run demo
```

---

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

---

## Error Handling

### Library

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

### CLI

```bash
# Check exit code
if fetch-with-render https://example.com; then
  echo "Success"
else
  echo "Failed"
fi

# Capture errors
fetch-with-render https://example.com 2> error.log
```

---

## Performance Tips

1. **Set reasonable timeouts**: Don't wait longer than necessary
2. **Use `waitFor`**: More efficient than arbitrary delays
3. **Extract selectors**: If you only need part of the page, use `selector`
4. **Reuse connections**: The underlying fetch supports keep-alive
5. **Cache with config files**: Store common settings in config files

---

## Documentation

- **ARCHITECTURE.md** - Technical deep dive into implementation
- **INSTALLATION.md** - Detailed setup instructions
- **CHANGELOG.md** - Version history and changes
- **CONTRIBUTING.md** - Contributing guidelines

---

## Demos

After building, try these demos:

```bash
npm run demo              # Quick demonstration
npm run demo:comparison   # Compare multiple websites
npm run demo:spa          # SPA handling
npm run demo:cli          # CLI features
```

---

## License

MIT

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Credits

Built with:
- [napi-rs](https://napi.rs/) - Node.js native addon framework
- [wry](https://github.com/tauri-apps/wry) - Cross-platform WebView library
- [tokio](https://tokio.rs/) - Async runtime for Rust
