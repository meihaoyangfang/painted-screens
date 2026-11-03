#!/usr/bin/env node
/** 从皮肤组件里渲染出主题自己的 logo（SVG → PNG，透明底）。 */
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2];
const which = process.argv[3] || 'hero';
const ink = process.argv[4] || '';
if (!id) { console.error('usage: make-logo <id> [hero|mark]'); process.exit(1); }

const meta = JSON.parse(await readFile(path.join(root, 'art/skins', id, 'meta.json'), 'utf8'));
const slot = which === 'mark' ? 'sidebar.brand.mark' : 'conversation.hero.brand.mark';
const componentName = meta.slots && meta.slots[slot];
if (!componentName) { console.error('no component for', slot); process.exit(1); }

const src = await readFile(path.join(root, 'art/skins', id, 'components.js'), 'utf8');
const h = (tag, props, ...children) => ({ tag, props: props || {}, children: children.flat(Infinity).filter((c) => c != null && c !== false) });
const React = { createElement: h, useState: (v) => [v, () => {}], useRef: (v) => ({ current: v }), useEffect() {}, useMemo: (f) => f(), useCallback: (f) => f() };
const theme = { getTheme: () => ({ preference: meta.appearance, colorScheme: meta.appearance }), setTheme() {}, onChange: () => () => {}, overrideTokens: () => () => {}, register: () => () => {} };
const ctx = { theme, on: () => () => {}, effect() {}, slots: { register: () => () => {}, inject() {} }, get: () => undefined, locale: { register() {}, t: (k) => k } };
const t = (k) => k;
const factory = new Function('ctx', 'theme', 't', 'h', 'React', src + '\nreturn typeof ' + componentName + ' === "function" ? ' + componentName + ' : null;');
const Comp = factory(ctx, theme, t, h, React);
if (!Comp) { console.error('component not found:', componentName); process.exit(1); }

const ATTR = { className: 'class', viewBox: 'viewBox', fillRule: 'fill-rule', clipRule: 'clip-rule', strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin', stopColor: 'stop-color', stopOpacity: 'stop-opacity', fillOpacity: 'fill-opacity', strokeOpacity: 'stroke-opacity', textAnchor: 'text-anchor', fontSize: 'font-size', fontFamily: 'font-family', letterSpacing: 'letter-spacing', dominantBaseline: 'dominant-baseline' };
const serialize = (node) => {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  const { tag, props, children } = node;
  if (typeof tag === 'function') return serialize(tag(props));
  const attrs = Object.entries(props || {})
    .filter(([k, v]) => v != null && typeof v !== 'function' && k !== 'key' && k !== 'style')
    .filter(([k]) => !(tag === 'svg' && (k === 'width' || k === 'height')))
    .map(([k, v]) => `${ATTR[k] || k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
  const kids = (children || []).map(serialize).join('');
  return `<${tag}${attrs ? ' ' + attrs : ''}>${kids}</${tag}>`;
};
let tree = Comp({});
let markup = serialize(tree);
if (!/<svg/i.test(markup)) {
  // 包一层，非 svg 的标记放进 inline svg 里会失效，改为按 HTML 渲染
}

let paint = markup;
if (ink) {
  // 组件里写死黑色 / currentColor 的，统一换成指定色
  paint = paint.replace(/currentColor/g, ink)
    .replace(/#000000|#000\b|\bblack\b/g, ink);
}
const html = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;width:512px;height:512px;background:transparent;color:${ink || '#000'};display:flex;align-items:center;justify-content:center}
svg,img{width:100%!important;height:100%!important}
</style>${paint}`;
const tmp = path.join(os.tmpdir(), 'huaping-logo-' + id + '.html');
await writeFile(tmp, html);
const out = path.join(root, 'art/gen', 'logo-' + id + '.png');
execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
  '--force-device-scale-factor=1', '--user-data-dir=' + path.join(os.tmpdir(), 'huaping-logo-profile'),
  '--window-size=512,512', '--screenshot=' + out, 'file://' + tmp,
], { stdio: 'ignore' });
// 裁掉透明留白，再补成正方形
try {
  execFileSync('python3', ['-c', `
import sys
from PIL import Image
p = sys.argv[1]
im = Image.open(p).convert('RGBA')
box = im.split()[3].getbbox()
if box:
    pad = int(max(box[2]-box[0], box[3]-box[1]) * 0.06)
    box = (max(0, box[0]-pad), max(0, box[1]-pad), min(im.width, box[2]+pad), min(im.height, box[3]+pad))
    im = im.crop(box)
w, h = im.size
side = max(w, h)
canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
canvas.paste(im, ((side-w)//2, (side-h)//2), im)
canvas = canvas.resize((512, 512), Image.LANCZOS)
canvas.save(p)
`, out], { stdio: 'ignore' });
} catch (error) { /* 没有 PIL 就保留原图 */ }
console.log('logo', id, componentName, '→', out);
