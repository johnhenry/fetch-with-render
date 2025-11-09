import { test } from 'node:test';
import assert from 'node:assert';
import fetch from '../dist/index.js';

test('fetch returns RenderableResponse', async () => {
  const res = await fetch('https://example.com');

  assert.ok(res, 'Response should exist');
  assert.ok(res.render, 'Response should have render method');
  assert.strictEqual(typeof res.render, 'function', 'render should be a function');
});

test('RenderableResponse delegates standard properties', async () => {
  const res = await fetch('https://example.com');

  assert.ok(res.url, 'Should have url property');
  assert.strictEqual(typeof res.status, 'number', 'Should have status property');
  assert.strictEqual(typeof res.ok, 'boolean', 'Should have ok property');
  assert.ok(res.headers, 'Should have headers property');
});

test('RenderableResponse can call text()', async () => {
  const res = await fetch('https://example.com');
  const text = await res.text();

  assert.ok(text, 'Should return text');
  assert.strictEqual(typeof text, 'string', 'Text should be a string');
  assert.ok(text.includes('Example Domain'), 'Should contain expected content');
});

test('render() returns HTML string', async (t) => {
  // Skip on Linux due to WebView headless limitations
  if (process.platform === 'linux') {
    t.skip('Skipping render test on Linux (headless WebView not fully supported)');
    return;
  }

  const res = await fetch('https://example.com');
  const html = await res.render({ timeout: 10000 });

  assert.ok(html, 'Should return HTML');
  assert.strictEqual(typeof html, 'string', 'HTML should be a string');
  assert.ok(html.includes('<html'), 'Should contain HTML tag');
});

test('render() accepts options', async (t) => {
  // Skip on Linux due to WebView headless limitations
  if (process.platform === 'linux') {
    t.skip('Skipping render test on Linux (headless WebView not fully supported)');
    return;
  }

  const res = await fetch('https://example.com');
  const html = await res.render({
    timeout: 5000,
    script: 'document.title = "Modified"',
  });

  assert.ok(html, 'Should return HTML with custom script');
});
