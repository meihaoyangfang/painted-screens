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

const a = boot(null);
a.plugin.apply(a.ctx);
const cardFor = (name) => { let found=null; walk(a.render(a.slotNamed('shell.overlay').component), (n)=>{ if(n.props && n.props.className==='hp-switch__btn') found=n; }); return found; };
const btn = cardFor(); btn.props.onPointerDown({ clientX:0, clientY:0, pointerId:1, currentTarget:{ getBoundingClientRect:()=>({left:0,top:0,width:38,height:38}) } }); btn.props.onPointerUp(); btn.props.onClick();
let tree = a.render(a.slotNamed('shell.overlay').component);
const inkCard = cardNamed(tree, '墨竹'); inkCard.props.onClick();
console.log('after ink:', a.styles.map(s=>(s.textContent||'').slice(0,28).replace(/\n/g,' ')));
