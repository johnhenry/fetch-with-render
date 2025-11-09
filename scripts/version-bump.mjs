#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const bumpType = process.argv[2];

if (!bumpType || !['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('Usage: npm run bump <patch|minor|major>');
  process.exit(1);
}

console.log(`🔄 Bumping version (${bumpType})...`);

try {
  // Bump npm version
  execSync(`npm version ${bumpType} --no-git-tag-version`, { stdio: 'ignore' });
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const newVersion = pkg.version;

  console.log(`📦 Updated package.json to ${newVersion}`);

  // Update Cargo.toml
  const cargoToml = readFileSync('Cargo.toml', 'utf8');
  const updatedCargo = cargoToml.replace(
    /^version = ".*"/m,
    `version = "${newVersion}"`
  );
  writeFileSync('Cargo.toml', updatedCargo);

  console.log(`🦀 Updated Cargo.toml to ${newVersion}`);

  // Git operations
  execSync('git add package.json Cargo.toml package-lock.json Cargo.lock', { stdio: 'inherit' });

  const commitMessage = `Bump version to ${newVersion}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  console.log('✅ Committed version bump');

  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
  console.log(`🏷️  Created tag v${newVersion}`);

  execSync('git push && git push --tags', { stdio: 'inherit' });
  console.log('🚀 Pushed to remote');

  console.log('');
  console.log(`✨ Version bumped to ${newVersion} and released!`);

  // Try to get repo URL for workflow link
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const repoPath = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1];
    if (repoPath) {
      console.log(`   View workflow: https://github.com/${repoPath}/actions`);
    }
  } catch (e) {
    // Ignore if can't get remote URL
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
