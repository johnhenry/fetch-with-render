#!/usr/bin/env node

import fetch from '../dist/index.js';
import { JSDOM } from 'jsdom';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import TurndownService from 'turndown';

const version = '0.1.14';

function showHelp() {
  console.log(`
fetch-text v${version} - Fetch URLs and extract text content

USAGE:
  fetch-text [OPTIONS] <URL | URL-FILE>

OPTIONS:
  Basic:
    -h, --help              Show this help message
    -v, --version           Show version
    --verbose               Enable verbose/debug output
    --config <file>         Load configuration from file

  Rendering:
    -r, --render            Render JavaScript before extracting text (slower)
    -t, --timeout <ms>      Timeout for rendering in milliseconds (default: 5000)
    -w, --wait-for <sel>    CSS selector to wait for before extracting
    -s, --selector <sel>    CSS selector to extract specific element
    --script <code>         Execute JavaScript before extracting

  Output:
    --raw                   Output raw HTML instead of text
    -f, --format <type>     Output format: text|html|markdown|json (default: text)
    -q, --quiet             Suppress progress indicators

  HTTP:
    -X, --method <method>   HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
    -d, --data <data>       Request body data
    -H, --header <header>   Add custom header (format: "Name: Value")
    -A, --user-agent <ua>   Set custom User-Agent
    --cookie <cookie>       Send cookies (format: "name=value")
    --no-redirect           Don't follow redirects (default: follow)

  Batch:
    -i, --input <file>      Read URLs from file (one per line)
    -o, --output <file>     Write output to file instead of stdout

EXAMPLES:
  # Simple text extraction
  fetch-text https://example.com

  # With JavaScript rendering
  fetch-text -r https://spa-site.com

  # Custom headers
  fetch-text -H "Authorization: Bearer token123" https://api.example.com

  # Custom User-Agent
  fetch-text -A "MyBot/1.0" https://example.com

  # Markdown output
  fetch-text -f markdown https://example.com

  # JSON output with metadata
  fetch-text -f json https://example.com

  # Batch processing
  fetch-text -i urls.txt -o results.txt

  # With cookies
  fetch-text --cookie "session=abc123" https://example.com

  # Verbose mode
  fetch-text --verbose https://example.com

  # Load config file
  fetch-text --config ~/.fetch-text.json https://example.com

  # Custom HTTP method
  fetch-text -X POST -d '{"key":"value"}' -H "Content-Type: application/json" https://api.example.com

  # PUT request
  fetch-text -X PUT -d "data" https://api.example.com/resource/123
`);
}

function parseArgs(args) {
  const options = {
    urls: [],
    inputFile: null,
    outputFile: null,
    method: 'GET',
    data: null,
    render: false,
    timeout: 5000,
    waitFor: null,
    selector: null,
    raw: false,
    format: 'text',
    script: null,
    headers: {},
    userAgent: null,
    cookies: [],
    followRedirect: true,
    verbose: false,
    quiet: false,
    configFile: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-h':
      case '--help':
        showHelp();
        process.exit(0);
        break;

      case '-v':
      case '--version':
        console.log(version);
        process.exit(0);
        break;

      case '--verbose':
        options.verbose = true;
        break;

      case '-q':
      case '--quiet':
        options.quiet = true;
        break;

      case '--config':
        i++;
        options.configFile = args[i];
        break;

      case '-X':
      case '--method':
        i++;
        options.method = args[i].toUpperCase();
        break;

      case '-d':
      case '--data':
        i++;
        options.data = args[i];
        break;

      case '-r':
      case '--render':
        options.render = true;
        break;

      case '-t':
      case '--timeout':
        i++;
        options.timeout = parseInt(args[i], 10);
        if (isNaN(options.timeout)) {
          console.error('Error: timeout must be a number');
          process.exit(1);
        }
        break;

      case '-w':
      case '--wait-for':
        i++;
        options.waitFor = args[i];
        break;

      case '-s':
      case '--selector':
        i++;
        options.selector = args[i];
        break;

      case '--raw':
        options.raw = true;
        break;

      case '-f':
      case '--format':
        i++;
        options.format = args[i];
        if (!['text', 'html', 'markdown', 'json'].includes(options.format)) {
          console.error('Error: format must be text, html, markdown, or json');
          process.exit(1);
        }
        break;

      case '--script':
        i++;
        options.script = args[i];
        break;

      case '-H':
      case '--header':
        i++;
        const headerParts = args[i].split(':');
        if (headerParts.length < 2) {
          console.error('Error: header must be in format "Name: Value"');
          process.exit(1);
        }
        const headerName = headerParts[0].trim();
        const headerValue = headerParts.slice(1).join(':').trim();
        options.headers[headerName] = headerValue;
        break;

      case '-A':
      case '--user-agent':
        i++;
        options.userAgent = args[i];
        break;

      case '--cookie':
        i++;
        options.cookies.push(args[i]);
        break;

      case '--no-redirect':
        options.followRedirect = false;
        break;

      case '-i':
      case '--input':
        i++;
        options.inputFile = args[i];
        break;

      case '-o':
      case '--output':
        i++;
        options.outputFile = args[i];
        break;

      default:
        if (arg.startsWith('-')) {
          console.error(`Error: Unknown option '${arg}'`);
          console.error('Run with --help for usage information');
          process.exit(1);
        }
        options.urls.push(arg);
    }
  }

  // Load config file if specified
  if (options.configFile) {
    loadConfig(options);
  }

  // Load URLs from input file if specified
  if (options.inputFile) {
    loadUrlsFromFile(options);
  }

  if (options.urls.length === 0) {
    console.error('Error: No URL provided');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  return options;
}

function loadConfig(options) {
  try {
    let configPath = options.configFile;

    // Expand ~ to home directory
    if (configPath.startsWith('~/')) {
      configPath = join(homedir(), configPath.slice(2));
    }

    if (!existsSync(configPath)) {
      console.error(`Error: Config file not found: ${configPath}`);
      process.exit(1);
    }

    const configData = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);

    // Merge config into options (command line args take precedence)
    if (config.timeout !== undefined && options.timeout === 5000) {
      options.timeout = config.timeout;
    }
    if (config.userAgent && !options.userAgent) {
      options.userAgent = config.userAgent;
    }
    if (config.headers && Object.keys(options.headers).length === 0) {
      options.headers = { ...config.headers };
    }
    if (config.cookies && options.cookies.length === 0) {
      options.cookies = [...config.cookies];
    }
    if (config.format && options.format === 'text') {
      options.format = config.format;
    }
    if (config.followRedirect !== undefined) {
      options.followRedirect = config.followRedirect;
    }
    if (config.method && options.method === 'GET') {
      options.method = config.method.toUpperCase();
    }
    if (config.data && !options.data) {
      options.data = config.data;
    }

    if (options.verbose) {
      console.error(`Loaded config from: ${configPath}`);
    }
  } catch (error) {
    console.error(`Error loading config: ${error.message}`);
    process.exit(1);
  }
}

function loadUrlsFromFile(options) {
  try {
    const fileContent = readFileSync(options.inputFile, 'utf-8');
    const urls = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));

    options.urls = [...options.urls, ...urls];

    if (options.verbose) {
      console.error(`Loaded ${urls.length} URLs from: ${options.inputFile}`);
    }
  } catch (error) {
    console.error(`Error reading input file: ${error.message}`);
    process.exit(1);
  }
}

function extractText(html) {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove script and style elements
    const unwanted = document.querySelectorAll('script, style, noscript');
    unwanted.forEach(el => el.remove());

    // Get text content and clean it up
    const text = document.body.textContent || '';

    // Normalize whitespace
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  } catch (error) {
    console.error('Error parsing HTML:', error.message);
    return html;
  }
}

function htmlToMarkdown(html) {
  try {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    return turndownService.turndown(html);
  } catch (error) {
    console.error('Error converting to markdown:', error.message);
    return html;
  }
}

function formatOutput(content, format, url, metadata = {}) {
  switch (format) {
    case 'html':
      return content;

    case 'markdown':
      return htmlToMarkdown(content);

    case 'json':
      return JSON.stringify({
        url,
        timestamp: new Date().toISOString(),
        content: extractText(content),
        html: content,
        ...metadata,
      }, null, 2);

    case 'text':
    default:
      return extractText(content);
  }
}

function showProgress(message) {
  console.error(`[${new Date().toISOString()}] ${message}`);
}

async function fetchUrl(url, options) {
  const startTime = Date.now();

  if (options.verbose) {
    showProgress(`Fetching: ${url}`);
  } else if (!options.quiet && options.urls.length > 1) {
    showProgress(`Processing: ${url}`);
  }

  try {
    // Build fetch options
    const fetchOptions = {
      method: options.method,
      redirect: options.followRedirect ? 'follow' : 'manual',
    };

    // Add request body if provided
    if (options.data) {
      fetchOptions.body = options.data;
    }

    // Add headers
    if (Object.keys(options.headers).length > 0 || options.userAgent || options.cookies.length > 0) {
      fetchOptions.headers = { ...options.headers };

      if (options.userAgent) {
        fetchOptions.headers['User-Agent'] = options.userAgent;
      }

      if (options.cookies.length > 0) {
        fetchOptions.headers['Cookie'] = options.cookies.join('; ');
      }
    }

    if (options.verbose) {
      showProgress(`Fetch options: ${JSON.stringify(fetchOptions, null, 2)}`);
    }

    // Fetch the URL
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    let html;
    const metadata = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    };

    // Render if requested
    if (options.render) {
      if (options.verbose) {
        showProgress('Rendering with JavaScript...');
      }

      const renderOptions = {};
      if (options.timeout) renderOptions.timeout = options.timeout;
      if (options.waitFor) renderOptions.waitFor = options.waitFor;
      if (options.selector) renderOptions.selector = options.selector;
      if (options.script) renderOptions.script = options.script;

      html = await response.render(renderOptions);
      metadata.rendered = true;
    } else {
      html = await response.text();
      metadata.rendered = false;
    }

    const elapsed = Date.now() - startTime;
    metadata.fetchTime = elapsed;

    if (options.verbose) {
      showProgress(`Completed in ${elapsed}ms`);
      showProgress(`Content length: ${html.length} bytes`);
    }

    // Format output based on options
    let output;
    if (options.raw) {
      output = html;
    } else {
      output = formatOutput(html, options.format, url, metadata);
    }

    return { success: true, url, output, metadata };

  } catch (error) {
    if (options.verbose) {
      showProgress(`Error: ${error.message}`);
    }
    return { success: false, url, error: error.message };
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const results = [];
  let outputBuffer = '';

  // Process all URLs
  for (let i = 0; i < options.urls.length; i++) {
    const url = options.urls[i];
    const result = await fetchUrl(url, options);
    results.push(result);

    if (result.success) {
      if (options.urls.length === 1) {
        // Single URL - output directly
        outputBuffer = result.output;
      } else {
        // Multiple URLs - format with separators
        outputBuffer += `\n${'='.repeat(70)}\n`;
        outputBuffer += `URL: ${result.url}\n`;
        outputBuffer += `${'='.repeat(70)}\n`;
        outputBuffer += result.output;
        outputBuffer += '\n';
      }
    } else {
      const errorMsg = `Error fetching ${result.url}: ${result.error}`;
      if (!options.quiet) {
        console.error(errorMsg);
      }
      if (options.urls.length > 1) {
        outputBuffer += `\n${errorMsg}\n`;
      }
    }
  }

  // Write output
  if (options.outputFile) {
    try {
      const { writeFileSync } = await import('fs');
      writeFileSync(options.outputFile, outputBuffer);
      if (!options.quiet) {
        console.error(`Output written to: ${options.outputFile}`);
      }
    } catch (error) {
      console.error(`Error writing output file: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(outputBuffer);
  }

  // Exit with error if any URLs failed
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    if (options.verbose) {
      showProgress(`Failed: ${failures.length}/${results.length} URLs`);
    }
    process.exit(1);
  }

  if (options.verbose) {
    showProgress(`Successfully processed ${results.length} URL(s)`);
  }
}

main();
