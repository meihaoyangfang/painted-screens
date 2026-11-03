#!/usr/bin/env node
/**
 * Screenshot the preview through CDP, in real time.
 *
 * `--virtual-time-budget` (used by tools/shoot.mjs) fast-forwards timers but
 * starves requestAnimationFrame — about 3 frames in 14 s — so anything
 * animated (the train loop) never appears. This script keeps the page in real
 * time instead: launch headless Chrome with a debugging port, navigate, wait,
 * then capture.
 *
 * Usage: node tools/shoot-live.mjs [--wait 6000]
 */
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import net from 'node:net';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const waitMs = Number(arg('wait', '6000'));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const port = await freePort();
const profile = path.join(root, 'preview/.chrome-live');

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-breakpad',
    '--disable-crash-reporter',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--user-data-dir=' + profile,
    '--window-size=1440,900',
    '--force-device-scale-factor=1',
    '--remote-debugging-port=' + port,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

async function version() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return res.json();
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error('chrome devtools endpoint never came up');
}

const shots = [
  ['noir', '?skin=noir-cathedral'],
  ['ink-bamboo', '?skin=ink-bamboo'],
  ['velvet-sin', '?skin=velvet-sin'],
  ['panel', '?skin=last-train&panel=1'],
];

try {
  await version();
  await mkdir(path.join(root, 'preview/shots'), { recursive: true });

  for (const [name, query] of shots) {
    const url = 'file://' + path.join(root, 'preview/index.html') + query;
    const created = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, {
      method: 'PUT',
    }).then((r) => r.json());

    const ws = new WebSocket(created.webSocketDebuggerUrl);
    let id = 0;
    const pending = new Map();

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    });

    const send = (method, params = {}) =>
      new Promise((resolve) => {
        id += 1;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await new Promise((resolve) => ws.addEventListener('open', resolve));
    await send('Page.enable');
    await sleep(waitMs);

    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if (!shot || !shot.data) {
      console.error('shoot-live: ' + name + ' captured nothing');
      process.exitCode = 1;
    } else {
      await writeFile(path.join(root, 'preview/shots', name + '.png'), Buffer.from(shot.data, 'base64'));
      console.log('shoot-live: ' + name + '.png');
    }

    ws.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${created.id}`).catch(() => {});
  }

  console.log('shoot-live: done → preview/shots/');
} finally {
  chrome.kill('SIGTERM');
}
