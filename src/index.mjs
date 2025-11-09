import { RenderableResponse } from './response.mjs';

/**
 * A drop-in replacement for Node's fetch that adds a .render() method
 * to the Response object for rendering pages with JavaScript execution.
 *
 * @param {string | URL | Request} resource - The resource to fetch
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<RenderableResponse>} A Response with .render() method
 *
 * @example
 * ```js
 * import fetch from 'fetch-with-render';
 *
 * const res = await fetch('https://example.com');
 * const html = await res.render({ timeout: 8000, waitFor: '.main' });
 * console.log(html);
 * ```
 */
async function fetchWithRender(resource, options) {
  // Use Node's native fetch
  const response = await fetch(resource, options);

  // Wrap in RenderableResponse
  return new RenderableResponse(response);
}

export default fetchWithRender;

// Also export the RenderableResponse class for advanced usage
export { RenderableResponse };
