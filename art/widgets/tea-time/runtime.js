/**
 * 三点一刻 · 右下角挂件：她是一张贴纸。
 * 气泡改成一张打了虚线边的便签（圆角矩形 + 右下小尾巴）。
 */
function installWidgetSkin(ctx) {
  ctx.effect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    if (typeof WHALE_ART !== 'string' || WHALE_ART.indexOf(',') < 0) return undefined;

    const html = document.documentElement;
    html.classList.add('sk-tea');

    const NOTE_PATH = 'M96 62 H930 Q978 62 978 110 V450 Q978 498 930 498 H604 L566 586 L528 498 H96 Q48 498 48 450 V110 Q48 62 96 62 Z';

    let disposed = false;
    let imgObserver = null;
    let bodyObserver = null;
    let currentImg = null;
    let lastRoleSrc = null;

    const findImg = () => document.querySelector('.dshwv-img');

    const ensureArt = (img) => {
      if (!img) return;
      const src = img.getAttribute('src') || '';
      if (src && src !== WHALE_ART) lastRoleSrc = src;
      if (src !== WHALE_ART) img.setAttribute('src', WHALE_ART);
      if (img !== currentImg) {
        currentImg = img;
        if (imgObserver) imgObserver.disconnect();
        if (typeof MutationObserver === 'function') {
          imgObserver = new MutationObserver(() => ensureArt(img));
          imgObserver.observe(img, { attributes: true, attributeFilter: ['src'] });
        }
      }
    };

    const ensureShape = () => {
      const shape = document.querySelector('.dshwv-bshape');
      if (shape && shape.getAttribute('d') !== NOTE_PATH) shape.setAttribute('d', NOTE_PATH);
    };

    const apply = () => {
      if (disposed) return;
      try {
        ensureArt(findImg());
        ensureShape();
      } catch (error) {
        /* 挂件可能正在重挂，下一拍再来 */
      }
    };

    apply();
    const timers = [80, 240, 600, 1200, 2400, 4000].map((d) => window.setTimeout(apply, d));
    const interval = window.setInterval(apply, 1600);

    if (typeof MutationObserver === 'function') {
      bodyObserver = new MutationObserver(apply);
      try {
        bodyObserver.observe(document.body, { childList: true, subtree: true });
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
      const img = findImg();
      if (img && lastRoleSrc) img.setAttribute('src', lastRoleSrc);
      html.classList.remove('sk-tea');
      currentImg = null;
      lastRoleSrc = null;
    };
  }, 'tea-time: widget skin');
}

const installWhaleSkin = installWidgetSkin;
