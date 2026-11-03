/**
 * 一比特 · 右下角挂件：把余额小鲸鱼换成一台 1984 的 Mac，
 * 顺手把气泡的云朵轮廓改成直角方框（1-bit 不讲圆角）。
 * 只做两件事——换图、改路径；样式全在 widget.css 里。
 */
function installWidgetSkin(ctx) {
  ctx.effect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    if (typeof WHALE_ART !== 'string' || WHALE_ART.indexOf(',') < 0) return undefined;

    const html = document.documentElement;
    html.classList.add('sk-1bit');

    // 一块直角面板（viewBox 1026×700，文字中心在 44.25%/36%）。
    // 不画尖角尾巴——Mac 压在面板右下角，本身就是「谁在说话」。
    const BOX_PATH = 'M40 30 H900 V500 H40 Z';

    let disposed = false;
    let imgObserver = null;
    let bodyObserver = null;
    let currentImg = null;
    let currentShape = null;
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

    // 挂件面板里配的消息带行内 !important 颜色（比如红色的金额），
    // 一比特是纯黑白，这里直接把行内 color 摘掉。
    const stripInlineColors = () => {
      const scope = document.querySelector('.dshwv-text');
      if (!scope) return;
      const nodes = scope.querySelectorAll('[style]');
      for (let i = 0; i < nodes.length; i += 1) {
        const el = nodes[i];
        if (el.style && el.style.color) el.style.removeProperty('color');
      }
    };

    const ensureShape = () => {
      const shape = document.querySelector('.dshwv-bshape');
      if (!shape) return;
      if (shape.getAttribute('d') !== BOX_PATH) shape.setAttribute('d', BOX_PATH);
      currentShape = shape;
    };

    const apply = () => {
      if (disposed) return;
      try {
        ensureArt(findImg());
        ensureShape();
        stripInlineColors();
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
      html.classList.remove('sk-1bit');
      currentImg = null;
      currentShape = null;
      lastRoleSrc = null;
    };
  }, '1bit: widget skin');
}

const installWhaleSkin = installWidgetSkin;
