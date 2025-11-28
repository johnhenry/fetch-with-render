#!/bin/bash

# Demo script for fetch-text CLI
# Run this after: npm install && npm link

echo "========================================="
echo "fetch-text CLI Demo"
echo "========================================="
echo ""

echo "1. Simple text extraction from example.com"
echo "Command: fetch-text https://example.com"
echo "-----------------------------------------"
node bin/cli.mjs https://example.com
echo ""

echo "========================================="
echo ""

echo "2. Raw HTML output"
echo "Command: fetch-text --raw https://example.com"
echo "-----------------------------------------"
node bin/cli.mjs --raw https://example.com | head -5
echo "... (truncated)"
echo ""

echo "========================================="
echo ""

echo "3. Version info"
echo "Command: fetch-text --version"
echo "-----------------------------------------"
node bin/cli.mjs --version
echo ""

echo "========================================="
echo "Demo complete!"
echo "========================================="
echo ""
echo "Try these commands:"
echo "  npm link                    # Install globally"
echo "  fetch-text --help           # Show help"
echo "  fetch-text <URL>            # Fetch any URL"
echo "  fetch-text -r <URL>         # Fetch with JS rendering"
echo ""
