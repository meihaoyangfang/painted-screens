#!/usr/bin/env node
/**
 * 单主题导入：curated 种子 + 依赖闭包 + 求值 CSS / token。
 * 用法：node tools/import-one.mjs rose-cream
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');
const id = process.argv[2];
const CONFIG = {
  'rose-cream': {
    dir: 'rose-cream-theme',
    name: '玫瑰奶油', latin: 'ROSÉ CREAM', appearance: 'light',
    blurb: '柔粉写真 · 奶油高光与玫瑰',
    components: ['RoseHero', 'RoseSidebarMark', 'RoseBrandName', 'RoseChip', 'RosePolaroid', 'RoseWallpaper', 'RosePaper', 'RoseBoot'],
    widget: 'skinWhaleWidget',
    boot: 'RoseBoot',
    overlay: 'RoseWallpaper',
    slots: {
      'sidebar.brand.mark': 'RoseSidebarMark',
      'sidebar.brand.name': 'RoseBrandName',
      'conversation.hero.brand.mark': 'RoseHero',
      'conversation.input.left': 'RoseChip',
      'conversation.composer.dock': 'RosePolaroid',
    },
    rootClasses: [],
  },
  cyberpunk: {
    dir: 'cyberpunk-theme',
    name: '霓虹残响', latin: 'NEON AFTERIMAGE', appearance: 'dark',
    blurb: '夜城霓虹 · 黄黑警戒与全息扫描',
    components: ['CybHeroMark', 'CybSidebarMark', 'CybBrandName', 'CybUplink', 'CybComposerHud', 'CybFrame', 'CybBoot', 'installWidgetSkin'],
    widget: 'installWidgetSkin',
    boot: 'CybBoot',
    overlay: 'CybFrame',
    slots: {
      'sidebar.brand.mark': 'CybSidebarMark',
      'sidebar.brand.name': 'CybBrandName',
      'conversation.hero.brand.mark': 'CybHeroMark',
      'conversation.input.left': 'CybUplink',
      'conversation.composer.dock': 'CybComposerHud',
    },
    rootClasses: ['cyb-whale'],
    // 「NIGHT CITY」是赛博朋克 2077 的地名，换成原创街区名
    rename: [
      ['NIGHT CITY', 'NEON DISTRICT'],
    ],
  },
  'eva02-asuka': {
    dir: 'eva02-asuka-theme',
    name: 'EVA-02', latin: 'ASUKA', appearance: 'dark',
    blurb: '驾驶舱 HUD · 橙红警报与同步率',
    components: ['CrestMark', 'Eva02BrandName', 'Eva02A10Chip', 'Eva02SyncHud', 'Eva02Wallpaper', 'Eva02HudFrame', 'Eva02Boot', 'installWhaleSkin'],
    widget: 'installWhaleSkin',
    boot: 'Eva02Boot',
    overlay: 'Eva02Wallpaper',
    slots: {
      'sidebar.brand.mark': 'CrestMark',
      'sidebar.brand.name': 'Eva02BrandName',
      'conversation.hero.brand.mark': 'CrestMark',
      'conversation.input.left': 'Eva02A10Chip',
      'conversation.composer.dock': 'Eva02SyncHud',
    },
    rootClasses: ['eva02-whale'],
    // 侧栏品牌按钮只有 24px 高且 overflow:hidden，34px 的标识会被切掉
    cssPatch: [
      '[class*="brandMark"] .eva02-nerv-logo{height:20px !important;width:auto !important}',
      '[class*="brandIdentity"]{align-items:center !important}',
    ].join('\n'),
  },
  qingming: {
    dir: 'jianlai-qingming-theme',
    name: '青冥 · 剑冢', latin: 'QINGMING', appearance: 'dark',
    blurb: '雪夜剑气 · 宣纸留白与朱砂印',
    components: ['JianHeroMark', 'JianSidebarMark', 'JianBrandName', 'JianVigilChip', 'JianRail', 'JianAtmosphere', 'JianBoot', 'installWhaleSkin'],
    widget: 'installWhaleSkin',
    boot: 'JianBoot',
    overlay: 'JianAtmosphere',
    slots: {
      'sidebar.brand.mark': 'JianSidebarMark',
      'sidebar.brand.name': 'JianBrandName',
      'conversation.hero.brand.mark': 'JianHeroMark',
      'conversation.input.left': 'JianVigilChip',
      'conversation.composer.dock': 'JianRail',
    },
    rootClasses: ['qingming-whale'],
    rename: [
      ['jianlai-whale', 'qingming-whale'],
      ['剑来 · 青冥', '青冥 · 剑冢'],
      ['剑气长城', '边关剑城'],
      ['养剑葫', '剑葫'],
      ['剑来', '剑冢'],
      ['JIAN LAI', 'QINGMING'],
      ['JIANLAI', 'QINGMING'],
    ],
  },
  famicom: {
    hosted: true, composerBg: '#F2EDE2',
    dir: 'famicom-theme',
    name: '红白机', latin: 'FAMICOM', appearance: 'light',
    blurb: '像素时代 · 奶白机身与红金按键',
    components: ['HeroMark', 'StatusBar'],
    widget: null,
    boot: null,
    overlay: null,
    slots: {
      'conversation.hero.brand.mark': 'HeroMark',
      'conversation.composer.dock': 'StatusBar',
    },
    rootClasses: [],
  },
  'famicom-night': {
    hosted: true, composerBg: '#141210',
    dir: 'famicom-theme',
    name: '红白机 · 夜', latin: 'FAMICOM NIGHT', appearance: 'dark',
    blurb: '深夜开机 · 暗红机身与荧光绿',
    variant: 'famicom-night',
  },
  sakura: {
    hosted: true, composerBg: '#FBF3F0',
    dir: 'sakura-theme',
    name: '樱花树下', latin: 'UNDER THE SAKURA', appearance: 'light',
    blurb: '春日慢速 · 花瓣徐徐落下',
  },
  'noir-arcade': {
    dir: 'noir-cathedral-theme',
    name: '黑金回廊', latin: 'NOIR ARCADE', appearance: 'dark',
    blurb: '哥特夜景 · 穹顶彩窗与烛光',
    components: ['NoirHeroMark', 'NoirSidebarMark', 'NoirBrandName', 'NoirVigilChip', 'NoirRail', 'NoirAtmosphere', 'NoirBoot'],
    widget: null,
    boot: 'NoirBoot',
    overlay: 'NoirAtmosphere',
    slots: {
      'sidebar.brand.mark': 'NoirSidebarMark',
      'sidebar.brand.name': 'NoirBrandName',
      'conversation.hero.brand.mark': 'NoirHeroMark',
      'conversation.input.left': 'NoirVigilChip',
      'conversation.composer.dock': 'NoirRail',
    },
    rootClasses: [],
    rename: [
      ['黑金圣堂', '黑金回廊'],
      ['NOIR CATHÉDRALE', 'NOIR ARCADE'],
      ['CATHÉDRALE', 'ARCADE'],
      ['Cathédrale', 'Arcade'],
      ['AD VESPERAS', 'AD NOCTEM'],
    ],
  },
  'ink-bamboo': {
    dir: 'ink-bamboo-theme',
    name: '墨竹', latin: 'INK BAMBOO', appearance: 'light',
    blurb: '纸窗竹影 · 一片叶子偶尔落下',
    components: ['InkHeroMark', 'InkSidebarMark', 'InkBrandName', 'InkListeningChip', 'InkAtmosphere', 'InkBoot', 'installLiveBamboo'],
    widget: null,
    sidecars: ['installLiveBamboo'],
    boot: 'InkBoot',
    overlay: 'InkAtmosphere',
    slots: {
      'sidebar.brand.mark': 'InkSidebarMark',
      'sidebar.brand.name': 'InkBrandName',
      'conversation.hero.brand.mark': 'InkHeroMark',
      'conversation.input.left': 'InkListeningChip',
    },
    rootClasses: [],
  },
  'velvet-sin': {
    dir: 'velvet-sin-theme',
    name: '绯夜尤物', latin: 'VELVET SIN', appearance: 'dark',
    blurb: '装饰艺术 · 绯红霓虹与旧金细线',
    components: ['VelvetHeroMark', 'VelvetSidebarMark', 'VelvetBrandName', 'VelvetChip', 'VelvetPulse', 'VelvetAtmosphere', 'VelvetBoot'],
    widget: null,
    boot: 'VelvetBoot',
    overlay: 'VelvetAtmosphere',
    slots: {
      'sidebar.brand.mark': 'VelvetSidebarMark',
      'sidebar.brand.name': 'VelvetBrandName',
      'conversation.hero.brand.mark': 'VelvetHeroMark',
      'conversation.input.left': 'VelvetChip',
      'conversation.composer.dock': 'VelvetPulse',
    },
    rootClasses: [],
  },
  aurelis: {
    dir: 'aurelis-gundam-theme',
    name: '曜界', latin: 'AURELIS', appearance: 'dark',
    blurb: '轨道机库 · 象牙白装甲与光晕',
    components: ['AurelisHeroMark', 'AurelisSidebarMark', 'AurelisBrandName', 'AurelisChip', 'AurelisComposerHud', 'AurelisFrame', 'AurelisBoot', 'installWidgetSkin'],
    widget: 'installWidgetSkin',
    boot: 'AurelisBoot',
    overlay: 'AurelisFrame',
    slots: {
      'sidebar.brand.mark': 'AurelisSidebarMark',
      'sidebar.brand.name': 'AurelisBrandName',
      'conversation.hero.brand.mark': 'AurelisHeroMark',
      'conversation.input.left': 'AurelisChip',
      'conversation.composer.dock': 'AurelisComposerHud',
    },
    rootClasses: ['au-whale'],
    rename: [
      ['曜界高达', '曜界'],
      ['AURELIS GUNDAM', 'AURELIS'],
      ['Gundam', 'Aurelis'],
      ['GUNDAM', 'AURELIS'],
      ['高达', '曜界'],
    ],
  },
};
const cfg = CONFIG[id];
if (!cfg) { console.error('unknown theme', id); process.exit(1); }

const OPEN = { '(': ')', '[': ']', '{': '}' };
function matchBalanced(s, start) {
  const open = s[start], close = OPEN[open];
  let d = 0, q = null;
  for (let i = start; i < s.length; i += 1) {
    const ch = s[i];
    if (q) { if (ch === '\\') { i += 1; continue; } if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
    if (ch === open) d += 1;
    else if (ch === close) { d -= 1; if (!d) return i; }
  }
  return -1;
}
function grab(s, name) {
  const fnRe = new RegExp('\\n( {2,})function\\s+' + name + '\\s*\\(');
  const allFn = [...s.matchAll(new RegExp(fnRe.source, 'g'))];
  let fn = null;
  if (allFn.length) {
    const shallowest = Math.min(...allFn.map((m) => m[1].length));
    fn = allFn.find((m) => m[1].length === shallowest);
  }
  if (fn) {
    const fnStart = fn.index + 1 + fn[1].length - 4;
    const p = s.indexOf('(', fnStart);
    const pe = matchBalanced(s, p);
    const b = s.indexOf('{', pe);
    const e = matchBalanced(s, b);
    return s.slice(fnStart, e + 1);
  }
  const v = new RegExp('(?:^|\\n)\\s*(?:const|let|var)\\s+' + name + '\\s*=').exec(s);
  if (!v) return null;
  const start = v.index + (v[0].startsWith('\n') ? 1 : 0);
  let i = start, d = 0, q = null;
  for (; i < s.length; i += 1) {
    const ch = s[i];
    if (q) { if (ch === '\\') { i += 1; continue; } if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
    if (OPEN[ch]) { d += 1; continue; }
    if (ch === ')' || ch === ']' || ch === '}') { d -= 1; continue; }
    if (ch === ';' && d === 0) break;
  }
  return s.slice(start, i + 1);
}

const HOST = new Set(['React','h','require','module','exports','document','window','console','JSON','Object','Array','String','Number','Boolean','Math','Date','Set','Map','Error','Promise','Symbol','parseInt','parseFloat','isNaN','setTimeout','clearTimeout','setInterval','clearInterval','URLSearchParams','navigator','MutationObserver','localStorage','sessionStorage','undefined','Infinity','NaN','Intl','RegExp','requestAnimationFrame','cancelAnimationFrame','ResizeObserver','IntersectionObserver','HTMLElement','Element','Node','Image','Event','CustomEvent','KeyboardEvent','PointerEvent','MouseEvent']);

function closure(src, seeds) {
  const out = [], seen = new Set(), queue = [...seeds];
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name) || HOST.has(name)) continue;
    seen.add(name);
    const decl = grab(src, name);
    if (!decl) { console.error('  ! missing', name); continue; }
    out.push({ decl, index: src.indexOf(decl) });
    for (const ref of new Set([...decl.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map((m) => m[1]))) {
      if (seen.has(ref) || HOST.has(ref) || queue.includes(ref)) continue;
      if (new RegExp('\\n {2,}(?:function\\s+' + ref + '\\s*\\(|(?:const|let|var)\\s+' + ref + '\\s*=)').test(src)) queue.push(ref);
    }
  }
  // 按原文出现顺序输出：被依赖的 const 通常在前面，避免 TDZ
  return out
    .sort((a, b) => a.index - b.index)
    .map((item) => item.decl)
    .join('\n\n');
}

const src = await readFile(path.join(repo, cfg.dir, 'client.js'), 'utf8');

if (cfg.hosted) {
  const dir = path.join(root, 'art/skins', id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'hosted.js'), src);
  await writeFile(path.join(dir, 'meta.json'), JSON.stringify({
    id,
    name: cfg.name,
    latin: cfg.latin,
    appearance: cfg.appearance,
    blurb: cfg.blurb,
    composerBg: cfg.composerBg,
    hosted: true,
    variant: cfg.variant || null,
  }, null, 2) + '\n');
  await writeExtraCss(path.join(root, 'art/skins', id));
  console.log(id, '| hosted', src.length, 'chars');
  process.exit(0);
}

// ---- 求值：CSS + token pairs ----
const styles = [];
let tokens = null;
const registered = [];
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
  document: {
    documentElement: { classList: { add() {}, remove() {} }, setAttribute() {}, removeAttribute() {}, getAttribute: () => null, style: { setProperty() {} } },
    head: { appendChild(tag) { styles.push(tag); return tag; } },
    body: { classList: { add() {}, remove() {} }, appendChild() {}, querySelector: () => null, setAttribute() {} },
    createElement() { return { dataset: {}, textContent: '', remove() {}, classList: { add() {}, remove() {} } }; },
    addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [], hidden: false,
  },
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, Error,
  parseInt, parseFloat, isNaN, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
});
vm.runInContext(src, context, { filename: cfg.dir + '/client.js' });
const def = context.window.__ModuleLoader__.def;
const React = {
  createElement: (t, p2, ...c) => ({ t, p: p2, c }),
  useState: (v) => [v, () => {}],
  useRef: (v) => ({ current: v }),
  useEffect() {},
  useMemo: (f) => f(),
  useCallback: (f) => f(),
};
const plugin = def.factory((n) => {
  if (n === 'react') return React;
  throw new Error('require ' + n);
});

function makeCtx(variantId, scheme) {
  return {
    theme: {
      getTheme: () => ({ preference: scheme, id: variantId, colorScheme: scheme }),
      setTheme() {},
      overrideTokens: (_s, pairs) => { tokens = pairs; return () => {}; },
      register: (definition) => { registered.push(definition); return () => {}; },
      onChange: () => () => {},
    },
    slots: { inject: (_n, f) => f(), register: () => () => {} },
    effect(fn) { try { fn(); } catch (e) { console.error('  effect threw:', e.message); } },
    on: () => () => {},
    get: () => undefined,
  };
}

function run(variantId, scheme) {
  styles.length = 0;
  tokens = null;
  registered.length = 0;
  try { plugin.apply(makeCtx(variantId, scheme)); } catch (e) { console.error('  apply threw:', e.message); }
  return { tokens, styles: styles.slice(), registered: registered.slice() };
}

const scheme = cfg.appearance === 'dark' ? 'dark' : 'light';
let pass = run('', scheme);
let variantId = cfg.variant || '';
if (!variantId && pass.registered.length) {
  const pick = pass.registered.find((r) => r.colorScheme === scheme) || pass.registered[0];
  variantId = pick && pick.id;
}
if (variantId) {
  pass = run(variantId, scheme);
  const reg = pass.registered.find((r) => r.id === variantId) || pass.registered[0];
  const flat = (reg && reg.tokens) || {};
  const pairs = {};
  for (const key of Object.keys(flat)) {
    const value = flat[key];
    pairs[key] = typeof value === 'string' ? { light: value, dark: value } : value;
  }
  if (Object.keys(pairs).length) pass.tokens = pairs;
}

tokens = pass.tokens;
const styles2 = pass.styles;

const css = styles2
  .map((tag) => tag.textContent || '')
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const cssPatch = cfg.cssPatch || '';
// 输入区底板色：优先用主题自己的 bg-base token，其次从 CSS 里找
const bgToken = tokens && (tokens['--dsw-alias-bg-base'] || tokens['--dsw-alias-bg-layer-1']);
const bgFromToken = bgToken && (typeof bgToken === 'string' ? bgToken : bgToken.light);
const composerBg = (/^#[0-9a-fA-F]{6}$/.test(bgFromToken || '') && bgFromToken)
  || (css.match(/background-color:\s*(#[0-9a-fA-F]{6})/) || [])[1]
  || '#0b0b0b';
const bootKey = (src.match(/const BOOT_KEY = '([^']+)'/) || [])[1] || null;
let comps = closure(src, cfg.components);
let widget = cfg.widget ? closure(src, [cfg.widget]) : '';
if (cfg.rename) {
  for (const [from, to] of cfg.rename) {
    css = css.split(from).join(to);
    comps = comps.split(from).join(to);
    widget = widget.split(from).join(to);
  }
}

// 校验：组件片段必须能解析
try { new Function(comps + '\nreturn 1;'); } catch (e) { console.error('  ! components do not parse:', e.message); process.exit(1); }
if (widget) { try { new Function(widget + '\nreturn 1;'); } catch (e) { console.error('  ! widget does not parse:', e.message); process.exit(1); } }

const outDir = path.join(root, 'art/skins', id);
await mkdir(outDir, { recursive: true });

/** 把 extra/<id>.css 里的 asset:name 换成 art/gen 下图片的 data URI */
async function writeExtraCss(targetDir) {
  const file = path.join(root, 'tools/extra', id + '.css');
  let css;
  try {
    css = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  const names = [...new Set([...css.matchAll(/asset:([a-z0-9-]+)/g)].map((m) => m[1]))];
  for (const name of names) {
    let bytes = null;
    let mime = 'image/jpeg';
    for (const [ext, type] of [['jpg', 'image/jpeg'], ['png', 'image/png'], ['webp', 'image/webp']]) {
      try {
        bytes = await readFile(path.join(root, 'art/gen', name + '.' + ext));
        mime = type;
        break;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    if (!bytes) { console.warn('  ! missing asset', name); continue; }
    css = css.split('asset:' + name).join('data:' + mime + ';base64,' + bytes.toString('base64'));
  }
  await writeFile(path.join(targetDir, 'extra.css'), css);
  console.log('  + extra.css', css.length, 'chars');
}


await writeFile(path.join(outDir, 'skin.css'), css + (cssPatch ? '\n' + cssPatch : '') + '\n');
await writeFile(path.join(outDir, 'token-pairs.json'), JSON.stringify(tokens, null, 2) + '\n');
await writeFile(path.join(outDir, 'components.js'), comps + '\n');
if (widget) await writeFile(path.join(outDir, 'widget.js'), widget + '\n');
await writeFile(path.join(outDir, 'meta.json'), JSON.stringify({
  id, name: cfg.name, latin: cfg.latin, appearance: cfg.appearance, blurb: cfg.blurb, composerBg, bootKey,
  boot: cfg.boot, overlay: cfg.overlay,
  slots: cfg.slots,
  rootClasses: cfg.rootClasses || [],
  widget: cfg.widget || null,
  sidecars: cfg.sidecars || [],
}, null, 2) + '\n');

await writeExtraCss(outDir);
console.log(id, '| tokens', tokens ? Object.keys(tokens).length : 0, '| css', css.length, '| comps', comps.length, '| widget', widget.length);
