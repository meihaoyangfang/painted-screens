#!/usr/bin/env node
/**
 * 用「壁纸 + logo + 名称」合成皮肤库封面（不调用生图 API）。
 * 用法: node tools/make-cover.mjs <id> <layout:bg|split> <art.png> <face.png> <中文名> <拉丁名> <accent>
 */
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [id, layout, artPath, facePath, name, latin, accent, slogan, initial, logoPath] = process.argv.slice(2);
const TINT = process.env.COVER_TINT || '#05080c';
const FONT = process.env.COVER_FONT || '"PingFang SC","Hiragino Sans GB","Inter",sans-serif';
const NAME_COLOR = process.env.COVER_NAME || '#F6FAFF';
const LOGO_FILTER = process.env.COVER_LOGO_FILTER || '';
const LOGO_PLATE = process.env.COVER_LOGO_PLATE === '1';
const hex = (h, a) => {
  const n = parseInt(h.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
if (!id) { console.error('usage: make-cover <id> <bg|split> <art> <face> <name> <latin> <accent>'); process.exit(1); }

// 扩展名不等于 MIME：svg 要写成 svg+xml，否则浏览器不认这张图
const MIME = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', avif: 'avif', svg: 'svg+xml' };
const toData = async (p) => {
  const bytes = await readFile(p);
  const ext = path.extname(p).slice(1).toLowerCase();
  return 'data:image/' + (MIME[ext] || ext) + ';base64,' + bytes.toString('base64');
};
const art = await toData(path.resolve(root, artPath));
const face = facePath === 'none' ? '' : await toData(path.resolve(root, facePath));
let logo = '';
if (logoPath && logoPath !== 'none') {
  try { logo = await toData(path.resolve(root, logoPath)); } catch (error) { logo = ''; }
}

const html = `<!doctype html><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1440px;height:810px;overflow:hidden;background:${TINT};
    font-family:${FONT}}
  .cv{position:relative;width:1440px;height:810px;overflow:hidden}
  .art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}
  .split .art{left:auto;right:0;width:62%;object-fit:cover;object-position:50% 22%}
  .split::before{content:"";position:absolute;left:0;top:0;bottom:0;width:76%;
    background:linear-gradient(90deg,${hex(TINT, 0.98)} 0%,${hex(TINT, 0.93)} 44%,${hex(TINT, 0.66)} 70%,${hex(TINT, 0.16)} 92%,${hex(TINT, 0)} 100%)}
  .bg::after{content:"";position:absolute;inset:0;
    background:linear-gradient(90deg,${hex(TINT, 0.92)} 0%,${hex(TINT, 0.58)} 34%,${hex(TINT, 0.05)} 62%,${hex(TINT, 0.26)} 100%),
               linear-gradient(180deg,${hex(TINT, 0.52)} 0%,${hex(TINT, 0)} 32%,${hex(TINT, 0.04)} 70%,${hex(TINT, 0.68)} 100%)}
  .brand{position:absolute;left:84px;top:50%;transform:translateY(-50%);
    display:flex;flex-direction:column;align-items:flex-start;gap:26px;z-index:2;max-width:52%}
  .face{width:104px;height:104px;border-radius:28px;object-fit:cover;
    border:1.5px solid ${accent}99;box-shadow:0 0 0 7px ${accent}1a,0 20px 44px -16px #000d}
  .mark{width:104px;height:104px;border-radius:26px;display:flex;align-items:center;justify-content:center;
    font-size:46px;font-weight:600;color:${accent};letter-spacing:0;
    background:linear-gradient(160deg,${accent}22,${accent}08);
    border:1.5px solid ${accent}88;box-shadow:0 0 0 7px ${accent}14,0 20px 44px -16px #000d}
  .plate{width:112px;height:112px;object-fit:cover;border-radius:24px;
    border:1.5px solid ${accent}99;box-shadow:0 0 0 7px ${accent}18,0 20px 44px -16px #000d}
  .emblem{width:128px;height:128px;object-fit:contain;
    filter:${LOGO_FILTER ? LOGO_FILTER + ' ' : ''}drop-shadow(0 10px 26px rgba(0,0,0,.55))}
  .txt{display:flex;flex-direction:column;gap:16px}
  .name{font-size:86px;line-height:.98;letter-spacing:.04em;color:${NAME_COLOR};font-weight:700;
    text-shadow:0 3px 30px rgba(0,0,0,.75),0 1px 3px rgba(0,0,0,.6)}
  .latin{font-size:15px;letter-spacing:.42em;color:${accent};font-weight:600;opacity:.95}
  .slogan{font-size:15px;line-height:1.6;color:rgba(238,244,255,.72);letter-spacing:.04em;max-width:430px}
  .rule{width:168px;height:2px;background:${accent};opacity:.6}
</style>
<div class="cv ${layout}">
  <img class="art" src="${art}">
  <div class="brand">
    ${logo ? '<img class="' + (LOGO_PLATE ? 'plate' : 'emblem') + '" src="' + logo + '">' : (face ? '<img class="face" src="' + face + '">' : '<div class="mark">' + (initial || name.slice(0, 1)) + '</div>')}
    <div class="txt">
      <div class="name">${name}</div>
      <div class="latin">${latin}</div>
      <div class="rule"></div>
      ${slogan ? '<div class="slogan">' + slogan + '</div>' : ''}
    </div>
  </div>
</div>`;

const tmp = path.join(os.tmpdir(), 'huaping-cover-' + id + '.html');
await writeFile(tmp, html);
const shot = path.join(root, 'art/gen', 'cover-' + id + '.png');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
execFileSync(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--user-data-dir=' + path.join(os.tmpdir(), 'huaping-cover-profile'),
  '--window-size=1440,810', '--screenshot=' + shot, 'file://' + tmp,
], { stdio: 'ignore' });
console.log('saved', shot);
