#!/bin/bash

# Advanced CLI features demonstration

echo "========================================="
echo "fetch-text CLI - Advanced Features Demo"
echo "========================================="
echo ""

# Test 1: JSON output format
echo "1. JSON Output Format"
echo "Command: fetch-text -f json https://example.com"
echo "-----------------------------------------"
node bin/cli.mjs -f json https://example.com | head -10
echo "... (truncated)"
echo ""

# Test 2: Markdown output format
echo "========================================="
echo ""
echo "2. Markdown Output Format"
echo "Command: fetch-text -f markdown https://example.com"
echo "-----------------------------------------"
node bin/cli.mjs -f markdown https://example.com
echo ""

# Test 3: Verbose mode
echo "========================================="
echo ""
echo "3. Verbose/Debug Mode"
echo "Command: fetch-text --verbose https://example.com"
echo "-----------------------------------------"
node bin/cli.mjs --verbose https://example.com 2>&1 | head -6
echo "... (truncated)"
echo ""

# Test 4: Custom User-Agent
echo "========================================="
echo ""
echo "4. Custom User-Agent"
echo "Command: fetch-text -A \"MyBot/1.0\" --verbose https://example.com"
echo "-----------------------------------------"
echo "(Would send custom User-Agent header)"
echo ""

# Test 5: Custom Headers
echo "========================================="
echo ""
echo "5. Custom Headers"
echo "Command: fetch-text -H \"Accept: application/json\" --verbose https://example.com"
echo "-----------------------------------------"
echo "(Would send custom Accept header)"
echo ""

# Test 6: Batch processing
echo "========================================="
echo ""
echo "6. Batch Processing from File"
echo "Command: fetch-text -i urls.txt -q"
echo "-----------------------------------------"
echo "Processing multiple URLs from file..."
echo "(See examples/urls.example.txt for format)"
echo ""

# Test 7: Output to file
echo "========================================="
echo ""
echo "7. Output to File"
echo "Command: fetch-text https://example.com -o /tmp/output.txt"
echo "-----------------------------------------"
node bin/cli.mjs https://example.com -o /tmp/output.txt 2>&1
cat /tmp/output.txt
rm -f /tmp/output.txt
echo ""

# Test 8: Config file
echo "========================================="
echo ""
echo "8. Configuration File"
echo "Command: fetch-text --config config.json https://example.com"
echo "-----------------------------------------"
echo "You can store default settings in a JSON file:"
cat examples/config.example.json
echo ""

echo "========================================="
echo "Demo complete!"
echo "========================================="
echo ""
echo "All new features:"
echo "  ✓ Custom headers (-H)"
echo "  ✓ Custom User-Agent (-A)"
echo "  ✓ Cookies (--cookie)"
echo "  ✓ Redirect control (--no-redirect)"
echo "  ✓ Output formats (-f text|html|markdown|json)"
echo "  ✓ Batch processing (-i)"
echo "  ✓ Output to file (-o)"
echo "  ✓ Verbose mode (--verbose)"
echo "  ✓ Quiet mode (-q)"
echo "  ✓ Config files (--config)"
echo ""
