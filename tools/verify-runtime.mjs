#!/usr/bin/env node
/**
 * Headless runtime check for client.js.
 *
 * Boots the generated bundle in a vm with a stubbed DSH host, then drives the
 * real code paths:
 *   1. cold boot  → tokens, styles, slots, appearance lock
 *   2. click the switcher launcher, click another skin → live switch
 *   3. teardown → everything released
 *   4. reload with a stored skin → the choice comes back
 *
 * A ~40-line React shim (createElement + useState/useRef/useEffect) lets the
 * switcher component actually run. Effects are recorded rather than executed
 * because the assertions are about the runtime contract, not pixels.
 *
 * Usage: node tools/verify-runtime.mjs
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(path.join(root, 'client.js'), 'utf8');

let failures = 0;
function check(label, ok, detail) {
  if (ok) {
    console.log('  ok   ' + label);
  } else {
    failures += 1;
    console.log('  FAIL ' + label + (detail !== undefined ? ' — ' + detail : ''));
  }
}

/** Boot one fresh instance of the bundle. A new vm context = a page reload. */
function boot(storedSkin) {
  const styles = [];
  const htmlAttrs = new Map();
  const storage = new Map(storedSkin ? [['painted-screens:skin', storedSkin]] : []);

  const documentStub = {
    documentElement: {
      setAttribute: (n, v) => htmlAttrs.set(n, v),
      removeAttribute: (n) => htmlAttrs.delete(n),
      classList: { add: (c) => htmlAttrs.set('class:' + c, '1'), remove: (c) => htmlAttrs.delete('class:' + c) },
    },
    head: {
      appendChild(tag) {
        styles.push(tag);
        return tag;
      },
    },
    createElement() {
      const tag = {
        dataset: {},
        textContent: '',
        remove() {
          const i = styles.indexOf(tag);
          if (i >= 0) styles.splice(i, 1);
        },
      };
      return tag;
    },
    hidden: false,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
    body: { classList: { add() {}, remove() {}, contains: () => false }, appendChild() {}, querySelector: () => null, setAttribute() {} },
  };

  const windowStub = {
    location: { search: '', href: 'http://test/' },
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
    },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    addEventListener() {},
    removeEventListener() {},
    __ModuleLoader__: { load(def) { this.def = def; } },
  };

  // 任何未显式桩掉的 DOM/Window 成员都退化成可调用的 no-op，
  // 这样外来主题的组件在加载期不会炸。
  const anyStub = new Proxy(function () {}, {
    get: () => anyStub,
    apply: () => anyStub,
    construct: () => anyStub,
  });
  const withFallback = (obj) => new Proxy(obj, {
    get: (target, key) => (key in target ? target[key] : anyStub),
  });
  documentStub.body = withFallback(documentStub.body || {});
  documentStub.documentElement = withFallback(documentStub.documentElement);
  const documentProxy = withFallback(documentStub);
  const windowProxy = withFallback(windowStub);

  const context = vm.createContext({
    window: windowProxy,
    document: documentProxy,
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
    setTimeout,
    clearTimeout,
    URLSearchParams,
    MutationObserver: class { observe() {} disconnect() {} },
  });

  vm.runInContext(source, context, { filename: 'client.js' });

  const moduleDef = windowStub.__ModuleLoader__.def;

  const hooks = [];
  const React = {
    __cursor: 0,
    createElement(type, props, ...children) {
      return { type, props: props || {}, children: children.flat(Infinity) };
    },
    useState(init) {
      const i = React.__cursor++;
      if (hooks.length <= i) hooks[i] = { value: typeof init === 'function' ? init() : init };
      const slot = hooks[i];
      return [slot.value, (next) => { slot.value = typeof next === 'function' ? next(slot.value) : next; }];
    },
    useRef(init) {
      const i = React.__cursor++;
      if (hooks.length <= i) hooks[i] = { ref: { current: init } };
      return hooks[i].ref;
    },
    useEffect(fn, deps) {
      const i = React.__cursor++;
      const prev = hooks[i];
      const changed = !prev || !deps || !prev.deps || deps.some((d, k) => d !== prev.deps[k]);
      hooks[i] = { deps, effect: fn, run: changed || (prev && prev.run) };
    },
  };

  // Re-render the same component instance: hooks persist, cursor resets.
  // Effects run after render (like React) so useSkin() really subscribes and a
  // skin switch is visible to the next render.
  function render(Component) {
    React.__cursor = 0;
    const tree = Component();
    for (const slot of hooks) {
      if (slot && slot.effect && slot.run) {
        slot.run = false;
        try {
          slot.effect();
        } catch (error) {
          /* effects in the shim are best-effort */
        }
      }
    }
    return tree;
  }

  const tokenCalls = [];
  const theme = {
    preference: 'light',
    getTheme: () => ({ preference: theme.preference }),
    setTheme(next) { theme.preference = next; },
    overrideTokens(sourceId, pairs) {
      const record = { sourceId, pairs, disposed: false };
      tokenCalls.push(record);
      return () => { record.disposed = true; };
    },
  };

  const slots = [];
  const effects = [];
  const listeners = new Map();
  const ctx = {
    theme,
    slots: {
      inject: (name, factory) => factory(),
      register(options, component) {
        slots.push({ name: options.name, id: options.id || null, component });
        return () => {};
      },
    },
    effect(fn, label) {
      const dispose = fn();
      effects.push({ label, dispose: typeof dispose === 'function' ? dispose : null });
      return () => {};
    },
    on(event, handler) {
      listeners.set(event, handler);
      return () => listeners.delete(event);
    },
  };

  const plugin = moduleDef.factory((name) => {
    if (name === 'react') return React;
    throw new Error('unexpected require: ' + name);
  });

  return { moduleDef, plugin, ctx, styles, htmlAttrs, storage, tokenCalls, slots, effects, theme, render };
}

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  (node.children || []).forEach((child) => walk(child, visit));
}

// ===========================================================================
console.log('\n1. cold boot');
const a = boot(null);

check('module id', a.moduleDef.id === '@mhstory/huaping');
check('plugin exposes apply()', typeof a.plugin.apply === 'function');
a.plugin.apply(a.ctx);

check('one token layer', a.tokenCalls.length === 1, a.tokenCalls.length);
check('110 tokens', Object.keys(a.tokenCalls[0].pairs).length === 110, Object.keys(a.tokenCalls[0].pairs).length);
check('every token has light+dark', Object.values(a.tokenCalls[0].pairs).every((v) => v.light && v.dark));
check('two style tags', a.styles.length === 2, a.styles.length);
check('default skin css is noir', a.styles.some((s) => (s.textContent || '').includes('.noir-')));
check('switcher css mounted', a.styles.some((s) => (s.textContent || '').includes('.hp-switch{')));
check('root attribute', a.htmlAttrs.get('data-hp-skin') === 'noir-arcade', a.htmlAttrs.get('data-hp-skin'));
check('appearance locked to dark', a.theme.preference === 'dark', a.theme.preference);
check('10 slots', a.slots.length === 10, a.slots.length);
check('settings.section registered', a.slots.some((s) => s.name === 'settings.section'));
check('shell.overlay registered three times', a.slots.filter((s) => s.name === 'shell.overlay').length === 3);
check('all slots carry a component', a.slots.every((s) => typeof s.component === 'function'));

// ===========================================================================
console.log('\n2. live switch through the real switcher component');
const switcherSlot = a.slots.find((s) => s.id === 'huaping-switcher');
check('switcher slot found', !!switcherSlot);

function cardNamed(node, label) {
  const cards = [];
  walk(node, (n) => {
    if (n.props && n.props.className === 'hp-card') cards.push(n);
  });
  let found = null;
  for (const card of cards) {
    let hit = false;
    walk(card, (n) => {
      if (Array.isArray(n.children) && n.children.indexOf(label) >= 0) hit = true;
    });
    if (hit) found = card;
  }
  return found;
}

let tree = a.render(switcherSlot.component);
let launcher = null;
walk(tree, (node) => {
  if (node.props && node.props.className === 'hp-switch__btn') launcher = node;
});
check('launcher rendered', !!launcher);

// The launcher is draggable now: a tap = pointerdown + pointerup without movement.
launcher.props.onPointerDown({
  clientX: 10,
  clientY: 10,
  pointerId: 1,
  currentTarget: {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 38, height: 38 }),
    setPointerCapture() {},
  },
});
launcher.props.onPointerUp();
launcher.props.onClick(); // 真实浏览器在 pointerup 之后还会派发 click
tree = a.render(switcherSlot.component);
const cards = [];
walk(tree, (node) => {
  if (node.props && node.props.className === 'hp-card') cards.push(node);
});
// 懒加载：首页 6 张，往下滚自动续页，不再有「加载更多」按钮
let scrollBox = null;
let hasMoreBtn = false;
walk(tree, (node) => {
  if (!node.props) return;
  if (node.props.className === 'hp-gallery__scroll') scrollBox = node;
  if (node.props.className === 'hp-more') hasMoreBtn = true;
});
check('first page is capped at six', cards.length <= 6, cards.length);
check('gallery scrolls in an inner box', !!scrollBox);
check('no load-more button', !hasMoreBtn);

let total = cards.length;
let guard = 0;
while (scrollBox && guard < 20) {
  scrollBox.props.onScroll({ currentTarget: { scrollHeight: 1200, scrollTop: 1100, clientHeight: 240 } });
  tree = a.render(switcherSlot.component);
  const next = [];
  walk(tree, (node) => { if (node.props && node.props.className === 'hp-card') next.push(node); });
  if (next.length === total) break;
  total = next.length;
  scrollBox = null;
  walk(tree, (node) => { if (node.props && node.props.className === 'hp-gallery__scroll') scrollBox = node; });
  guard += 1;
}
check('scrolling to the bottom loads the rest', total > 6, total);

const before = a.tokenCalls.length;
const bamboo = cardNamed(tree, '墨竹');
check('ink-bamboo card found', !!bamboo);
bamboo.props.onClick();

check('old token layer disposed', a.tokenCalls[0].disposed === true);
check('new token layer applied', a.tokenCalls.length === before + 1);
check('root switched to ink-bamboo', a.htmlAttrs.get('data-hp-skin') === 'ink-bamboo', a.htmlAttrs.get('data-hp-skin'));
check('appearance flipped to light', a.theme.preference === 'light', a.theme.preference);
// 导入的主题会在挂载时自带一个 style（启动幕/挂件），所以基线不是固定 2
check('style tags do not grow', a.styles.length <= 3, a.styles.length);
check('old skin css removed', !a.styles.some((s) => (s.textContent || '').includes('.noir-')));
check('new skin css present', a.styles.some((s) => (s.textContent || '').includes('.inkb-')));
check('bamboo art inlined', a.styles.some((s) => (s.textContent || '').includes('data:image/svg+xml')));
check('choice persisted', a.storage.get('painted-screens:skin') === 'ink-bamboo', a.storage.get('painted-screens:skin'));

// 点卡片后面板会自动关闭：先确认关闭，再重新打开去切回暗色皮肤
tree = a.render(switcherSlot.component);
let panelGone = true;
walk(tree, (node) => { if (node.props && node.props.className === 'hp-gallery') panelGone = false; });
check('gallery closes after applying a skin', panelGone);

await new Promise((resolve) => setTimeout(resolve, 400)); // 越过 350ms 开合去重
let reopen = null;
walk(tree, (node) => { if (node.props && node.props.className === 'hp-switch__btn') reopen = node; });
check('launcher still rendered', !!reopen);
if (reopen) {
  reopen.props.onPointerDown({ clientX: 10, clientY: 10, pointerId: 1, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 38, height: 38 }) } });
  reopen.props.onPointerUp();
  reopen.props.onClick();
}
tree = a.render(switcherSlot.component);
const noirCard = cardNamed(tree, '黑金回廊');
check('noir card found', !!noirCard);
noirCard.props.onClick();
check('switched back to noir', a.htmlAttrs.get('data-hp-skin') === 'noir-arcade', a.htmlAttrs.get('data-hp-skin'));
check('appearance back to dark', a.theme.preference === 'dark', a.theme.preference);
check('style tags return to baseline', a.styles.length <= 2, a.styles.length);

// ===========================================================================
console.log('\n3. teardown');
const runtime = a.effects.find((e) => e.label === 'huaping: runtime');
check('runtime effect registered', !!(runtime && runtime.dispose));
runtime.dispose();
check('token layer disposed', a.tokenCalls[a.tokenCalls.length - 1].disposed === true);
check('all style tags removed', a.styles.length === 0, a.styles.length);
check('root attribute cleared', !a.htmlAttrs.has('data-hp-skin'));

// ===========================================================================
console.log('\n4. reload restores the stored skin');
const b = boot('noir-arcade');
b.plugin.apply(b.ctx);
check('restored noir-cathedral', b.htmlAttrs.get('data-hp-skin') === 'noir-arcade', b.htmlAttrs.get('data-hp-skin'));
check('110 tokens on restore', Object.keys(b.tokenCalls[0].pairs).length === 110);
check('noir css mounted', b.styles.some((s) => (s.textContent || '').includes('.noir-')));

console.log('\n5. unknown stored skin falls back');
const c = boot('does-not-exist');
c.plugin.apply(c.ctx);
check('falls back to the default skin', c.htmlAttrs.get('data-hp-skin') === 'noir-arcade', c.htmlAttrs.get('data-hp-skin'));

console.log('\n' + (failures ? failures + ' check(s) failed' : 'all checks passed'));
process.exit(failures ? 1 : 0);
