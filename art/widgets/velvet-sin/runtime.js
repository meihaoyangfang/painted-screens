/**
 * VELVET SIN — whale widget skin runtime.
 *
 * Skins the third-party `dsh-whale-widget` as a VELVET SIN private ledger:
 *   - adds the `vs-whale` scope class + stylesheet,
 *   - swaps the character image for the gold-ringed martini emblem at runtime
 *     (the original src is restored on teardown; the widget's data is untouched),
 *   - injects a small HUD and re-applies both if the widget remounts,
 *   - marks amount/time rows so only they stay on one line.
 *
 * Opt out with localStorage `velvet-sin-whale-skin` = `off` and refresh.
 */
function installWhaleSkin(ctx) {
  ctx.effect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.documentElement) {
      return undefined;
    }

    let enabled = true;
    try {
      enabled = window.localStorage.getItem('velvet-sin-whale-skin') !== 'off';
    } catch (error) {
      enabled = true;
    }
    if (!enabled) return undefined;

    const html = document.documentElement;
    const style = document.createElement('style');
    style.dataset.plugin = SOURCE;
    style.dataset.pluginCss = SOURCE + '/whale-skin.css';
    style.textContent = WHALE_CSS;
    html.classList.add('vs-whale');
    document.head.appendChild(style);

    const WHALE_HUD = `
      <span class="vsw-hud__mono">VS</span>
      <span class="vsw-hud__rail">VELVET SIN</span>
      <span class="vsw-hud__tag">MEMBERS ONLY</span>
      <span class="vsw-hud__time">22:00</span>
      <span class="vsw-hud__corner vsw-hud__corner--tl"></span>
      <span class="vsw-hud__corner vsw-hud__corner--br"></span>
    `;

    let disposed = false;
    let imgObserver = null;
    let bubbleObserver = null;
    let bubbleEl = null;
    let currentImg = null;
    let hud = null;

    const findRoot = () => document.querySelector('.dshwv-root');
    const findImg = (root) =>
      root && typeof root.querySelector === 'function' ? root.querySelector('.dshwv-img') : null;

    const decorateBubble = () => {
      const text = document.querySelector('.dshwv-text');
      if (!text) return;
      for (const row of text.querySelectorAll('.dshwv-trow')) {
        const value = String(row.textContent || '').trim();
        const money =
          /^[¥￥$€£₩]\s?[\d—–-]/.test(value) || /^\d[\d,]*\.\d{2}$/.test(value);
        const time = /^\d{1,2}:\d{2}(:\d{2})?$/.test(value);
        row.classList.toggle('vsw-amount', money);
        row.classList.toggle('vsw-time', !money && time);
      }
    };

    const watchBubble = () => {
      const text = document.querySelector('.dshwv-text');
      if (!text) return;
      if (text !== bubbleEl) {
        if (bubbleObserver) bubbleObserver.disconnect();
        bubbleEl = text;
        if (typeof MutationObserver === 'function') {
          bubbleObserver = new MutationObserver(decorateBubble);
          bubbleObserver.observe(text, {
            childList: true,
            subtree: true,
            characterData: true,
          });
        }
      }
      decorateBubble();
    };

    const ensureHud = (root) => {
      if (!root) return;
      if (hud && hud.isConnected && hud.parentElement === root) return;
      hud = null;
      for (const child of Array.from(root.children)) {
        if (child && child.classList && child.classList.contains('vsw-hud')) {
          hud = child;
          break;
        }
      }
      if (!hud) {
        hud = document.createElement('div');
        hud.className = 'vsw-hud';
        hud.setAttribute('aria-hidden', 'true');
        hud.innerHTML = WHALE_HUD;
        root.appendChild(hud);
      }
    };

    const ensureFold = (root) => {
      if (!root) return;
      const pop = root.querySelector('.dshwv-pop');
      if (!pop) return;
      if (!pop.querySelector('.vsw-fold')) {
        const fold = document.createElement('span');
        fold.className = 'vsw-fold';
        fold.setAttribute('aria-hidden', 'true');
        pop.appendChild(fold);
      }
    };

    const ensureArt = (img) => {
      if (!img) return;
      if (!img.dataset.vswOriginalSrc) {
        img.dataset.vswOriginalSrc = img.getAttribute('src') || '';
      }
      if (img.getAttribute('src') !== WHALE_ART) {
        img.setAttribute('src', WHALE_ART);
      }
      if (img !== currentImg) {
        currentImg = img;
        if (imgObserver) imgObserver.disconnect();
        if (typeof MutationObserver === 'function') {
          imgObserver = new MutationObserver(() => ensureArt(img));
          imgObserver.observe(img, { attributes: true, attributeFilter: ['src'] });
        }
      }
    };

    const restoreArt = (img) => {
      if (!img) return;
      const src = img.dataset.vswOriginalSrc;
      if (src) img.setAttribute('src', src);
      delete img.dataset.vswOriginalSrc;
    };

    const apply = () => {
      if (disposed) return;
      const root = findRoot();
      if (!root) return;
      ensureHud(root);
      ensureFold(root);
      ensureArt(findImg(root));
      watchBubble();
    };

    apply();
    const timers = [80, 240, 600, 1200, 2400, 4000].map((delay) =>
      window.setTimeout(apply, delay),
    );
    const interval = window.setInterval(apply, 1800);

    let bodyObserver = null;
    if (typeof MutationObserver === 'function') {
      bodyObserver = new MutationObserver(apply);
      try {
        bodyObserver.observe(document.body, { childList: true });
      } catch (error) {
        bodyObserver = null;
      }
    }

    try {
      window.__velvetSinWhale = {
        art: WHALE_ART,
        refresh: apply,
      };
    } catch (error) {
      /* debugging hook is optional */
    }

    return () => {
      disposed = true;
      timers.forEach((id) => window.clearTimeout(id));
      window.clearInterval(interval);
      if (imgObserver) imgObserver.disconnect();
      if (bubbleObserver) bubbleObserver.disconnect();
      if (bodyObserver) bodyObserver.disconnect();
      for (const row of document.querySelectorAll(
        '.dshwv-text .vsw-amount, .dshwv-text .vsw-time',
      )) {
        row.classList.remove('vsw-amount', 'vsw-time');
      }
      html.classList.remove('vs-whale');
      style.remove();

      const root = findRoot();
      if (root) {
        for (const node of Array.from(root.querySelectorAll('.vsw-hud, .vsw-fold'))) {
          node.remove();
        }
        restoreArt(findImg(root));
      } else {
        restoreArt(findImg(document.body));
      }
      hud = null;
      bubbleEl = null;
      currentImg = null;
      try {
        delete window.__velvetSinWhale;
      } catch (error) {
        /* ignore */
      }
    };
  }, 'velvet-sin: whale widget skin');
}
