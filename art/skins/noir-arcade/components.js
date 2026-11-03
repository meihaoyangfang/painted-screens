    function NoirCrest(props) {
      const className = ['noir-crest', props && props.className]
        .filter(Boolean)
        .join(' ');
      return h(
        'svg',
        {
          viewBox: '0 0 64 64',
          width: 64,
          height: 64,
          className,
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h(
          'g',
          {
            fill: 'none',
            stroke: 'currentColor',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
          h('circle', {
            cx: 32,
            cy: 32,
            r: 30,
            strokeOpacity: 0.26,
            strokeWidth: 0.8,
            strokeDasharray: '1 4',
          }),
          h('path', {
            d: 'M32 3v10M27 7h10',
            strokeWidth: 1.4,
            strokeOpacity: 0.82,
          }),
          h('path', {
            d: 'M12 57V36c0-11 8-19 20-29 12 10 20 18 20 29v21',
            strokeWidth: 1.6,
            strokeOpacity: 0.9,
          }),
          h('path', {
            d: 'M16 58V38c0-9 6-16 16-25 10 9 16 16 16 25v20',
            strokeWidth: 0.8,
            strokeOpacity: 0.46,
          }),
          h('path', {
            d: 'M20 58V40c0-7 4-13 12-21 8 8 12 14 12 21v18',
            strokeWidth: 0.7,
            strokeOpacity: 0.28,
          }),
          h('circle', {
            cx: 32,
            cy: 34,
            r: 15.5,
            strokeWidth: 1.25,
            strokeOpacity: 0.88,
          }),
          h('circle', {
            cx: 32,
            cy: 34,
            r: 11,
            strokeWidth: 0.75,
            strokeOpacity: 0.55,
          }),
          h('circle', {
            cx: 32,
            cy: 34,
            r: 4,
            strokeWidth: 0.9,
            strokeOpacity: 0.9,
          }),
          h('g', { strokeWidth: 0.75, strokeOpacity: 0.66 }, [
            h('path', {
              key: 'petal-n',
              d: 'M32 19c-4 4.5-4 9.5 0 15 4-5.5 4-10.5 0-15Z',
            }),
            h('path', {
              key: 'petal-e',
              d: 'M47 34c-4.5-4-9.5-4-15 0 5.5 4 10.5 4 15 0Z',
            }),
            h('path', {
              key: 'petal-s',
              d: 'M32 49c4-4.5 4-9.5 0-15-4 5.5-4 10.5 0 15Z',
            }),
            h('path', {
              key: 'petal-w',
              d: 'M17 34c4.5 4 9.5 4 15 0-5.5-4-10.5-4-15 0Z',
            }),
          ]),
          h('path', {
            d: 'M21 58h22M24 22l-4-5M40 22l4-5',
            strokeWidth: 0.9,
            strokeOpacity: 0.55,
          })
        ),
        h(
          'g',
          { fill: 'currentColor', stroke: 'none' },
          h('circle', { cx: 32, cy: 34, r: 1.9, opacity: 0.9 }),
          h('path', {
            d: 'M32 52l2.2 2.4-2.2 2.4-2.2-2.4z',
            opacity: 0.72,
          }),
          h('circle', { cx: 20, cy: 60, r: 1, opacity: 0.52 }),
          h('circle', { cx: 44, cy: 60, r: 1, opacity: 0.52 }),
          h('circle', { cx: 8, cy: 34, r: 0.9, opacity: 0.44 }),
          h('circle', { cx: 56, cy: 34, r: 0.9, opacity: 0.44 })
        )
      );
    }

    function NoirSidebarMark() {
      return h(
        'span',
        { className: 'noir-sidebar-mark' },
        h(NoirCrest)
      );
    }

    function NoirBrandName() {
      return h(
        'span',
        { className: 'noir-brand' },
        h('span', { className: 'noir-brand__first' }, 'NOIR'),
        h('span', { className: 'noir-brand__rest' }, 'ARCADE')
      );
    }

    function NoirHeroMark() {
      return h(
        'div',
        { className: 'noir-hero' },
        h(
          'span',
          { className: 'noir-hero__seal' },
          h(NoirCrest, { className: 'noir-hero__crest' })
        ),
        h('span', { className: 'noir-hero__rule' }),
        h(
          'span',
          { className: 'noir-hero__copy' },
          h('span', { className: 'noir-hero__eyebrow' }, 'NOIR ARCADE'),
          h('span', { className: 'noir-hero__sub' }, '于长夜中，专注构建')
        )
      );
    }

    function NoirVigilChip() {
      return h(
        'span',
        { className: 'noir-vigil', 'aria-hidden': 'true' },
        h('span', { className: 'noir-vigil__gem' }),
        h('span', { className: 'noir-vigil__text' }, 'VIGIL')
      );
    }

    function NoirRail() {
      return h(
        'div',
        { className: 'noir-rail', 'aria-hidden': 'true' },
        h('span', { className: 'noir-rail__line' }),
        h('span', { className: 'noir-rail__gem' }),
        h('span', { className: 'noir-rail__verse' }, 'IN TENEBRIS'),
        h('span', { className: 'noir-rail__dot' }),
        h('span', { className: 'noir-rail__gold' }, 'LUX AETERNA'),
        h('span', { className: 'noir-rail__verse noir-rail__verse--tail' }, 'MMXXVI'),
        h('span', { className: 'noir-rail__line noir-rail__line--right' })
      );
    }

    function NoirAtmosphere() {
      return h(
        'div',
        { className: 'noir-atmosphere', 'aria-hidden': 'true' },
        h('span', { className: 'noir-atmosphere__light' }),
        h('span', { className: 'noir-atmosphere__vignette' }),
        h('span', { className: 'noir-atmosphere__grain' }),
        h('span', { className: 'noir-atmosphere__frame' }),
        h('span', {
          className: 'noir-atmosphere__corner noir-atmosphere__corner--tl',
        }),
        h('span', {
          className: 'noir-atmosphere__corner noir-atmosphere__corner--tr',
        }),
        h('span', {
          className: 'noir-atmosphere__corner noir-atmosphere__corner--bl',
        }),
        h('span', {
          className: 'noir-atmosphere__corner noir-atmosphere__corner--br',
        })
      );
    }


    const BOOT_KEY = 'noir-cathedral-boot-v1';

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

    function NoirBoot() {
      const [visible, setVisible] = React.useState(bootAllowed);
      const [leaving, setLeaving] = React.useState(false);

      React.useEffect(() => {
        if (!visible) return undefined;

        try {
          window.sessionStorage.setItem(BOOT_KEY, '1');
        } catch (error) {
          /* the veil can replay when storage is unavailable */
        }

        let alive = true;
        let hideTimer;
        const reduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hold = reduced ? 450 : 1650;

        const dismiss = () => {
          if (!alive) return;
          alive = false;
          setLeaving(true);
          hideTimer = window.setTimeout(() => setVisible(false), 260);
        };

        const leaveTimer = window.setTimeout(dismiss, hold);
        const onKey = (event) => {
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
          }
          dismiss();
        };
        const onPointer = (event) => {
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          dismiss();
        };
        window.addEventListener('keydown', onKey, { once: true, capture: true });
        window.addEventListener('pointerdown', onPointer, {
          once: true,
          capture: true,
        });

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
          className: 'noir-boot' + (leaving ? ' noir-boot--leaving' : ''),
          role: 'presentation',
          'aria-hidden': 'true',
        },
        h('span', { className: 'noir-boot__halo' }),
        h('span', { className: 'noir-boot__arch' }),
        h(NoirCrest, { className: 'noir-boot__crest' }),
        h(
          'div',
          { className: 'noir-boot__content' },
          h('span', { className: 'noir-boot__kicker' }, 'MMXXVI · AD NOCTEM'),
          h('span', { className: 'noir-boot__title' }, 'NOIR ARCADE'),
          h('span', { className: 'noir-boot__cn' }, '黑金回廊'),
          h(
            'span',
            { className: 'noir-boot__rule' },
            h('span', { className: 'noir-boot__gem' })
          ),
          h('span', { className: 'noir-boot__verse' }, 'IN TENEBRIS · LUX AETERNA'),
          h('span', { className: 'noir-boot__progress' }, h('span')),
          h(
            'span',
            { className: 'noir-boot__hint' },
            'CLICK OR PRESS ANY KEY TO ENTER',
            h('span', { className: 'noir-boot__replay' }, '  ·  ?boot=1 REPLAY')
          )
        )
      );
    }
