import fetch from '../dist/index.js';

/**
 * Advanced example demonstrating all render options
 */

async function scrapeHackerNews() {
  console.log('Fetching Hacker News...\n');

  const res = await fetch('https://news.ycombinator.com');

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  // Render with options
  const html = await res.render({
    timeout: 10000,
    waitFor: '.itemlist', // Wait for the story list to load
    script: `
      // Remove unnecessary elements
      document.querySelectorAll('.spacer').forEach(el => el.remove());

      // Highlight top story
      const topStory = document.querySelector('.athing');
      if (topStory) {
        topStory.style.backgroundColor = '#ffffcc';
      }
    `,
  });

  console.log(`Rendered HTML length: ${html.length} characters`);

  // Extract just the story list
  const res2 = await fetch('https://news.ycombinator.com');
  const storyList = await res2.render({
    timeout: 10000,
    selector: '.itemlist', // Extract only the story list
  });

  console.log(`\nStory list HTML length: ${storyList.length} characters`);
  console.log('\nFirst 300 characters of story list:');
  console.log(storyList.substring(0, 300));
}

async function handleSPA() {
  console.log('\n\nExample: Handling a Single Page App');
  console.log('=====================================\n');

  // This example shows how to wait for dynamic content
  const res = await fetch('https://jsonplaceholder.typicode.com/');

  const html = await res.render({
    timeout: 8000,
    waitFor: 'body', // Wait for basic structure
    script: `
      // Inject some dynamic content for demo
      const div = document.createElement('div');
      div.id = 'dynamic-content';
      div.textContent = 'This was added by JavaScript!';
      document.body.appendChild(div);
    `,
  });

  const hasDynamicContent = html.includes('This was added by JavaScript!');
  console.log(`Dynamic content rendered: ${hasDynamicContent}`);
}

async function main() {
  try {
    await scrapeHackerNews();
    await handleSPA();
  } catch (err) {
    console.error('Error:', err.message);

    if (err.message.includes('RenderTimeoutError')) {
      console.error('\nThe page took too long to render. Try increasing the timeout.');
    }
  }
}

main().catch(console.error);
