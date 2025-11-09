import fetch from '../dist/index.js';

/**
 * Basic example of using fetch-with-render
 */

async function main() {
  console.log('Fetching example.com...');

  const res = await fetch('https://example.com');

  console.log(`Status: ${res.status} ${res.statusText}`);
  console.log(`URL: ${res.url}`);

  console.log('\nRendering page with JavaScript execution...');

  const html = await res.render({
    timeout: 8000,
  });

  console.log(`\nRendered HTML length: ${html.length} characters`);
  console.log('\nFirst 500 characters:');
  console.log(html.substring(0, 500));
}

main().catch(console.error);
