    const WHALE_SKIN = [
      {
        classes: ['menu', 'usagepanel', 'rgbmenu', 'qcolmenu', 'custmenu', 'colpop', 'snapwin', 'rolelist', 'audiolist', 'slotlist'],
        light: { 'background-color': '#FFFCFA', color: '#3B1A19' },
        dark: { 'background-color': '#2E1B20', color: '#F8E9E5' },
      },
      {
        classes: ['confirmwin', 'cropwin', 'audiowin', 'gifwin', 'bubcard'],
        light: { 'background-color': '#FFFCFA', color: '#3B1A19' },
        dark: { 'background-color': '#2E1B20', color: '#F8E9E5' },
      },
      {
        classes: ['usagebody', 'usage-subtitle', 'usage-back', 'usage-collapse', 'usage-oview-num', 'usage-yuan', 'usage-model', 'about', 'about-name', 'about-k', 'about-v', 'confirmtext', 'bubsec', 'bubhint', 'fcard'],
        light: { color: '#3B1A19' },
        dark: { color: '#F8E9E5' },
      },
      {
        classes: ['usage-hint', 'usage-chev', 'ver'],
        light: { color: '#8C7A75' },
        dark: { color: '#B49C99' },
      },
      {
        classes: ['usage-total'],
        light: { color: '#B3402F' },
        dark: { color: '#F08C7E' },
      },
      {
        classes: ['usagemsg', 'number'],
        light: { 'background-color': '#FFFDFB', color: '#3B1A19' },
        dark: { 'background-color': '#3A252C', color: '#F8E9E5' },
      },
      {
        classes: ['sound', 'about-btn', 'bubbtn', 'custbtn', 'choicechip', 'usage-more'],
        light: { 'background-color': 'rgba(200, 107, 124, 0.08)', color: '#8A5560' },
        dark: { 'background-color': 'rgba(229, 141, 155, 0.12)', color: '#F2C9CE' },
      },
      {
        classes: ['bubbtn-ok'],
        light: { 'background-color': '#AD5568', color: '#FFFFFF' },
        dark: { 'background-color': '#C06478', color: '#FFF6F3' },
      },
      {
        classes: ['usage-mask', 'bubmask', 'confirmmask', 'cropmask', 'gifmask', 'audiomask', 'snapmask'],
        light: { 'background-color': 'rgba(59, 26, 25, 0.34)' },
        dark: { 'background-color': 'rgba(10, 4, 6, 0.62)' },
      },
      {
        classes: ['text'],
        light: { color: '#B85E72' },
        dark: { color: '#EB9AA6' },
      },
    ];

    function skinWhaleWidget(ctx) {
      if (typeof document === 'undefined' || !document.body) return;
      if (typeof MutationObserver !== 'function') return;

      const dark = () =>
        typeof document !== 'undefined' &&
        document.body &&
        document.body.hasAttribute('data-ds-dark-theme');

      const paint = () => {
        if (typeof document === 'undefined') return;
        const isDark = dark();
        const nodes = document.querySelectorAll('[class*="dshwv-"]');
        for (const node of nodes) {
          const cls = typeof node.className === 'string' ? node.className : '';
          if (!cls) continue;
          const tokens = cls.split(/\s+/);
          for (const rule of WHALE_SKIN) {
            if (!rule.classes.some((name) => tokens.includes('dshwv-' + name))) continue;
            const styles = isDark ? rule.dark : rule.light;
            for (const [prop, value] of Object.entries(styles)) {
              if (node.style.getPropertyValue(prop) === value) continue;
              node.style.setProperty(prop, value, 'important');
            }
          }
        }
      };

      let timer = 0;
      const schedule = () => {
        if (timer) return;
        timer = window.setTimeout(() => {
          timer = 0;
          paint();
        }, 120);
      };

      ctx.effect(() => {
        paint();
        const observer = new MutationObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-ds-dark-theme'] });
        const interval = window.setInterval(paint, 2500);
        return () => {
          observer.disconnect();
          window.clearInterval(interval);
          if (timer) window.clearTimeout(timer);
        };
      }, 'rose-cream: whale skin');
    }
