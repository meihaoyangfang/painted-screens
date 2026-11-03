    const BUILD = '0.1.0';

    function WsSidebarMark() {
      return h('span', { className: 'ws-cameo', 'aria-hidden': 'true' });
    }

    function WsBrandName() {
      return h(
        'span',
        { className: 'ws-brand' },
        h('span', { className: 'ws-brand__dot', 'aria-hidden': 'true' }),
        h('span', { className: 'ws-brand__latin' }, 'Whale Song'),
        h('span', { className: 'ws-brand__cn' }, '鲸歌'),
      );
    }

    function WsHero() {
      return h(
        'div',
        { className: 'ws-hero', 'aria-hidden': 'true' },
        h(
          'span',
          { className: 'ws-hero__cameo' },
          h('span', { className: 'ws-hero__lace' }),
          h('span', { className: 'ws-hero__halo' }),
        ),
        h(
          'span',
          { className: 'ws-hero__text' },
          h('span', { className: 'ws-hero__latin' }, 'WHALE SONG'),
          h('span', { className: 'ws-hero__cn' }, '鲸歌'),
          h('span', { className: 'ws-hero__sub' }, '一尾鲸歌，落在深蓝里'),
        ),
      );
    }

    function WsChip() {
      return h(
        'span',
        { className: 'ws-chip', 'aria-hidden': 'true' },
        h('span', { className: 'ws-chip__bead' }),
        h('span', { className: 'ws-chip__label' }, '鲸歌'),
        h('span', { className: 'ws-chip__sep' }),
        h('span', { className: 'ws-chip__depth' }, 'DIVE 0380'),
      );
    }

    function WsDock() {
      const ticks = [];
      for (let i = 0; i < 29; i += 1) ticks.push(h('i', { key: i, style: { '--i': i } }));
      return h(
        'div',
        { className: 'ws-dock', 'aria-hidden': 'true' },
        h(
          'span',
          { className: 'ws-dock__left' },
          h('span', { className: 'ws-dock__bead' }),
          h('span', { className: 'ws-dock__label' }, 'DEPTH'),
          h('span', { className: 'ws-dock__value' }, '0380'),
          h('span', { className: 'ws-dock__unit' }, 'm'),
        ),
        h('span', { className: 'ws-dock__sonar' }, ticks),
        h(
          'span',
          { className: 'ws-dock__right' },
          h('span', { className: 'ws-dock__brand' }, 'WHALE SONG'),
          h('span', { className: 'ws-dock__sep' }),
          h('span', { className: 'ws-dock__cn' }, '鲸歌'),
        ),
      );
    }

    function WsAtmosphere() {
      const bubbles = [];
      for (let i = 0; i < 16; i += 1) bubbles.push(h('i', { key: i, style: { '--i': i } }));
      return h(
        'div',
        { className: 'ws-atmos', 'aria-hidden': 'true' },
        h('span', { className: 'ws-atmos__shaft ws-atmos__shaft--a' }),
        h('span', { className: 'ws-atmos__shaft ws-atmos__shaft--b' }),
        h('span', { className: 'ws-atmos__shaft ws-atmos__shaft--c' }),
        h('span', { className: 'ws-atmos__swell' }),
        h('span', { className: 'ws-atmos__bubbles' }, bubbles),
        h('span', { className: 'ws-atmos__grain' }),
      );
    }

    const BOOT_KEY = 'whale-song-boot-v1';

    function bootAllowed() {
      try {
        if (typeof window === 'undefined') return false;
        const value = new URLSearchParams(window.location.search).get('boot');
        if (value === '0') return false;
        if (value === '1') return true;
        return window.sessionStorage.getItem(BOOT_KEY) !== '1';
      } catch (error) {
        return false;
      }
    }

    function WsBoot() {
      const [visible, setVisible] = React.useState(bootAllowed);
      const [leaving, setLeaving] = React.useState(false);

      React.useEffect(() => {
        if (!visible) return undefined;
        try {
          window.sessionStorage.setItem(BOOT_KEY, '1');
        } catch (error) {
          /* storage may be unavailable; the veil replays next load */
        }

        const reduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hold = reduced ? 420 : 1900;

        let hideTimer;
        let leaveTimer;
        const onSkip = () => {
          setLeaving(true);
          window.clearTimeout(hideTimer);
          window.clearTimeout(leaveTimer);
          hideTimer = window.setTimeout(() => setVisible(false), 240);
        };

        leaveTimer = window.setTimeout(() => setLeaving(true), hold);
        hideTimer = window.setTimeout(() => setVisible(false), hold + 260);

        window.addEventListener('keydown', onSkip, { once: true });
        window.addEventListener('pointerdown', onSkip, { once: true });

        return () => {
          window.clearTimeout(hideTimer);
          window.clearTimeout(leaveTimer);
          window.removeEventListener('keydown', onSkip);
          window.removeEventListener('pointerdown', onSkip);
        };
      }, [visible]);

      if (!visible) return null;

      const deep = [];
      for (let i = 0; i < 9; i += 1) deep.push(h('i', { key: i, style: { '--i': i } }));

      return h(
        'div',
        {
          className: 'ws-boot' + (leaving ? ' ws-boot--leaving' : ''),
          role: 'presentation',
          'aria-hidden': 'true',
        },
        h('span', { className: 'ws-boot__sea' }),
        h('span', { className: 'ws-boot__deep' }, deep),
        h(
          'div',
          { className: 'ws-boot__inner' },
          h(
            'span',
            { className: 'ws-boot__glyph' },
            h('span', { className: 'ws-boot__lace' }),
          ),
          h('span', { className: 'ws-boot__latin' }, 'WHALE SONG'),
          h('span', { className: 'ws-boot__cn' }, '鲸歌'),
          h('span', { className: 'ws-boot__sub' }, '一尾鲸歌，落在深蓝里'),
          h('span', { className: 'ws-boot__rule' }),
          h('span', { className: 'ws-boot__bar' }, h('span', { className: 'ws-boot__fill' })),
          h(
            'span',
            { className: 'ws-boot__meta' },
            h('span', null, 'DESCENT'),
            h('span', null, '0380 m'),
          ),
          h('span', { className: 'ws-boot__hint' }, '点击任意处跳过'),
        ),
      );
    }
