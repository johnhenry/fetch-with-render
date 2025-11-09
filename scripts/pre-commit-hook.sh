#!/bin/bash
# Pre-commit hook to run linting checks
# To install: ln -s ../../scripts/pre-commit-hook.sh .git/hooks/pre-commit

set -e

echo "Running pre-commit checks..."
echo ""

# Check Rust formatting
echo "📝 Checking Rust formatting..."
if ! cargo fmt -- --check; then
    echo "❌ Rust formatting check failed!"
    echo "   Run 'npm run fmt' or 'cargo fmt' to fix formatting issues"
    exit 1
fi
echo "✅ Rust formatting passed"
echo ""

# Run clippy
echo "🔍 Running Clippy..."
if ! cargo clippy -- -D warnings; then
    echo "❌ Clippy check failed!"
    echo "   Fix the warnings above before committing"
    exit 1
fi
echo "✅ Clippy passed"
echo ""

echo "✅ All pre-commit checks passed!"
