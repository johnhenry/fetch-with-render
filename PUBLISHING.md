# Publishing Checklist

This document ensures the GitHub Actions workflow will successfully build and publish binaries.

## Pre-Publish Checklist

Before creating a release tag, verify:

### 1. NPM Token Setup
- [ ] `NPM_TOKEN` secret is configured in GitHub repository settings
  - Go to: Settings → Secrets and variables → Actions
  - Add secret named `NPM_TOKEN` with your npm access token
  - Get token from: https://www.npmjs.com/settings/YOUR_USERNAME/tokens

### 2. Package Configuration
- Version number is updated in `package.json`
- Repository URL is correct
- All files are included in `files` array

### 3. Local Build Test

Run these commands locally to verify everything builds:

\`\`\`bash
# Clean build
rm -rf dist/ *.node index.cjs index.js
npm install
npm run build

# Verify artifacts
ls -la *.node    # Should see platform-specific .node file
ls -la index.cjs # Should exist
ls -la dist/     # Should contain JS files

# Test it works
npm run demo
\`\`\`

### 4. Supported Platforms

✅ **macOS**
- x86_64 (Intel)
- aarch64 (Apple Silicon)

✅ **Linux**
- x86_64
- aarch64 (ARM64) - built using Docker/QEMU emulation

✅ **Windows**
- x86_64

## Publishing Process

### Step 1: Update Version
\`\`\`bash
npm version patch  # or minor, or major
\`\`\`

### Step 2: Push Tag
\`\`\`bash
git push origin main --tags
\`\`\`

### Step 3: Monitor GitHub Actions
1. Go to: https://github.com/johnhenry/fetch-with-render/actions
2. Watch the "Build and Release" workflow

The workflow will:
1. **Build** - Build binaries for all 5 platforms in parallel (macOS x64/ARM64, Linux x64/ARM64, Windows x64)
2. **Test** - Run tests on each platform (Linux ARM64 uses Docker for testing)
3. **Publish** - Publish to npm with all binaries (only on v* tags)
4. **Release** - Create GitHub release with binaries attached

### Step 4: Verify Publication
\`\`\`bash
npm view fetch-with-render
\`\`\`

## Troubleshooting

### NPM_TOKEN not set
Add it in GitHub repo settings: Settings → Secrets → Actions → New repository secret

### Workflow fails on test
Check that xvfb is being used on Linux (line 140 in release.yml)

### Binaries not included in package
Verify `package.json` files array includes `*.node` and `index.cjs`
