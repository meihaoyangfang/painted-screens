#!/usr/bin/env node
/**
 * Re-render the preview screenshots in preview/shots/.
 *
 * Drives the local Chrome build in headless mode against preview/index.html.
 * No network, no DSH install, no profile changes.
 *
 * Usage: node tools/shoot.mjs [--width 1440] [--height 900]
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const width = arg('width', '1440');
const height = arg('height', '900');

const chrome = await (async () => {
  for (const candidate of CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      /* try the next one */
    }
  }
  return null;
})();

if (!chrome) {
  console.error('shoot: no Chrome/Chromium/Edge found; open preview/index.html manually');
  process.exit(1);
}

const shots = [
  ['noir', '?skin=noir-cathedral'],
  ['ink-bamboo', '?skin=ink-bamboo'],
  ['panel', '?skin=last-train&panel=1'],
];

const profile = path.join(root, 'preview/.chrome');

for (const [name, query] of shots) {
  const url = 'file://' + path.join(root, 'preview/index.html') + query;
  const out = path.join(root, 'preview/shots', name + '.png');
  await run(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-breakpad',
      '--disable-crash-reporter',
      '--user-data-dir=' + profile,
      '--window-size=' + width + ',' + height,
      '--force-device-scale-factor=1',
      '--virtual-time-budget=9000',
      '--screenshot=' + out,
      url,
    ],
    { timeout: 120000 },
  ).catch((error) => {
    console.error('shoot: ' + name + ' failed — ' + error.message);
    process.exitCode = 1;
  });
  console.log('shoot: ' + name + '.png');
}

console.log('shoot: done → preview/shots/');
