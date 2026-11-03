const WIDGET_HUD_PARTS = [
      ['inkb-hud__line', ''],
      ['inkb-hud__seal', '借'],
      ['inkb-hud__spine', '借景'],
      ['inkb-hud__sub', 'BORROWED VIEW'],
      ['inkb-hud__tag', '园窗'],
    ];

    /**
     * Re-dress the bottom-right widget as a round garden window. The
     * widget's own character is swapped for WHALE_ART (the ring alone); a
     * separate transparent cat layer perches on the lower rim and sways. A
     * small HUD is inserted, and the menu/bubble CSS is applied through
     * html.inkb-whale. Role changes, remounts and resets are picked up and
     * re-applied; teardown restores the last chosen role image and its clip.
     */
    function installWidgetSkin(ctx) {
      ctx.effect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          return undefined;
        }
        if (typeof WHALE_ART !== 'string' || WHALE_ART.indexOf(',') < 0) {
          return undefined;
        }

        const html = document.documentElement;
        html.classList.add('inkb-whale');

        let disposed = false;
        let imgObserver = null;
        let bodyObserver = null;
        let currentImg = null;
        let lastRoleSrc = null;
        let hud = null;
        let cat = null;

        const findRoot = () => document.querySelector('.dshwv-root');
        const findImg = (root) => (root ? root.querySelector('.dshwv-img') : null);

        const ensureHud = (root) => {
          if (!root) return;
          const host = root.querySelector('.dshwv-body') || root;
          if (hud && hud.isConnected && hud.parentElement === host) return;
          hud = null;
          const existing = host.querySelector('.inkb-hud');
          if (existing) {
            hud = existing;
            return;
          }
          hud = document.createElement('div');
          hud.className = 'inkb-hud';
          hud.setAttribute('aria-hidden', 'true');
          for (const [className, text] of WIDGET_HUD_PARTS) {
            const node = document.createElement('span');
            node.className = className;
            node.setAttribute('aria-hidden', 'true');
            if (text) node.textContent = text;
            hud.appendChild(node);
          }
          host.insertBefore(hud, host.firstChild || null);
        };

        const ensureCat = (root) => {
          if (!root) return;
          if (typeof CAT_ART !== 'string' || CAT_ART.indexOf(',') < 0) return;
          const host = root.querySelector('.dshwv-body') || root;
          if (cat && cat.isConnected && cat.parentElement === host) return;
          const existing = host.querySelector('.inkb-cat');
          if (existing) {
            if (existing.getAttribute('src') !== CAT_ART) existing.setAttribute('src', CAT_ART);
            cat = existing;
            return;
          }
          cat = document.createElement('img');
          cat.className = 'inkb-cat';
          cat.alt = '';
          cat.draggable = false;
          cat.setAttribute('aria-hidden', 'true');
          cat.src = CAT_ART;
          host.appendChild(cat);
        };

        const ensureArt = (img) => {
          if (!img) return;
          const src = img.getAttribute('src') || '';
          if (src && src !== WHALE_ART) lastRoleSrc = src;
          if (!img.dataset.inkbOriginalSrc) {
            img.dataset.inkbOriginalSrc = src;
            img.dataset.inkbOriginalClip = img.style.clipPath || '';
            img.dataset.inkbOriginalWebkitClip = img.style.webkitClipPath || '';
          }
          if (src !== WHALE_ART) img.setAttribute('src', WHALE_ART);
          img.style.setProperty('clip-path', 'none', 'important');
          img.style.setProperty('-webkit-clip-path', 'none', 'important');
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
          const src = lastRoleSrc || img.dataset.inkbOriginalSrc;
          if (src) img.setAttribute('src', src);
          try {
            const clip = img.dataset.inkbOriginalClip || '';
            const webkit = img.dataset.inkbOriginalWebkitClip || '';
            if (clip) img.style.setProperty('clip-path', clip);
            else img.style.removeProperty('clip-path');
            if (webkit) img.style.setProperty('-webkit-clip-path', webkit);
            else img.style.removeProperty('-webkit-clip-path');
          } catch (error) {
            /* the widget owns these inline styles; best effort restore */
          }
          delete img.dataset.inkbOriginalSrc;
          delete img.dataset.inkbOriginalClip;
          delete img.dataset.inkbOriginalWebkitClip;
        };

        const apply = () => {
          if (disposed) return;
          const root = findRoot();
          if (!root) return;
          try {
            ensureArt(findImg(root));
          } catch (error) {
            /* the widget may be between mounts; retry on the next tick */
          }
          try {
            ensureHud(root);
          } catch (error) {
            /* a HUD failure is cosmetic; never break the theme */
          }
          try {
            ensureCat(root);
          } catch (error) {
            /* a cat failure is cosmetic; never break the theme */
          }
        };

        apply();
        const timers = [80, 240, 600, 1200, 2400, 4000].map((delay) =>
          window.setTimeout(apply, delay),
        );
        const interval = window.setInterval(apply, 1600);

        if (typeof MutationObserver === 'function') {
          bodyObserver = new MutationObserver(apply);
          try {
            bodyObserver.observe(document.body, { childList: true });
          } catch (error) {
            bodyObserver = null;
          }
        }

        return () => {
          disposed = true;
          timers.forEach((id) => window.clearTimeout(id));
          window.clearInterval(interval);
          if (imgObserver) imgObserver.disconnect();
          if (bodyObserver) bodyObserver.disconnect();

          for (const node of document.querySelectorAll('.inkb-hud, .inkb-cat')) node.remove();
          const root = findRoot();
          restoreArt(findImg(root) || findImg(document.body));
          html.classList.remove('inkb-whale');
          hud = null;
          cat = null;
          currentImg = null;
          lastRoleSrc = null;
        };
      }, 'ink-bamboo: widget skin');
    }

const installWhaleSkin = installWidgetSkin;
