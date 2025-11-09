# Architecture Documentation

This document provides a deep dive into the architecture and implementation details of `fetch-with-render`.

## Overview

`fetch-with-render` is a hybrid JavaScript/Rust library that extends Node.js's native `fetch` with the ability to render web pages using native system WebViews. The architecture consists of three main layers:

1. **JavaScript Layer**: User-facing API that wraps fetch
2. **Rust Layer**: Native module that manages WebView rendering
3. **System WebView**: Platform-specific browser engine

## Layer Details

### JavaScript Layer

Located in `src/index.mjs` and `src/response.mjs`.

#### Components

**fetchWithRender (src/index.mjs)**
- Wraps Node's native `fetch()`
- Returns `RenderableResponse` instead of standard `Response`
- Maintains full compatibility with fetch API

**RenderableResponse (src/response.mjs)**
- Extends standard Response with `.render()` method
- Delegates all standard Response methods to wrapped response
- Uses private fields (`#response`, `#url`) for encapsulation

#### Data Flow

```
User Code
    │
    ▼
fetchWithRender(url, options)
    │
    ├─► Native fetch(url, options)
    │       │
    │       ▼
    │   Standard Response
    │       │
    └───────┴─► RenderableResponse
                    │
                    ├─► Standard methods (text(), json(), etc.)
                    │
                    └─► render(options) → Rust layer
```

### Rust Layer

Located in `src/lib.rs`.

#### Components

**render_page (N-API Function)**
```rust
#[napi]
pub async fn render_page(url: String, options: Option<RenderOptions>) -> Result<String>
```

- Main entry point from JavaScript
- Async function using tokio runtime
- Spawns blocking thread for WebView event loop
- Uses channels for communication

**RenderOptions (Struct)**
```rust
#[derive(Deserialize, Default)]
#[napi(object)]
pub struct RenderOptions {
    pub timeout: Option<u64>,
    pub wait_for: Option<String>,
    pub selector: Option<String>,
    pub script: Option<String>,
}
```

- Serializable options from JavaScript
- All fields optional with sensible defaults
- Automatically bridged via napi-rs

**run_webview_blocking (Core Logic)**
```rust
fn run_webview_blocking(
    url: &str,
    opts: RenderOptions,
    timeout_ms: u64,
) -> std::result::Result<String, RenderError>
```

- Runs on dedicated thread
- Creates and manages WebView event loop
- Implements timeout mechanism
- Handles all rendering phases

#### Threading Model

```
┌─────────────────────────────────────────┐
│          Node.js Main Thread            │
│  (JavaScript execution)                 │
└─────────────────────────────────────────┘
                    │
                    ▼ (async N-API call)
┌─────────────────────────────────────────┐
│         Tokio Async Runtime             │
│  (spawns blocking task)                 │
└─────────────────────────────────────────┘
                    │
                    ▼ (std::thread::spawn)
┌─────────────────────────────────────────┐
│      Dedicated WebView Thread           │
│  • Creates EventLoop                    │
│  • Builds WebView                       │
│  • Runs event loop                      │
│  • Extracts HTML                        │
└─────────────────────────────────────────┘
                    │
                    ▼ (oneshot channel)
┌─────────────────────────────────────────┐
│         Return to JavaScript            │
│  (Promise resolution)                   │
└─────────────────────────────────────────┘
```

**Why This Model?**

1. **Node.js thread**: Must not block for I/O
2. **Tokio runtime**: Manages async tasks efficiently
3. **Dedicated WebView thread**: Required by wry/OS WebView APIs
4. **Channels**: Safe inter-thread communication

### System WebView Layer

Platform-specific browser engines accessed via `wry`.

| Platform | Engine | Notes |
|----------|--------|-------|
| macOS | WKWebView | Built-in, modern, excellent performance |
| Linux | WebKitGTK | Requires system package |
| Windows | WebView2 | Based on Chromium Edge, usually pre-installed |

## Rendering Process

### Phase 1: Initialization

```rust
let event_loop = EventLoop::new();
let window = WindowBuilder::new()
    .with_visible(false)  // Headless
    .with_title("fetch-with-render")
    .build(&event_loop)?;
```

### Phase 2: WebView Creation

```rust
let webview = WebViewBuilder::new(window)
    .with_url(url)
    .with_initialization_script(r#"
        window.__renderReady = false;
        window.addEventListener('load', () => {
            window.__renderReady = true;
        });
    "#)
    .build()?;
```

The initialization script sets up a flag to detect when the page is fully loaded.

### Phase 3: Event Loop

```rust
event_loop.run(move |event, _, control_flow| {
    *control_flow = ControlFlow::Poll;

    match event {
        Event::MainEventsCleared => {
            // Main rendering logic
        }
        _ => {}
    }
});
```

### Phase 4: Load Detection

```rust
if !*loaded_clone.lock().unwrap() {
    if let Ok(webview) = webview_clone.lock() {
        let check_script = "window.__renderReady";
        if let Ok(result) = webview.evaluate_script(check_script) {
            if result == "true" {
                *loaded_clone.lock().unwrap() = true;
            }
        }
    }
    return; // Keep waiting
}
```

Polls until the page signals it's ready.

### Phase 5: Wait For Selector (Optional)

```rust
if let Some(wait_selector) = &wait_for {
    let check_script = format!(
        "!!document.querySelector('{}')",
        wait_selector.replace('\'', "\\'")
    );
    if let Ok(result) = webview.evaluate_script(&check_script) {
        if result != "true" {
            return; // Keep waiting
        }
    }
}
```

### Phase 6: Custom Script Execution (Optional)

```rust
if let Some(custom_script) = &script {
    if let Err(e) = webview.evaluate_script(custom_script) {
        *error_clone.lock().unwrap() = Some(RenderError::ScriptExecution(e.to_string()));
        *control_flow = ControlFlow::Exit;
        return;
    }
}
```

### Phase 7: HTML Extraction

```rust
let extract_script = if let Some(sel) = &selector {
    format!(
        "(() => {{ const el = document.querySelector('{}'); return el ? el.outerHTML : ''; }})()",
        sel.replace('\'', "\\'")
    )
} else {
    "document.documentElement.outerHTML".to_string()
};

match webview.evaluate_script(&extract_script) {
    Ok(result) => {
        let cleaned = result.trim_matches('"')
            .replace("\\n", "\n")
            .replace("\\\"", "\"");
        *html_clone.lock().unwrap() = Some(cleaned);
        *control_flow = ControlFlow::Exit;
    }
    Err(e) => {
        *error_clone.lock().unwrap() = Some(RenderError::ScriptExecution(e.to_string()));
        *control_flow = ControlFlow::Exit;
    }
}
```

## Error Handling

### Error Types

```rust
pub enum RenderError {
    WindowCreation(String),
    WebViewCreation(String),
    Timeout,
    ScriptExecution(String),
    Unknown(String),
}
```

### Conversion to N-API Errors

```rust
impl From<RenderError> for napi::Error {
    fn from(err: RenderError) -> Self {
        match err {
            RenderError::Timeout =>
                napi::Error::from_reason("RenderTimeoutError: Rendering timed out"),
            // ... other conversions
        }
    }
}
```

### JavaScript Error Handling

```javascript
try {
    const html = await res.render({ timeout: 5000 });
} catch (err) {
    if (err.message.includes('RenderTimeoutError')) {
        // Handle timeout
    }
}
```

## Build Process

### Rust Build

```bash
napi build --platform --release
```

1. Runs `cargo build --release`
2. Generates platform-specific `.node` binary
3. Creates TypeScript definitions (via napi-rs)
4. Places binary in correct location

### JavaScript Build

```bash
node scripts/build-js.mjs
```

1. Creates `dist/` directory
2. Copies `.mjs` files as `.js`
3. Preserves ES module syntax

### Complete Build

```bash
npm run build
```

Runs both Rust and JavaScript builds in sequence.

## Platform-Specific Considerations

### macOS

- Uses WKWebView (built-in)
- No additional dependencies
- Full JavaScript support
- Excellent performance

### Linux

- Requires `webkit2gtk-4.0-dev`
- May need `libgtk-3-dev`
- Display server required (X11 or Wayland)
- Can run headless with `xvfb`

### Windows

- Requires WebView2 Runtime
- Usually pre-installed on Windows 10+
- Falls back to Edge Chromium
- No additional build dependencies

## Performance Characteristics

### Startup Time

- Cold start: ~100-200ms
- Warm start: ~50-100ms
- Mainly WebView initialization overhead

### Memory Usage

- Base: ~10-20 MB
- Per page: ~20-50 MB
- Depends on page complexity

### Rendering Time

- Simple page: 100-500ms
- Complex SPA: 1-5s
- Depends on:
  - Network latency
  - JavaScript execution
  - DOM complexity
  - Custom scripts

## Security Considerations

1. **JavaScript Execution**: Renders pages in isolated WebView
2. **Script Injection**: User scripts run in page context
3. **Network Access**: Full network access like a browser
4. **File System**: No direct file system access from rendered pages
5. **Sandboxing**: Leverages OS WebView sandbox

## Future Improvements

### Planned Features

1. **Connection Pooling**
   - Reuse WebView instances
   - Reduce initialization overhead

2. **Screenshot Support**
   - `.renderToImage()` method
   - Return PNG/JPEG buffer

3. **Network Interception**
   - Intercept requests
   - Mock responses
   - Block resources

4. **Session Management**
   - Persistent cookies
   - LocalStorage caching
   - Authentication state

### Potential Optimizations

1. Keep WebView warm between renders
2. Parallel rendering with pool
3. Streaming HTML as it loads
4. Selective resource loading

## Debugging

### Enable Rust Logs

```bash
RUST_LOG=debug npm run build
```

### Enable WebView DevTools

Modify `src/lib.rs`:

```rust
let webview = WebViewBuilder::new(window)
    .with_devtools(true)  // Enable DevTools
```

### JavaScript Debugging

```javascript
const res = await fetch(url);
console.log('Fetched:', res.url);

const html = await res.render(options);
console.log('Rendered:', html.length, 'chars');
```

## Testing Strategy

### Unit Tests (Rust)

```bash
cargo test
```

Test individual functions and error handling.

### Integration Tests (JavaScript)

```bash
npm test
```

Test end-to-end functionality with real URLs.

### Manual Testing

```bash
node examples/basic.mjs
node examples/advanced.mjs
```

## Dependencies

### Critical Dependencies

- `napi-rs`: Node.js native addon framework
- `wry`: Cross-platform WebView library
- `tokio`: Async runtime

### Why These?

- **napi-rs**: Best-in-class N-API bindings, great DX
- **wry**: Mature, actively maintained, powers Tauri
- **tokio**: Industry standard async runtime for Rust

## Troubleshooting

### Build Failures

1. Check Rust installation: `rustc --version`
2. Verify Node version: `node --version` (>= 18)
3. Install platform dependencies (see README)

### Runtime Errors

1. Check WebView availability
2. Verify network connectivity
3. Increase timeout for slow pages
4. Check console for JavaScript errors

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## References

- [napi-rs Documentation](https://napi.rs/)
- [wry GitHub Repository](https://github.com/tauri-apps/wry)
- [WebView2 Documentation](https://docs.microsoft.com/en-us/microsoft-edge/webview2/)
- [WKWebView Documentation](https://developer.apple.com/documentation/webkit/wkwebview)
