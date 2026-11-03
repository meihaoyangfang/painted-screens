#!/usr/bin/env node
/**
 * 从原主题里提取「启动幕」和「挂件皮肤」，原样落地到 art/。
 *
 * 提取三样东西：
 *   1. 组件函数源码（按大括号配平切出来，递归带上它用到的其它组件）
 *   2. 求值后的 CSS（在 vm 里跑一遍主题、抓它注入的 <style>，再按选择器前缀切）
 *   3. 会话键与时长
 *
 * 用法：node tools/extract-originals.mjs
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');

const THEMES = [
  { id: 'noir-cathedral', dir: 'noir-cathedral-theme', boot: 'NoirBoot', bootPrefix: '.noir-boot', rootClass: null },
  { id: 'ink-bamboo', dir: 'ink-bamboo-theme', boot: 'InkBoot', bootPrefix: '.inkb-boot', rootClass: 'inkb-whale', widgetNeedles: ['.dshwv', '.inkb-hud', '.inkb-cat'] },
  { id: 'velvet-sin', dir: 'velvet-sin-theme', boot: 'VelvetBoot', bootPrefix: '.vs-boot', rootClass: 'vs-whale' },
];

/** 取一个函数声明/表达式的完整源码，按大括号配平。 */
function grabFunction(source, name) {
  const patterns = [
    new RegExp(`function ${name}\\s*\\(`),
    new RegExp(`const ${name}\\s*=\\s*\\(`),
    new RegExp(`const ${name}\\s*=\\s*function\\s*\\(`),
  ];
  for (const re of patterns) {
    const hit = re.exec(source);
    if (!hit) continue;
    let start = hit.index;
    let i = source.indexOf('{', start);
    if (i < 0) continue;
    let depth = 0;
    for (let k = i; k < source.length; k += 1) {
      if (source[k] === '{') depth += 1;
      else if (source[k] === '}') {
        depth -= 1;
        if (depth === 0) return source.slice(start, k + 1).trim();
      }
    }
  }
  return null;
}

/** 组件用到的其它组件名。 */
function componentRefs(source) {
  const names = new Set();
  const re = /h\(\s*([A-Z][A-Za-z0-9]*)/g;
  let m;
  while ((m = re.exec(source))) names.add(m[1]);
  return [...names];
}

/** 把 CSS 切成块，返回 [{prelude, body, text}]。 */
function cssBlocks(css) {
  const blocks = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const prelude = css.slice(i, open);
    let depth = 1;
    let k = open + 1;
    for (; k < css.length && depth > 0; k += 1) {
      if (css[k] === '{') depth += 1;
      else if (css[k] === '}') depth -= 1;
    }
    blocks.push({ prelude, text: css.slice(i, k) });
    i = k;
  }
  return blocks;
}


/** 收集 CSS 里 var(--x) 引用到的变量定义，拼成 :root 块。 */
function rootVarsFor(css, picked) {
  const names = new Set();
  const re = /var\(\s*(--[\w-]+)/g;
  let m;
  while ((m = re.exec(picked))) names.add(m[1]);

  const defs = [];
  for (const name of names) {
    const at = css.indexOf(name + ':');
    if (at < 0) continue;
    let i = css.indexOf(':', at) + 1;
    let depth = 0;
    let quote = null;
    let value = '';
    for (; i < css.length; i += 1) {
      const ch = css[i];
      if (quote) {
        value += ch;
        if (ch === quote && css[i - 1] !== '\\') quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        value += ch;
        continue;
      }
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      else if (ch === ';' && depth === 0) break;
      value += ch;
    }
    defs.push('  ' + name + ':' + value.trim() + ';');
  }
  return defs.length ? ':root {\n' + defs.join('\n') + '\n}\n\n' : '';
}

function pickRules(css, selectorNeedle) {
  const needles = Array.isArray(selectorNeedle) ? selectorNeedle : [selectorNeedle];
  const blocks = cssBlocks(css);
  const kept = [];
  const animations = new Set();
  for (const block of blocks) {
    if (!needles.some((n) => block.prelude.includes(n))) continue;
    kept.push(block.text);
    const re = /animation(?:-name)?\s*:\s*([^;}]+)/g;
    let m;
    while ((m = re.exec(block.text))) {
      for (const token of m[1].split(/[\s,]+/)) {
        if (/^[a-zA-Z][\w-]*$/.test(token) && token !== 'none') animations.add(token);
      }
    }
  }
  for (const block of blocks) {
    const m = /@(?:-\w+-)?keyframes\s+([\w-]+)/.exec(block.prelude);
    if (m && animations.has(m[1])) kept.push(block.text);
  }
  const picked = kept.join('\n\n');
  return rootVarsFor(css, picked) + picked;
}

async function evaluatedCss(themeDir) {
  const src = await readFile(path.join(repo, themeDir, 'client.js'), 'utf8');
  const styles = [];
  const context = vm.createContext({
    window: {
      localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
      requestAnimationFrame: () => 0,
      cancelAnimationFrame() {},
      addEventListener() {},
      removeEventListener() {},
      location: { search: '' },
      __ModuleLoader__: { load(def) { this.def = def; } },
    },
    document: {
      documentElement: { classList: { add() {}, remove() {} }, setAttribute() {}, removeAttribute() {}, getAttribute: () => null },
      head: { appendChild(tag) { styles.push(tag); return tag; } },
      createElement() { return { dataset: {}, textContent: '', remove() {}, classList: { add() {}, remove() {} } }; },
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
      removeEventListener() {},
      body: { appendChild() {}, classList: { add() {}, remove() {} } },
      hidden: false,
    },
    console,
    Math,
    Date,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Error,
    parseInt,
    parseFloat,
    isNaN,
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval: () => 0,
    clearInterval() {},
  });
  vm.runInContext(src, context, { filename: themeDir + '/client.js' });
  const def = context.window.__ModuleLoader__.def;
  const React = { createElement: (t, p, ...c) => ({ t, p, c }), useState: (v) => [v, () => {}], useRef: (v) => ({ current: v }), useEffect() {}, useMemo: (f) => f() };
  const plugin = def.factory((n) => {
    if (n === 'react') return React;
    throw new Error('unexpected require ' + n);
  });
  try {
    plugin.apply({
      theme: { getTheme: () => ({ preference: 'dark' }), setTheme() {}, overrideTokens: () => () => {} },
      slots: { inject: (_n, f) => f(), register: () => () => {} },
      effect(fn) { try { fn(); } catch (error) { /* ignore */ } },
      on: () => () => {},
      get: () => undefined,
    });
  } catch (error) {
    console.error('  apply threw:', error.message);
  }
  return { css: styles.map((s) => s.textContent || '').join('\n'), source: src };
}

for (const theme of THEMES) {
  console.log('== ' + theme.id);
  const { css, source } = await evaluatedCss(theme.dir);

  // ---- 启动幕 ----
  const bootDir = path.join(root, 'art/boots', theme.id);
  await mkdir(bootDir, { recursive: true });

  const parts = [];
  const seen = new Set();
  const queue = [theme.boot];
  const support = grabFunction(source, 'bootAllowed');
  if (support) parts.push(support);
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    seen.add(name);
    const fn = grabFunction(source, name);
    if (!fn) {
      console.error('  missing component:', name);
      continue;
    }
    parts.push(fn);
    for (const ref of componentRefs(fn)) if (!seen.has(ref)) queue.push(ref);
  }
  await writeFile(path.join(bootDir, 'boot.js'), parts.join('\n\n') + '\n');

  const bootCss = pickRules(css, theme.bootPrefix);
  await writeFile(path.join(bootDir, 'boot.css'), bootCss + '\n');

  const bootKey = (/const BOOT_KEY = '([^']+)';/.exec(source) || [])[1] || theme.id + '-boot';
  const hold = (/const hold = reduced \? (\d+) : (\d+);/.exec(source) || [])[2] || '1650';
  await writeFile(
    path.join(bootDir, 'meta.json'),
    JSON.stringify({ component: theme.boot, bootKey, holdMs: Number(hold), components: [...seen] }, null, 2) + '\n',
  );
  console.log('  boot:', [...seen].join(', '), '| css', bootCss.length, 'bytes | hold', hold);

  // ---- 挂件 ----
  const widgetCss = pickRules(css, theme.widgetNeedles || '.dshwv');
  if (widgetCss.length) {
    const widgetDir = path.join(root, 'art/widgets', theme.id);
    await mkdir(widgetDir, { recursive: true });
    await writeFile(path.join(widgetDir, 'widget.css'), widgetCss + '\n');
    console.log('  widget css:', widgetCss.length, 'bytes');
  }
}
