    const style = document.createElement('style');


    const BG = '#070205';

    const CRIMSON = '#FF335F';

    const GOLD = '#E9BC72';


    const VELVET = {
      bg: BG,
      bgBase: 'rgba(7, 2, 5, 0.62)',
      layer1: 'rgba(20, 6, 12, 0.92)',
      layer2: 'rgba(28, 9, 16, 0.95)',
      layer3: 'rgba(38, 12, 20, 0.96)',
      overlay: 'rgba(12, 3, 8, 0.985)',
      module: 'rgba(14, 3, 9, 0.94)',
      multi: 'rgba(32, 9, 17, 0.96)',
      skeleton: 'rgba(255, 110, 140, 0.07)',
      selection: 'rgba(255, 46, 86, 0.30)',
      mask1: 'rgba(0, 0, 0, 0.72)',
      mask2: 'rgba(0, 0, 0, 0.48)',
      mask3: 'rgba(0, 0, 0, 0.84)',
      maskPhoto: 'rgba(4, 1, 3, 0.95)',
      maskDrop: 'rgba(10, 2, 7, 0.74)',
      line1: 'rgba(255, 180, 150, 0.08)',
      line2: 'rgba(255, 180, 150, 0.14)',
      line3: 'rgba(255, 180, 150, 0.21)',
      line4: 'rgba(255, 180, 150, 0.30)',
      lineThin: 'rgba(255, 180, 150, 0.06)',
      lineInv: 'rgba(255, 240, 236, 0.05)',
      lineInv2: 'rgba(255, 240, 236, 0.09)',
      brand: CRIMSON,
      brandInvert: '#12030A',
      brandNew: '#E02048',
      brandText: '#FFE9E6',
      primaryFill: '#D81B45',
      primaryHover: '#F03A60',
      primaryDimmed: '#3A0A18',
      contrastFill: GOLD,
      elevated: 'rgba(26, 8, 14, 0.96)',
      floating: '#0B0206',
      floatingHover: '#241019',
      ghostFill: '#1C0A11',
      ghostHover: '#2A0E18',
      ghostBorder: '#7A3A46',
      info: '#E8B76B',
      infoHover: '#F5CD8A',
      hover: 'rgba(255, 110, 140, 0.07)',
      hoverSolid: 'rgba(30, 8, 15, 0.90)',
      active: 'rgba(255, 110, 140, 0.14)',
      hoverAccent: 'rgba(255, 80, 110, 0.16)',
      hoverDanger: 'rgba(255, 60, 60, 0.16)',
      ink: '#F8E9E8',
      inkSecondary: '#D8BFC0',
      inkTertiary: '#A98E93',
      inkCaption: '#8E7378',
      inkDimmed: '#5A4248',
      inkPrimaryDimmed: '#E2C9C9',
      inkInverted: '#12030A',
      inkOnRed: '#FFF6F4',
      inkBluish: GOLD,
      shimmer: 'rgba(255, 235, 230, 0.30)',
      deep: '#F0C98C',
      deepShimmer: '#FFE7BD',
      menuIcon: '#B99AA0',
      link: '#FF7E96',
      citation: 'rgba(30, 10, 17, 0.94)',
      codeBlock: '#060103',
      codeBanner: '#10040A',
      codeSel: '#2A0A14',
      codeUnsel: '#0B0206',
      codeInline: '#1A0810',
      placeholder: '#634A50',
      tag: '#1C0A12',
      scrollbar: 'rgba(255, 120, 145, 0.20)',
      scrollbarHover: 'rgba(255, 120, 145, 0.42)',
      error: '#FF7A7A',
      errorSecondary: '#FFA8A8',
      success: '#9FD3A8',
      successSecondary: '#C6E8CC',
      successTertiary: '#0D1A10',
      warn: GOLD,
      warnSecondary: '#FFE0A8',
      warnTertiary: '#2A1B08',
      warnLabel: '#FFE0A8',
      idle: '#6B5258',
      business: CRIMSON,
      businessTertiary: 'rgba(40, 10, 18, 0.94)',
      switchThumb: '#FFE6D8',
      toastBg: 'rgba(24, 7, 13, 0.985)',
      toastLabel: '#F8E9E8',
      tooltipBg: 'rgba(30, 8, 15, 0.99)',
      turnBg: '#0A0206',
      turnBgHover: '#16060C',
      diffAdded: 'rgba(120, 180, 130, 0.14)',
      diffDeleted: 'rgba(255, 80, 80, 0.14)',
      fileAddedBg: '#0C170E',
      fileAddedGutter: '#09120A',
      fileAddedMarker: '#9FD3A8',
      fileDeletedBg: '#220A0C',
      fileDeletedGutter: '#1A0608',
      fileDeletedMarker: '#FF7A7A',
      bubble: 'rgba(40, 10, 18, 0.94)',
      bubbleHighlight: '#3A0E1A',
      input: 'rgba(12, 3, 8, 0.95)',
      loginInput: '#0B0206',
      menuFill: 'rgba(18, 5, 10, 0.98)',
      menuHeader: 'rgba(22, 6, 12, 0.995)',
      selector: 'rgba(26, 8, 14, 0.95)',
      sidebar: 'rgba(6, 1, 4, 0.86)',
      sidebarActive: 'rgba(96, 20, 36, 0.60)',
      sidebarAccent: 'rgba(255, 80, 110, 0.45)',
      sidebarHover: 'rgba(60, 14, 24, 0.60)',
      tip: '#1A0710',
      focus: GOLD,
    };

    function KissMark(props) {
      const className = ['vs-kiss', props && props.className]
        .filter(Boolean)
        .join(' ');
      return h(
        'svg',
        {
          viewBox: '0 0 64 64',
          className,
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h(
          'defs',
          null,
          h(
            'radialGradient',
            { id: 'vs-kiss-grad', cx: '42%', cy: '26%', r: '78%' },
            h('stop', { offset: '0', stopColor: '#FF8FA0' }),
            h('stop', { offset: '0.34', stopColor: '#FF2E55' }),
            h('stop', { offset: '0.74', stopColor: '#C40E36' }),
            h('stop', { offset: '1', stopColor: '#7A0420' }),
          ),
        ),
        h(
          'g',
          { transform: 'translate(0 -4.6) scale(1 1.15)' },
          h('path', {
            d: 'M5 33 C12 26 20 21 27 20 C30 19.5 31.5 21 32 24 C32.5 21 34 19.5 37 20 C44 21 52 26 59 33 C52 40 45 45 37 47.5 C35 48 33 48 32 47.5 C31 48 29 48 27 47.5 C19 45 12 40 5 33 Z',
            fill: 'url(#vs-kiss-grad)',
          }),
          h('path', {
            d: 'M6 33.5 C14 36.5 22 38 32 38 C42 38 50 36.5 58 33.5',
            fill: 'none',
            stroke: '#6E0320',
            strokeOpacity: 0.55,
            strokeWidth: 0.9,
            strokeLinecap: 'round',
          }),
          h('path', {
            d: 'M11 31.5 C18 26 24 22.6 28.4 22 C30 21.8 31 22.6 31.4 24.4',
            fill: 'none',
            stroke: '#FFB6BE',
            strokeOpacity: 0.55,
            strokeWidth: 1.1,
            strokeLinecap: 'round',
          }),
          h('ellipse', {
            cx: 22,
            cy: 42.5,
            rx: 6.4,
            ry: 1.5,
            fill: '#FFDDE0',
            opacity: 0.5,
            transform: 'rotate(-9 22 42.5)',
          }),
          h('ellipse', {
            cx: 41.5,
            cy: 41.5,
            rx: 2.6,
            ry: 0.9,
            fill: '#FFE9E6',
            opacity: 0.35,
            transform: 'rotate(8 41.5 41.5)',
          }),
        ),
      );
    }

    function VelvetHeroMark(props) {
      const size = props && Number(props.size) > 0 ? Number(props.size) : 64;
      return h(
        'span',
        {
          className: 'vs-hero',
          style: { width: size + 'px', height: size + 'px' },
          'aria-hidden': 'true',
        },
        h('span', { className: 'vs-hero__halo' }),
        h(KissMark, { className: 'vs-hero__kiss' }),
      );
    }

    function VelvetSidebarMark() {
      return h(
        'span',
        { className: 'vs-sidemark', 'aria-hidden': 'true' },
        h(KissMark, null),
      );
    }

    function VelvetBrandName() {
      return h(
        'span',
        { className: 'vs-brand' },
        h('span', { className: 'vs-brand__dot' }),
        h('span', null, 'VELVET'),
        h('span', { className: 'vs-brand__sin' }, 'SIN'),
      );
    }

    function LipstickIcon() {
      return h(
        'svg',
        { viewBox: '0 0 12 20', className: 'vs-chip__bullet', 'aria-hidden': 'true' },
        h('rect', {
          x: 2.5,
          y: 8.4,
          width: 7,
          height: 9.6,
          rx: 0.6,
          fill: '#16040B',
          stroke: '#E9BC72',
          strokeOpacity: 0.55,
          strokeWidth: 0.8,
        }),
        h('path', {
          d: 'M3 8.4 V4.6 L9 2.6 V8.4 Z',
          fill: '#C4143C',
        }),
        h('path', {
          d: 'M3 4.6 L9 2.6 V4.2 L3 6.2 Z',
          fill: '#FF6A82',
          opacity: 0.8,
        }),
        h('rect', {
          x: 2.5,
          y: 8.4,
          width: 7,
          height: 1.4,
          fill: '#E9BC72',
          opacity: 0.8,
        }),
        h('rect', {
          x: 4.2,
          y: 12.2,
          width: 3.6,
          height: 0.7,
          fill: '#E9BC72',
          opacity: 0.35,
        }),
      );
    }

    function VelvetChip() {
      return h(
        'span',
        { className: 'vs-chip', 'aria-label': 'After dark · 22:00' },
        h('span', { className: 'vs-chip__dot' }),
        h('span', { className: 'vs-chip__label' }, 'AFTER DARK'),
        h('span', { className: 'vs-chip__sep' }, '·'),
        h('span', { className: 'vs-chip__time' }, '22:00'),
        h(LipstickIcon, null),
      );
    }

    function VelvetPulse() {
      const d =
        'M0 8 H34 l5 -9 l6 18 l6 -15 l5 6 H88 l4 -7 l5 15 l5 -12 l4 4 H142 l6 -11 l7 19 l6 -14 l5 6 H220';
      return h(
        'div',
        { className: 'vs-pulse', 'aria-hidden': 'true' },
        h('span', { className: 'vs-pulse__label' }, 'PULSE'),
        h(
          'span',
          { className: 'vs-pulse__beat' },
          h(
            'svg',
            { viewBox: '0 0 220 16', preserveAspectRatio: 'none', focusable: 'false' },
            h('path', { className: 'vs-pulse__ghost', d }),
            h('path', { className: 'vs-pulse__line', d }),
          ),
        ),
        h('span', { className: 'vs-pulse__bpm' }, '128'),
        h('span', { className: 'vs-pulse__unit' }, 'BPM'),
        h('span', { className: 'vs-pulse__brand' }, 'VELVET SIN'),
      );
    }

    function VelvetAtmosphere() {
      return h(
        'div',
        { className: 'vs-atmos', 'aria-hidden': 'true' },
        h('span', { className: 'vs-atmos__top' }),
        h('span', { className: 'vs-atmos__frame' }),
        h('span', { className: 'vs-atmos__corner vs-atmos__corner--tl' }),
        h('span', { className: 'vs-atmos__corner vs-atmos__corner--tr' }),
        h('span', { className: 'vs-atmos__corner vs-atmos__corner--bl' }),
        h('span', { className: 'vs-atmos__corner vs-atmos__corner--br' }),
        h('span', { className: 'vs-atmos__edge' }, 'AFTER DARK · MEMBERS ONLY · 22:00'),
        h('span', { className: 'vs-atmos__glow' }),
        h('span', { className: 'vs-atmos__grain' }),
      );
    }


    const BOOT_KEY = 'velvet-sin-boot-v1';

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

    function VelvetBoot() {
      const [visible, setVisible] = React.useState(bootAllowed);
      const [leaving, setLeaving] = React.useState(false);

      const dismiss = () => {
        setLeaving(true);
        if (typeof window !== 'undefined') {
          window.setTimeout(() => setVisible(false), 260);
        } else {
          setVisible(false);
        }
      };

      React.useEffect(() => {
        if (!visible) return undefined;
        try {
          window.sessionStorage.setItem(BOOT_KEY, '1');
        } catch (error) {
          /* storage can be unavailable; the session simply replays next load */
        }
        const reduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hold = reduced ? 600 : 1750;
        const leaveTimer = window.setTimeout(() => setLeaving(true), hold);
        const hideTimer = window.setTimeout(() => setVisible(false), hold + 260);
        const onKey = (event) => {
          if (event && typeof event.preventDefault === 'function') event.preventDefault();
          if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
          dismiss();
        };
        const onPointer = () => dismiss();
        window.addEventListener('keydown', onKey, { once: true });
        window.addEventListener('pointerdown', onPointer, { once: true });
        return () => {
          window.clearTimeout(leaveTimer);
          window.clearTimeout(hideTimer);
          window.removeEventListener('keydown', onKey);
          window.removeEventListener('pointerdown', onPointer);
        };
      }, [visible]);

      if (!visible) return null;

      return h(
        'div',
        {
          className: 'vs-boot' + (leaving ? ' vs-boot--leaving' : ''),
          onClick: dismiss,
          role: 'presentation',
          'aria-hidden': 'true',
        },
        h('span', { className: 'vs-boot__haze' }),
        h('span', { className: 'vs-boot__rays' }),
        h('span', { className: 'vs-boot__ring' }),
        h(
          'span',
          { className: 'vs-boot__inner' },
          h('span', { className: 'vs-boot__kiss' }, h(KissMark, null)),
          h('span', { className: 'vs-boot__kicker' }, 'MEMBERS ONLY · EST. MMXXVI'),
          h('span', { className: 'vs-boot__title' }, 'VELVET SIN'),
          h('span', { className: 'vs-boot__cn' }, '绯 夜 尤 物'),
          h('span', { className: 'vs-boot__rule' }),
          h('span', { className: 'vs-boot__line' }, 'AFTER DARK, EVERYTHING IS PERMITTED.'),
          h('span', { className: 'vs-boot__bar' }, h('span', { className: 'vs-boot__bar-fill' })),
          h(
            'span',
            { className: 'vs-boot__hint' },
            'CLICK OR PRESS ANY KEY',
            h('span', { className: 'vs-boot__replay' }, ' · ?boot=1 REPLAY'),
          ),
        ),
      );
    }
