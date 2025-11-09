import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Track render count to decide between direct call vs child process
let renderCount = 0;

/**
 * RenderableResponse - A wrapper around the native Response object
 * that adds a .render() method for executing JavaScript and returning
 * the final rendered HTML using a native WebView.
 */
export class RenderableResponse {
  #response;
  #url;

  constructor(response) {
    this.#response = response;
    this.#url = response.url;
  }

  /**
   * Renders the page using a native WebView and returns the final HTML
   * after JavaScript execution.
   *
   * @param {Object} options - Rendering options
   * @param {number} [options.timeout=5000] - Maximum time to wait for rendering in milliseconds
   * @param {string} [options.waitFor] - CSS selector to wait for before capturing HTML
   * @param {string} [options.selector] - CSS selector to extract (returns only matching element's HTML)
   * @param {string} [options.script] - JavaScript code to execute before capturing HTML
   * @returns {Promise<string>} The rendered HTML
   */
  async render(options = {}) {
    renderCount++;

    const renderOptions = {
      timeout: options.timeout,
      waitFor: options.waitFor,
      selector: options.selector,
      script: options.script,
    };

    // Remove undefined values
    Object.keys(renderOptions).forEach(
      key => renderOptions[key] === undefined && delete renderOptions[key]
    );

    // First render: Use direct native call (fastest, no process overhead)
    if (renderCount === 1) {
      const { renderPage } = await import('./native.js');
      return renderPage(this.#url, renderOptions);
    }

    // Subsequent renders: Use child process to avoid macOS EventLoop limitation
    return this.#renderInChildProcess(renderOptions);
  }

  /**
   * Renders the page in a child process.
   * This works around macOS EventLoop limitations by giving each render a fresh process.
   *
   * @private
   */
  async #renderInChildProcess(options) {
    return new Promise((resolve, reject) => {
      const workerPath = join(__dirname, 'render-worker.js');

      const child = fork(workerPath, [], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      });

      let workerReady = false;
      let resolved = false;
      const timeout = options.timeout || 5000;
      const killTimeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          child.kill();
          reject(new Error(`Render timeout after ${timeout}ms`));
        }
      }, timeout + 2000); // Give worker extra time beyond render timeout

      child.on('message', (message) => {
        if (message.ready) {
          workerReady = true;
          // Send render request to worker
          child.send({
            url: this.#url,
            options
          });
        } else if (message.success) {
          if (!resolved) {
            resolved = true;
            clearTimeout(killTimeout);
            resolve(message.html);
          }
        } else if (message.error) {
          if (!resolved) {
            resolved = true;
            clearTimeout(killTimeout);
            reject(new Error(message.error));
          }
        }
      });

      child.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(killTimeout);
          reject(error);
        }
      });

      child.on('exit', (code) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(killTimeout);
          if (code !== 0) {
            reject(new Error(`Worker process exited with code ${code}`));
          } else {
            reject(new Error('Worker exited without sending result'));
          }
        }
      });
    });
  }

  // Delegate all standard Response methods to the wrapped response
  get url() {
    return this.#response.url;
  }

  get status() {
    return this.#response.status;
  }

  get statusText() {
    return this.#response.statusText;
  }

  get headers() {
    return this.#response.headers;
  }

  get ok() {
    return this.#response.ok;
  }

  get redirected() {
    return this.#response.redirected;
  }

  get type() {
    return this.#response.type;
  }

  get bodyUsed() {
    return this.#response.bodyUsed;
  }

  get body() {
    return this.#response.body;
  }

  async arrayBuffer() {
    return this.#response.arrayBuffer();
  }

  async blob() {
    return this.#response.blob();
  }

  async formData() {
    return this.#response.formData();
  }

  async json() {
    return this.#response.json();
  }

  async text() {
    return this.#response.text();
  }

  clone() {
    return new RenderableResponse(this.#response.clone());
  }
}
