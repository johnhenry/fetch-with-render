#!/usr/bin/env node

import fetch from '../dist/index.js';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const version = '0.1.14';

function showHelp() {
  console.log(`
fetch-with-render v${version} - Fetch with automatic JavaScript rendering

USAGE:
  fetch-with-render [OPTIONS] <URL>

DESCRIPTION:
  Like curl/wget, but automatically renders HTML pages with JavaScript.
  For HTML responses, returns the fully rendered HTML after JS execution.
  For non-HTML responses (JSON, text, etc.), returns content as-is.

OPTIONS:
  Basic:
    -h, --help              Show this help message
    -v, --version           Show version
    --verbose               Enable verbose/debug output
    --config <file>         Load configuration from file

  Rendering:
    -t, --timeout <ms>      Timeout for rendering in milliseconds (default: 5000)
    -w, --wait-for <sel>    CSS selector to wait for before capturing
    -s, --selector <sel>    CSS selector to extract specific element
    --script <code>         Execute JavaScript before capturing

  HTTP:
    -X, --method <method>   HTTP method (GET, POST, PUT, DELETE, etc.)
    -d, --data <data>       Request body data
    -H, --header <header>   Add custom header (format: "Name: Value")
    -A, --user-agent <ua>   Set custom User-Agent
    --cookie <cookie>       Send cookies (format: "name=value")
    --no-redirect           Don't follow redirects (default: follow)

  Output:
    -o, --output <file>     Write output to file instead of stdout
    -q, --quiet             Suppress progress indicators

EXAMPLES:
  # Fetch and render HTML page
  fetch-with-render https://example.com

  # Fetch API endpoint (returns JSON as-is)
  fetch-with-render https://api.example.com/data

  # Wait for element before capturing
  fetch-with-render -w ".content" https://spa-site.com

  # Extract specific element
  fetch-with-render -s "article" https://blog.com/post

  # POST request
  fetch-with-render -X POST -d '{"key":"value"}' \\
    -H "Content-Type: application/json" \\
    https://api.example.com

  # With authentication
  fetch-with-render -H "Authorization: Bearer token" https://api.example.com

  # Save to file
  fetch-with-render https://example.com -o page.html

  # Custom timeout
  fetch-with-render -t 10000 https://slow-site.com
`);
}

function parseArgs(args) {
  const options = {
    url: null,
    method: 'GET',
    data: null,
    timeout: 5000,
    waitFor: null,
    selector: null,
    script: null,
    headers: {},
    userAgent: null,
    cookies: [],
    followRedirect: true,
    verbose: false,
    quiet: false,
    outputFile: null,
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
        if (!options.url) {
          options.url = arg;
        } else {
          console.error('Error: Multiple URLs provided');
          process.exit(1);
        }
    }
  }

  // Load config file if specified
  if (options.configFile) {
    loadConfig(options);
  }

  if (!options.url) {
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

function showProgress(message) {
  console.error(`[${new Date().toISOString()}] ${message}`);
}

function isHtmlResponse(contentType) {
  if (!contentType) return false;
  return contentType.includes('text/html') || contentType.includes('application/xhtml');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  try {
    if (options.verbose) {
      showProgress(`Fetching: ${options.url}`);
    }

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
      showProgress(`Request: ${options.method} ${options.url}`);
      if (Object.keys(fetchOptions).length > 2 || fetchOptions.headers) {
        showProgress(`Options: ${JSON.stringify(fetchOptions, null, 2)}`);
      }
    }

    // Fetch the URL
    const startTime = Date.now();
    const response = await fetch(options.url, fetchOptions);

    if (!response.ok) {
      console.error(`Error: HTTP ${response.status} ${response.statusText}`);
      process.exit(1);
    }

    const contentType = response.headers.get('content-type');
    const isHtml = isHtmlResponse(contentType);

    if (options.verbose) {
      showProgress(`Response: ${response.status} ${response.statusText}`);
      showProgress(`Content-Type: ${contentType || 'unknown'}`);
      showProgress(`Is HTML: ${isHtml}`);
    }

    let output;

    if (isHtml) {
      // HTML response - render it
      if (options.verbose) {
        showProgress('Rendering HTML with JavaScript...');
      }

      const renderOptions = {};
      if (options.timeout) renderOptions.timeout = options.timeout;
      if (options.waitFor) renderOptions.waitFor = options.waitFor;
      if (options.selector) renderOptions.selector = options.selector;
      if (options.script) renderOptions.script = options.script;

      output = await response.render(renderOptions);

      if (options.verbose) {
        const elapsed = Date.now() - startTime;
        showProgress(`Rendered in ${elapsed}ms`);
        showProgress(`Output length: ${output.length} bytes`);
      }
    } else {
      // Non-HTML response - return as-is
      if (options.verbose) {
        showProgress('Non-HTML response, returning as-is');
      }

      output = await response.text();

      if (options.verbose) {
        const elapsed = Date.now() - startTime;
        showProgress(`Completed in ${elapsed}ms`);
        showProgress(`Output length: ${output.length} bytes`);
      }
    }

    // Write output
    if (options.outputFile) {
      writeFileSync(options.outputFile, output);
      if (!options.quiet) {
        console.error(`Output written to: ${options.outputFile}`);
      }
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
