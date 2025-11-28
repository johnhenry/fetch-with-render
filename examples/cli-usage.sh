#!/bin/bash

# Real-world examples of using fetch-text CLI

echo "=== fetch-text CLI Usage Examples ==="
echo ""

# Example 1: Simple web scraping
echo "Example 1: Scraping text from a simple page"
echo "Command: fetch-text https://example.com"
echo ""
node ../bin/cli.mjs https://example.com
echo ""
echo "---"
echo ""

# Example 2: Getting word count
echo "Example 2: Getting word count from a page"
echo "Command: fetch-text https://example.com | wc -w"
echo ""
WORD_COUNT=$(node ../bin/cli.mjs https://example.com | wc -w)
echo "Word count: $WORD_COUNT"
echo ""
echo "---"
echo ""

# Example 3: Saving to file
echo "Example 3: Saving content to a file"
echo "Command: fetch-text https://example.com > /tmp/page.txt"
echo ""
node ../bin/cli.mjs https://example.com > /tmp/page.txt
echo "Saved to /tmp/page.txt ($(wc -c < /tmp/page.txt) bytes)"
cat /tmp/page.txt
echo ""
echo "---"
echo ""

# Example 4: Raw HTML
echo "Example 4: Getting raw HTML"
echo "Command: fetch-text --raw https://example.com | head -3"
echo ""
node ../bin/cli.mjs --raw https://example.com | head -3
echo "..."
echo ""
echo "---"
echo ""

# Example 5: Search for text
echo "Example 5: Searching for specific text"
echo "Command: fetch-text https://example.com | grep -i 'domain'"
echo ""
node ../bin/cli.mjs https://example.com | grep -i 'domain'
echo ""
echo "---"
echo ""

echo "=== More Examples ==="
echo ""
echo "# Extract article from a blog (with rendering)"
echo "fetch-text -r -s 'article' https://blog.com/post"
echo ""
echo "# Monitor a status page"
echo "fetch-text -r -w '.status-ok' https://status.example.com"
echo ""
echo "# Remove ads before extraction"
echo "fetch-text -r --script \"document.querySelectorAll('.ad').forEach(x => x.remove())\" https://news.com"
echo ""
echo "# Custom timeout for slow sites"
echo "fetch-text -r -t 10000 https://slow-site.com"
echo ""
echo "# Chain with other tools"
echo "fetch-text https://example.com | tr '[:upper:]' '[:lower:]' | sort | uniq"
echo ""

# Cleanup
rm -f /tmp/page.txt
