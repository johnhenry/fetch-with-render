# Contributing to fetch-with-render

Thank you for your interest in contributing to fetch-with-render! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- Rust toolchain (stable)
- Platform-specific dependencies:
  - **Linux**: `sudo apt-get install libwebkit2gtk-4.0-dev` (Ubuntu/Debian)
  - **macOS**: No additional dependencies (WKWebView is built-in)
  - **Windows**: WebView2 Runtime (usually pre-installed)

### Installation

```bash
# Clone the repository
git clone https://github.com/johnhenry/fetch-with-render.git
cd fetch-with-render

# Install dependencies
npm install

# Build the project
npm run build
```

## Project Structure

```
fetch-with-render/
├── src/
│   ├── lib.rs           # Rust native module code
│   ├── index.mjs        # Main JavaScript export
│   ├── response.mjs     # RenderableResponse class
│   └── index.d.ts       # TypeScript definitions
├── examples/            # Usage examples
├── tests/              # Test files
├── scripts/            # Build scripts
├── Cargo.toml          # Rust dependencies
├── package.json        # Node dependencies
└── README.md
```

## Development Workflow

### Building

```bash
# Full build (Rust + JavaScript)
npm run build

# Build only Rust (faster for Rust-only changes)
npm run build:rust

# Build only JavaScript
npm run build:js

# Debug build (unoptimized, faster compilation)
npm run build:debug
```

### Testing

```bash
# Run all tests
npm test

# Run specific test
node --test tests/basic.test.mjs
```

### Code Style

**Rust:**
```bash
# Format code
cargo fmt

# Lint with Clippy
cargo clippy

# Run Rust tests
cargo test
```

**JavaScript:**
- Use modern ES modules syntax
- Follow existing code style
- Add JSDoc comments for public APIs

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

### 3. Test Your Changes

```bash
# Build
npm run build

# Test
npm test

# Try the examples
node examples/basic.mjs
node examples/advanced.mjs
```

### 4. Submit a Pull Request

- Push your branch to GitHub
- Create a Pull Request with a clear description
- Reference any related issues
- Wait for review

## Guidelines

### Commit Messages

Use clear, descriptive commit messages:

```
Add support for custom headers in render()

- Add headers option to RenderOptions
- Update Rust code to apply headers
- Add tests and documentation
```

### Code Quality

- **Rust**: Follow Rust best practices, use `cargo fmt` and `cargo clippy`
- **JavaScript**: Use modern ES6+ syntax, add JSDoc comments
- **TypeScript**: Keep type definitions up-to-date
- **Tests**: Add tests for new features and bug fixes

### Documentation

- Update README.md for new features
- Add JSDoc comments to public APIs
- Create examples for significant features
- Update TypeScript definitions

## Adding New Features

### Example: Adding a new render option

1. **Update Rust struct** (`src/lib.rs`):
```rust
#[derive(Deserialize, Default)]
#[napi(object)]
pub struct RenderOptions {
    // ... existing options
    pub new_option: Option<String>,
}
```

2. **Implement the feature** in `run_webview_blocking()`

3. **Update TypeScript definitions** (`src/index.d.ts`):
```typescript
export interface RenderOptions {
  // ... existing options
  newOption?: string;
}
```

4. **Add tests** (`tests/feature.test.mjs`)

5. **Update documentation** (README.md)

6. **Add example** (`examples/new-feature.mjs`)

## Release Process

1. Update version in `package.json` and `Cargo.toml`
2. Update CHANGELOG.md
3. Create a git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions will build and publish

## Getting Help

- Open an issue for bugs or feature requests
- Ask questions in discussions
- Check existing issues and pull requests

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
