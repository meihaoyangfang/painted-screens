    const BUILD = '1.8.3';

    function RoseHero() {
      return h(
        'div',
        { className: 'rose-hero', 'aria-hidden': 'true' },
        h('span', { className: 'rose-hero__mark rose-cameo' }),
        h(
          'span',
          { className: 'rose-hero__text' },
          h('span', { className: 'rose-hero__script' }, 'Rosé Cream'),
          h('span', { className: 'rose-hero__sub' }, '玫瑰奶油 · 今天也想温柔一点'),
        ),
      );
    }

    function RoseBrandName() {
      return h(
        'span',
        { className: 'rose-brand' },
        h('span', { className: 'rose-brand__script' }, 'Rosé'),
        h('span', { className: 'rose-brand__cn' }, '奶油'),
        h('span', { className: 'rose-brand__ver' }, 'v' + BUILD),
      );
    }

    function RoseSidebarMark() {
      return h('span', { className: 'rose-cameo rose-cameo--sm' });
    }

    function RoseChip() {
      return h(
        'span',
        { className: 'rose-chip', 'aria-hidden': 'true' },
        h('span', { className: 'rose-chip__rose rose-cameo rose-cameo--xs' }),
        h('span', { className: 'rose-chip__text' }, '玫瑰'),
      );
    }

    function RosePolaroid() {
      return h(
        'div',
        { className: 'rose-note', 'aria-hidden': 'true' },
        h(
          'div',
          { className: 'rose-note__card' },
          h('span', { className: 'rose-note__tape' }),
          h('span', { className: 'rose-note__line' }, '今天也要温柔一点'),
          h('span', { className: 'rose-note__sub' }, '给正在写代码的你'),
          h('span', { className: 'rose-note__sign' }, '\u2014 Rosé'),
          h('span', { className: 'rose-note__rose' }),
        ),
      );
    }

    function RoseWallpaper() {
      return h('div', { className: 'rose-wallpaper', 'aria-hidden': 'true' });
    }

    function RosePaper() {
      return h(
        'div',
        { className: 'rose-paper', 'aria-hidden': 'true' },
        h('span', {
          className: 'rose-paper__spark rose-paper__spark--a',
        }),
        h('span', {
          className: 'rose-paper__spark rose-paper__spark--b',
        }),
      );
    }


    const BOOT_KEY = 'rose-cream-boot-v1';

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

    function RoseBoot() {
      const [visible, setVisible] = React.useState(bootAllowed);
      const [leaving, setLeaving] = React.useState(false);

      React.useEffect(() => {
        if (!visible) return undefined;
        try {
          window.sessionStorage.setItem(BOOT_KEY, '1');
        } catch (error) {
          /* storage can be unavailable; the veil simply replays next load */
        }

        const reduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hold = reduced ? 420 : 1400;

        let hideTimer;
        let leaveTimer;
        const onSkip = () => {
          setLeaving(true);
          window.clearTimeout(hideTimer);
          window.clearTimeout(leaveTimer);
          hideTimer = window.setTimeout(() => setVisible(false), 220);
        };

        leaveTimer = window.setTimeout(() => setLeaving(true), hold);
        hideTimer = window.setTimeout(() => setVisible(false), hold + 240);

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

      return h(
        'div',
        {
          className: 'rose-boot' + (leaving ? ' rose-boot--leaving' : ''),
          role: 'presentation',
          'aria-hidden': 'true',
        },
        h(
          'div',
          { className: 'rose-boot__inner' },
          h('span', { className: 'rose-boot__seal rose-cameo rose-cameo--lg' }),
          h('span', { className: 'rose-boot__script' }, 'Rosé Cream'),
          h('span', { className: 'rose-boot__sub' }, 'roseraie · atelier'),
          h(
            'span',
            { className: 'rose-boot__bar' },
            h('span', { className: 'rose-boot__fill' }),
          ),
          h('span', { className: 'rose-boot__hint' }, '点击任意处跳过'),
        ),
      );
    }
