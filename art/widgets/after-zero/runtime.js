/**
 * 零点以后 · 右下角挂件：一枚黄铜镶边的圆形肖像胸针。
 * 气泡改成「信笺」：直角、黄铜细线、右下角盖一个 No.07。
 */
function installWidgetSkin(ctx) {
  ctx.effect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    if (typeof WHALE_ART !== 'string' || WHALE_ART.indexOf(',') < 0) return undefined;

    const html = document.documentElement;
    html.classList.add('sk-after-zero');

    // viewBox 1026×700：文字中心在 44.25% / 36%
    const CARD_PATH = 'M40 30 H900 V470 H840 L808 568 L776 470 H40 Z';

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
      if (shape && shape.getAttribute('d') !== CARD_PATH) shape.setAttribute('d', CARD_PATH);
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
    const timers = [80, 240, 600, 1200, 2400, 4000].map((delay) => window.setTimeout(apply, delay));
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
      html.classList.remove('sk-after-zero');
      currentImg = null;
      lastRoleSrc = null;
    };
  }, 'after-zero: widget skin');
}

const installWhaleSkin = installWidgetSkin;
