# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of fetch-with-render
- Drop-in replacement for Node's `fetch` with `.render()` method
- Native WebView rendering using wry (WebKit on macOS/Linux, WebView2 on Windows)
- Support for render options:
  - `timeout`: Maximum rendering time
  - `waitFor`: Wait for CSS selector
  - `selector`: Extract specific element
  - `script`: Execute custom JavaScript
- Full TypeScript support with type definitions
- Comprehensive documentation and examples
- Cross-platform support (macOS, Linux, Windows)
- Zero Chromium dependencies
- MIT License

## [0.1.0] - 2024-XX-XX

### Added
- Initial implementation
- Rust native module with napi-rs
- JavaScript wrapper with RenderableResponse class
- Basic tests and examples
- CI/CD with GitHub Actions
- Documentation (README, CONTRIBUTING, examples)

[Unreleased]: https://github.com/johnhenry/fetch-with-render/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/johnhenry/fetch-with-render/releases/tag/v0.1.0
