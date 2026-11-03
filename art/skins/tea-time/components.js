    // 三点一刻：一只冒热气的茶杯 + 试用期工牌。
    const TT = {
      cocoa: '#5B4034',
      mint: '#5FA88C',
      mintSoft: '#BFE3D0',
      strawberry: '#FF8FA6',
      cream: '#FFF8F0',
    };

    // 拟物茶杯：薄胎、茶汤、口沿高光、碟子投影（线条压细，越小越干净）
    function CupMark(props) {
      const cls = (props && props.className) || '';
      return h(
        'svg',
        { viewBox: '0 0 32 32', className: 'tt-cup ' + cls, 'aria-hidden': 'true' },
        h(
          'defs',
          null,
          h('linearGradient', { id: 'ttPor', x1: '0.2', y1: '0', x2: '0.7', y2: '1' },
            h('stop', { offset: '0', stopColor: '#FFFFFF' }),
            h('stop', { offset: '0.5', stopColor: '#FCF6EF' }),
            h('stop', { offset: '0.82', stopColor: '#EFE2D4' }),
            h('stop', { offset: '1', stopColor: '#DCC9B8' })),
          h('linearGradient', { id: 'ttTeaG', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0', stopColor: '#DC9F63' }),
            h('stop', { offset: '1', stopColor: '#A9693D' })),
          h('linearGradient', { id: 'ttSaucerG', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0', stopColor: '#FFFFFF' }),
            h('stop', { offset: '1', stopColor: '#E9DCCC' })),
        ),
        // 碟子投影
        h('ellipse', { cx: 16, cy: 27.4, rx: 9.6, ry: 2.1, fill: 'rgba(91, 64, 52, 0.13)' }),
        // 碟子
        h('ellipse', { cx: 16, cy: 25.8, rx: 10.6, ry: 3, fill: 'url(#ttSaucerG)', stroke: 'rgba(95, 168, 140, 0.42)', strokeWidth: 0.7 }),
        // 把手（先画，压在杯身后面）
        h('path', { d: 'M23.2 13.6c3.6-0.2 3.8 5.4 0.2 5.9', fill: 'none', stroke: 'rgba(95, 168, 140, 0.42)', strokeWidth: 3, strokeLinecap: 'round' }),
        h('path', { d: 'M23.2 13.6c3.6-0.2 3.8 5.4 0.2 5.9', fill: 'none', stroke: '#FCF6EF', strokeWidth: 1.6, strokeLinecap: 'round' }),
        // 杯身（上宽下窄）
        h('path', { d: 'M6.8 11.4h18.4l-1.6 8.6c-0.2 1.1-1.1 1.9-2.2 1.9H10.6c-1.1 0-2-0.8-2.2-1.9z',
          fill: 'url(#ttPor)', stroke: 'rgba(95, 168, 140, 0.46)', strokeWidth: 0.8 }),
        // 茶汤 + 口沿
        h('ellipse', { cx: 16, cy: 11.5, rx: 9.2, ry: 2.7, fill: 'url(#ttTeaG)' }),
        h('ellipse', { cx: 16, cy: 11.5, rx: 9.2, ry: 2.7, fill: 'none', stroke: '#FFFFFF', strokeWidth: 1 }),
        h('ellipse', { cx: 12.9, cy: 10.9, rx: 2.4, ry: 0.7, fill: 'rgba(255, 255, 255, 0.6)' }),
        // 薄荷腰线
        h('path', { d: 'M8.5 17.4h15', stroke: 'rgba(95, 168, 140, 0.38)', strokeWidth: 0.9 }),
        // 热气
        h('path', { d: 'M13.6 7.4c-1-1.1 0.8-1.8 0-2.9M18.4 7.4c-1-1.1 0.8-1.8 0-2.9',
          fill: 'none', stroke: 'rgba(226, 96, 127, 0.5)', strokeWidth: 0.9, strokeLinecap: 'round' }),
      );
    }

    function TeaMark() {
      return h('span', { className: 'tt-mark', 'aria-hidden': 'true' }, h(CupMark, null));
    }

    function TeaBrandName() {
      return h(
        'span',
        { className: 'tt-brand' },
        h('span', { className: 'tt-brand__tea' }, 'TEA'),
        h('span', { className: 'tt-brand__time' }, 'AT THREE'),
        h('span', { className: 'tt-brand__no' }, 'No.13'),
      );
    }

    function TeaHeroMark(props) {
      const size = props && Number(props.size) > 0 ? Number(props.size) : 60;
      return h(
        'span',
        { className: 'tt-hero', style: { width: size + 'px', height: size + 'px' }, 'aria-hidden': 'true' },
        h('span', { className: 'tt-hero__halo' }),
        h(CupMark, { className: 'tt-hero__cup' }),
      );
    }

    function TeaChip() {
      return h(
        'span',
        { className: 'tt-chip', 'aria-label': '试用期第 13 天 · 下午三点一刻' },
        h('span', { className: 'tt-chip__bow' }),
        h('span', { className: 'tt-chip__label' }, '试用期第 13 天'),
        h('span', { className: 'tt-chip__time' }, '15:15'),
      );
    }

    // 动态壁纸：把 CSS 里的动画 WebP 取出来，交给一张铺满的 <img> 播。
    // 注意：sidecar 比样式表先跑，所以要等 --tt-live-src 出现。
    function installLiveTeaWall(ctx) {
      ctx.effect(() => {
        if (typeof document === 'undefined') return undefined;
        const root = document.documentElement;
        let img = null;
        let timer = 0;
        let tries = 0;

        const mount = () => {
          timer = 0;
          if (img) return;
          let raw = '';
          try {
            raw = (getComputedStyle(root).getPropertyValue('--tt-live-src') || '').trim();
          } catch (error) {
            raw = '';
          }
          const m = /url\(["']?(.*?)["']?\)/.exec(raw);
          if (!m) {
            if (tries++ < 30) timer = window.setTimeout(mount, 120);
            return;
          }
          img = document.createElement('img');
          img.className = 'tt-live-img';
          img.alt = '';
          img.setAttribute('aria-hidden', 'true');
          img.src = m[1];
          document.body.appendChild(img);
          root.classList.add('tt-live');
        };

        mount();

        return () => {
          if (timer) window.clearTimeout(timer);
          root.classList.remove('tt-live');
          if (img) { try { img.remove(); } catch (error) { /* ignore */ } }
          img = null;
        };
      }, 'tea-time: live wallpaper');
    }
