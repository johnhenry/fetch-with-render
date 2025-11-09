/**
 * Options for rendering a page with JavaScript execution
 */
export interface RenderOptions {
  /**
   * Maximum time to wait for rendering in milliseconds
   * @default 5000
   */
  timeout?: number;

  /**
   * CSS selector to wait for before capturing HTML
   */
  waitFor?: string;

  /**
   * CSS selector to extract (returns only matching element's HTML)
   */
  selector?: string;

  /**
   * JavaScript code to execute before capturing HTML
   */
  script?: string;
}

/**
 * A wrapper around the native Response object that adds a .render() method
 * for executing JavaScript and returning the final rendered HTML using a native WebView.
 */
export class RenderableResponse implements Response {
  constructor(response: Response);

  /**
   * Renders the page using a native WebView and returns the final HTML
   * after JavaScript execution.
   *
   * @param options - Rendering options
   * @returns The rendered HTML
   */
  render(options?: RenderOptions): Promise<string>;

  // Standard Response properties and methods
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly type: ResponseType;
  readonly bodyUsed: boolean;
  readonly body: ReadableStream<Uint8Array> | null;

  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<any>;
  text(): Promise<string>;
  clone(): RenderableResponse;
}

/**
 * A drop-in replacement for Node's fetch that adds a .render() method
 * to the Response object for rendering pages with JavaScript execution.
 *
 * @param resource - The resource to fetch
 * @param options - Fetch options
 * @returns A Response with .render() method
 *
 * @example
 * ```ts
 * import fetch from 'fetch-with-render';
 *
 * const res = await fetch('https://example.com');
 * const html = await res.render({ timeout: 8000, waitFor: '.main' });
 * console.log(html);
 * ```
 */
declare function fetchWithRender(
  resource: string | URL | Request,
  options?: RequestInit
): Promise<RenderableResponse>;

export default fetchWithRender;
