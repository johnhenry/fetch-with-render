# Publishing Guide

This guide explains how to publish `fetch-with-render` with cross-platform binaries.

## The Problem with `prepublishOnly`

The current `prepublishOnly` hook in package.json:

```json
"prepublishOnly": "npm run build"
```

**Only builds for your current platform!** If you run `npm publish` on macOS, Linux and Windows users won't get working binaries.

## Solution: Use GitHub Actions

We build binaries on **all platforms** using GitHub Actions, then publish with all artifacts.

## Publishing Workflow

### Option 1: Automated Publishing (Recommended)

**Trigger:** Push a git tag

```bash
# 1. Update version in package.json and Cargo.toml
npm version patch  # or minor, major

# 2. Push the tag
git push && git push --tags

# 3. GitHub Actions automatically:
#    - Builds for all platforms
#    - Runs tests
#    - Publishes to npm (if NPM_TOKEN is set)
#    - Creates GitHub Release
```

**Setup required:**
1. Add `NPM_TOKEN` secret to GitHub repository settings
2. Get token from npmjs.com → Access Tokens → Generate New Token (Automation)

### Option 2: Manual Publishing with Artifacts

**Step 1: Trigger CI builds**

```bash
# Push to main/master to trigger builds
git push origin main

# Or create a tag
git tag v0.1.0
git push origin v0.1.0
```

**Step 2: Download artifacts from GitHub Actions**

1. Go to Actions tab in GitHub
2. Find your workflow run
3. Download all artifacts (will get .zip files)

**Step 3: Extract and prepare**

```bash
# Extract all .node files
unzip artifacts/bindings-x86_64-apple-darwin.zip
unzip artifacts/bindings-aarch64-apple-darwin.zip
unzip artifacts/bindings-x86_64-unknown-linux-gnu.zip
unzip artifacts/bindings-x86_64-pc-windows-msvc.zip

# Move .node files to project root
mv *.node .

# Build JavaScript
npm run build:js
```

**Step 4: Publish**

```bash
# Check what will be published
npm pack --dry-run

# Publish to npm
npm publish --access public
```

### Option 3: Using napi-rs Artifacts System

For even better cross-platform support, use napi-rs's artifact system:

**Step 1: Update package.json**

```json
{
  "name": "fetch-with-render",
  "optionalDependencies": {
    "@napi-rs/fetch-with-render-darwin-x64": "0.1.0",
    "@napi-rs/fetch-with-render-darwin-arm64": "0.1.0",
    "@napi-rs/fetch-with-render-linux-x64-gnu": "0.1.0",
    "@napi-rs/fetch-with-render-win32-x64-msvc": "0.1.0"
  }
}
```

**Step 2: Build and publish platform packages**

```bash
# This creates separate packages for each platform
npm run artifacts

# Publish main package
npm publish

# Publish platform-specific packages
cd npm/darwin-x64 && npm publish && cd ../..
cd npm/darwin-arm64 && npm publish && cd ../..
cd npm/linux-x64-gnu && npm publish && cd ../..
cd npm/win32-x64-msvc && npm publish && cd ../..
```

**Benefits:**
- Users only download binaries for their platform
- Smaller install size
- Automatic platform detection
- Fallback to source build if platform not supported

## What Gets Published

### With bundled binaries (Option 1 & 2):

```
fetch-with-render/
├── dist/
│   ├── index.js
│   ├── index.d.ts
│   ├── response.js
│   └── native.js
├── fetch-with-render.darwin-x64.node
├── fetch-with-render.darwin-arm64.node
├── fetch-with-render.linux-x64-gnu.node
├── fetch-with-render.win32-x64-msvc.node
├── package.json
└── README.md
```

Users get **all binaries**, npm/napi-rs auto-selects the right one.

### With platform packages (Option 3):

```
fetch-with-render (main package - just JavaScript)
@napi-rs/fetch-with-render-darwin-x64 (macOS x64 binary)
@napi-rs/fetch-with-render-darwin-arm64 (macOS ARM binary)
@napi-rs/fetch-with-render-linux-x64-gnu (Linux binary)
@napi-rs/fetch-with-render-win32-x64-msvc (Windows binary)
```

Users only download **their platform's** binary.

## Testing Before Publishing

### Test locally

```bash
# Build for your platform
npm run build

# Run tests
npm test

# Run demos
npm run demo
```

### Test in CI

```bash
# Push to trigger CI
git push

# Check GitHub Actions for all platform builds
```

### Test installation

```bash
# Pack to see what would be published
npm pack

# Install from the tarball
mkdir test-install && cd test-install
npm install ../fetch-with-render-0.1.0.tgz

# Test it works
node -e "import('fetch-with-render').then(m => console.log('✓ Loaded!'))"
```

## Pre-publish Checklist

Before running `npm publish`:

- [ ] Version updated in package.json
- [ ] Version updated in Cargo.toml
- [ ] CHANGELOG.md updated
- [ ] All tests passing on CI
- [ ] Binaries built for all platforms
- [ ] README.md is up to date
- [ ] TypeScript definitions are correct
- [ ] Examples work
- [ ] NPM_TOKEN is set (for automated publishing)

## Versioning

Follow semantic versioning:

```bash
# Patch release (0.1.0 -> 0.1.1)
npm version patch

# Minor release (0.1.0 -> 0.2.0)
npm version minor

# Major release (0.1.0 -> 1.0.0)
npm version major
```

This updates package.json and creates a git tag.

**Don't forget to update Cargo.toml manually!**

## GitHub Actions Setup

### Required Secrets

Add to GitHub repository settings → Secrets and variables → Actions:

1. **NPM_TOKEN** - For publishing to npm
   - Get from npmjs.com → Access Tokens
   - Type: "Automation"
   - Paste into GitHub secret

### Workflow Files

- `.github/workflows/ci.yml` - Runs on every push/PR (tests only)
- `.github/workflows/release.yml` - Runs on tags (builds + publishes)

## Troubleshooting

### "No binaries found"

**Problem:** Artifacts didn't upload from CI

**Solution:** Check GitHub Actions logs, ensure build succeeded

### "Binary doesn't work on user's platform"

**Problem:** Missing a platform or wrong architecture

**Solution:** Check supported platforms in release.yml matrix

### "npm publish fails with 401"

**Problem:** NPM_TOKEN not set or invalid

**Solution:**
1. Generate new token at npmjs.com
2. Add to GitHub secrets
3. Try again

### "Users can't install"

**Problem:** Native module not loading

**Solution:** Ensure all platform binaries are in the package

## Publishing Frequency

**Recommended:**

- **Patch releases** - Bug fixes, as needed
- **Minor releases** - New features, monthly
- **Major releases** - Breaking changes, rarely

## Beta Releases

Test releases before stable:

```bash
# Set version to beta
npm version 0.2.0-beta.1

# Publish with beta tag
npm publish --tag beta

# Users install with:
# npm install fetch-with-render@beta
```

## Summary

**Simple approach (for now):**
1. Use GitHub Actions to build on all platforms
2. Tag a release: `git tag v0.1.0 && git push --tags`
3. GitHub Actions builds everything
4. Manually download artifacts and publish

**Advanced approach (production):**
1. Use napi-rs artifact system
2. Publish platform-specific packages
3. Fully automated via GitHub Actions
4. Users only download what they need

Choose based on your needs. The GitHub Actions workflow is ready for both!
