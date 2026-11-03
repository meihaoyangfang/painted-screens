#!/usr/bin/env node
/**
 * Build `client.js` from `src/client.template.js`.
 *
 * Injects three things that are easier to keep as data than as source:
 *   - art/palettes.json   — one 110-key palette per skin
 *   - art/token-map.json  — `--dsw-alias-*` token → palette key
 *   - art/cathedral.svg   — Noir Cathédrale background, as a data URI
 *
 * Usage: node tools/build.mjs [--check]
 *   --check  fail if client.js is out of date instead of writing it
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFile(path.join(root, rel), 'utf8');

const template = await read('src/client.template.js');
const palettes = JSON.parse(await read('art/palettes.json'));
const tokenMap = JSON.parse(await read('art/token-map.json'));
const cathedral = await read('art/cathedral.svg');
const bamboo = await read('art/bamboo.svg');

// 原版挂件皮肤：每个皮肤一个目录，里面是原主题的 runtime + CSS + 角色图。
const widgetRoot = path.join(root, 'art/widgets');
let widgetsSource = '{}';
try {
  const ids = (await readdir(widgetRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const parts = [];
  for (const id of ids) {
    let runtime;
    try {
      runtime = await readFile(path.join(widgetRoot, id, 'runtime.js'), 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue; // 纯 CSS 挂件皮肤，没有运行时
      throw error;
    }
    let css = '';
    try {
      css = await readFile(path.join(widgetRoot, id, 'whale-skin.css'), 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const art = (await readFile(path.join(widgetRoot, id, 'art.txt'), 'utf8')).trim();
    let extras = '';
    try {
      const cat = (await readFile(path.join(widgetRoot, id, 'cat.txt'), 'utf8')).trim();
      extras += '    const CAT_ART = ' + JSON.stringify(cat) + ';\n';
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    parts.push(
      '  ' + JSON.stringify(id) + ': (function () {\n' +
      "    const SOURCE = '@mhstory/huaping';\n" +
      '    const WHALE_ART = ' + JSON.stringify(art) + ';\n' +
      '    const WHALE_CSS = ' + JSON.stringify(css) + ';\n' +
      extras +
      runtime + '\n' +
      '    return installWhaleSkin;\n' +
      '  })(),'
    );
  }
  widgetsSource = '{\n' + parts.join('\n') + '\n}';
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const artUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cathedral.trim());
const bambooUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bamboo.trim());

// ---- 导入的整主题皮肤 ----
const MIME_BY_EXT = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  woff2: 'font/woff2',
  woff: 'font/woff',
};

async function inlineAssets(css, dir) {
  const matches = [...css.matchAll(/url\((['"]?)\.\/assets\/([^'"()]+)\1\)/g)];
  let out = css;
  for (const match of matches) {
    const rel = match[2];
    const ext = rel.split('.').pop().toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) throw new Error(`inlineAssets: unsupported asset type ${rel} in ${dir}`);
    const bytes = await readFile(path.join(dir, 'assets', rel));
    out = out.replace(match[0], 'url("data:' + mime + ';base64,' + bytes.toString('base64') + '")');
  }
  return out;
}

const HOST_SHIM = `    const __hostTheme = (scheme) => ({
      getTheme: () => ({ preference: scheme, colorScheme: scheme }),
      setTheme() {}, onChange: () => () => {},
      overrideTokens: () => () => {}, register: () => () => {},
    });
    const __hostCtx = (scheme) => ({
      theme: __hostTheme(scheme), on: () => () => {}, effect: () => {},
      slots: { register: () => () => {}, inject: () => {} },
      get: () => undefined, locale: { register() {}, t: (k) => k },
    });
`;

const importedRoot = path.join(root, 'art/skins');
let importedSource = '[]';
try {
  const ids = (await readdir(importedRoot, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const parts = [];
  for (const id of ids) {
   try {
    const dir = path.join(importedRoot, id);
    let meta;
    try {
      meta = JSON.parse(await readFile(path.join(dir, 'meta.json'), 'utf8'));
    } catch (error) {
      // 还没导完的目录（缺 meta）直接跳过，不要连累其它皮肤
      console.warn('  skip incomplete skin:', id);
      continue;
    }
    let extraCss = '';
    try {
      extraCss = await readFile(path.join(dir, 'extra.css'), 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    // 启动幕底图：art/gen/<id>-boot.jpg
    let bootArt = '';
    try {
      const bytes = await readFile(path.join(root, 'art/gen', meta.id + '-boot.jpg'));
      bootArt = 'data:image/jpeg;base64,' + bytes.toString('base64');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    // 启动幕上的矢量标记（会自己动）：art/gen/<id>-mark.svg
    let bootMark = '';
    try {
      const bytes = await readFile(path.join(root, 'art/gen', meta.id + '-mark.svg'));
      bootMark = 'data:image/svg+xml;base64,' + bytes.toString('base64');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    if (meta.hosted) {
      let source = await readFile(path.join(dir, 'hosted.js'), 'utf8');
      // 皮肤可以带一份 vendor/three.min.js，用 `/*__THREE_SRC__*/ null` 占位等它。
      // 这样实时场景不用连 CDN，整包还是只有一个 client.js。
      if (source.includes('/*__THREE_SRC__*/')) {
        const threePath = path.join(dir, 'vendor/three.min.js');
        const threeSrc = await readFile(threePath, 'utf8');
        source = source.replace('/*__THREE_SRC__*/ null', JSON.stringify(threeSrc));
      }
      // 宿主是用 new Function 跑这段源码的：语法错只会在浏览器控制台里报一句
      // 「hosted skin failed」，然后整块皮肤静默失效。构建期先编译一次，错了直接停。
      try {
        // eslint-disable-next-line no-new-func
        new Function('React', 'require', source);
      } catch (error) {
        throw new Error('hosted skin "' + meta.id + '" 语法错误：' + error.message);
      }
      parts.push(
        '  {\n' +
        '    id: ' + JSON.stringify(meta.id) + ',\n' +
        '    name: ' + JSON.stringify(meta.name) + ',\n' +
        '    latin: ' + JSON.stringify(meta.latin) + ',\n' +
        '    blurb: ' + JSON.stringify(meta.blurb) + ',\n' +
        '    appearance: ' + JSON.stringify(meta.appearance) + ',\n' +
        '    composerBg: ' + JSON.stringify(meta.composerBg || '#0b0b0b') + ',\n' +
        '    swatch: [],\n' +
        '    css: ' + JSON.stringify(extraCss) + ',\n' +
        (bootArt ? '    bootArt: ' + JSON.stringify(bootArt) + ',\n' : '') +
        (bootMark ? '    bootMark: ' + JSON.stringify(bootMark) + ',\n' : '') +
        '    hosted: true,\n' +
        '    source: ' + JSON.stringify(source) + ',\n' +
        '  },'
      );
      continue;
    }
    let tokenPairs;
    try {
      tokenPairs = JSON.parse(await readFile(path.join(dir, 'token-pairs.json'), 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const flat = JSON.parse(await readFile(path.join(dir, 'tokens.json'), 'utf8'));
      tokenPairs = Object.fromEntries(Object.keys(flat).map((k) => [k, { light: flat[k], dark: flat[k] }]));
    }
    let widgetSource = '';
    try {
      widgetSource = await readFile(path.join(dir, 'widget.js'), 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const components = await readFile(path.join(dir, 'components.js'), 'utf8');
    const strip = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n{3,}/g, '\n\n').trim();
    const rawCss = strip(await readFile(path.join(dir, 'skin.css'), 'utf8'));
    // `extra.css` 是皮肤自己的后手：排在 skin.css 后面，用来整段推翻背景或面板，
    // 不必把实验值写回主样式。原先只有 hosted 皮肤会带上它，普通皮肤写了等于没写。
    const mergedCss = extraCss ? rawCss + '\n\n' + strip(extraCss) : rawCss;
    // `url("./assets/x.webp")` → data URI, so a skin can keep its artwork as a
    // real file next to the CSS instead of a 300 KB base64 blob in the source.
    const css = await inlineAssets(mergedCss, dir);
    const slotEntries = Object.entries(meta.slots || {})
      .map(([slot, comp]) => '    ' + JSON.stringify(slot) + ': ' + comp + ',')
      .join('\n');
    parts.push(
      '  (function (ctx, theme, t) {\n' +
      '  {\n' +
      components + '\n' +
      '    return {\n' +
      '      id: ' + JSON.stringify(meta.id) + ',\n' +
      '      name: ' + JSON.stringify(meta.name) + ',\n' +
      '      latin: ' + JSON.stringify(meta.latin) + ',\n' +
      '      blurb: ' + JSON.stringify(meta.blurb) + ',\n' +
      '      appearance: ' + JSON.stringify(meta.appearance) + ',\n' +
      '      composerBg: ' + JSON.stringify(meta.composerBg || '#0b0b0b') + ',\n' +
      (meta.bootKey ? '      bootKey: ' + JSON.stringify(meta.bootKey) + ',\n' : '') +
      '      swatch: Object.values(tokenPairs).slice(0, 4).map((p) => p.light),\n' +
      '      tokenPairs: ' + JSON.stringify(tokenPairs) + ',\n' +
      '      css: ' + JSON.stringify(css) + ',\n' +
      '      rootClasses: ' + JSON.stringify(meta.rootClasses || []) + ',\n' +
      (bootArt ? '      bootArt: ' + JSON.stringify(bootArt) + ',\n' : '') +
      (bootMark ? '      bootMark: ' + JSON.stringify(bootMark) + ',\n' : '') +
      (meta.boot ? '      Boot: ' + meta.boot + ',\n' : '') +
      (meta.overlay ? '      Overlay: ' + meta.overlay + ',\n' : '') +
      (meta.sidecars && meta.sidecars.length ? '      Sidecars: [' + meta.sidecars.join(', ') + '],\n' : '') +
      (widgetSource ? '      Widget: (function () {\n' + widgetSource + '\n return ' + meta.widget + '; })(),\n' : '') +
      '      slots: {\n' + slotEntries + '\n      },\n' +
      '    };\n' +
      '  }\n' +
      '  })(__hostCtx(' + JSON.stringify(meta.appearance === 'dark' ? 'dark' : 'light') + '), __hostTheme(' + JSON.stringify(meta.appearance === 'dark' ? 'dark' : 'light') + '), (k) => k),'
    );
   } catch (error) {
     console.warn('  skip incomplete skin:', id, '-', error.message);
   }
  }
  importedSource = '[\n' + parts.join('\n') + '\n]';
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

// ---- 皮肤库封面（来自真机/预览截图）----
const posterRoot = path.join(root, 'art/posters');
let posterFiles = [];
try {
  posterFiles = (await readdir(posterRoot)).filter((f) => /\.(jpg|png)$/i.test(f));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

// ---- 原版启动幕：组件源码 + 求值后的 CSS + 可选截图 ----
const bootRoot = path.join(root, 'art/boots');
let bootsSource = '{}';
let postersSource = '{}';
{
  const posters = [];
  // 原版启动幕（如果还留有抽取产物）
  try {
    const ids = (await readdir(bootRoot, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    const parts = [];
    for (const id of ids) {
      const js = await readFile(path.join(bootRoot, id, 'boot.js'), 'utf8');
      const css = await readFile(path.join(bootRoot, id, 'boot.css'), 'utf8');
      const meta = JSON.parse(await readFile(path.join(bootRoot, id, 'meta.json'), 'utf8'));
      parts.push(
        '  ' + JSON.stringify(id) + ': (function () {\n' +
        '    const BOOT_KEY = ' + JSON.stringify(meta.bootKey) + ';\n' +
        js + '\n' +
        '    return { component: ' + meta.component + ', css: ' + JSON.stringify(css) + ' };\n' +
        '  })(),'
      );
      for (const [file, mime] of [['still.jpg', 'image/jpeg'], ['still.png', 'image/png']]) {
        try {
          const bytes = await readFile(path.join(bootRoot, id, file));
          posters.push('  ' + JSON.stringify(id) + ': ' + JSON.stringify('data:' + mime + ';base64,' + bytes.toString('base64')));
          break;
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
      }
    }
    bootsSource = '{\n' + parts.join('\n') + '\n}';
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  // 皮肤库封面（art/posters/*.jpg）
  for (const file of posterFiles) {
    const id = file.replace(/\.(jpg|png)$/i, '');
    if (posters.some((p) => p.trim().startsWith(JSON.stringify(id) + ':'))) continue;
    const bytes = await readFile(path.join(posterRoot, file));
    const mime = /\.png$/i.test(file) ? 'image/png' : 'image/jpeg';
    posters.push('  ' + JSON.stringify(id) + ': ' + JSON.stringify('data:' + mime + ';base64,' + bytes.toString('base64')));
  }
  postersSource = '{\n' + posters.join(',\n') + '\n}';
}

// ---- 原版挂件 CSS ----
const widgetCssRoot = path.join(root, 'art/widgets');
let widgetCssSource = '{}';
try {
  const ids = (await readdir(widgetCssRoot, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const parts = [];
  for (const id of ids) {
    try {
      const css = await readFile(path.join(widgetCssRoot, id, 'widget.css'), 'utf8');
      parts.push('  ' + JSON.stringify(id) + ': ' + JSON.stringify(css));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  widgetCssSource = '{\n' + parts.join(',\n') + '\n}';
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const output = template
  .replace('/*__PALETTES__*/ {}', () => '/*__PALETTES__*/ ' + JSON.stringify(palettes))
  .replace('/*__TOKEN_MAP__*/ {}', () => '/*__TOKEN_MAP__*/ ' + JSON.stringify(tokenMap))
  .replace("/*__ART_CATHEDRAL__*/ ''", () => '/*__ART_CATHEDRAL__*/ ' + JSON.stringify(artUri))
  .replace("/*__ART_BAMBOO__*/ ''", () => '/*__ART_BAMBOO__*/ ' + JSON.stringify(bambooUri))
  .replace('/*__WIDGETS__*/ {}', () => '/*__WIDGETS__*/ ' + widgetsSource)
  .replace('/*__BOOTS__*/ {}', () => '/*__BOOTS__*/ ' + bootsSource)
  .replace('/*__WIDGET_CSS__*/ {}', () => '/*__WIDGET_CSS__*/ ' + widgetCssSource)
  .replace('/*__POSTERS__*/ {}', () => '/*__POSTERS__*/ ' + postersSource)
  .replace(
    'const IMPORTED = /*__IMPORTED__*/ [];',
    () => HOST_SHIM + '    const IMPORTED = ' + importedSource + ';',
  );

if (output === template) {
  console.error('build: no marker was replaced — did the template change?');
  process.exit(1);
}
for (const marker of ['/*__PALETTES__*/ {}', '/*__TOKEN_MAP__*/ {}', "/*__ART_CATHEDRAL__*/ ''", "/*__ART_BAMBOO__*/ ''", '/*__WIDGETS__*/ {}', '/*__WIDGET_CSS__*/ {}']) {
  if (output.includes(marker)) {
    console.error('build: marker left unreplaced: ' + marker);
    process.exit(1);
  }
}

const target = path.join(root, 'client.js');

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = await read('client.js');
  } catch {
    current = '';
  }
  if (current !== output) {
    console.error('build --check: client.js is out of date, run `node tools/build.mjs`');
    process.exit(1);
  }
  console.log('build --check: client.js is up to date');
  process.exit(0);
}

await writeFile(target, output);
const kb = (output.length / 1024).toFixed(1);
console.log(`build: client.js written (${kb} KB, ${Object.keys(palettes).length} palettes, ${Object.keys(tokenMap).length} tokens)`);
