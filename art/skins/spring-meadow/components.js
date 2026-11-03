    // 春野：一株刚抽出来的芽。
    // 一片修长的叶子：三段渐变 + 一条高光叶脉，小尺寸下也干净
    function LeafGlyph(props) {
      const cls = (props && props.className) || '';
      return h(
        'svg',
        { viewBox: '0 0 24 24', className: 'sp-leaf ' + cls, 'aria-hidden': 'true' },
        h('defs', null,
          h('linearGradient', { id: 'spLeafG', x1: '0.18', y1: '0.06', x2: '0.82', y2: '0.94' },
            h('stop', { offset: '0', stopColor: '#B4E493' }),
            h('stop', { offset: '0.48', stopColor: '#74B863' }),
            h('stop', { offset: '1', stopColor: '#3A7A37' }))),
        h('path', {
          d: 'M20.4 3.2C15.2 3.6 10.6 5.6 7.8 9 5.2 12.1 4.2 15.8 4.6 19.2 8.4 19.6 12.2 18.4 15 15.6 18 12.6 19.7 8.4 20.4 3.2Z',
          fill: 'url(#spLeafG)',
        }),
        h('path', {
          d: 'M19.9 3.9C16.5 7.4 12.7 11.2 9.7 15.4 8.9 16.6 8.3 17.8 7.9 19',
          fill: 'none', stroke: '#F6FCEF', strokeWidth: 0.75, strokeLinecap: 'round', opacity: 0.95,
        }),
      );
    }

    function LeafMark() {
      return h('span', { className: 'sp-mark', 'aria-hidden': 'true' }, h(LeafGlyph, null));
    }

    function SpringBrandName() {
      return h(
        'span',
        { className: 'sp-brand' },
        h('span', { className: 'sp-brand__cn' }, '春野'),
        h('span', { className: 'sp-brand__en' }, 'SPRING MEADOW'),
        h('span', { className: 'sp-brand__no' }, '3月'),
      );
    }

    // 英雄位：同一片叶子放大，带一圈光
    function Sprout() {
      return h(
        'svg',
        { viewBox: '0 0 24 24', className: 'sp-sprout', 'aria-hidden': 'true' },
        h('path', {
          d: 'M20.6 3.4 C12.4 4.2 5.6 9.4 4.2 16.4 C3.6 19.4 6.2 21.2 8.8 19.8 C15.4 16.4 19.4 10.2 20.6 3.4 Z',
          fill: 'currentColor',
        }),
        h('path', {
          d: 'M20.2 4.4 C15.6 8.2 11.2 12.8 8.4 19.2',
          fill: 'none', stroke: '#F6FCEF', strokeWidth: 0.9, strokeLinecap: 'round', opacity: 0.92,
        }),
      );
    }

    function SpringHeroMark(props) {
      const size = props && Number(props.size) > 0 ? Number(props.size) : 60;
      return h(
        'span',
        { className: 'sp-hero', style: { width: size + 'px', height: size + 'px' }, 'aria-hidden': 'true' },
        h('span', { className: 'sp-hero__glow' }),
        h(Sprout, null),
      );
    }

    function SpringChip() {
      return h(
        'span',
        { className: 'sp-chip', 'aria-label': '三月 · 草长莺飞' },
        h('span', { className: 'sp-chip__dot' }),
        h('span', null, '三月 · 草长莺飞'),
        h('span', { className: 'sp-chip__time' }, '14:00'),
      );
    }

    // 壁纸自愈层：铺一张固定 <img>，并主动把压在它上面的不透明白底清掉。
    // 宿主的外壳类名哈希每次构建都会变，靠 CSS 选择器赌不赢，只能运行时检测。
    function installSpringWall(ctx) {
      ctx.effect(() => {
        if (typeof document === 'undefined') return undefined;
        const root = document.documentElement;
        let img = null;
        let veil = null;
        let timer = 0;
        let tries = 0;
        const cleared = [];

        const clearOpaque = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          const points = [[w * 0.5, h * 0.35], [w * 0.5, h * 0.62], [w * 0.28, h * 0.5], [w * 0.74, h * 0.5]];
          const seen = new Set();
          for (const [x, y] of points) {
            let stack = [];
            try { stack = document.elementsFromPoint(x, y); } catch (error) { stack = []; }
            for (const el of stack) {
              if (!el || el === document.body || el === document.documentElement || seen.has(el)) continue;
              seen.add(el);
              if (el === img) continue;
              // 弹窗/模态框不能清，否则会变成半透明浮字
              if (el.getAttribute && (el.getAttribute('role') === 'dialog' || el.getAttribute('aria-modal') === 'true')) continue;
              if (el.tagName === 'DIALOG') continue;
              let cs;
              try { cs = getComputedStyle(el); } catch (error) { continue; }
              const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(cs.backgroundColor || '');
              if (!m) continue;
              const alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
              if (alpha < 0.85) continue;
              const r = el.getBoundingClientRect();
              if (r.width * r.height < w * h * 0.4) continue;   // 只动大面积的
              el.style.setProperty('background-color', 'transparent', 'important');
              el.style.setProperty('background-image', 'none', 'important');
              cleared.push(el);
            }
          }
        };

        const mount = () => {
          timer = 0;
          if (img) {
            clearOpaque();
            return;
          }
          let raw = '';
          try {
            raw = (getComputedStyle(root).getPropertyValue('--sp-wall') || '').trim();
          } catch (error) {
            raw = '';
          }
          const mm = /url\(["']?(.*?)["']?\)/.exec(raw);
          if (!mm) {
            if (tries++ < 30) timer = window.setTimeout(mount, 120);
            return;
          }
          img = document.createElement('img');
          img.className = 'sp-wall-img';
          img.alt = '';
          img.setAttribute('aria-hidden', 'true');
          img.src = mm[1];
          document.body.appendChild(img);
          root.classList.add('sp-wall-on');
          clearOpaque();
          window.setTimeout(clearOpaque, 400);
          window.setTimeout(clearOpaque, 1600);
          window.setTimeout(clearOpaque, 3200);
        };

        mount();
        const onResize = () => { clearOpaque(); };
        window.addEventListener('resize', onResize);

        return () => {
          if (timer) window.clearTimeout(timer);
          window.removeEventListener('resize', onResize);
          root.classList.remove('sp-wall-on');
          for (const el of cleared) {
            try {
              el.style.removeProperty('background-color');
              el.style.removeProperty('background-image');
            } catch (error) { /* ignore */ }
          }
          if (img) { try { img.remove(); } catch (error) { /* ignore */ } }
          if (veil) { try { veil.remove(); } catch (error) { /* ignore */ } }
          img = null;
          veil = null;
        };
      }, 'spring-meadow: wallpaper layer');
    }
