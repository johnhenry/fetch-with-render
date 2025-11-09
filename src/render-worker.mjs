/**
 * Worker process for rendering pages.
 *
 * This worker is spawned for each render to work around macOS EventLoop limitations.
 * It receives render requests via IPC and returns the rendered HTML.
 */

import { renderPage } from './native.mjs';

// Listen for render requests from parent process
process.on('message', async (request) => {
  try {
    const { url, options } = request;

    // Perform the render using the native module
    const html = renderPage(url, options || {});

    // Send result back to parent and wait for it to be sent
    process.send({ success: true, html }, () => {
      process.exit(0);
    });
  } catch (error) {

    // Send error back to parent and wait for it to be sent
    process.send({
      success: false,
      error: error.message || String(error)
    }, () => {
      process.exit(1);
    });
  }
});

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  process.send({
    success: false,
    error: `Uncaught exception: ${error.message || String(error)}`
  }, () => {
    process.exit(1);
  });
});

// Signal ready
process.send({ ready: true });
