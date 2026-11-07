/**
 * 画屏 · PAINTED SCREENS — multi-skin runtime for the DSH Web UI.
 *
 * Why one bundle instead of one bundle per theme: `ctx.theme` exposes only
 * `getTheme` / `setTheme` / `overrideTokens`. There is no third-party theme
 * registry and no picker, so a "theme" is really "a plugin row that overrides
 * tokens while enabled". Two enabled theme bundles therefore stack their
 * layers, both claim the same slots and both inject a full-screen overlay —
 * which is why every single-theme bundle needs a `theme-guard`.
 *
 * This pack keeps exactly one row enabled and switches skins inside itself:
 *
 *   - one stable set of slot registrations (React hosts that read the store),
 *   - one token layer, replaced on switch (the old override is disposed first),
 *   - one stylesheet, replaced on switch,
 *   - one persisted choice in localStorage.
 *
 * Adding a skin means adding one object to `SKINS`: a palette, a stylesheet
 * and the components for the slots it wants to own. Everything else is shared.
 *
 * GENERATED FILE — edit `src/client.template.js` and run `node tools/build.mjs`.
 */

window.__ModuleLoader__.load({
  id: '@mhstory/painted-screens',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useRef, useState } = React;
    const useCallback = React.useCallback || ((fn) => fn);

    const SOURCE = '@mhstory/painted-screens';
    const STORE_KEY = 'painted-screens:skin';
    const LEGACY_KEY = 'huaping-skin';
    const ROOT_ATTR = 'data-hp-skin';

    // Injected by tools/build.mjs -------------------------------------------
    const PALETTES = /*__PALETTES__*/ {};
    const TOKEN_MAP = /*__TOKEN_MAP__*/ {};
    const WIDGETS = /*__WIDGETS__*/ {};
    const BOOTS = /*__BOOTS__*/ {};
    const WIDGET_CSS = /*__WIDGET_CSS__*/ {};
    const POSTERS = /*__POSTERS__*/ {};
    const IMPORTED = /*__IMPORTED__*/ [];
    const FIELD_SLOT = {
      Overlay: 'shell.overlay',
      SidebarMark: 'sidebar.brand.mark',
      BrandName: 'sidebar.brand.name',
      HeroMark: 'conversation.hero.brand.mark',
      InputLeft: 'conversation.input.left',
      ComposerDock: 'conversation.composer.dock',
      FooterAction: 'sidebar.footer.action',
    };
    const ROOT_CLASS = { 'ink-bamboo': 'inkb-whale' };
    const ART_CATHEDRAL = /*__ART_CATHEDRAL__*/ '';
    const ART_BAMBOO = /*__ART_BAMBOO__*/ '';
    // -----------------------------------------------------------------------

    // =======================================================================
    // Palette → the 110 semantic tokens
    // =======================================================================

    function tokenPairs(paletteId) {
      const p = PALETTES[paletteId] || {};
      const out = {};
      for (const token of Object.keys(TOKEN_MAP)) {
        const value = p[TOKEN_MAP[token]];
        if (typeof value === 'string' && value) {
          out[token] = { light: value, dark: value };
        }
      }
      return out;
    }

    function hexToRgba(hex, alpha) {
      const m = /^#([0-9a-f]{6})$/i.exec(String(hex || ''));
      if (!m) return hex;
      const n = parseInt(m[1], 16);
      return 'rgba(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ', ' + alpha + ')';
    }

    // =======================================================================
    // Store — active skin id, persisted, observable
    // =======================================================================

    const skinStore = (function () {
      const subscribers = new Set();
      let current = null;

      try {
        current = window.localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_KEY);
      } catch (error) {
        current = null;
      }

      return {
        get() {
          return current;
        },
        set(id) {
          if (id === current) return;
          current = id;
          try {
            window.localStorage.setItem(STORE_KEY, id);
          } catch (error) {
            /* storage is optional; the session still switches */
          }
          subscribers.forEach((fn) => {
            try {
              fn(id);
            } catch (error) {
              /* a broken subscriber must not break the switch */
            }
          });
        },
        subscribe(fn) {
          subscribers.add(fn);
          return () => subscribers.delete(fn);
        },
      };
    })();

    function useSkin() {
      const [id, setId] = useState(() => skinStore.get());
      useEffect(() => {
        setId(skinStore.get());
        return skinStore.subscribe(setId);
      }, []);
      return id;
    }

    // =======================================================================
    // Registry
    // =======================================================================

    const SKINS = [
    ];

    SKINS.push(...IMPORTED);

    // 分类、标签与展示顺序：题材分组，组内按「浅→深」再按名字
    const SKIN_META = {
      'ink-bamboo': { group: 1, tags: ['国风', '浅色'] },
      qingming: { group: 1, tags: ['国风', '深色'] },
      'eva02-asuka': { group: 2, tags: ['机甲', '深色'] },
      aurelis: { group: 2, tags: ['机甲', '深色'] },
      'noir-arcade': { group: 3, tags: ['哥特', '深色'] },
      'velvet-sin': { group: 4, tags: ['性感', '深色'] },
      cyberpunk: { group: 5, tags: ['赛博', '深色'] },
      'rose-cream': { group: 6, tags: ['柔粉', '浅色'] },
      'big-fat-fish': { group: 7, tags: ['深海', '深色'] },
      'whale-song': { group: 7, tags: ['深海', '深色'] },
      '1bit-mac': { group: 8, tags: ['复古', '单色'] },
      sakura: { group: 9, tags: ['花见', '深色'] },
      'after-zero': { group: 10, tags: ['女仆', '深色'] },
      'tea-time': { group: 11, tags: ['女仆', '浅色'] },
      'spring-meadow': { group: 12, tags: ['自然', '浅色'] },
    };

    const tagOf = (skin) => (SKIN_META[skin.id] && SKIN_META[skin.id].tags) || [];
    const groupOf = (skin) => (SKIN_META[skin.id] && SKIN_META[skin.id].group) || 99;
    SKINS.sort((a, b) => groupOf(a) - groupOf(b) || String(a.name).localeCompare(String(b.name), 'zh'));

    const PAGE_SIZE = 6;

    const ALL_TAGS = [];
    SKINS.forEach((skin) => tagOf(skin).forEach((tag) => {
      if (!ALL_TAGS.includes(tag)) ALL_TAGS.push(tag);
    }));

    const HOSTED_SLOTS = {};

    const SKIN_BY_ID = {};
    SKINS.forEach((skin) => {
      SKIN_BY_ID[skin.id] = skin;
    });

    // 画屏的展示顺序：先给人看最强的，再按视觉家族收拢，同人垫底。
    // 未列出的皮肤按 id 排在后面，新增主题不用改这里也能显示。
    const SKIN_ORDER = [
      // 第一屏：三张最抓眼的（实时场景 / 深海 / 春野）
      'sakura', 'whale-song', 'spring-meadow',
      // 女仆三部曲：暗-亮成对，方便对比
      'after-zero', 'tea-time',
      // 暗色艺术系
      'velvet-sin', 'noir-arcade', 'aurelis', 'cyberpunk',
      // 国风
      'qingming', 'ink-bamboo',
      // 亮色与复古
      'rose-cream', '1bit-mac',
      // 其他
      'big-fat-fish',
      // 非官方同人，永远垫底
      'eva02-asuka',
    ];
    const SKIN_ORDER_INDEX = new Map(SKIN_ORDER.map((id, i) => [id, i]));
    SKINS.sort((a, b) => {
      const ia = SKIN_ORDER_INDEX.has(a.id) ? SKIN_ORDER_INDEX.get(a.id) : 900;
      const ib = SKIN_ORDER_INDEX.has(b.id) ? SKIN_ORDER_INDEX.get(b.id) : 900;
      return ia - ib || a.id.localeCompare(b.id);
    });

    SKINS.forEach((skin) => {
      const boot = BOOTS[skin.id];
      if (boot && typeof boot.component === 'function') skin.Boot = boot.component;
    });

    // 默认皮肤固定为黑金圣堂；列表顺序变了也不影响首次体验
    const DEFAULT_SKIN = SKIN_BY_ID['noir-arcade'] ? 'noir-arcade' : SKINS[0].id;

    function resolveSkin(id) {
      return SKIN_BY_ID[id] || SKIN_BY_ID[DEFAULT_SKIN];
    }

    // =======================================================================
    // Switcher
    // =======================================================================


    const SWITCH_CSS = `
.hp-switch{position:fixed;z-index:2147483640;right:16px;top:56%;pointer-events:auto;touch-action:none;font-family:"Inter",-apple-system,"PingFang SC","Noto Sans SC",sans-serif}
.hp-tip{
  position:fixed; z-index:2147483646;
  display:flex; align-items:center; gap:8px;
  max-width:280px; padding:10px 14px; white-space:nowrap;
  border-radius:12px;
  background:rgba(18,14,10,.88);
  border:1px solid color-mix(in srgb, var(--hp-accent, #e8b23d) 42%, transparent);
  box-shadow:0 12px 30px rgba(0,0,0,.5);
  color:#F4EAD8;
  font:500 13px/1.35 "PingFang SC",-apple-system,sans-serif;
  animation:hp-tip-in .34s cubic-bezier(.2,.9,.3,1.2) both;
}
.hp-tip::after{
  content:""; position:absolute; right:-6px; top:50%; margin-top:-5px;
  width:10px; height:10px; transform:rotate(45deg);
  background:rgba(18,14,10,.88);
  border-right:1px solid color-mix(in srgb, var(--hp-accent, #e8b23d) 42%, transparent);
  border-top:1px solid color-mix(in srgb, var(--hp-accent, #e8b23d) 42%, transparent);
}
.hp-tip__hint{font:400 10px/1 ui-monospace,monospace;letter-spacing:.12em;color:color-mix(in srgb, var(--hp-accent,#e8b23d) 78%, #fff);white-space:nowrap}
.hp-tip__x{appearance:none;border:0;background:none;color:rgba(244,234,216,.55);font-size:15px;line-height:1;cursor:pointer;padding:0 2px}
.hp-tip__x:hover{color:#fff}
@keyframes hp-tip-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
/* 新会话页（有 hero 输入框）根本不显示 */
/* ===== 内容层：会话正文里的代码、引用、表格、链接，跟随当前皮肤 ===== */
[class*="markdown"] :is(code, pre, blockquote, table, a, hr, kbd, mark){--hp-ink-soft:color-mix(in srgb,var(--hp-ink,#f2e9da) 78%,transparent);}
[class*="markdown"] :not(pre) > code{
  font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  font-size:.92em;padding:1px 5px;border-radius:5px;
  background:color-mix(in srgb,var(--hp-accent,#e8b23d) 14%,transparent);
  border:1px solid color-mix(in srgb,var(--hp-accent,#e8b23d) 22%,transparent);
  color:color-mix(in srgb,var(--hp-ink,#f2e9da) 92%,transparent);
}
[class*="markdown"] pre{
  position:relative;padding:14px 16px;border-radius:12px;overflow:auto;
  background:color-mix(in srgb,var(--hp-surface,#0b0b0b) 88%,#000 12%);
  border:1px solid color-mix(in srgb,var(--hp-accent,#e8b23d) 18%,transparent);
  box-shadow:0 10px 26px -18px rgba(0,0,0,.9);
}
[class*="markdown"] pre code{background:none;border:0;padding:0;font-size:12.5px;line-height:1.62;color:inherit}
[class*="markdown"] blockquote{
  margin:14px 0;padding:10px 14px;border-left:2px solid var(--hp-accent,#e8b23d);
  background:color-mix(in srgb,var(--hp-accent,#e8b23d) 8%,transparent);
  border-radius:0 10px 10px 0;color:var(--hp-ink-soft);
}
[class*="markdown"] hr{border:0;height:1px;margin:18px 0;
  background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--hp-accent,#e8b23d) 34%,transparent),transparent)}
[class*="markdown"] a{color:var(--hp-accent,#e8b23d);text-decoration:underline;text-underline-offset:2px;
  text-decoration-color:color-mix(in srgb,var(--hp-accent,#e8b23d) 45%,transparent)}
[class*="markdown"] table{border-collapse:collapse;width:100%;margin:14px 0;font-size:12.5px}
[class*="markdown"] th{
  text-align:left;font-weight:600;padding:8px 12px;
  background:color-mix(in srgb,var(--hp-accent,#e8b23d) 10%,transparent);
  border-bottom:1px solid color-mix(in srgb,var(--hp-accent,#e8b23d) 30%,transparent);
}
[class*="markdown"] td{padding:7px 12px;border-bottom:1px solid color-mix(in srgb,var(--hp-ink,#f2e9da) 10%,transparent)}
[class*="markdown"] tbody tr:nth-child(even){background:color-mix(in srgb,var(--hp-ink,#f2e9da) 4%,transparent)}
[class*="markdown"] li::marker{color:color-mix(in srgb,var(--hp-accent,#e8b23d) 70%,transparent)}

[class*="markdown"] a:hover{text-decoration-thickness:2px}
[class*="markdown"] pre:hover{border-color:color-mix(in srgb,var(--hp-accent,#e8b23d) 34%,transparent)}
[class*="markdown"] tbody tr:hover{background:color-mix(in srgb,var(--hp-accent,#e8b23d) 7%,transparent)}
[class*="markdown"] kbd{
  font-family:ui-monospace,monospace;font-size:11px;padding:1px 5px;border-radius:4px;
  border:1px solid color-mix(in srgb,var(--hp-ink,#f2e9da) 26%,transparent);
  border-bottom-width:2px;background:color-mix(in srgb,var(--hp-ink,#f2e9da) 8%,transparent);
}
[class*="markdown"] mark{
  background:color-mix(in srgb,var(--hp-accent,#e8b23d) 30%,transparent);
  color:inherit;border-radius:3px;padding:0 3px;
}

/* ===== 输入区与发送按钮：跟随皮肤骨架 ===== */
[class*="composerStack"] [class*="_add"],
[class*="composerStack"] [class*="_trigger"]{
  transition:border-color 160ms ease, background 160ms ease;
}
[class*="composerStack"] [class*="_add"]:hover,
[class*="composerStack"] [class*="_trigger"]:hover{
  border-color:color-mix(in srgb,var(--hp-accent,#e8b23d) 45%,transparent) !important;
}

html[data-hp-skin="1bit-mac"] [class*="composerStack"] [class*="_primary"]{
  border-radius:0 !important; box-shadow:3px 3px 0 color-mix(in srgb,var(--hp-ink,#111) 30%,transparent) !important;
}
html[data-hp-skin="ink-bamboo"] [class*="composerStack"] [class*="_primary"],
html[data-hp-skin="qingming"] [class*="composerStack"] [class*="_primary"]{
  border-radius:3px 12px 3px 12px !important;
}
html[data-hp-skin="eva02-asuka"] [class*="composerStack"] [class*="_primary"],
html[data-hp-skin="aurelis"] [class*="composerStack"] [class*="_primary"],
html[data-hp-skin="cyberpunk"] [class*="composerStack"] [class*="_primary"]{
  border-radius:0 !important;
  clip-path:polygon(0 0,calc(100% - 9px) 0,100% 9px,100% 100%,9px 100%,0 calc(100% - 9px));
}
html[data-hp-skin="velvet-sin"] [class*="composerStack"] [class*="_primary"]{
  border-radius:2px !important;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--hp-accent,#e0457b) 40%,transparent) !important;
}
html[data-hp-skin="noir-arcade"] [class*="composerStack"] [class*="_primary"]{
  border-radius:5px 5px 2px 2px !important;
}

/* ===== 气泡骨架：按皮肤分四类，改形状不改配色 ===== */
[class*="markdown"]{ }
/* 通用：让气泡本身接受形状改造 */
[class*="_bubble"], [class*="_body"]:has(> [class*="markdown"]){ transition:border-color 160ms ease, box-shadow 160ms ease; }

/* ① 像素：直角 + 硬阴影 */
html[data-hp-skin="1bit-mac"] [class*="_bubble"],
html[data-hp-skin="1bit-mac"] [class*="_body"]:has(> [class*="markdown"]){
  border-radius:0 !important;
  border:2px solid color-mix(in srgb,var(--hp-ink,#111) 62%,transparent) !important;
  box-shadow:4px 4px 0 color-mix(in srgb,var(--hp-ink,#111) 26%,transparent) !important;
}
/* ② 切角面板：机甲/赛博 */
html[data-hp-skin="eva02-asuka"] [class*="_bubble"],
html[data-hp-skin="eva02-asuka"] [class*="_body"]:has(> [class*="markdown"]),
html[data-hp-skin="aurelis"] [class*="_bubble"],
html[data-hp-skin="aurelis"] [class*="_body"]:has(> [class*="markdown"]),
html[data-hp-skin="cyberpunk"] [class*="_bubble"],
html[data-hp-skin="cyberpunk"] [class*="_body"]:has(> [class*="markdown"]){
  border-radius:0 !important;
  border:1px solid color-mix(in srgb,var(--hp-accent,#ff5a3c) 38%,transparent) !important;
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
}
/* ③ 纸感：水墨/宣纸 */
html[data-hp-skin="ink-bamboo"] [class*="_bubble"],
html[data-hp-skin="ink-bamboo"] [class*="_body"]:has(> [class*="markdown"]),
html[data-hp-skin="qingming"] [class*="_bubble"],
html[data-hp-skin="qingming"] [class*="_body"]:has(> [class*="markdown"]){
  border-radius:3px 14px 4px 12px !important;
  border:1px solid color-mix(in srgb,var(--hp-accent,#b03a2e) 26%,transparent) !important;
  box-shadow:0 2px 0 color-mix(in srgb,var(--hp-accent,#b03a2e) 12%,transparent) !important;
}
/* ④ 柔玻璃：写真/深海/春野 */
html[data-hp-skin="whale-song"] [class*="_bubble"],
html[data-hp-skin="whale-song"] [class*="_body"]:has(> [class*="markdown"]),
html[data-hp-skin="rose-cream"] [class*="_bubble"],
html[data-hp-skin="rose-cream"] [class*="_body"]:has(> [class*="markdown"]),
html[data-hp-skin="spring-meadow"] [class*="_bubble"],
html[data-hp-skin="spring-meadow"] [class*="_body"]:has(> [class*="markdown"]),
html[data-hp-skin="tea-time"] [class*="_bubble"],
html[data-hp-skin="tea-time"] [class*="_body"]:has(> [class*="markdown"]),
html[data-hp-skin="sakura"] [class*="_bubble"],
html[data-hp-skin="sakura"] [class*="_body"]:has(> [class*="markdown"]){
  border-radius:18px !important;
  border:1px solid color-mix(in srgb,var(--hp-accent,#d9788f) 24%,transparent) !important;
  box-shadow:0 8px 22px -16px color-mix(in srgb,var(--hp-ink,#333) 55%,transparent) !important;
}
/* ⑤ 双线：装饰艺术 */
html[data-hp-skin="velvet-sin"] [class*="_bubble"],
html[data-hp-skin="velvet-sin"] [class*="_body"]:has(> [class*="markdown"]){
  border-radius:2px !important;
  border:1px solid color-mix(in srgb,var(--hp-accent,#e0457b) 34%,transparent) !important;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--hp-accent,#e0457b) 14%,transparent) !important;
}
/* ⑥ 拱窗：哥特 */
html[data-hp-skin="noir-arcade"] [class*="_bubble"],
html[data-hp-skin="noir-arcade"] [class*="_body"]:has(> [class*="markdown"]){
  border-radius:4px 4px 2px 2px !important;
  border:1px solid color-mix(in srgb,var(--hp-accent,#d4b16d) 30%,transparent) !important;
  box-shadow:0 0 0 1px color-mix(in srgb,var(--hp-accent,#d4b16d) 10%,transparent) !important;
}

/* 选中与光标 */
::selection{background:color-mix(in srgb,var(--hp-accent,#e8b23d) 34%,transparent);color:inherit}

/* 焦点环：键盘操作时可见 */
:where(button,a,input,textarea,[role="button"]):focus-visible{
  outline:2px solid color-mix(in srgb,var(--hp-accent,#e8b23d) 62%,transparent);
  outline-offset:2px;border-radius:6px;
}

/* 会话滚动条：细、跟随主题 */
[class*="scrollBody"]::-webkit-scrollbar,[class*="scroll"]::-webkit-scrollbar{width:10px;height:10px}
[class*="scrollBody"]::-webkit-scrollbar-thumb,[class*="scroll"]::-webkit-scrollbar-thumb{
  background:color-mix(in srgb,var(--hp-accent,#e8b23d) 34%,transparent);
  border:3px solid transparent;background-clip:content-box;border-radius:99px;
}
[class*="scrollBody"]::-webkit-scrollbar-thumb:hover,[class*="scroll"]::-webkit-scrollbar-thumb:hover{
  background:color-mix(in srgb,var(--hp-accent,#e8b23d) 58%,transparent);background-clip:content-box;
}
[class*="scrollBody"]::-webkit-scrollbar-track,[class*="scroll"]::-webkit-scrollbar-track{background:transparent}

html:has([class*="composerHero"]) .hp-composer-fade{display:none !important}
.hp-composer-fade{position:absolute;left:0;right:0;top:100%;height:56px;z-index:1;pointer-events:none;border-radius:0 0 20px 20px}
.hp-switch__btn{
  width:38px;height:38px;display:grid;place-items:center;cursor:pointer;
  border-radius:50%;
  border:1px solid color-mix(in srgb, var(--hp-accent, #e8b23d) 58%, transparent);
  background:color-mix(in srgb, var(--hp-surface, #0b0b0b) 84%, transparent);
  color:var(--hp-accent, #f2e9da);
  backdrop-filter:blur(14px);
  box-shadow:0 6px 22px rgba(0,0,0,.5),0 0 0 3px color-mix(in srgb, var(--hp-accent, #e8b23d) 14%, transparent);
  transition:transform .16s ease,border-color .16s ease;
}
.hp-switch__btn:hover{transform:translateY(-1px);border-color:var(--hp-accent, #e8b23d);box-shadow:0 8px 26px rgba(0,0,0,.55),0 0 0 4px color-mix(in srgb, var(--hp-accent, #e8b23d) 22%, transparent)}
.hp-switch__btn:active{cursor:grabbing}
.hp-switch__btn:focus-visible{outline:2px solid #E8B23D;outline-offset:2px}

.hp-plainboot{
  position:fixed; inset:0; z-index:2147483646;
  display:grid; place-content:center; justify-items:center; gap:10px;
  animation:hp-plainboot-in .22s ease both;
}
.hp-plainboot__name{font:600 30px/1.2 "Songti SC","PingFang SC",serif;letter-spacing:.14em;color:var(--hp-accent,#f2e9da)}
.hp-plainboot__latin{font:400 11px/1 ui-monospace,monospace;letter-spacing:.32em;color:color-mix(in srgb,var(--hp-accent,#f2e9da) 62%,transparent)}
.hp-plainboot__bar{width:120px;height:2px;border-radius:2px;background:color-mix(in srgb,var(--hp-accent,#f2e9da) 26%,transparent);overflow:hidden;position:relative}
.hp-plainboot__bar::after{content:"";position:absolute;inset:0;background:var(--hp-accent,#f2e9da);transform-origin:left;animation:hp-plainboot-bar 1.1s cubic-bezier(.4,0,.2,1) both}
@keyframes hp-plainboot-in{from{opacity:0}to{opacity:1}}
@keyframes hp-plainboot-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.hp-gallery{
  position:fixed;inset:0;z-index:2147483645;pointer-events:auto;
  display:grid;place-items:center;padding:24px;
  background:rgba(5,7,11,.72);backdrop-filter:blur(14px);
  animation:hp-fade .18s ease both;
}
@keyframes hp-fade{from{opacity:0}to{opacity:1}}
/* ── 画屏 · 跟随主题明暗 ─────────────────────────────────────────── */
html[data-hp-appearance="light"] .hp-gallery__panel{
  color:var(--hp-ink,#1F2A24) !important;
  background:rgba(253,254,252,.975) !important;
  border-color:color-mix(in srgb, var(--hp-accent,#4E8B4A) 26%, transparent) !important;
  box-shadow:0 30px 80px rgba(20,32,24,.26) !important;
}
html[data-hp-appearance="light"] .hp-gallery__title,
html[data-hp-appearance="light"] .hp-card__name{color:var(--hp-ink,#1F2A24) !important}
html[data-hp-appearance="light"] .hp-gallery__sub,
html[data-hp-appearance="light"] .hp-card__latin,
html[data-hp-appearance="light"] .hp-card__blurb,
html[data-hp-appearance="light"] .hp-gallery__foot{color:color-mix(in srgb, var(--hp-ink,#1F2A24) 58%, transparent) !important}
html[data-hp-appearance="light"] .hp-gallery__close{
  color:var(--hp-ink,#1F2A24) !important;
  border-color:color-mix(in srgb, var(--hp-accent,#4E8B4A) 32%, transparent) !important;
}
html[data-hp-appearance="light"] .hp-card{
  background:rgba(255,255,255,.95) !important;
  border-color:color-mix(in srgb, var(--hp-accent,#4E8B4A) 18%, transparent) !important;
}
html[data-hp-appearance="light"] .hp-gallery__panel input,
html[data-hp-appearance="light"] .hp-gallery__panel [class*="search"]{
  color:var(--hp-ink,#1F2A24) !important;
  background:rgba(255,255,255,.96) !important;
  border:1px solid color-mix(in srgb, var(--hp-accent,#4E8B4A) 28%, transparent) !important;
}
html[data-hp-appearance="light"] .hp-gallery__panel input::placeholder{
  color:color-mix(in srgb, var(--hp-ink,#1F2A24) 42%, transparent) !important;
}
html[data-hp-appearance="light"] .hp-tags,
html[data-hp-appearance="light"] .hp-tags *{color:color-mix(in srgb, var(--hp-ink,#1F2A24) 72%, transparent) !important;opacity:1 !important}
html[data-hp-appearance="light"] .hp-tag{
  color:color-mix(in srgb, var(--hp-ink,#1F2A24) 72%, transparent) !important;
  background:color-mix(in srgb, var(--hp-accent,#4E8B4A) 14%, #fff) !important;
  border:1px solid color-mix(in srgb, var(--hp-accent,#4E8B4A) 28%, transparent) !important;
  opacity:1 !important;
}
html[data-hp-appearance="light"] .hp-tag[data-on="1"],
html[data-hp-appearance="light"] .hp-tag[aria-selected="true"],
html[data-hp-appearance="light"] .hp-tag--on{
  background:var(--hp-accent,#4E8B4A) !important;color:#fff !important;
}
html[data-hp-appearance="light"] .hp-card__tags,
html[data-hp-appearance="light"] .hp-card__tags *{
  color:color-mix(in srgb, var(--hp-ink,#1F2A24) 72%, transparent) !important;
  opacity:1 !important;
  background:color-mix(in srgb, var(--hp-accent,#4E8B4A) 14%, #fff) !important;
  border:1px solid color-mix(in srgb, var(--hp-accent,#4E8B4A) 30%, transparent) !important;
  border-radius:999px !important;
  padding:1px 7px !important;
}
html[data-hp-appearance="light"] .hp-switch__btn{
  background:rgba(255,255,255,.9) !important;
  border-color:color-mix(in srgb, var(--hp-accent,#4E8B4A) 45%, transparent) !important;
}
html[data-hp-appearance="light"] .hp-tip{
  background:rgba(255,255,255,.96) !important;
  border-color:color-mix(in srgb, var(--hp-accent,#4E8B4A) 32%, transparent) !important;
  color:var(--hp-ink,#1F2A24) !important;
}
.hp-gallery__panel{
  width:min(960px,94vw);max-height:82vh;overflow:hidden;box-sizing:border-box;
  display:flex;flex-direction:column;
  padding:26px 26px 20px;border-radius:18px;
  border:1px solid color-mix(in srgb, var(--hp-accent, #e8b23d) 26%, rgba(255,255,255,.1));
  background:color-mix(in srgb, var(--hp-surface, #0c0e13) 95%, transparent);
  box-shadow:0 32px 90px rgba(0,0,0,.62);
  color:var(--hp-ink, #e7ecf5);
}
/* 省电动效：一键停掉持续动画，保留过渡 */
html[data-hp-motion="lite"] *,
html[data-hp-motion="lite"] *::before,
html[data-hp-motion="lite"] *::after{
  animation-duration: 1ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 120ms !important;
}
.hp-gallery__head-actions{display:flex;align-items:center;gap:10px}
.hp-motion{
  font:500 11px/1 "Inter",-apple-system,"PingFang SC",sans-serif;letter-spacing:.04em;
  padding:7px 11px;border-radius:999px;cursor:pointer;
  border:1px solid color-mix(in srgb,var(--hp-accent,#e8b23d) 34%,transparent);
  background:color-mix(in srgb,var(--hp-surface,#0b0b0b) 70%,transparent);
  color:color-mix(in srgb,var(--hp-ink,#f5efe6) 78%,transparent);
}
.hp-motion[data-on="true"]{
  border-color:color-mix(in srgb,var(--hp-accent,#e8b23d) 60%,transparent);
  color:var(--hp-accent,#e8b23d);
}
.hp-gallery__head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:20px;flex:none}
.hp-gallery__scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;margin:0 -8px;padding:0 8px 4px}
.hp-gallery__title{font:600 13px/1 "Inter",-apple-system,"PingFang SC",sans-serif;letter-spacing:.26em;color:var(--hp-ink, #f2e9da)}
.hp-gallery__sub{margin-top:7px;font:500 10px/1.4 "IBM Plex Mono",monospace;letter-spacing:.12em;color:color-mix(in srgb, var(--hp-ink, #eaeff7) 58%, transparent)}
.hp-gallery__close{
  width:30px;height:30px;flex:none;cursor:pointer;border-radius:8px;
  border:1px solid color-mix(in srgb, var(--hp-ink, #eaeff7) 22%, transparent);
  background:color-mix(in srgb, var(--hp-ink, #eaeff7) 8%, transparent);
  color:color-mix(in srgb, var(--hp-ink, #eaeff7) 75%, transparent);font:400 16px/1 system-ui;display:grid;place-items:center;
}
.hp-gallery__close:hover{background:rgba(255,255,255,.1)}
.hp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.hp-card{
  display:grid;gap:0;padding:0;overflow:hidden;cursor:pointer;text-align:left;
  border-radius:12px;border:1px solid color-mix(in srgb, var(--hp-ink, #eaeff7) 16%, transparent);
  background:color-mix(in srgb, var(--hp-ink, #eaeff7) 4%, transparent);color:inherit;font:inherit;
  transition:border-color .14s ease,background .14s ease,transform .14s ease;
}
.hp-card:hover{border-color:color-mix(in srgb, var(--hp-ink, #eaeff7) 34%, transparent);background:color-mix(in srgb, var(--hp-ink, #eaeff7) 8%, transparent);transform:translateY(-1px)}
.hp-card:focus-visible{outline:2px solid #E8B23D;outline-offset:2px}
.hp-card[data-active="true"]{border-color:var(--hp-accent, #e8b23d);background:color-mix(in srgb, var(--hp-accent, #e8b23d) 10%, transparent)}
.hp-card__preview{position:relative;display:block;aspect-ratio:16/9;overflow:hidden;background:rgba(255,255,255,.04)}
.hp-card__shot{width:100%;height:100%;object-fit:cover;display:block}
.hp-card__bands{display:flex;height:100%}
.hp-card__bands i{flex:1}
.hp-card__body{padding:9px 12px 8px;display:grid;gap:4px;padding:11px 12px 6px}
.hp-card__name{font-size:12.5px;letter-spacing:.04em;color:var(--hp-ink, #eaeff7)}
.hp-card__latin{font:500 8px/1 "IBM Plex Mono",monospace;letter-spacing:.2em;color:color-mix(in srgb, var(--hp-ink, #eaeff7) 55%, transparent)}
.hp-card__blurb{font-size:9.5px;line-height:1.35;color:color-mix(in srgb, var(--hp-ink, #eaeff7) 72%, transparent);margin-top:2px}
.hp-card__foot{display:flex;justify-content:flex-end;padding:0 12px 11px}
.hp-card__check{font:500 8.5px/1 "IBM Plex Mono",monospace;letter-spacing:.16em;color:var(--hp-accent, #e8b23d)}
.hp-settings{
  display:grid;gap:18px;position:relative;padding:18px 18px 20px;border-radius:16px;
  background:
    linear-gradient(180deg,color-mix(in srgb,var(--hp-accent,#e8b23d) 7%,transparent),transparent 42%),
    color-mix(in srgb,var(--hp-surface,#0b0b0b) 92%,transparent);
  border:1px solid color-mix(in srgb,var(--hp-accent,#e8b23d) 18%,transparent);
}
.hp-settings::before{
  content:"";position:absolute;left:18px;right:18px;top:0;height:2px;border-radius:2px;
  background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--hp-accent,#e8b23d) 65%,transparent),transparent);
}
.hp-settings__head{display:grid;gap:6px}
.hp-settings__title{margin:0;font:600 15px/1.2 "Inter",-apple-system,"PingFang SC",sans-serif;letter-spacing:.06em;color:color-mix(in srgb,var(--hp-ink,#f5efe6) 96%,transparent)}
.hp-settings__title::before{content:"";display:inline-block;width:8px;height:8px;margin-right:8px;border-radius:2px;background:var(--hp-accent,#e8b23d);vertical-align:1px}
.hp-settings__sub{margin:0;font-size:12px;line-height:1.5;opacity:.72;color:color-mix(in srgb,var(--hp-ink,#f5efe6) 80%,transparent)}
.hp-settings__foot{margin:0;font:500 9px/1.5 "IBM Plex Mono",monospace;letter-spacing:.1em;opacity:.5}
.hp-settings .hp-grid{margin-top:2px}
.hp-gallery__foot{flex:none;
  margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,.07);
  font:500 9px/1.5 "IBM Plex Mono",monospace;letter-spacing:.1em;color:color-mix(in srgb, var(--hp-ink, #eaeff7) 45%, transparent);
}
.hp-tools{display:grid;gap:10px;margin:0 0 16px;flex:none}
.hp-search{
  width:100%;box-sizing:border-box;padding:9px 12px;border-radius:9px;
  font:inherit;font-size:12px;
  color:var(--hp-ink, #eaeff7);
  background:color-mix(in srgb, var(--hp-ink, #eaeff7) 6%, transparent);
  border:1px solid color-mix(in srgb, var(--hp-ink, #eaeff7) 18%, transparent);
  outline:none;
}
.hp-search::placeholder{color:color-mix(in srgb, var(--hp-ink, #eaeff7) 45%, transparent)}
.hp-search:focus{border-color:var(--hp-accent, #e8b23d)}
.hp-tags{display:flex;flex-wrap:wrap;gap:6px}
.hp-tag{
  padding:4px 10px;border-radius:999px;cursor:pointer;font:inherit;font-size:10px;letter-spacing:.06em;
  color:color-mix(in srgb, var(--hp-ink, #eaeff7) 72%, transparent);
  background:transparent;
  border:1px solid color-mix(in srgb, var(--hp-ink, #eaeff7) 20%, transparent);
  transition:color .14s ease,border-color .14s ease,background .14s ease;
}
.hp-tag:hover{color:var(--hp-ink, #eaeff7);border-color:color-mix(in srgb, var(--hp-ink, #eaeff7) 40%, transparent)}
.hp-tag[data-on="true"]{
  color:var(--hp-accent, #e8b23d);
  border-color:var(--hp-accent, #e8b23d);
  background:color-mix(in srgb, var(--hp-accent, #e8b23d) 12%, transparent);
}
.hp-card__tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.hp-card__tags i{
  font-style:normal;font-size:8.5px;letter-spacing:.08em;padding:2px 6px;border-radius:999px;
  color:color-mix(in srgb, var(--hp-ink, #eaeff7) 62%, transparent);
  border:1px solid color-mix(in srgb, var(--hp-ink, #eaeff7) 16%, transparent);
}
.hp-empty{
  padding:26px 8px 10px;text-align:center;font-size:12px;
  color:color-mix(in srgb, var(--hp-ink, #eaeff7) 55%, transparent);
}

/* 启动幕挂在宿主的 overlayLayer 里，那层的 z-index 只有 20，
   会被主界面压住（只透出一层薄薄的影）。单独把这一层提到最前面。 */
html body [class*="overlayLayer"]{z-index:2147483000 !important}
.hp-artboot__mark{position:absolute;left:50%;top:24%;width:184px;height:184px;transform:translateX(-50%);animation:hp-artboot-float 5s ease-in-out infinite;filter:drop-shadow(0 18px 30px rgba(91,64,52,.18))}
@keyframes hp-artboot-float{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-8px)}}
/* 只有三点一刻的茶壶会蹦：蓄力—弹起—落地—回弹 */
.hp-artboot--tea-time .hp-artboot__mark{animation:hp-artboot-mark 3.2s cubic-bezier(.34,1.4,.64,1) infinite}
@keyframes hp-artboot-mark{
  0%,100%{transform:translate(-50%,0) rotate(0deg) scale(1)}
  18%{transform:translate(-50%,6px) rotate(0deg) scale(1.06,.94)}
  42%{transform:translate(-50%,-30px) rotate(-4deg) scale(.97,1.05)}
  62%{transform:translate(-50%,-6px) rotate(3deg) scale(1.02,.98)}
  78%{transform:translate(-50%,-14px) rotate(-1.2deg) scale(1)}
}
.hp-artboot--light .hp-artboot__inner{padding-top:184px}
.hp-artboot--light .hp-artboot__veil{background:radial-gradient(ellipse 72% 62% at 50% 46%,rgba(255,248,240,.06),rgba(120,86,66,.34))}
.hp-artboot--light .hp-artboot__inner{color:#5B4034;text-shadow:0 2px 18px rgba(255,252,247,.85)}
.hp-artboot--light .hp-artboot__bar{background:rgba(91,64,52,.20)}
.hp-artboot{position:fixed;inset:0;z-index:2147483300;pointer-events:none;isolation:isolate}
.hp-artboot__art{position:absolute;inset:0;background-size:cover;background-position:center;transform:scale(1.02);animation:hp-artboot-in .32s ease-out both}
.hp-artboot__veil{position:absolute;inset:0;background:radial-gradient(ellipse 72% 62% at 50% 46%,rgba(0,0,0,.18),rgba(0,0,0,.72))}
.hp-artboot__inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#F6EFE2;text-shadow:0 2px 18px rgba(0,0,0,.6)}
.hp-artboot__name{font:600 26px/1 "Inter","PingFang SC",sans-serif;letter-spacing:.34em}
.hp-artboot__latin{font:500 9px/1 "IBM Plex Mono",monospace;letter-spacing:.42em;opacity:.62}
.hp-artboot__bar{width:96px;height:1px;background:rgba(246,239,226,.22);overflow:hidden}
.hp-artboot__bar::after{content:"";display:block;height:100%;width:100%;background:currentColor;animation:hp-artboot-bar 1.65s ease-in-out both}
@keyframes hp-artboot-in{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:scale(1.02)}}
@keyframes hp-artboot-bar{from{transform:translateX(-100%)}to{transform:translateX(0)}}

@media (max-width:760px){
  .hp-grid{grid-template-columns:1fr 1fr}
  .hp-card__preview{aspect-ratio:16/9}
}
`;

    function HpGlyph() {
      return h(
        'svg',
        { width: 18, height: 18, viewBox: '0 0 24 24', 'aria-hidden': 'true' },
        h('circle', { cx: 12, cy: 12, r: 8.4, fill: 'none', stroke: 'currentColor', strokeOpacity: 0.55, strokeWidth: 1.4 }),
        h('path', { d: 'M12 3.6a8.4 8.4 0 0 1 8.4 8.4h-8.4z', fill: 'currentColor', fillOpacity: 0.9 }),
        h('path', { d: 'M12 20.4A8.4 8.4 0 0 1 3.6 12h8.4z', fill: 'currentColor', fillOpacity: 0.35 }),
      );
    }

    function useAnchor() {
      const [pos, setPos] = useState(() => {
        try {
          const raw = window.localStorage.getItem('painted-screens:anchor') || window.localStorage.getItem('huaping-anchor');
          const parsed = raw ? JSON.parse(raw) : null;
          if (!parsed || typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null;
          // 存下来的是绝对像素。换了显示器（大屏→笔记本小屏）之后，
          // 这些坐标可能已经整颗都在视口外，那就别用了，退回默认位置。
          const w = window.innerWidth || 1440;
          const h = window.innerHeight || 900;
          if (parsed.x > w - 40 || parsed.y > h - 40 || parsed.x < 0 || parsed.y < 0) return null;
          return parsed;
        } catch (error) {
          return null;
        }
      });
      const save = (next) => {
        setPos(next);
        try {
          window.localStorage.setItem('painted-screens:anchor', JSON.stringify(next));
        } catch (error) {
          /* storage optional */
        }
      };
      return [pos, save];
    }

    function HpSwitcher() {
      const activeId = useSkin();
      const [open, setOpen] = useState(false);
      const [query, setQuery] = useState('');
      const [tag, setTag] = useState('all');
      const [lite, setLite] = useState(() => {
        try { return localStorage.getItem('painted-screens:motion') === 'lite'; } catch (e) { return false; }
      });
      const [limit, setLimit] = useState(PAGE_SIZE);
      const scrollRef = useRef(null);
      const [anchor, saveAnchor] = useAnchor();
      const drag = useRef(null);
      const movedRef = useRef(false);
      const lastToggle = useRef(0);
      const observer = useRef(null);
      const [dragging, setDragging] = useState(false);

      useEffect(() => {
        // 面板开着的时候，底下的实时场景（樱花那套 WebGL）要停下来：
        // 整块 backdrop-filter 盖着还在重画的 canvas，滚动就会闪。
        try {
          document.documentElement.dataset.hpGallery = open ? '1' : '0';
        } catch (error) {
          /* ignore */
        }
        if (!open) return undefined;
        const onKey = (event) => {
          if (event.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, [open]);

      const toggleLite = useCallback(() => {
        setLite((prev) => {
          const next = !prev;
          try { localStorage.setItem('painted-screens:motion', next ? 'lite' : 'full'); } catch (e) {}
          document.documentElement.setAttribute('data-hp-motion', next ? 'lite' : 'full');
          return next;
        });
      }, []);

      React.useEffect(() => {
        document.documentElement.setAttribute('data-hp-motion', lite ? 'lite' : 'full');
      }, [lite]);

      const close = () => setOpen(false);

      // 一页 6 张，滚到底自动续页；换搜索/标签时回到第一页
      const more = () => setLimit((value) => value + PAGE_SIZE);
      const resetPage = () => setLimit(PAGE_SIZE);
      const onScroll = (event) => {
        const box = event.currentTarget;
        if (box.scrollHeight - box.scrollTop - box.clientHeight < 240) more();
      };

      const q = query.trim().toLowerCase();
      const shown = SKINS.filter((skin) => {
        if (tag !== 'all' && !tagOf(skin).includes(tag)) return false;
        if (!q) return true;
        const hay = [skin.name, skin.latin, skin.blurb].concat(tagOf(skin)).join(' ').toLowerCase();
        return hay.indexOf(q) >= 0;
      });
      const visible = shown.slice(0, limit);

      // 每次打开都从第一页开始
      useEffect(() => {
        if (!open) return;
        setLimit(PAGE_SIZE);
      }, [open]);

      // 一屏放得下 6 张时不会出现滚动条，滚到底的事件也永远不会来——
      // 这里补一段：只要内容还没撑满容器、后面还有卡片，就继续加。
      useEffect(() => {
        if (!open) return;
        const box = scrollRef.current;
        if (!box) return;
        if (box.scrollHeight - box.clientHeight >= 24) return;
        if (limit >= shown.length) return;
        setLimit((value) => Math.min(value + PAGE_SIZE, shown.length));
      }, [open, limit, shown.length]);

      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

      // 拖动只负责位移；开合交给 click，避免真实点击后紧跟的 click
      // 把刚打开的面板立刻关掉。
      const onPointerDown = (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        const rect = event.currentTarget.getBoundingClientRect();
        movedRef.current = false;
        drag.current = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, moved: false };
        // 捕获指针：鼠标移出 38px 的按钮后仍能收到 move，拖动才跟手
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch (error) {
          /* ignore */
        }
      };

      const onPointerMove = (event) => {
        const d = drag.current;
        if (!d) return;
        const dx = event.clientX - d.x;
        const dy = event.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) < 5) return;
        if (!d.moved) {
          d.moved = true;
          movedRef.current = true;
          setDragging(true);
        }
        saveAnchor({
          x: clamp(d.left + dx, 8, window.innerWidth - 46),
          y: clamp(d.top + dy, 8, window.innerHeight - 46),
        });
      };

      // 两种事件模型都兜住：pointerup 和 click 都能开合，但 350ms 内只生效一次。
      const doToggle = () => {
        const now = Date.now();
        if (now - lastToggle.current < 350) return;
        lastToggle.current = now;
        setOpen((value) => !value);
      };

      const onPointerUp = () => {
        const moved = movedRef.current;
        drag.current = null;
        setDragging(false);
        if (!moved) doToggle();
      };

      const onClick = () => {
        if (movedRef.current) {
          movedRef.current = false;
          return;
        }
        doToggle();
      };

      // 记录视口尺寸：从大屏投屏切回小屏时，存下来的绝对坐标可能已经在屏幕外，
      // 所以每次渲染都把位置夹回可视范围，并用 resize 触发重算。
      const [viewport, setViewport] = useState(() => ({
        w: typeof window === 'undefined' ? 1440 : window.innerWidth,
        h: typeof window === 'undefined' ? 900 : window.innerHeight,
      }));
      useEffect(() => {
        const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        return () => {
          window.removeEventListener('resize', onResize);
          window.removeEventListener('orientationchange', onResize);
        };
      }, []);

      const buttonStyle = anchor
        ? {
            left: clamp(anchor.x, 8, Math.max(8, viewport.w - 46)) + 'px',
            top: clamp(anchor.y, 8, Math.max(8, viewport.h - 46)) + 'px',
            right: 'auto',
            bottom: 'auto',
          }
        : null;

      return h(
        'div',
        { className: 'hp-switch', style: buttonStyle, 'data-dragging': dragging ? 'true' : 'false' },
        open
          ? h(
              'div',
              {
                className: 'hp-gallery',
                role: 'dialog',
                'aria-modal': 'true',
                'aria-label': '选择皮肤',
                onClick: (event) => {
                  if (event.target === event.currentTarget) close();
                },
              },
              h(
                'div',
                { className: 'hp-gallery__panel' },
                h(
                  'div',
                  { className: 'hp-gallery__head' },
                  h(
                    'div',
                    null,
                    h('div', { className: 'hp-gallery__title' }, '画屏 · 皮肤库'),
                    h('div', { className: 'hp-gallery__sub' }, SKINS.length + ' SKINS · 切换即时生效 · 选择会被记住'),
                  ),
                  h(
                    'div',
                    { className: 'hp-gallery__head-actions' },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'hp-motion',
                        'data-on': lite ? 'true' : 'false',
                        onClick: toggleLite,
                        title: '减少背景动效，省电',
                        'aria-pressed': lite ? 'true' : 'false',
                      },
                      lite ? '动效·省电' : '动效·完整',
                    ),
                    h('button', { type: 'button', className: 'hp-gallery__close', onClick: close, 'aria-label': '关闭' }, '×'),
                  ),
                ),
                h(
                  'div',
                  { className: 'hp-tools' },
                  h('input', {
                    className: 'hp-search',
                    type: 'search',
                    value: query,
                    placeholder: '搜索皮肤 / 标签',
                    'aria-label': '搜索皮肤',
                    onInput: (event) => { setQuery(event.target.value); resetPage(); },
                  }),
                  h(
                    'div',
                    { className: 'hp-tags' },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'hp-tag',
                        'data-on': tag === 'all' ? 'true' : 'false',
                        onClick: () => { setTag('all'); resetPage(); },
                      },
                      '全部',
                    ),
                    ALL_TAGS.map((name) =>
                      h(
                        'button',
                        {
                          key: name,
                          type: 'button',
                          className: 'hp-tag',
                          'data-on': tag === name ? 'true' : 'false',
                          onClick: () => { setTag(tag === name ? 'all' : name); resetPage(); },
                        },
                        name,
                      ),
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'hp-gallery__scroll', ref: scrollRef, onScroll },
                  h(
                  'div',
                  { className: 'hp-grid' },
                  visible.map((skin) =>
                    h(
                      'button',
                      {
                        key: skin.id,
                        type: 'button',
                        className: 'hp-card',
                        'data-active': skin.id === activeId ? 'true' : 'false',
                        onClick: () => {
                        skinStore.set(skin.id);
                        setOpen(false);
                      },
                      },
                      h(
              'span',
              { className: 'hp-card__preview' },
              POSTERS[skin.id]
                ? h('img', { src: POSTERS[skin.id], alt: '', className: 'hp-card__shot', loading: 'lazy', decoding: 'async' })
                : h('span', { className: 'hp-card__bands' }, (skin.swatch || []).map((color, i) => h('i', { key: i, style: { background: color } }))),
            ),
                      h(
                        'span',
                        { className: 'hp-card__body' },
                        h('span', { className: 'hp-card__name' }, skin.name),
                        h('span', { className: 'hp-card__latin' }, skin.latin),
                        h('span', { className: 'hp-card__blurb' }, skin.blurb),
                        h(
                          'span',
                          { className: 'hp-card__tags' },
                          tagOf(skin).map((name) => h('i', { key: name }, name)),
                        ),
                      ),
                      h(
                        'span',
                        { className: 'hp-card__foot' },
                        skin.id === activeId ? h('span', { className: 'hp-card__check' }, '● 已应用') : null,
                      ),
                    ),
                  ),
                ),
                  shown.length
                    ? null
                    : h('div', { className: 'hp-empty' }, '没有匹配的皮肤，试试清空搜索或切回「全部」'),
                ),
                h(
                  'div',
                  { className: 'hp-gallery__foot' },
                  '共 ' + shown.length + ' / ' + SKINS.length + ' 套 · 滚到底自动加载 · 按 Esc 关闭 · 拖拽按钮可换位置',
                ),
              ),
            )
          : null,
        h(FirstRunTip, { onDismiss: () => {} }),
        h(
          'button',
          {
            type: 'button',
            className: 'hp-switch__btn',
            'aria-label': '打开皮肤库（可拖动）',
            'aria-expanded': open ? 'true' : 'false',
            title: '打开皮肤库 · 可拖动',
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
            onClick,
          },
          h(HpGlyph),
        ),
      );
    }

    // =======================================================================
    // 首次使用的提示：告诉用户右下角这个按钮可以点
    // =======================================================================

    const TIP_KEY = 'huaping-tip-v1';

    function FirstRunTip() {
      const [show, setShow] = React.useState(false);
      const [pos, setPos] = React.useState(null);

      function place() {
        // 按画屏按钮的实际位置定位，而不是写死像素
        const btn = document.querySelector('.hp-switch__btn');
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        setPos({
          right: Math.max(12, window.innerWidth - r.left + 14),
          top: Math.max(12, r.top + r.height / 2 - 22),
        });
      }

      React.useEffect(() => {
        let seen = true;
        try {
          seen = window.localStorage.getItem(TIP_KEY) === '1';
        } catch (error) {
          seen = true;
        }
        if (seen) return undefined;
        const t1 = setTimeout(() => {
          place();
          setShow(true);
        }, 1400);
        const t2 = setTimeout(() => close(), 16000);
        const onResize = () => place();
        window.addEventListener('resize', onResize);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          window.removeEventListener('resize', onResize);
        };
      }, []);

      function close() {
        setShow(false);
        try {
          window.localStorage.setItem(TIP_KEY, '1');
        } catch (error) {
          /* ignore */
        }
      }

      if (!show || !pos) return null;
      return h(
        'div',
        { className: 'hp-tip', role: 'status', style: { right: pos.right + 'px', top: pos.top + 'px' } },
        h('span', { className: 'hp-tip__text' }, '点这个按钮，打开画屏换主题'),
        h('span', { className: 'hp-tip__hint' }, SKINS.length + ' 套 · 可拖动'),
        h('button', { type: 'button', className: 'hp-tip__x', 'aria-label': '知道了', onClick: close }, '×'),
      );
    }

    // =======================================================================
    // One-shot boot veil
    // =======================================================================

    const BOOT_SESSION_PREFIX = 'huaping-boot-';

    function bootPreference() {
      try {
        const value = new URLSearchParams(window.location.search).get('boot');
        if (value === '1') return true;
        if (value === '0') return false;
      } catch (error) {
        /* no location (tests) */
      }
      return null;
    }

    function bootPlayed(id) {
      try {
        return window.sessionStorage.getItem(BOOT_SESSION_PREFIX + id) === '1';
      } catch (error) {
        return false;
      }
    }

    function markBootPlayed(id) {
      try {
        window.sessionStorage.setItem(BOOT_SESSION_PREFIX + id, '1');
      } catch (error) {
        /* session storage is optional */
      }
    }

    // 连启动图都没有的皮肤：用主题底色 + 名字做一次 1.2 秒的过场
    function PlainBoot({ skin }) {
      const [gone, setGone] = React.useState(false);
      React.useEffect(() => {
        const timer = setTimeout(() => setGone(true), 1200);
        return () => clearTimeout(timer);
      }, []);
      if (gone) return null;
      const bg = skin.composerBg || '#0b0b0b';
      return h(
        'div',
        { className: 'hp-plainboot', 'aria-hidden': 'true', style: { background: bg } },
        h('div', { className: 'hp-plainboot__name' }, skin.name),
        h('div', { className: 'hp-plainboot__latin' }, skin.latin),
        h('div', { className: 'hp-plainboot__bar' }),
      );
    }

    // 没有原版启动幕的皮肤：用生成图做一张，1.7 秒后自动退场
    function ArtBoot({ skin }) {
      const [gone, setGone] = React.useState(false);
      React.useEffect(() => {
        const timer = setTimeout(() => setGone(true), 1700);
        return () => clearTimeout(timer);
      }, []);
      if (gone) return null;
      // 浅色主题的启动图是奶油色的，白字会看不见：按 appearance 反过来选色
      const light = skin.appearance === 'light';
      return h(
        'div',
        { className: 'hp-artboot hp-artboot--' + skin.id + (light ? ' hp-artboot--light' : ''), 'aria-hidden': 'true' },
        h('div', { className: 'hp-artboot__art', style: { backgroundImage: 'url(' + skin.bootArt + ')' } }),
        h('div', { className: 'hp-artboot__veil' }),
        skin.bootMark ? h('img', { className: 'hp-artboot__mark', src: skin.bootMark, alt: '' }) : null,
        h(
          'div',
          { className: 'hp-artboot__inner' },
          h('div', { className: 'hp-artboot__name' }, skin.name),
          h('div', { className: 'hp-artboot__latin' }, skin.latin),
          h('div', { className: 'hp-artboot__bar' }),
        ),
      );
    }

    function BootHost() {
      const id = useSkin();
      const skin = SKIN_BY_ID[id];
      if (!skin) return null;
      if (typeof skin.Boot === 'function') {
        // 原版启动幕自己管可见性、计时、跳过和 sessionStorage。
        return h(skin.Boot, { key: id });
      }
      if (!skin.Boot && skin.bootArt) return h(ArtBoot, { skin, key: id });
      const hosted = HOSTED_SLOTS[id] && HOSTED_SLOTS[id]['shell.overlay'];
      if (hosted) {
        const boot = hosted.find((Component) => /Boot/.test(Component.name || ''));
        if (boot) return h(boot, { key: id });
      }
      // 兜底：既没有 Boot 组件、也没有启动图的皮肤，用主题色做一次一闪而过
      return h(PlainBoot, { skin, key: id });
    }

    // =======================================================================
    // Settings section — same grid, second entrance
    // =======================================================================

    function SkinGrid() {
      const activeId = useSkin();
      return h(
        'div',
        { className: 'hp-grid' },
        SKINS.map((skin) =>
          h(
            'button',
            {
              key: skin.id,
              type: 'button',
              className: 'hp-card',
              'data-active': skin.id === activeId ? 'true' : 'false',
              onClick: () => skinStore.set(skin.id),
            },
            h('span', { className: 'hp-card__preview' }, POSTERS[skin.id] ? h('img', { src: POSTERS[skin.id], alt: '', className: 'hp-card__shot' }) : null),
            h(
              'span',
              { className: 'hp-card__body' },
              h('span', { className: 'hp-card__name' }, skin.name),
              h('span', { className: 'hp-card__latin' }, skin.latin),
              h('span', { className: 'hp-card__blurb' }, skin.blurb),
            ),
            h(
              'span',
              { className: 'hp-card__foot' },
              skin.id === activeId ? h('span', { className: 'hp-card__check' }, '● 已应用') : null,
            ),
          ),
        ),
      );
    }

    function HpSettingsPage() {
      return h(
        'div',
        { className: 'hp-settings' },
        h(
          'div',
          { className: 'hp-settings__head' },
          h('h2', { className: 'hp-settings__title' }, '画屏 · 皮肤'),
          h('p', { className: 'hp-settings__sub' }, '选择一套皮肤，立即生效；只改界面，不碰会话、余额与设置。'),
        ),
        h(SkinGrid, null),
        h('p', { className: 'hp-settings__foot' }, '也可以用界面右缘的圆形按钮随时打开皮肤库。'),
      );
    }

    // =======================================================================
    // Slot hosts — registered once, re-render from the store
    // =======================================================================

    function makeHost(field) {
      // 插槽 props 一并转发给皮肤组件：挂件要读宿主的 selector（例如用量快照），
      // 而 key 单独给，切皮肤时组件才会真正重建。现有皮肤忽略多出来的 props。
      return function SlotHost(props) {
        const id = useSkin();
        const skin = SKIN_BY_ID[id];
        const slotName = FIELD_SLOT[field];
        // 托管皮肤：组件由原插件在激活时注册，同一个插槽可能有多个
        const hosted = slotName && HOSTED_SLOTS[id] && HOSTED_SLOTS[id][slotName];
        if (hosted && hosted.length) {
          const list = field === 'Overlay'
            ? hosted.filter((Component) => !/Boot$/.test(Component.name || ''))
            : hosted;
          if (!list.length) return null;
          return h(
            'span',
            { className: 'hp-hosted', key: id, style: { display: 'contents' } },
            list.map((Component, index) => h(Component, Object.assign({}, props, { key: id + '-' + index }))),
          );
        }
        const Component = (skin && slotName && skin.slots && skin.slots[slotName]) || (skin && skin[field]);
        return Component ? h(Component, Object.assign({}, props, { key: id })) : null;
      };
    }

    const OverlayHost = makeHost('Overlay');
    const SidebarMarkHost = makeHost('SidebarMark');
    const BrandNameHost = makeHost('BrandName');
    const HeroMarkHost = makeHost('HeroMark');
    const InputLeftHost = makeHost('InputLeft');
    const ComposerDockHost = makeHost('ComposerDock');
    const FooterActionHost = makeHost('FooterAction');

    // =======================================================================
    // Apply
    // =======================================================================

    return {
      inject: ['theme', 'slots'],

      apply(ctx) {
        let active = null;

        // 诊断开关：?motion=0 停掉全部动画，?fx=0 去掉模糊与滤镜
        try {
          const params = new URLSearchParams(window.location.search);
          const diag = [];
          if (params.get('motion') === '0') {
            diag.push('*,*::before,*::after{animation:none !important;transition:none !important}');
          }
          if (params.get('fx') === '0') {
            diag.push('*,*::before,*::after{backdrop-filter:none !important;-webkit-backdrop-filter:none !important;filter:none !important}');
          }
          if (diag.length) {
            const tag = document.createElement('style');
            tag.dataset.plugin = SOURCE + '/diag';
            tag.textContent = diag.join('\n');
            document.head.appendChild(tag);
          }
        } catch (error) {
          /* ignore */
        }

        function mountStyle(css, skinId) {
          const tag = document.createElement('style');
          tag.dataset.plugin = SOURCE;
          tag.dataset.hpSkin = skinId;
          tag.dataset.pluginCss = SOURCE + '/client.css#' + skinId;
          tag.textContent = css || '';
          document.head.appendChild(tag);
          return () => tag.remove();
        }

        let firstActivation = true;

        function runHosted(skin) {
          const slots = {};
          const cleanups = [];
          let currentId = skin.id;
          const theme = {
            getTheme: () => Object.assign({}, ctx.theme.getTheme(), {
              id: currentId,
              preference: skin.appearance,
              colorScheme: skin.appearance,
            }),
            setTheme: (value) => ctx.theme.setTheme(value),
            overrideTokens: (source, pairs) => {
              const dispose = ctx.theme.overrideTokens(source, pairs);
              cleanups.push(() => { try { dispose(); } catch (error) { /* gone */ } });
              // 托管主题没有 tokenPairs，这里顺手把切换器要用的三个颜色取出来
              const pick = (token) => {
                const value = pairs && pairs[token];
                if (!value) return null;
                return typeof value === 'string' ? value : value.light || value.dark;
              };
              const vars = {
                '--hp-accent': pick('--dsw-alias-brand-primary'),
                '--hp-ink': pick('--dsw-alias-label-primary'),
                '--hp-line': pick('--dsw-alias-border-l2'),
                '--hp-surface': skin.composerBg || pick('--dsw-alias-bg-base'),
              };
              for (const name of Object.keys(vars)) {
                if (!vars[name]) continue;
                document.documentElement.style.setProperty(name, vars[name]);
                cleanups.push(() => document.documentElement.style.removeProperty(name));
              }
              return dispose;
            },
            register: (definition) => {
              if (definition && definition.id) {
                // 优先选中与这套皮肤明暗一致的那个变体
                if (!currentId || definition.colorScheme === skin.appearance) {
                  currentId = definition.id;
                }
              }
              return () => {};
            },
            onChange: (handler) => ctx.theme.onChange(handler),
          };
          const shim = {
            theme,
            on: () => () => {},
            effect(fn) {
              try {
                const cleanup = fn();
                if (typeof cleanup === 'function') cleanups.push(cleanup);
              } catch (error) {
                console.warn('[huaping] hosted effect failed', skin.id, error);
              }
            },
            slots: {
              inject: (_name, fn) => { try { fn(); } catch (error) { /* ignore */ } },
              register: (opts, Component) => {
                const name = (opts && opts.name) || opts;
                if (!name) return () => {};
                (slots[name] = slots[name] || []).push(Component);
                return () => {};
              },
            },
            get: (key) => (typeof ctx.get === 'function' ? ctx.get(key) : undefined),
            locale: { register() {}, t: (key) => key },
          };
          try {
            // 用真实 window：主题里会用到 innerWidth / addEventListener 等
            const captured = { def: null };
            const saved = window.__ModuleLoader__;
            window.__ModuleLoader__ = { load(definition) { captured.def = definition; } };
            try {
              // eslint-disable-next-line no-new-func
              new Function('React', 'require', skin.source)(React, require);
            } finally {
              window.__ModuleLoader__ = saved;
            }
            const definition = captured.def;
            if (!definition) throw new Error('module did not self-register');
            const hosted = definition.factory(require);
            hosted.apply(shim);
            HOSTED_SLOTS[skin.id] = slots;
          } catch (error) {
            console.warn('[huaping] hosted skin failed', skin.id, error);
          }
          return () => {
            for (const cleanup of cleanups.reverse()) {
              try { cleanup(); } catch (error) { /* gone */ }
            }
            delete HOSTED_SLOTS[skin.id];
          };
        }

        function activate(id) {
          const skin = resolveSkin(id);
          if (!skin) return;

          if (active) {
            active.dispose();
            active = null;
          }

          // 首次加载尊重「每个会话只播一次」；之后每次切换都重播，
          // 让用户能看到新皮肤的 loading 过程。
          if (skin.bootKey) {
            try {
              if (!firstActivation) window.sessionStorage.removeItem(skin.bootKey);
            } catch (error) {
              /* session storage optional */
            }
          }
          firstActivation = false;

          const disposers = [];
          if (skin.hosted && skin.source) disposers.push(runHosted(skin));

          try {
            const pairs = skin.tokenPairs
              || (skin.tokens
                ? Object.fromEntries(Object.keys(skin.tokens).map((token) => [token, { light: skin.tokens[token], dark: skin.tokens[token] }]))
                : tokenPairs(skin.palette));
            disposers.push(ctx.theme.overrideTokens(SOURCE, pairs));

            // 把当前皮肤的关键颜色暴露给切换器，让悬浮按钮和面板跟着主题变
            const pick = (token) => {
              const value = pairs[token];
              if (!value) return null;
              return typeof value === 'string' ? value : value.light || value.dark;
            };
            const vars = {
              '--hp-accent': pick('--dsw-alias-brand-primary'),
              '--hp-ink': pick('--dsw-alias-label-primary'),
              '--hp-line': pick('--dsw-alias-border-l2'),
              '--hp-surface': skin.composerBg || null,
            };
            for (const name of Object.keys(vars)) {
              if (vars[name]) document.documentElement.style.setProperty(name, vars[name]);
            }
            disposers.push(() => {
              for (const name of Object.keys(vars)) document.documentElement.style.removeProperty(name);
            });
          } catch (error) {
            console.warn('[huaping] token override failed for ' + skin.id, error);
          }

          disposers.push(mountStyle(SWITCH_CSS, 'switcher'));
          const boot = BOOTS[skin.id];
          if (boot && boot.css) disposers.push(mountStyle(boot.css, 'boot'));
          if (WIDGET_CSS[skin.id]) disposers.push(mountStyle(WIDGET_CSS[skin.id], 'widget'));
          // 输入卡正下方的窄遮罩：固定定位，逐帧跟随（宿主重渲染会移除子节点，只能这样）
          try {
            const paper = skin.appearance === 'dark' ? '20,15,18' : '252,253,251';
            const bar = document.createElement('div');
            bar.className = 'hp-composer-fade';
            bar.style.display = 'none';
            document.body.appendChild(bar);

            // 遮罩高度 = 输入卡下沿到窗口底部的距离（不低于 56px）。
            // 各套皮肤的输入卡离底边远近不同：「玫瑰奶油」卡片下面还压着状态行和拍立得，
            // 固定 56px 会在半途断开，留下一条没盖住的窄边。按实际空隙拉长，
            // 渐变与遮罩的 stop 同比缩放，贴着卡片那端仍然是 0.55 的柔光。
            let lastHeight = 0;
            let lastLeft = -1, lastWidth = -1, lastTop = -1;
            const paint = (height) => {
              const h = Math.min(240, Math.max(56, Math.round(height)));
              if (Math.abs(h - lastHeight) < 3) return;
              lastHeight = h;
              const at = (ratio) => Math.round(h * ratio) + 'px';
              bar.style.height = h + 'px';
              bar.style.background =
                'linear-gradient(180deg, rgba(' + paper + ',0.55) 0, rgba(' + paper + ',0.42) ' + at(24 / 56) +
                ', rgba(' + paper + ',0.22) ' + at(40 / 56) + ', rgba(' + paper + ',0) ' + h + 'px)';
              const mask = 'linear-gradient(180deg, #000 0, #000 ' + at(30 / 56) + ', transparent ' + h + 'px)';
              bar.style.maskImage = mask;
              bar.style.webkitMaskImage = mask;
            };

            let raf = 0;
            const place = () => {
              const card = document.querySelector('[class*="composerStack"] [class*="_card"]');
              const r = card ? card.getBoundingClientRect() : null;
              if (!r || r.width < 80) {
                bar.style.display = 'none';
                raf = requestAnimationFrame(place);
                return;
              }
              bar.style.display = 'block';
              const left = Math.round(r.left);
              const width = Math.round(r.width);
              const top = Math.round(r.bottom - 1);
              if (left !== lastLeft) { bar.style.left = left + 'px'; lastLeft = left; }
              if (width !== lastWidth) { bar.style.width = width + 'px'; lastWidth = width; }
              if (top !== lastTop) { bar.style.top = top + 'px'; lastTop = top; }
              paint(window.innerHeight - r.bottom + 6);
              raf = requestAnimationFrame(place);
            };
            place();

            disposers.push(() => {
              if (raf) cancelAnimationFrame(raf);
              bar.remove();
            });
          } catch (error) {
            /* 宿主结构不同就跳过 */
          }

          const extraClass = ROOT_CLASS[skin.id];
          for (const cls of skin.rootClasses || []) {
            try {
              document.documentElement.classList.add(cls);
              disposers.push(() => document.documentElement.classList.remove(cls));
            } catch (error) {
              /* ignore */
            }
          }
          // 画屏要知道当前主题是明是暗，才能自动换面板配色
          try {
            document.documentElement.setAttribute('data-hp-appearance', skin.appearance === 'light' ? 'light' : 'dark');
            disposers.push(() => document.documentElement.removeAttribute('data-hp-appearance'));
          } catch (error) {
            /* 没有 document 的宿主忽略 */
          }

          if (extraClass) {
            try {
              document.documentElement.classList.add(extraClass);
              disposers.push(() => document.documentElement.classList.remove(extraClass));
            } catch (error) {
              /* hosts without classList keep the rest of the skin */
            }
          }

          // 原版挂件皮肤：把主题自己的 installWhaleSkin 原样跑一遍，
          // 用一个最小的 ctx 把它的 effect 清理函数收进本次激活的 disposers。
          for (const sidecar of skin.Sidecars || []) {
            try {
              sidecar({
                effect(fn) {
                  const cleanup = fn();
                  if (typeof cleanup === 'function') disposers.push(cleanup);
                },
              });
            } catch (error) {
              console.warn('[huaping] sidecar failed for ' + skin.id, error);
            }
          }

          const widgetInstaller = skin.Widget || WIDGETS[skin.id];
          if (typeof widgetInstaller === 'function') {
            try {
              widgetInstaller({
                effect(fn) {
                  const cleanup = fn();
                  if (typeof cleanup === 'function') disposers.push(cleanup);
                },
              });
            } catch (error) {
              console.warn('[huaping] widget skin failed for ' + skin.id, error);
            }
          }
          // 输入框所在的 composerStack 默认透明，滚动内容会从卡片下方透出来。
          // 用主题自己的底色给它铺一块不透明底板（hero 态不铺）。
          const composerBg = skin.composerBg || '#0b0b0b';
          const composerRule =
            '\n[class*="composerStack"]:not([class*="composerHero"]){' +
            'background-color:' + composerBg + ' !important;}\n';
          disposers.push(mountStyle((skin.css || '') + composerRule, skin.id));

          document.documentElement.setAttribute(ROOT_ATTR, skin.id);
          document.documentElement.setAttribute('data-hp-appearance', skin.appearance);

          if (skin.appearance === 'dark' || skin.appearance === 'light') {
            try {
              const snapshot = ctx.theme.getTheme();
              if (!snapshot || snapshot.preference !== skin.appearance) {
                ctx.theme.setTheme(skin.appearance);
              }
            } catch (error) {
              /* the forced tokens still keep the palette coherent */
            }
          }

          active = {
            id: skin.id,
            dispose() {
              for (let i = disposers.length - 1; i >= 0; i -= 1) {
                const fn = disposers[i];
                if (typeof fn === 'function') {
                  try {
                    fn();
                  } catch (error) {
                    /* keep unwinding the rest */
                  }
                }
              }
              document.documentElement.removeAttribute(ROOT_ATTR);
              document.documentElement.removeAttribute('data-hp-appearance');
            },
          };
        }

        const startId = SKIN_BY_ID[skinStore.get()] ? skinStore.get() : DEFAULT_SKIN;
        skinStore.set(startId);
        activate(startId);

        const unsubscribe = skinStore.subscribe((id) => activate(id));

        // Keep the forced appearance while the pack stays enabled.
        function enforceAppearance() {
          const skin = active && SKIN_BY_ID[active.id];
          if (!skin) return;
          if (skin.appearance !== 'dark' && skin.appearance !== 'light') return;
          try {
            const snapshot = ctx.theme.getTheme();
            if (snapshot && snapshot.preference === skin.appearance) return;
            ctx.theme.setTheme(skin.appearance);
          } catch (error) {
            /* ignore */
          }
        }

        ctx.effect(() => {
          const off = ctx.on('theme/change', enforceAppearance);
          return () => {
            off();
          };
        }, 'huaping: appearance lock');

        ctx.effect(
          () => () => {
            unsubscribe();
            if (active) {
              active.dispose();
              active = null;
            }
          },
          'huaping: runtime',
        );

        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register({ name: 'shell.overlay', id: 'huaping-overlay', order: -80 }, OverlayHost),
        );

        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register({ name: 'shell.overlay', id: 'huaping-switcher', order: 900 }, HpSwitcher),
        );

        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register({ name: 'shell.overlay', id: 'huaping-boot', order: 950 }, BootHost),
        );

        // Settings gets its own section when the host projects one; a rejected
        // contract must not take the whole theme down with it.
        try {
          ctx.slots.inject('settings.section', () =>
            ctx.slots.register(
              { name: 'settings.section', id: 'huaping', order: 40, label: () => '画屏' },
              HpSettingsPage,
            ),
          );
        } catch (error) {
          console.warn('[huaping] settings.section not available', error);
        }

        ctx.slots.inject('sidebar.brand.mark', () =>
          ctx.slots.register({ name: 'sidebar.brand.mark', priority: -100 }, SidebarMarkHost),
        );

        ctx.slots.inject('sidebar.brand.name', () =>
          ctx.slots.register({ name: 'sidebar.brand.name', priority: -100 }, BrandNameHost),
        );

        ctx.slots.inject('conversation.hero.brand.mark', () =>
          ctx.slots.register({ name: 'conversation.hero.brand.mark', priority: -100 }, HeroMarkHost),
        );

        ctx.slots.inject('conversation.input.left', () =>
          ctx.slots.register({ name: 'conversation.input.left', id: 'huaping-input-left', order: 10 }, InputLeftHost),
        );

        // 主题自带的侧栏底部控件（红白机电源键、羊皮纸模式开关、废土电台的灯）
        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register({ name: 'sidebar.footer.action', id: 'huaping-footer-action', order: 40 }, FooterActionHost),
        );

        ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register({ name: 'conversation.composer.dock', id: 'huaping-composer-dock', order: 20 }, ComposerDockHost),
        );
      },
    };
  },
});
