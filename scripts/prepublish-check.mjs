#!/usr/bin/env node

/**
 * Pre-publish validation script
 *
 * Checks that everything is ready for publishing:
 * - JavaScript is built
 * - At least one native binary exists (ideally all platforms)
 * - TypeScript definitions exist
 */

import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const REQUIRED_PLATFORMS = [
  'darwin-arm64',
  'linux-x64-gnu',
  'linux-arm64-gnu',
  'win32-x64-msvc',
];

const OPTIONAL_PLATFORMS = [
  'darwin-x64', // Optional: Users can compile from source if needed
];

async function check() {
  let hasErrors = false;
  let hasWarnings = false;

  console.log('🔍 Pre-publish validation...\n');

  // Check dist directory exists
  if (!existsSync(join(projectRoot, 'dist'))) {
    console.error('❌ dist/ directory not found');
    console.error('   Run: npm run build:js\n');
    hasErrors = true;
  } else {
    console.log('✅ dist/ directory exists');
  }

  // Check JavaScript files
  const jsFiles = ['index.js', 'response.js', 'native.js'];
  for (const file of jsFiles) {
    if (!existsSync(join(projectRoot, 'dist', file))) {
      console.error(`❌ dist/${file} not found`);
      hasErrors = true;
    } else {
      console.log(`✅ dist/${file} exists`);
    }
  }

  // Check TypeScript definitions
  if (!existsSync(join(projectRoot, 'dist', 'index.d.ts'))) {
    console.error('❌ dist/index.d.ts not found');
    hasErrors = true;
  } else {
    console.log('✅ dist/index.d.ts exists');
  }

  console.log('');

  // Check for native binaries
  const files = await readdir(projectRoot);
  const nodeFiles = files.filter(f => f.endsWith('.node'));

  if (nodeFiles.length === 0) {
    console.error('❌ No .node binaries found!');
    console.error('   This package will NOT work when installed.\n');
    console.error('   You need to either:');
    console.error('   1. Build locally: npm run build:rust');
    console.error('   2. Download from CI artifacts (see PUBLISHING.md)');
    console.error('   3. Use GitHub Actions to build and publish\n');
    hasErrors = true;
  } else {
    console.log(`✅ Found ${nodeFiles.length} native binary(ies):`);
    nodeFiles.forEach(f => console.log(`   - ${f}`));
  }

  // Check if we have all platforms
  const foundPlatforms = nodeFiles
    .map(f => f.replace('fetch-with-render.', '').replace('.node', ''))
    .filter(p => p !== 'fetch-with-render'); // handle unnamed .node file

  const missingPlatforms = REQUIRED_PLATFORMS.filter(
    p => !foundPlatforms.includes(p)
  );

  if (missingPlatforms.length > 0) {
    console.log('\n⚠️  Missing binaries for some platforms:');
    missingPlatforms.forEach(p => console.log(`   - ${p}`));
    console.log('\n   Users on these platforms will need to compile from source.');
    console.log('   For full cross-platform support, build on CI (see PUBLISHING.md)\n');
    hasWarnings = true;
  } else {
    console.log('\n✅ All target platforms covered!\n');
  }

  // Check versions match
  const packageJson = await import(join(projectRoot, 'package.json'), {
    with: { type: 'json' }
  });

  const cargoToml = await import('fs').then(fs =>
    fs.promises.readFile(join(projectRoot, 'Cargo.toml'), 'utf-8')
  );

  const cargoVersion = cargoToml.match(/version = "(.+?)"/)?.[1];
  const npmVersion = packageJson.default.version;

  if (cargoVersion !== npmVersion) {
    console.error(`❌ Version mismatch!`);
    console.error(`   package.json: ${npmVersion}`);
    console.error(`   Cargo.toml:   ${cargoVersion}`);
    console.error('   Update both to match.\n');
    hasErrors = true;
  } else {
    console.log(`✅ Versions match: ${npmVersion}\n`);
  }

  // Summary
  if (hasErrors) {
    console.error('❌ Pre-publish validation FAILED');
    console.error('   Fix errors above before publishing.\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Pre-publish validation passed with warnings');
    console.log('   Consider addressing warnings for best user experience.\n');
  } else {
    console.log('✅ Pre-publish validation PASSED');
    console.log('   Package is ready to publish!\n');
  }
}

check().catch(err => {
  console.error('❌ Validation script error:', err.message);
  process.exit(1);
});
