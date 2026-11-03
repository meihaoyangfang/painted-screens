#!/usr/bin/env node
/**
 * Capture one preview URL in real time (CSS animations included).
 *
 *   node tools/shoot-one.mjs --url "preview/index.html?skin=big-fat-fish&boot=1" \
 *     --out preview/shots/boot.png --wait 900 [--width 1440] [--height 900]
 *
 * Unlike tools/shoot.mjs (virtual time, which starves rAF and CSS animation),
 * this keeps headless Chrome running in real time and grabs the frame when the
 * page has settled. No network, no DSH install, no profile changes.
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
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
};

const rel = arg('url', 'preview/index.html?skin=big-fat-fish');
const out = path.resolve(root, arg('out', 'preview/shots/shot.png'));
const wait = Number(arg('wait', '1200'));
const click = arg('click', '');
const evalJs = arg('eval', '');
const clipSel = arg('clip', '');
const width = Number(arg('width', '1440'));
const height = Number(arg('height', '900'));
const url = 'file://' + path.resolve(root, rel);

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
const profile = path.join(root, 'preview/.chrome-one');
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-crashpad',
  '--disable-breakpad',
  '--disable-crash-reporter',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--user-data-dir=' + profile,
  '--window-size=' + width + ',' + height,
  '--force-device-scale-factor=1',
  '--remote-debugging-port=' + port,
  'about:blank',
], { stdio: 'ignore' });

try {
  let ready = false;
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) { ready = true; break; }
    } catch { /* not up yet */ }
    await sleep(150);
  }
  if (!ready) throw new Error('chrome devtools endpoint never came up');

  const created = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' }).then((r) => r.json());
  const ws = new WebSocket(created.webSocketDebuggerUrl);
  let seq = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) => new Promise((resolve) => {
    seq += 1;
    pending.set(seq, resolve);
    ws.send(JSON.stringify({ id: seq, method, params }));
  });

  await new Promise((resolve) => ws.addEventListener('open', resolve));
  await send('Page.enable');
  await send('Runtime.enable');
  await sleep(wait);
  if (click) {
    await send('Runtime.evaluate', {
      expression: `(function(){const el=document.querySelector(${JSON.stringify(click)});if(el){el.click();return true;}return false;})()`,
      returnByValue: true,
    });
    await sleep(600);
  }
  if (evalJs) {
    await send('Runtime.evaluate', { expression: evalJs, returnByValue: true });
    await sleep(500);
  }
  let clip;
  if (clipSel) {
    const box = await send('Runtime.evaluate', {
      expression: `(function(){const el=document.querySelector(${JSON.stringify(clipSel)});if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()`,
      returnByValue: true,
    });
    const rect = box && box.result && box.result.value;
    if (rect) clip = { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 2 };
  }
  const shot = await send('Page.captureScreenshot', clip
    ? { format: 'png', clip }
    : { format: 'png', captureBeyondViewport: false });
  if (!shot || !shot.data) throw new Error('captured nothing');
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(shot.data, 'base64'));
  console.log('shoot-one: ' + path.relative(root, out));
  ws.close();
  await fetch(`http://127.0.0.1:${port}/json/close/${created.id}`).catch(() => {});
} finally {
  chrome.kill('SIGTERM');
}
