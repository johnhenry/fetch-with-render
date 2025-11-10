import { test, before, after } from 'node:test';
import { spawn } from 'node:child_process';
import assert from 'node:assert';
import fetch2 from '../dist/index.js';

const URL = 'http://localhost:8888/';
let serverProcess;

// Inline server (runs in separate process to avoid event loop contention)
const serverCode = `
import http from 'node:http';
const HTML = \`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>unloaded</title>
  </head>
  <body>
    <div id="content">❌</div>
    <script>
      window.addEventListener('load', () => {
        document.title = "loaded";
        document.getElementById('content').textContent = new DOMParser()
          .parseFromString('&#9989;', 'text/html')
          .documentElement.textContent;
      });
    </script>
  </body>
</html>\`;

http.createServer((_, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': Buffer.byteLength(HTML),
  });
  res.end(HTML);
}).listen(8888);
`;

before(async () => {
  serverProcess = spawn('node', ['--input-type=module', '-e', serverCode], {
    stdio: 'ignore'
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

after(async () => {
  serverProcess.kill();
  await new Promise((resolve) => setTimeout(resolve, 100));
});

test('Response.render() executes JavaScript', async () => {
  const text = await fetch(URL).then(r => r.text());
  assert(text.includes('❌'));
  assert(!text.includes('✅'));
  const rendered = await fetch2(URL).then(r => r.render());
  assert(rendered.includes('✅'));
  assert(!rendered.includes('❌'));
});
