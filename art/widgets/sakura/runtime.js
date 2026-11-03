/**
 * 樱花树下的右下角挂件：把余额小鲸鱼换成一颗发光的樱。
 * 只做两件事——换角色图、挂上 html.sk-whale 让 widget.css 生效；
 * 样式全部在 widget.css 里，这里不写内联样式，免得和挂件自己的拖拽打架。
 */
function installWidgetSkin(ctx) {
  ctx.effect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
    if (typeof WHALE_ART !== 'string' || WHALE_ART.indexOf(',') < 0) return undefined;

    const html = document.documentElement;
    html.classList.add('sk-whale');

    let disposed = false;
    let imgObserver = null;
    let bodyObserver = null;
    let currentImg = null;
    let lastRoleSrc = null;

    const findRoot = () => document.querySelector('.dshwv-root');
    const findImg = (root) => (root ? root.querySelector('.dshwv-img') : null);

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

    const apply = () => {
      if (disposed) return;
      try {
        ensureArt(findImg(findRoot()));
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
      const img = findImg(document.body);
      if (img && lastRoleSrc) img.setAttribute('src', lastRoleSrc);
      html.classList.remove('sk-whale');
      currentImg = null;
      lastRoleSrc = null;
    };
  }, 'sakura: widget skin');
}

const installWhaleSkin = installWidgetSkin;
