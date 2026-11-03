    // 零点以后：一枚黄铜烛台标记 + 班表工牌。
    const AZ = {
      brass: '#D9A441',
      brassDim: 'rgba(217, 164, 65, 0.42)',
      lipstick: '#E0245E',
      ivory: '#F3E7DC',
      wine: '#4A0F1E',
    };

    // 一支烛换成了她手里那只怀表：黄铜提环 + 表盘 + 10:10 的指针
    function WatchMark(props) {
      const cls = (props && props.className) || '';
      return h(
        'svg',
        { viewBox: '0 0 24 24', className: 'az-watch ' + cls, 'aria-hidden': 'true' },
        h('circle', { cx: 12, cy: 2.9, r: 1.8, fill: 'none', stroke: AZ.brass, strokeWidth: 1.2 }),
        h('rect', { x: 11.1, y: 4.4, width: 1.8, height: 1.8, fill: AZ.brass }),
        h('circle', { cx: 12, cy: 13.9, r: 9.1, fill: 'none', stroke: AZ.brassDim, strokeWidth: 1 }),
        h('circle', { cx: 12, cy: 13.9, r: 7.2, fill: 'rgba(12, 5, 8, 0.55)', stroke: AZ.brass, strokeWidth: 0.9, strokeOpacity: 0.85 }),
        h('path', { d: 'M12 13.9 L8.3 9.9', stroke: AZ.ivory, strokeWidth: 1.6, strokeLinecap: 'round' }),
        h('path', { d: 'M12 13.9 L16.4 10.4', stroke: AZ.ivory, strokeWidth: 1.2, strokeLinecap: 'round' }),
        h('circle', { cx: 12, cy: 13.9, r: 1.15, fill: AZ.lipstick }),
      );
    }

    function ZeroMark() {
      return h('span', { className: 'az-mark', 'aria-hidden': 'true' }, h(WatchMark, null));
    }

    function ZeroBrandName() {
      return h(
        'span',
        { className: 'az-brand' },
        h('span', { className: 'az-brand__after' }, 'AFTER'),
        h('span', { className: 'az-brand__zero' }, 'ZERO'),
        h('span', { className: 'az-brand__no' }, 'No.07'),
      );
    }

    function ZeroHeroMark(props) {
      const size = props && Number(props.size) > 0 ? Number(props.size) : 60;
      return h(
        'span',
        { className: 'az-hero', style: { width: size + 'px', height: size + 'px' }, 'aria-hidden': 'true' },
        h('span', { className: 'az-hero__halo' }),
        h(WatchMark, { className: 'az-hero__watch' }),
      );
    }

    function ZeroChip() {
      return h(
        'span',
        { className: 'az-chip', 'aria-label': '值班 22:00 – 06:00' },
        h('span', { className: 'az-chip__dot' }),
        h('span', { className: 'az-chip__label' }, '夜班'),
        h('span', { className: 'az-chip__sep' }, '·'),
        h('span', { className: 'az-chip__time' }, '22:00 – 06:00'),
      );
    }

    // 微动壁纸：把 CSS 里的动态 WebP 取出来，铺满窗口
    function installLiveZeroWall(ctx) {
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
            raw = (getComputedStyle(root).getPropertyValue('--az-art') || '').trim();
          } catch (error) {
            raw = '';
          }
          const m = /url\(["']?(.*?)["']?\)/.exec(raw);
          if (!m) {
            if (tries++ < 30) timer = window.setTimeout(mount, 120);
            return;
          }
          img = document.createElement('img');
          img.className = 'az-live-img';
          img.alt = '';
          img.setAttribute('aria-hidden', 'true');
          img.src = m[1];
          document.body.appendChild(img);
          root.classList.add('az-live');
        };

        mount();

        return () => {
          if (timer) window.clearTimeout(timer);
          root.classList.remove('az-live');
          if (img) { try { img.remove(); } catch (error) { /* ignore */ } }
          img = null;
        };
      }, 'after-zero: live wallpaper');
    }
