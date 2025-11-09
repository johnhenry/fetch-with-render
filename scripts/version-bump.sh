#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: npm run bump <patch|minor|major>"
  exit 1
fi

BUMP_TYPE=$1

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Error: Bump type must be 'patch', 'minor', or 'major'"
  exit 1
fi

echo "🔄 Bumping version ($BUMP_TYPE)..."

# Bump npm version and capture new version
NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version | sed 's/v//')

echo "📦 Updated package.json to $NEW_VERSION"

# Update Cargo.toml
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/^version = \".*\"/version = \"$NEW_VERSION\"/" Cargo.toml
else
  # Linux
  sed -i "s/^version = \".*\"/version = \"$NEW_VERSION\"/" Cargo.toml
fi

echo "🦀 Updated Cargo.toml to $NEW_VERSION"

# Stage changes
git add package.json Cargo.toml

# Commit
git commit -m "Bump version to $NEW_VERSION

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "✅ Committed version bump"

# Create tag
git tag "v$NEW_VERSION"
echo "🏷️  Created tag v$NEW_VERSION"

# Push
git push && git push origin "v$NEW_VERSION"
echo "🚀 Pushed to remote"

echo ""
echo "✨ Version bumped to $NEW_VERSION and released!"
echo "   View workflow: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
