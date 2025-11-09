# Development Guide

## Local Linting & Quality Checks

This project has comprehensive linting checks that run both locally and in CI. **Always run these before pushing to avoid CI failures!**

### Quick Start

```bash
# Run all linting checks (same as CI)
npm run lint

# Auto-fix Rust formatting issues
npm run fmt

# Run linting + tests (full pre-push check)
npm run check
```

### Individual Linting Commands

```bash
# Check Rust formatting (without making changes)
npm run lint:fmt

# Run Clippy with strict warnings
npm run lint:clippy

# Auto-format Rust code
npm run fmt
```

### Pre-Commit Hook (Recommended)

Install the pre-commit hook to automatically check your code before each commit:

```bash
ln -s ../../scripts/pre-commit-hook.sh .git/hooks/pre-commit
```

This will run:
- ✅ Rust formatting check (`cargo fmt -- --check`)
- ✅ Clippy linting (`cargo clippy -- -D warnings`)

If any check fails, the commit will be blocked and you'll see helpful error messages.

### Common Linting Issues & Fixes

#### 1. Formatting Issues
**Error**: Code formatting doesn't match rustfmt style

**Fix**:
```bash
npm run fmt
# or
cargo fmt
```

#### 2. Clippy Warnings
**Error**: Clippy reports warnings (treated as errors in CI)

**Fix**: Address the specific warnings shown. Common ones:
- `arc_with_non_send_sync` - Use `Rc<RefCell<>>` instead of `Arc<Mutex<>>` for thread-local state
- `single_match` - Replace `match` with `if` for simple equality checks
- `collapsible_if` - Combine nested if statements with `&&`
- `missing_const_for_thread_local` - Use `const { }` for thread_local initializers

#### 3. Build Issues
**Error**: WebKit dependencies missing on Linux

**Fix**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev

# macOS (should work out of the box)
# Windows (should work out of the box)
```

### CI Checks

GitHub Actions runs the following checks on every push:

**Build & Test Workflow:**
- ✅ Build for 5 platforms (macOS x64/ARM64, Linux x64/ARM64, Windows x64)
- ✅ Run tests on 3 platforms (macOS x64, Linux x64, Windows x64)
- ✅ Generate all platform binaries

**CI Workflow:**
- ✅ Rust formatting (`cargo fmt -- --check`)
- ✅ Clippy linting (`cargo clippy -- -D warnings`)
- ✅ Build on macOS, Linux, Windows
- ✅ Run tests

### Best Practices

1. **Before starting work**: Pull latest changes
   ```bash
   git pull origin main
   ```

2. **During development**: Run linting frequently
   ```bash
   npm run lint
   ```

3. **Before committing**: Run full checks
   ```bash
   npm run check
   ```

4. **Before pushing**: Ensure all checks pass
   ```bash
   npm run lint && npm test
   ```

5. **After CI failure**:
   - Check the GitHub Actions logs
   - Run the same command locally to reproduce
   - Fix the issue and push again

### Platform-Specific Notes

**macOS**:
- Native WebKit support via WebKit.framework
- Both Intel and Apple Silicon builds supported

**Linux**:
- Requires `libwebkit2gtk-4.1-dev` and `libgtk-3-dev`
- Both x86_64 and ARM64 (via cross-compilation) supported

**Windows**:
- Native WebView2 support
- Only x86_64 currently supported (ARM64 not standardized)

### Cross-Compilation Notes

ARM64 Linux builds use cross-compilation:
- Builds on x86_64 host with ARM64 cross-compiler
- Uses `ports.ubuntu.com` for ARM64 packages
- Cannot run tests (different architecture)
- Validated by successful compilation

## Questions?

If you encounter linting issues not covered here, check:
1. GitHub Actions logs for the specific error
2. [Rust Clippy lint documentation](https://rust-lang.github.io/rust-clippy/master/)
3. Create an issue with the error details
