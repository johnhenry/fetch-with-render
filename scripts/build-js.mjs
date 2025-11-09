import { mkdir, copyFile, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function copyAndTransform(srcPath, destPath) {
  let content = await readFile(srcPath, 'utf-8');
  // Transform .mjs imports to .js
  content = content.replace(/from ['"]\.\/([^'"]+)\.mjs['"]/g, "from './$1.js'");
  await writeFile(destPath, content, 'utf-8');
}

async function build() {
  const distDir = join(projectRoot, 'dist');

  // Create dist directory
  await mkdir(distDir, { recursive: true });

  // Copy and transform source files
  await copyAndTransform(
    join(projectRoot, 'src', 'index.mjs'),
    join(distDir, 'index.js')
  );

  await copyAndTransform(
    join(projectRoot, 'src', 'response.mjs'),
    join(distDir, 'response.js')
  );

  await copyAndTransform(
    join(projectRoot, 'src', 'native.mjs'),
    join(distDir, 'native.js')
  );

  await copyAndTransform(
    join(projectRoot, 'src', 'render-worker.mjs'),
    join(distDir, 'render-worker.js')
  );

  // Copy TypeScript definitions if they exist (may not exist for cross-compiled targets)
  try {
    await copyFile(
      join(projectRoot, 'src', 'index.d.ts'),
      join(distDir, 'index.d.ts')
    );
    console.log('✓ TypeScript definitions copied to dist/');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('⚠ TypeScript definitions not found (expected for cross-compilation)');
    } else {
      throw err;
    }
  }

  console.log('✓ JavaScript files copied to dist/');
}

build().catch(console.error);
