    const BUILD = '1.0.0';

    // ---- 大肥鱼 · 蓝鲸徽记 ------------------------------------------------
    // 一只圆滚滚的深蓝鲸：白肚皮、长睫毛、腮红、尾鳍卷成心形，
    // 头顶是气泡与一颗小星星。全部矢量，24px 到 96px 都清楚。
    function BffWhale(props) {
      const p = props || {};
      return h(
        'svg',
        {
          viewBox: '0 0 96 96',
          className: p.className || 'bff-whale',
          role: 'img',
          'aria-label': '大肥鱼 · DeepSeek 蓝鲸',
          focusable: 'false',
        },
        h(
          'defs',
          null,
          h(
            'linearGradient',
            { id: 'bffBody', x1: 24, y1: 24, x2: 74, y2: 76, gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0', stopColor: '#B9D4FF' }),
            h('stop', { offset: '0.38', stopColor: '#7A9DFF' }),
            h('stop', { offset: '0.78', stopColor: '#4D6BFE' }),
            h('stop', { offset: '1', stopColor: '#3348B8' })
          ),
          h(
            'linearGradient',
            { id: 'bffBelly', x1: 34, y1: 52, x2: 62, y2: 74, gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0', stopColor: '#FFFFFF' }),
            h('stop', { offset: '0.55', stopColor: '#E6F6FF' }),
            h('stop', { offset: '1', stopColor: '#B5DEFF' })
          ),
          h(
            'linearGradient',
            { id: 'bffFin', x1: 42, y1: 64, x2: 52, y2: 80, gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0', stopColor: '#8FB4FF' }),
            h('stop', { offset: '1', stopColor: '#4056C0' })
          ),
          h(
            'linearGradient',
            { id: 'bffGold', x1: 72, y1: 20, x2: 84, y2: 33, gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0', stopColor: '#FFF1C4' }),
            h('stop', { offset: '1', stopColor: '#FFC96B' })
          ),
          h(
            'radialGradient',
            { id: 'bffGlow' },
            h('stop', { offset: '0', stopColor: '#7FE7FF', stopOpacity: '0.34' }),
            h('stop', { offset: '0.62', stopColor: '#4D6BFE', stopOpacity: '0.10' }),
            h('stop', { offset: '1', stopColor: '#4D6BFE', stopOpacity: '0' })
          )
        ),
        h('circle', { cx: 48, cy: 52, r: 46, fill: 'url(#bffGlow)' }),
        // 气泡
        h('circle', { cx: 64, cy: 17, r: 2.4, fill: 'rgba(127,231,255,0.18)', stroke: 'rgba(234,246,255,0.72)', strokeWidth: 0.9 }),
        h('circle', { cx: 71, cy: 11, r: 1.6, fill: 'rgba(127,231,255,0.14)', stroke: 'rgba(234,246,255,0.6)', strokeWidth: 0.8 }),
        h('circle', { cx: 58, cy: 12, r: 1.1, fill: 'rgba(234,246,255,0.75)' }),
        // 星星
        h('path', {
          d: 'M80 20 L81.7 24.1 L85.8 25.8 L81.7 27.5 L80 31.6 L78.3 27.5 L74.2 25.8 L78.3 24.1 Z',
          fill: 'url(#bffGold)',
        }),
        h('circle', { cx: 22, cy: 30, r: 1.2, fill: 'rgba(234,246,255,0.55)' }),
        h('circle', { cx: 16, cy: 46, r: 0.9, fill: 'rgba(127,231,255,0.6)' }),
        h('circle', { cx: 86, cy: 60, r: 1.3, fill: 'rgba(255,217,138,0.6)' }),
        // 心形尾鳍
        h('path', {
          d: 'M71 43 C78 43 85 38 89 30 C91.5 34 92 40 89.5 45 C91.5 47 93 51 92 55 C87 54 83 51 80 47 C77 50 73 51 69.5 50 Z',
          fill: 'url(#bffBody)',
          stroke: 'rgba(20,40,96,0.55)',
          strokeWidth: 0.9,
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M73 44.6 C79 44.4 84 41 87.4 35.4',
          fill: 'none',
          stroke: 'rgba(234,246,255,0.5)',
          strokeWidth: 0.9,
          strokeLinecap: 'round',
        }),
        // 身体
        h('path', {
          d: 'M22 52 C22 38 34 28 49 27 C63 26 73 34 76 45 C78 53 76 61 70 67 C64 73 54 76 44 74 C31 72 22 64 22 52 Z',
          fill: 'url(#bffBody)',
          stroke: 'rgba(18,36,90,0.55)',
          strokeWidth: 1,
          strokeLinejoin: 'round',
        }),
        // 头顶轮廓光
        h('path', {
          d: 'M26 47 C31 33 43 27 55 28.5 C65 29.8 72 35.5 75 43',
          fill: 'none',
          stroke: 'rgba(240,249,255,0.66)',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
        }),
        // 白肚皮
        h('path', {
          d: 'M30 58 C38 51 50 50 61 54 C69 57 72 64 68 69.5 C60 76 45 77 36 70.5 C31.5 67.2 29.2 62.6 30 58 Z',
          fill: 'url(#bffBelly)',
        }),
        // 胸鳍
        h('path', {
          d: 'M44 65 C47.6 67.6 49.8 72.8 48.2 79 C44.4 76.6 41.9 71.4 41.2 66.8 Z',
          fill: 'url(#bffFin)',
          stroke: 'rgba(18,36,90,0.45)',
          strokeWidth: 0.8,
          strokeLinejoin: 'round',
        }),
        // 腮红
        h('ellipse', { cx: 32, cy: 58, rx: 4.6, ry: 2.4, fill: '#FF9FB2', opacity: 0.55 }),
        h('ellipse', { cx: 50.5, cy: 61.5, rx: 3.2, ry: 1.8, fill: '#FF9FB2', opacity: 0.35 }),
        // 眼睛
        h('circle', { cx: 40.5, cy: 48, r: 6.4, fill: '#0A1A3C' }),
        h('circle', { cx: 40.5, cy: 48.8, r: 4.7, fill: '#1E3A8A' }),
        h('circle', { cx: 40.5, cy: 49.4, r: 2.9, fill: '#061027' }),
        h('circle', { cx: 38.9, cy: 46.2, r: 2.05, fill: '#FFFFFF' }),
        h('circle', { cx: 43.1, cy: 50.6, r: 0.95, fill: 'rgba(255,255,255,0.85)' }),
        // 睫毛
        h('path', {
          d: 'M34.4 43.4 C33.6 41.4 32.4 40.2 30.8 39.6 M38.6 42.1 C38.4 40 37.8 38.6 36.9 37.6 M43.4 42.6 C44 40.8 45 39.6 46.2 38.9',
          fill: 'none',
          stroke: '#0A1A3C',
          strokeWidth: 1.15,
          strokeLinecap: 'round',
        }),
        // 嘴
        h('path', {
          d: 'M29 61 C31.2 63.6 34.4 63.9 36.6 62',
          fill: 'none',
          stroke: '#12224A',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
        }),
        // 呼吸孔的小水花
        h('path', {
          d: 'M47.5 31.4 C47.8 29.4 47.3 27.8 46.1 26.6 M50.2 30.8 C51.2 29.2 52.2 28.2 53.4 27.6',
          fill: 'none',
          stroke: 'rgba(234,246,255,0.62)',
          strokeWidth: 1,
          strokeLinecap: 'round',
        })
      );
    }

    // ---- 鲸鱼娘头像 --------------------------------------------------------
    // 侧栏 / 首屏 / 启动幕 / 输入框共用一张从主视觉裁出的脸，
    // 圆框 + 青色描边，24px 到 72px 都是同一个人。
    function BffFace(props) {
      const p = props || {};
      return h('span', {
        className: 'bff-face' + (p.className ? ' ' + p.className : ''),
        role: 'img',
        'aria-label': '大肥鱼 · 鲸鱼娘',
      });
    }

    // ---- 侧栏 --------------------------------------------------------------
    function BffSidebarMark() {
      return h('span', { className: 'bff-mark' }, h(BffFace));
    }

    function BffBrandName() {
      return h(
        'span',
        { className: 'bff-brand' },
        h('span', { className: 'bff-brand__cn' }, '大肥鱼'),
        h('span', { className: 'bff-brand__dot', 'aria-hidden': 'true' }),
        h('span', { className: 'bff-brand__sub' }, 'BIG FAT FISH'),
        h('span', { className: 'bff-brand__ver' }, 'v' + BUILD)
      );
    }

    // ---- 新会话 hero -------------------------------------------------------
    function BffHero() {
      return h(
        'div',
        { className: 'bff-hero', 'aria-label': '大肥鱼 · DeepSeek 蓝鲸主题' },
        h(
          'span',
          { className: 'bff-hero__badge' },
          h('span', { className: 'bff-hero__ring', 'aria-hidden': 'true' }),
          h(BffFace, { className: 'bff-face--hero' })
        ),
        h(
          'span',
          { className: 'bff-hero__copy' },
          h(
            'span',
            { className: 'bff-hero__title' },
            h('span', { className: 'bff-hero__cn' }, '大肥鱼'),
            h('span', { className: 'bff-hero__latin' }, 'BIG FAT FISH')
          ),
          h('span', { className: 'bff-hero__sub' }, 'DEEPSEEK · WHALE GIRL'),
          h(
            'span',
            { className: 'bff-hero__wave', 'aria-hidden': 'true' },
            h('i'),
            h('i'),
            h('i')
          ),
          h('span', { className: 'bff-hero__tagline' }, '深海很冷，正合我意。')
        )
      );
    }

    // ---- 输入框左侧 --------------------------------------------------------
    function BffChip() {
      return h(
        'span',
        { className: 'bff-chip', title: '大肥鱼 · 深潜模式' },
        h(BffFace, { className: 'bff-face--chip' }),
        h('span', { className: 'bff-chip__text' }, '大肥鱼'),
        h('span', { className: 'bff-chip__dot', 'aria-hidden': 'true' }),
        h('span', { className: 'bff-chip__sub' }, '深潜')
      );
    }

    // ---- 输入框下方 --------------------------------------------------------
    function BffDock() {
      const depths = [0, 1, 2, 3, 4, 5, 6, 7];
      return h(
        'div',
        { className: 'bff-dock', 'aria-hidden': 'true' },
        h(BffWhale, { className: 'bff-whale bff-whale--dock' }),
        h('span', { className: 'bff-dock__label' }, 'DIVE'),
        h(
          'span',
          { className: 'bff-dock__meter' },
          depths.map((i) =>
            h('i', {
              key: i,
              className: i < 5 ? 'is-on' : '',
              style: { height: 4 + i * 1.7 + 'px' },
            })
          )
        ),
        h('span', { className: 'bff-dock__value' }, '− 1,024 m'),
        h('span', { className: 'bff-dock__hint' }, '冷水区 · 深潜中')
      );
    }

    // ---- 全屏氛围 ----------------------------------------------------------
    const BFF_BUBBLES = [
      { left: '9%', size: 10, delay: -4, duration: 22, drift: 18 },
      { left: '17%', size: 5, delay: -12, duration: 18, drift: -14 },
      { left: '28%', size: 7, delay: -7, duration: 26, drift: 12 },
      { left: '62%', size: 6, delay: -16, duration: 20, drift: -10 },
      { left: '72%', size: 14, delay: -2, duration: 28, drift: 22 },
      { left: '81%', size: 8, delay: -10, duration: 24, drift: -18 },
      { left: '90%', size: 4, delay: -19, duration: 16, drift: 8 },
      { left: '44%', size: 3, delay: -14, duration: 30, drift: 6 },
    ];

    function BffAtmosphere() {
      return h(
        'div',
        { className: 'bff-atmosphere', 'aria-hidden': 'true' },
        h('span', { className: 'bff-atmosphere__glow' }),
        h('span', { className: 'bff-atmosphere__vignette' }),
        h('span', { className: 'bff-atmosphere__grain' }),
        h('span', { className: 'bff-atmosphere__frame' }),
        BFF_BUBBLES.map((b, i) =>
          h('span', {
            key: i,
            className: 'bff-bubble',
            style: {
              left: b.left,
              width: b.size + 'px',
              height: b.size + 'px',
              animationDelay: b.delay + 's',
              animationDuration: b.duration + 's',
              '--bff-drift': b.drift + 'px',
            },
          })
        ),
        h('span', { className: 'bff-atmosphere__spine' }, 'BIG FAT FISH · 大肥鱼'),
        h('span', { className: 'bff-atmosphere__star bff-atmosphere__star--a' }),
        h('span', { className: 'bff-atmosphere__star bff-atmosphere__star--b' })
      );
    }

    // ---- 启动幕 ------------------------------------------------------------
    const BOOT_KEY = 'big-fat-fish-boot-v1';

    function bootAllowed() {
      try {
        if (typeof window === 'undefined') return false;
        const value = new URLSearchParams(window.location.search).get('boot');
        if (value === '0') return false;
        if (value === '1') return true;
        return window.sessionStorage.getItem(BOOT_KEY) !== '1';
      } catch (error) {
        return true;
      }
    }

    function BffBoot() {
      const [visible, setVisible] = React.useState(bootAllowed);
      const [leaving, setLeaving] = React.useState(false);

      React.useEffect(() => {
        if (!visible) return undefined;
        try {
          window.sessionStorage.setItem(BOOT_KEY, '1');
        } catch (error) {
          /* replay is fine without storage */
        }

        let alive = true;
        let hideTimer;
        const reduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hold = reduced ? 620 : 2000;

        const dismiss = () => {
          if (!alive) return;
          alive = false;
          setLeaving(true);
          hideTimer = window.setTimeout(() => setVisible(false), 320);
        };

        const leaveTimer = window.setTimeout(dismiss, hold);
        const onKey = (event) => {
          if (event && typeof event.preventDefault === 'function') event.preventDefault();
          if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
          dismiss();
        };
        const onPointer = (event) => {
          if (event && typeof event.preventDefault === 'function') event.preventDefault();
          dismiss();
        };
        window.addEventListener('keydown', onKey, { once: true, capture: true });
        window.addEventListener('pointerdown', onPointer, { once: true, capture: true });

        return () => {
          alive = false;
          window.clearTimeout(leaveTimer);
          window.clearTimeout(hideTimer);
          window.removeEventListener('keydown', onKey, true);
          window.removeEventListener('pointerdown', onPointer, true);
        };
      }, [visible]);

      if (!visible) return null;

      return h(
        'div',
        {
          className: 'bff-boot' + (leaving ? ' bff-boot--leaving' : ''),
          role: 'presentation',
          'aria-hidden': 'true',
        },
        h('span', { className: 'bff-boot__art' }),
        h('span', { className: 'bff-boot__glow' }),
        h('span', { className: 'bff-boot__caustic' }),
        h(
          'div',
          { className: 'bff-boot__content' },
          h('span', { className: 'bff-boot__badge' }, h(BffFace, { className: 'bff-face--boot' })),
          h('span', { className: 'bff-boot__kicker' }, 'DEEPSEEK · WHALE GIRL'),
          h('span', { className: 'bff-boot__title' }, '大肥鱼'),
          h('span', { className: 'bff-boot__latin' }, 'BIG FAT FISH'),
          h('span', { className: 'bff-boot__rule', 'aria-hidden': 'true' }, h('i'), h('em') ),
          h('span', { className: 'bff-boot__verse' }, '深海很冷，正合我意。'),
          h('span', { className: 'bff-boot__progress' }, h('span')),
          h(
            'span',
            { className: 'bff-boot__hint' },
            'CLICK OR PRESS ANY KEY TO DIVE',
            h('span', { className: 'bff-boot__replay' }, ' · ?boot=1 REPLAY')
          )
        ),
        h('span', { className: 'bff-boot__bubble bff-boot__bubble--a' }),
        h('span', { className: 'bff-boot__bubble bff-boot__bubble--b' }),
        h('span', { className: 'bff-boot__bubble bff-boot__bubble--c' })
      );
    }
