# Cross-Platform Installation Guide

## Overview

`fetch-with-render` uses native Rust modules that must be compiled for each platform. This guide covers installation considerations for different scenarios.

## Installation Methods

### Method 1: Install Pre-built Binaries (Recommended)

**When available**, the library will download pre-compiled binaries for your platform:

```bash
npm install fetch-with-render
```

No Rust toolchain required! The package automatically detects your platform and downloads the correct binary.

**Supported platforms:**
- macOS (x64, ARM64)
- Linux (x64, ARM64)
- Windows (x64, ARM64)

### Method 2: Build from Source

If pre-built binaries aren't available for your platform, the package will attempt to compile from source.

**Requirements:**
- Node.js ≥ 18.0.0
- Rust toolchain (latest stable)
- Platform-specific dependencies (see below)

```bash
# Install Rust if needed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install the package (will build from source)
npm install fetch-with-render
```

## Platform-Specific Dependencies

### macOS

✅ **No additional dependencies needed**

WKWebView is built into macOS.

```bash
npm install fetch-with-render
```

### Linux (Ubuntu/Debian)

📦 **Requires WebKitGTK development files**

```bash
# Install dependencies first
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  libwebkit2gtk-4.0-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev

# Then install the package
npm install fetch-with-render
```

### Linux (Fedora/RHEL)

```bash
# Install dependencies
sudo dnf install -y \
  webkit2gtk3-devel \
  gtk3-devel \
  libappindicator-gtk3-devel

# Install package
npm install fetch-with-render
```

### Linux (Arch)

```bash
# Install dependencies
sudo pacman -S webkit2gtk gtk3

# Install package
npm install fetch-with-render
```

### Windows

✅ **WebView2 Runtime required** (usually pre-installed on Windows 10+)

```bash
npm install fetch-with-render
```

If WebView2 is missing:
- Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
- Or it will be automatically installed on first use

**For building from source on Windows:**
- Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- Or install [Visual Studio](https://visualstudio.microsoft.com/) with "Desktop development with C++" workload

## Docker Deployment

### Dockerfile for Linux

```dockerfile
FROM node:18

# Install WebKitGTK and dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libwebkit2gtk-4.0-dev \
    libgtk-3-dev \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (will build from source if needed)
RUN npm install

# Copy application
COPY . .

# Run with virtual display
CMD ["xvfb-run", "-a", "node", "index.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    environment:
      - DISPLAY=:99
    volumes:
      - ./:/app
```

## CI/CD Considerations

### GitHub Actions

The library includes a workflow that builds for all platforms:

```yaml
# .github/workflows/ci.yml
strategy:
  matrix:
    settings:
      - host: macos-latest
        target: x86_64-apple-darwin
      - host: ubuntu-latest
        target: x86_64-unknown-linux-gnu
      - host: windows-latest
        target: x86_64-pc-windows-msvc
```

### Building Pre-built Binaries

For library maintainers:

```bash
# Build for current platform
npm run build

# Generate artifacts for all platforms
npm run artifacts

# This creates platform-specific binaries in artifacts/
```

To publish with pre-built binaries:

```bash
# Build for all platforms (requires GitHub Actions or local cross-compilation)
napi build --platform --release --strip

# Publish with artifacts
npm publish
```

## Headless Environments

### Linux Servers (No Display)

Use `xvfb` for virtual display:

```bash
# Install xvfb
sudo apt-get install xvfb

# Run your app
xvfb-run -a node your-app.js

# Or set display environment variable
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
node your-app.js
```

### Automated Testing in CI

```yaml
# GitHub Actions example
- name: Run tests
  run: |
    sudo apt-get install xvfb
    xvfb-run -a npm test
```

## Troubleshooting

### Issue: "No pre-built binary found"

**Solution:** The package will try to build from source. Ensure you have:
1. Rust toolchain installed
2. Platform-specific dependencies installed
3. Build tools installed (gcc, make, etc.)

### Issue: "Cannot find module '@napi-rs/fetch-with-render'"

**Solution:** The native module failed to build or install.

```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install

# Or force rebuild
npm rebuild fetch-with-render
```

### Issue: Linux "cannot open display"

**Solution:** Use xvfb for headless operation:

```bash
xvfb-run -a node your-app.js
```

### Issue: Windows "WebView2 not found"

**Solution:** Install WebView2 Runtime:
- Download: https://go.microsoft.com/fwlink/p/?LinkId=2124703
- Or: `winget install Microsoft.EdgeWebView2Runtime`

### Issue: macOS "dyld: Library not loaded"

**Solution:** Usually a signing issue. Try:

```bash
# Remove quarantine attribute
xattr -cr node_modules/fetch-with-render
```

## Optional: Pure JavaScript Fallback

If native compilation is problematic, you could implement a fallback:

```javascript
// your-app.js
let fetch;

try {
  // Try to use fetch-with-render
  fetch = (await import('fetch-with-render')).default;
  console.log('Using fetch-with-render');
} catch (err) {
  // Fallback to standard fetch
  fetch = globalThis.fetch;
  console.warn('fetch-with-render unavailable, using standard fetch');
  console.warn('Note: .render() will not be available');
}

export default fetch;
```

## Electron Integration

`fetch-with-render` works in Electron apps:

```javascript
// main.js (Electron main process)
import fetch from 'fetch-with-render';

const html = await (await fetch('https://example.com')).render();
```

The native module is compatible with Electron's Node.js environment.

## Package Size Considerations

### With Pre-built Binaries

- **Package size:** ~5-10 MB per platform
- **Install time:** Fast (just downloads)
- **User requirements:** None (no Rust needed)

### Building from Source

- **Package size:** ~500 KB (source only)
- **Install time:** 2-5 minutes (compilation)
- **User requirements:** Rust toolchain + platform dependencies

## Recommendations

### For End Users

1. **Use pre-built binaries** when available (automatic)
2. **Have Rust installed** as fallback for source builds
3. **Install platform dependencies** (especially Linux)

### For Library Authors Using This Package

1. **Test on all platforms** during development
2. **Use Docker** for consistent Linux environments
3. **Document platform requirements** in your README
4. **Consider optional dependencies** if .render() is not critical

### For This Library's Maintainers

1. **Publish pre-built binaries** for all major platforms
2. **Use GitHub Actions** to build artifacts
3. **Version binaries with package** version
4. **Provide clear error messages** when builds fail

## Platform Detection

The library automatically detects your platform:

```javascript
// This happens automatically in the package
const platform = process.platform; // 'darwin', 'linux', 'win32'
const arch = process.arch; // 'x64', 'arm64'

// Loads the correct binary:
// - darwin-x64.node
// - darwin-arm64.node
// - linux-x64.node
// - win32-x64.node
// etc.
```

## Minimal Installation (Advanced)

If you only need specific platforms:

```json
{
  "optionalDependencies": {
    "@napi-rs/fetch-with-render-darwin-x64": "^0.1.0",
    "@napi-rs/fetch-with-render-darwin-arm64": "^0.1.0",
    "@napi-rs/fetch-with-render-linux-x64-gnu": "^0.1.0",
    "@napi-rs/fetch-with-render-win32-x64-msvc": "^0.1.0"
  }
}
```

Only the platform-specific binary will be installed.

## Summary

| Platform | Dependencies | Pre-built Binary | Source Build |
|----------|-------------|------------------|--------------|
| macOS | None | ✅ Yes | ✅ Yes |
| Linux | WebKitGTK + GTK3 | ✅ Yes | ✅ Yes |
| Windows | WebView2 Runtime | ✅ Yes | ✅ Yes |

**Best Practice:** Publish with pre-built binaries for smooth user experience!
