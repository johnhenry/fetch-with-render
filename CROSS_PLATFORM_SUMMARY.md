# Cross-Platform Installation Considerations - Summary

## Key Considerations

### 1. **Native Binary Compilation**

The library uses Rust native modules that must be compiled for each platform/architecture combination.

**Challenge:** Different users have different platforms
**Solution:** 
- ✅ Provide pre-built binaries for common platforms
- ✅ Fallback to source compilation when needed
- ✅ Clear error messages guiding users

### 2. **Platform-Specific Dependencies**

Each platform requires different WebView libraries:

| Platform | Requirement | Installation |
|----------|------------|--------------|
| **macOS** | WKWebView | ✅ Built-in (no action needed) |
| **Linux** | WebKitGTK | ⚠️ Must install: `sudo apt-get install libwebkit2gtk-4.0-dev` |
| **Windows** | WebView2 | ✅ Usually pre-installed on Windows 10+ |

**Challenge:** Linux users must install system packages
**Solution:** 
- ✅ Clear documentation in INSTALLATION.md
- ✅ Error messages that guide users to install dependencies
- ✅ CI examples showing the setup

### 3. **Installation Methods**

#### Method 1: Pre-built Binaries (Ideal)

```bash
npm install fetch-with-render
```

**Pros:**
- No Rust toolchain needed
- Fast installation (seconds)
- Works for most users

**Cons:**
- Requires publishing platform-specific packages
- Larger npm package size

#### Method 2: Build from Source (Fallback)

```bash
# Install Rust first
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install platform dependencies (Linux only)
sudo apt-get install libwebkit2gtk-4.0-dev

# Install package (compiles from source)
npm install fetch-with-render
```

**Pros:**
- Works on any platform
- Smaller package size (source only)

**Cons:**
- Requires Rust toolchain
- Slow installation (2-5 minutes)
- Requires platform dependencies

### 4. **Pre-built Binary Distribution**

Using `napi-rs` to generate and publish platform-specific packages:

```bash
# Build for all platforms (via CI)
npm run artifacts

# Publishes:
# - @napi-rs/fetch-with-render-darwin-x64
# - @napi-rs/fetch-with-render-darwin-arm64
# - @napi-rs/fetch-with-render-linux-x64-gnu
# - @napi-rs/fetch-with-render-win32-x64-msvc
# ... etc
```

**Automatic platform detection** - the main package loads the correct binary for the user's platform.

### 5. **Headless Environments**

**Challenge:** Linux servers often don't have a display
**Solution:** Use `xvfb` (virtual display)

```bash
# Install xvfb
sudo apt-get install xvfb

# Run with virtual display
xvfb-run -a node your-app.js
```

Documented in INSTALLATION.md with examples for:
- Docker deployments
- CI/CD pipelines
- Production servers

### 6. **CI/CD Builds**

The `.github/workflows/ci.yml` demonstrates:
- Building on all 3 platforms (macOS, Linux, Windows)
- Installing platform-specific dependencies
- Running tests in each environment
- Generating artifacts for distribution

### 7. **Docker Deployment**

Special considerations for containerized deployments:

```dockerfile
FROM node:18

# Install WebKitGTK + xvfb for headless operation
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.0-dev \
    xvfb

# Your app code
COPY . /app
WORKDIR /app
RUN npm install

# Run with virtual display
CMD ["xvfb-run", "-a", "node", "index.js"]
```

### 8. **Error Messages & User Guidance**

The `src/native.mjs` loader provides helpful error messages:

```javascript
Failed to load native module: ...

This usually means:
1. The native module hasn't been built yet - run 'npm run build'
2. You're on an unsupported platform
3. Platform dependencies are missing (e.g., WebKitGTK on Linux)

See INSTALLATION.md for platform-specific requirements.
```

### 9. **Optional Dependencies Strategy**

For advanced users, can specify only needed platforms:

```json
{
  "optionalDependencies": {
    "@napi-rs/fetch-with-render-darwin-arm64": "^0.1.0"
  }
}
```

This reduces installation size for single-platform deployments.

### 10. **Fallback Strategy**

Applications can implement graceful degradation:

```javascript
let fetch;

try {
  fetch = (await import('fetch-with-render')).default;
  console.log('✓ Using fetch-with-render');
} catch (err) {
  fetch = globalThis.fetch;
  console.warn('⚠ Using standard fetch (no .render() available)');
}
```

## Implementation Status

✅ **INSTALLATION.md created** - Comprehensive guide covering all scenarios
✅ **Native module loader improved** - Better error messages
✅ **Build scripts updated** - Support for artifacts and universal builds
✅ **Docker examples provided** - Ready-to-use Dockerfile
✅ **CI/CD configured** - Multi-platform builds
✅ **Troubleshooting guide** - Common issues and solutions

## Recommended Publishing Strategy

### For Maximum User Convenience:

1. **Use GitHub Actions** to build binaries for all platforms
2. **Publish with pre-built binaries** using `napi-rs` artifacts
3. **Include source code** for fallback compilation
4. **Document platform requirements** in README

### Publishing Steps:

```bash
# 1. Build artifacts for all platforms (via GitHub Actions)
# 2. Download artifacts from CI
# 3. Publish to npm with all artifacts
npm publish --access public

# This publishes:
# - Main package: fetch-with-render
# - Platform packages: @napi-rs/fetch-with-render-*
```

Users then install with:
```bash
npm install fetch-with-render
```

And the correct binary is automatically selected!

## Testing Across Platforms

### Local Testing

```bash
# macOS
npm run build && npm test

# Linux (with dependencies)
sudo apt-get install libwebkit2gtk-4.0-dev
npm run build && npm test

# Windows
npm run build && npm test
```

### CI Testing

The GitHub Actions workflow tests all platforms automatically on each push.

## Common Issues & Solutions

### Issue: "Cannot find module"
**Cause:** Native module not built
**Solution:** Run `npm run build`

### Issue: "No display" on Linux
**Cause:** Headless environment
**Solution:** Use `xvfb-run -a node app.js`

### Issue: WebKitGTK not found
**Cause:** Missing Linux dependencies
**Solution:** `sudo apt-get install libwebkit2gtk-4.0-dev`

### Issue: WebView2 not found (Windows)
**Cause:** Missing WebView2 Runtime
**Solution:** Download from Microsoft or use `winget install Microsoft.EdgeWebView2Runtime`

## Summary

The library handles cross-platform installation through:

1. **Pre-built binaries** for fast, easy installation
2. **Source compilation fallback** for flexibility  
3. **Clear documentation** for each platform
4. **Helpful error messages** when issues occur
5. **Docker support** for containerized deployments
6. **CI/CD examples** for automated builds
7. **Graceful fallback options** for critical applications

All considerations are documented in **INSTALLATION.md** with step-by-step guides for each scenario.

## Next Steps for Production

Before publishing to npm:

1. ✅ Set up GitHub Actions to build artifacts
2. ✅ Test installation on all platforms
3. ✅ Verify pre-built binaries work
4. ✅ Update README with installation instructions
5. ✅ Publish with artifacts to npm
