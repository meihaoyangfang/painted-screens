#!/usr/bin/env node
/**
 * 把其他几套主题导入成「皮肤包」的一等皮肤。
 *
 * 每套主题产出一个自包含目录：
 *   art/skins/<id>/
 *     tokens.json     求值后的 110 个 token（直接来自主题自己的 overrideTokens 调用）
 *     skin.css        求值后的整份样式表
 *     components.js   slot 组件源码 + 它们依赖的顶层声明（依赖闭包）
 *     meta.json       slot→组件映射、启动幕组件名、根属性/类、外观
 *
 * 用法：node tools/import-themes.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');

const THEMES = [
  { id: 'rose-cream', dir: 'rose-cream-theme', name: '玫瑰奶油', latin: 'ROSÉ CREAM', appearance: 'light', blurb: '柔粉写真 · 奶油高光与玫瑰' },
  { id: 'cyberpunk', dir: 'cyberpunk-theme', name: '霓虹残响', latin: 'NEON AFTERIMAGE', appearance: 'dark', blurb: '夜城霓虹 · 黄黑警戒与全息扫描' },
  { id: 'eva02-asuka', dir: 'eva02-asuka-theme', name: 'EVA-02', latin: 'ASUKA', appearance: 'dark', blurb: '驾驶舱 HUD · 橙红警报与同步率' },
  { id: 'jianlai-qingming', dir: 'jianlai-qingming-theme', name: '剑来 · 青冥', latin: 'QINGMING', appearance: 'dark', blurb: '雪夜剑气 · 宣纸留白与朱砂印' },
  { id: 'aurelis-gundam', dir: 'aurelis-gundam-theme', name: '曜界', latin: 'AURELIS', appearance: 'dark', blurb: '轨道机库 · 象牙白装甲与光晕' },
];

// ---------------------------------------------------------------- 组件切分

const OPEN = { '(': ')', '[': ']', '{': '}' };

/** 从 index 处的开括号扫描到配对的闭括号。 */
function matchBalanced(src, start) {
  const open = src[start];
  const close = OPEN[open];
  let depth = 0;
  let quote = null;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** 抓一个顶层声明（function / const / let）。 */
function grabDecl(src, name) {
  const fn = new RegExp(`function\\s+${name}\\s*\\(`).exec(src);
  if (fn) {
    // 先配平参数表，再找函数体的第一个 {（参数默认值里可能有 {}）
    const paren = src.indexOf('(', fn.index);
    const parenEnd = matchBalanced(src, paren);
    if (parenEnd < 0) return null;
    const brace = src.indexOf('{', parenEnd);
    const end = matchBalanced(src, brace);
    return end > 0 ? src.slice(fn.index, end + 1) : null;
  }
  const v = new RegExp(`(?:^|\\n)\\s*(?:const|let|var)\\s+${name}\\s*=`).exec(src);
  if (!v) return null;
  const start = v.index + (v[0].startsWith('\n') ? 1 : 0);
  const eq = src.indexOf('=', start) + 1;
  const bodyStart = v.index + v[0].length;
  // 扫描到顶层分号（对象/函数字面量里也有 {}，用括号配平）
  let i = bodyStart;
  let quote = null;
  let depth = 0;
  for (; i < src.length; i += 1) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (OPEN[ch]) { depth += 1; continue; }
    if (ch === ')' || ch === ']' || ch === '}') { depth -= 1; continue; }
    if (ch === ';' && depth === 0) break;
  }
  void eq;
  return src.slice(start, i + 1);
}

/** 组件 + 它引用的顶层声明的闭包。 */
const HOST_NAMES = new Set([
  'React', 'h', 'require', 'module', 'exports', 'document', 'window', 'console',
  'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Math', 'Date', 'Set',
  'Map', 'Error', 'Promise', 'Symbol', 'parseInt', 'parseFloat', 'isNaN',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'URLSearchParams',
  'navigator', 'localStorage', 'sessionStorage', 'undefined', 'Infinity', 'NaN',
  'Intl', 'RegExp', 'WeakMap', 'WeakSet', 'requestAnimationFrame', 'cancelAnimationFrame',
]);

function closure(src, seeds) {
  const out = [];
  const seen = new Set(HOST_NAMES);
  const queue = [...seeds];
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name) || HOST_NAMES.has(name)) continue;
    seen.add(name);
    const decl = grabDecl(src, name);
    if (!decl || /=\s*require\(/.test(decl)) {
      console.error('  ! missing', name);
      continue;
    }
    out.push(decl);
    const refs = [...new Set([...decl.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map((m) => m[1]))];
    for (const ref of refs) {
      if (seen.has(ref) || queue.includes(ref)) continue;
      if (new RegExp(`(?:function\\s+${ref}\\s*\\(|(?:const|let|var)\\s+${ref}\\s*=)`).test(src)) queue.push(ref);
    }
  }
  return out.join('\n\n');
}

/** slot 注册：brace-aware 解析。 */
function parseRegisters(src) {
  const out = [];
  let i = 0;
  while ((i = src.indexOf('slots.register(', i)) >= 0) {
    const brace = src.indexOf('{', i);
    if (brace < 0) break;
    const end = matchBalanced(src, brace);
    if (end < 0) break;
    const opts = src.slice(brace, end + 1);
    const name = (opts.match(/name:\s*'([^']+)'/) || [])[1];
    const rest = src.slice(end + 1, end + 160);
    const comp = (rest.match(/^\s*,\s*([A-Za-z0-9_$]+)/) || [])[1];
    if (name && comp) out.push({ name, comp });
    i = end;
  }
  return out;
}

// ---------------------------------------------------------------- 求值抓取

async function evaluate(themeDir) {
  const src = await readFile(path.join(repo, themeDir, 'client.js'), 'utf8');
  const styles = [];
  let tokens = null;
  let rootAttrs = new Set();
  let rootClasses = new Set();

  const documentStub = {
    documentElement: {
      classList: { add: (c) => rootClasses.add(c), remove() {} },
      setAttribute: (n) => rootAttrs.add(n),
      removeAttribute() {},
      getAttribute: () => null,
      style: { setProperty() {}, removeProperty() {} },
      dataset: {},
    },
    head: { appendChild(tag) { styles.push(tag); return tag; } },
    body: { classList: { add: (c) => rootClasses.add(c), remove() {} }, setAttribute() {}, appendChild() {}, querySelector: () => null },
    createElement() { return { dataset: {}, textContent: '', remove() {}, classList: { add() {}, remove() {} } }; },
    addEventListener() {}, removeEventListener() {},
    querySelector: () => null, querySelectorAll: () => [],
    hidden: false,
  };

  const context = vm.createContext({
    window: {
      localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
      requestAnimationFrame: () => 0, cancelAnimationFrame() {},
      addEventListener() {}, removeEventListener() {},
      location: { search: '' },
      __ModuleLoader__: { load(def) { this.def = def; } },
    },
    document: documentStub,
    console, Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, Error,
    parseInt, parseFloat, isNaN,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  });
  vm.runInContext(src, context, { filename: themeDir + '/client.js' });

  const def = context.window.__ModuleLoader__.def;
  const React = {
    createElement: (t, p, ...c) => ({ t, p, c }),
    useState: (v) => [v, () => {}], useRef: (v) => ({ current: v }),
    useEffect() {}, useMemo: (f) => f(), useCallback: (f) => f(), createContext: () => ({ Provider: null }),
  };
  const plugin = def.factory((n) => {
    if (n === 'react') return React;
    throw new Error('unexpected require ' + n);
  });
  try {
    plugin.apply({
      theme: {
        getTheme: () => ({ preference: 'dark' }),
        setTheme() {},
        overrideTokens: (_source, pairs) => { tokens = pairs; return () => {}; },
      },
      slots: { inject: (_n, f) => f(), register: () => () => {} },
      effect(fn) { try { fn(); } catch (error) { /* ignore */ } },
      on: () => () => {},
      get: () => undefined,
      locales: { register() {} },
    });
  } catch (error) {
    console.error('  apply threw:', error.message);
  }

  return {
    css: styles.map((s) => s.textContent || '').join('\n'),
    tokens,
    source: src,
    rootAttrs: [...rootAttrs],
    rootClasses: [...rootClasses],
  };
}

// ---------------------------------------------------------------- 主流程

for (const theme of THEMES) {
  console.log('== ' + theme.id);
  const { css, tokens, source, rootAttrs, rootClasses } = await evaluate(theme.dir);
  const registers = parseRegisters(source);

  const slotMap = {};
  const components = [];
  const overlayComps = [];
  for (const reg of registers) {
    if (reg.comp === 'undefined') continue;
    if (!components.includes(reg.comp)) components.push(reg.comp);
    if (reg.name === 'shell.overlay') { overlayComps.push(reg.comp); continue; }
    if (!slotMap[reg.name]) slotMap[reg.name] = reg.comp;
  }

  const bootComp = overlayComps.find((c) => /Boot$/.test(c)) || components.find((c) => /Boot$/.test(c)) || null;
  const overlayComp = overlayComps.find((c) => c !== bootComp) || null;
  if (overlayComp) slotMap['shell.overlay'] = overlayComp;

  const outDir = path.join(root, 'art/skins', theme.id);
  await mkdir(outDir, { recursive: true });

  await writeFile(path.join(outDir, 'skin.css'), css + '\n');
  await writeFile(path.join(outDir, 'tokens.json'), JSON.stringify(tokens || {}, null, 2) + '\n');
  await writeFile(
    path.join(outDir, 'components.js'),
    closure(source, components.filter((c) => c !== bootComp)) + '\n',
  );
  await writeFile(
    path.join(outDir, 'meta.json'),
    JSON.stringify(
      {
        id: theme.id,
        name: theme.name,
        latin: theme.latin,
        appearance: theme.appearance,
        blurb: theme.blurb,
        slots: slotMap,
        boot: bootComp,
        overlay: overlayComp,
        rootAttrs,
        rootClasses,
      },
      null,
      2,
    ) + '\n',
  );

  console.log(
    `  tokens ${tokens ? Object.keys(tokens).length : 0} | css ${css.length} | slots ${Object.keys(slotMap).length} | boot ${bootComp || '-'} | overlay ${slotMap['shell.overlay'] || '-'} | attrs ${rootAttrs.join(',') || '-'} | classes ${rootClasses.join(',') || '-'}`,
  );
}
