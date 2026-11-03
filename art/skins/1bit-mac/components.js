    // =======================================================================
    // 单色 · 1-BIT SYSTEM — 1984 的机器，接 2026 的模型
    //
    // 只有两种颜色。所以「灰」必须靠抖动算出来：任何渐变、任何中间调、
    // 任何进度条，都是 4×4 Bayer 有序抖动的一个点。本文件里的 DitherRect
    // 就是这台机器的显卡：给它一个 0..1 的值，它返回一串 1px 方块。
    // =======================================================================

    const MONO_KEY = 'huaping-1bit-sound';
    const MONO_BOOT_KEY = 'huaping-1bit-boot-v1';

    // 4×4 Bayer 有序抖动矩阵。16 级灰度，全部由黑白两点拼出来。
    const MONO_BAYER = [
      0, 8, 2, 10,
      12, 4, 14, 6,
      3, 11, 1, 9,
      15, 7, 13, 5,
    ];

    /** 4×4 Bayer 阈值，归一化到 [0,1)。方格 (x,y) 的「黑点密度」。 */
    function monoBayer(x, y) {
      return (MONO_BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
    }

    /** 用 4×4 Bayer 把一个 0..1 的灰度铺成点阵 SVG 背景（1px 方格）。 */
    function monoBayerTile(level, ink) {
      const cells = [];
      const count = Math.max(0, Math.min(16, Math.round(level * 16)));
      for (let y = 0; y < 4; y += 1) {
        for (let x = 0; x < 4; x += 1) {
          // MONO_BAYER 里是 0..15 的等级，不是 0..1 的阈值：
          // 点亮等级 < count 的格子，才是由疏到密的十六级 Bayer 网点。
          if (MONO_BAYER[y * 4 + x] < count) {
            cells.push("<rect x='" + x + "' y='" + y + "' width='1' height='1'/>");
          }
        }
      }
      const svg =
        "<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4' shape-rendering='crispEdges'>" +
        "<g fill='" + ink + "'>" + cells.join('') + '</g></svg>';
      return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
    }

    // 挂到根元素上的抖动纹理，CSS 里直接 var(--b1-dot-N) 取用。
    // 颜色写 #000，交给下面的 encodeURIComponent 编码一次就够了（别写成 %23）。
    const MONO_TEXTURES = {
      '--b1-dot-1': monoBayerTile(1 / 16, '#000'),
      '--b1-dot-2': monoBayerTile(2 / 16, '#000'),
      '--b1-dot-4': monoBayerTile(4 / 16, '#000'),
      '--b1-dot-6': monoBayerTile(6 / 16, '#000'),
      '--b1-dot-8': monoBayerTile(8 / 16, '#000'),
      '--b1-dot-12': monoBayerTile(12 / 16, '#000'),
    };

    // -----------------------------------------------------------------------
    // 机械键盘的「咔」
    // -----------------------------------------------------------------------

    const monoSound = (function () {
      const listeners = new Set();
      let mode = 'send';

      try {
        const saved = window.localStorage.getItem(MONO_KEY);
        if (saved === 'off' || saved === 'send' || saved === 'all') mode = saved;
      } catch (error) {
        /* storage is optional */
      }

      let ctx = null;
      let noise = null;

      function audio() {
        if (ctx) return ctx;
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        try {
          ctx = new Ctor();
        } catch (error) {
          return null;
        }
        return ctx;
      }

      function noiseBuffer(ac) {
        if (noise) return noise;
        const length = Math.max(64, Math.floor(ac.sampleRate * 0.03));
        const buffer = ac.createBuffer(1, length, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) {
          // 指数衰减的白噪声：剪刀脚键帽撞到底板的那一下
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 7);
        }
        noise = buffer;
        return buffer;
      }

      /** heavy=true 是空格键/发送键：更闷、更长。 */
      function play(heavy) {
        const ac = audio();
        if (!ac) return;
        if (ac.state === 'suspended') {
          ac.resume().catch(function () {});
        }
        const now = ac.currentTime;

        const source = ac.createBufferSource();
        source.buffer = noiseBuffer(ac);
        const band = ac.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = heavy ? 1500 : 2700;
        band.Q.value = 0.85;
        const gain = ac.createGain();
        gain.gain.value = heavy ? 0.17 : 0.06;
        source.connect(band).connect(gain).connect(ac.destination);
        source.start(now);
        source.stop(now + 0.05);

        if (heavy) {
          // 低频「壳」声：让 1-bit 的咔有重量
          const osc = ac.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(210, now);
          osc.frequency.exponentialRampToValueAtTime(92, now + 0.07);
          const body = ac.createGain();
          body.gain.setValueAtTime(0.0001, now);
          body.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
          body.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
          osc.connect(body).connect(ac.destination);
          osc.start(now);
          osc.stop(now + 0.12);
        }
      }

      const api = {
        get() {
          return mode;
        },
        set(next) {
          mode = next;
          try {
            window.localStorage.setItem(MONO_KEY, next);
          } catch (error) {
            /* optional */
          }
          listeners.forEach(function (fn) {
            try {
              fn(next);
            } catch (error) {
              /* a broken subscriber must not break the toggle */
            }
          });
        },
        cycle() {
          api.set(mode === 'send' ? 'all' : mode === 'all' ? 'off' : 'send');
        },
        subscribe(fn) {
          listeners.add(fn);
          return function () {
            listeners.delete(fn);
          };
        },
        play: play,
      };
      return api;
    })();

    function useMonoSound() {
      const [mode, setMode] = React.useState(function () {
        return monoSound.get();
      });
      React.useEffect(function () {
        setMode(monoSound.get());
        return monoSound.subscribe(setMode);
      }, []);
      return mode;
    }

    const MONO_SEND = /(send|发送|提交|submit)/i;

    /**
     * 判断一个控件是不是「发送键」。宿主没有稳定的 test id，所以按三条走：
     * submit 类型 → 无障碍名字 → 输入框工具行里最右的那个按钮（兜底）。
     * 命中就给它机械键盘那种更沉的「咔」。
     */
    function monoIsSendControl(el) {
      if (!el || !el.getAttribute) return false;
      if (String(el.type || '').toLowerCase() === 'submit') return true;

      const labels = (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '');
      if (MONO_SEND.test(labels)) return true;

      try {
        const scope = el.closest('[class*="composer"]');
        const parent = el.parentElement;
        if (scope && parent && parent.lastElementChild === el) return true;
      } catch (error) {
        /* 没有 closest 的老环境就只按前两条判 */
      }
      return false;
    }

    // -----------------------------------------------------------------------
    // 抖动柱状图：这台机器的「显卡」
    // -----------------------------------------------------------------------

    /**
     * values: 0..1 的数组，一列一根柱子。
     * 柱子整数格是实心的，顶上那一格用 4×4 Bayer 补小数——这就是 1-bit
     * 打印机画「不足一格」的做法，所以满格读数一定是实心的一条。
     */
    function MonoBars(props) {
      const cols = props.cols;
      const rows = props.rows;
      const unit = props.unit || 1;
      const values = props.values || [];
      const originX = props.x || 0;
      const originY = props.y || 0;
      const cells = [];

      // 序列比格子短时靠右对齐（左边留白），这样读数像一条从右往左涨的水位线，
      // 而不是把 5 根柱子平铺重复三遍。
      const series = [];
      for (let i = 0; i < cols; i += 1) {
        const offset = cols - Math.min(values.length, cols);
        const index = i - offset;
        series.push(index >= 0 ? values[index] : 0);
      }

      for (let c = 0; c < cols; c += 1) {
        const value = Math.max(0, Math.min(1, Number(series[c]) || 0));
        const exact = value * rows;
        const full = Math.floor(exact);
        const frac = exact - full;

        // 整数格实心：满格就是一条实心的柱子
        for (let r = 0; r < full; r += 1) {
          cells.push(
            h('rect', {
              key: c + ':' + r,
              x: originX + c * unit,
              y: originY + (rows - 1 - r) * unit,
              width: unit,
              height: unit,
            }),
          );
        }

        // 顶端不满一格的余量按 Bayer 阈值补点：1-bit 打印机就是这么画半格的
        const top = rows - 1 - full;
        if (full < rows && frac > 0 && monoBayer(c, top) < frac) {
          cells.push(
            h('rect', {
              key: c + ':top',
              x: originX + c * unit,
              y: originY + top * unit,
              width: unit,
              height: unit,
            }),
          );
        }
      }

      return h('g', { fill: props.fill || '#000' }, cells);
    }

    /**
     * 宿主的 selector hook 必须在渲染期、按固定顺序、无条件地取。
     * 所以这里只做「调用 + 兜底」，自身不含任何 hook，可以在 useMemo 里安全跑。
     */
    function monoSnapshot(props, name) {
      if (!props) return null;
      const fn = props[name];
      if (typeof fn !== 'function') return null;
      try {
        return fn() || null;
      } catch (error) {
        return null;
      }
    }

    /**
     * 从宿主给插槽的 props 里「嗅」出真实的 token 数字。
     *
     * 宿主没有公开 token 服务，只有各个 selector 的快照。这里不去猜
     * 某一个固定的形状，而是在有界的深度里找长得像 token 的数字：
     *   - 一个 token 计数的数组 → 直接当柱状图的序列用（最理想）；
     *   - used / limit 一对 → 折算成一根「水位」柱。
     * 什么都找不到就返回 null，界面退回自检画面，不编数字。
     */
    function monoReadTokens(sources) {
      const roots = (sources || []).filter(function (value) {
        return value && typeof value === 'object';
      });
      if (!roots.length) return null;

      const tokenish = /token/i;
      const limitish = /(context|window|limit|max)/i;
      const series = [];
      const numbers = [];
      const seen = new Set();
      const queue = roots.map(function (node) {
        return { node: node, depth: 0 };
      });

      let visited = 0;
      while (queue.length && visited < 300) {
        const item = queue.shift();
        const node = item.node;
        visited += 1;
        if (!node || typeof node !== 'object') continue;
        if (item.depth > 4) continue;
        if (seen.has(node)) continue;
        seen.add(node);

        let keys;
        try {
          keys = Object.keys(node);
        } catch (error) {
          continue;
        }
        for (let i = 0; i < keys.length && i < 60; i += 1) {
          const key = keys[i];
          const value = node[key];
          if (Array.isArray(value)) {
            if (tokenish.test(key) && value.length >= 2 && value.length <= 64) {
              const flat = value.filter(function (n) {
                return typeof n === 'number' && n >= 0;
              });
              if (flat.length >= 2 && flat.every(function (n, index) {
                return typeof value[index] === 'number';
              })) {
                series.push(flat);
              }
            }
            queue.push({ node: value, depth: item.depth + 1 });
          } else if (typeof value === 'number') {
            if (tokenish.test(key) && value > 0) numbers.push({ key: key, value: value });
          } else if (value && typeof value === 'object') {
            if (tokenish.test(key) || limitish.test(key) || key === 'usage' || key === 'stats') {
              queue.push({ node: value, depth: item.depth + 1 });
            }
          }
        }
      }

      if (series.length) {
        const best = series[0];
        const max = Math.max.apply(null, best) || 1;
        return {
          kind: 'series',
          values: best.slice(-12).map(function (n) {
            return n / max;
          }),
          total: best.reduce(function (a, b) {
            return a + b;
          }, 0),
        };
      }

      let limit = null;
      let used = null;
      numbers.forEach(function (entry) {
        if (limitish.test(entry.key)) {
          if (entry.value >= 1000 && (limit === null || entry.value > limit)) limit = entry.value;
        } else if (used === null || entry.value > used) {
          used = entry.value;
        }
      });
      if (used === null) return null;

      const capped = limit ? Math.min(1, used / limit) : 1;
      const cols = 14;
      const filled = Math.max(1, Math.round(capped * cols));
      return {
        kind: 'gauge',
        values: Array.from({ length: cols }, function (_, index) {
          return index < filled ? 1 : 0;
        }),
        used: used,
        limit: limit,
      };
    }

    function monoFormat(n) {
      if (typeof n !== 'number' || !isFinite(n)) return '—';
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(Math.round(n));
    }

    // 3×5 点阵字模。屏幕上的读数是一个像素一个像素拼出来的——
    // 用 CSS 字体渲染必然带抗锯齿，带抗锯齿就不是 1-bit 了。
    const MONO_FONT = {
      ' ': '000000000000000',
      '.': '000000000000010',
      '-': '000000111000000',
      '/': '001001010100100',
      '%': '101001010100101',
      '0': '111101101101111',
      '1': '010110010010111',
      '2': '111001111100111',
      '3': '111001111001111',
      '4': '101101111001001',
      '5': '111100111001111',
      '6': '111100111101111',
      '7': '111001001010010',
      '8': '111101111101111',
      '9': '111101111001111',
      'A': '111101111101101',
      'B': '110101110101110',
      'C': '111100100100111',
      'D': '110101101101110',
      'E': '111100111100111',
      'H': '101101111101101',
      'I': '111010010010111',
      'K': '101101110101101',
      'L': '100100100100111',
      'M': '101111111101101',
      'N': '101111111111101',
      'O': '111101101101111',
      'P': '111101111100100',
      'R': '111101110101101',
      'S': '111100111001111',
      'T': '111010010010010',
      'U': '101101101101111',
      'X': '101101010101101',
      'Y': '101101010010010',
    };

    function monoTextWidth(text, scale) {
      const s = scale || 1;
      return String(text).length * 4 * s - s;
    }

    function MonoPixelText(props) {
      const scale = props.scale || 1;
      const text = String(props.text == null ? '' : props.text).toUpperCase();
      const bits = [];
      let cursor = props.x;
      let seq = 0;

      for (let i = 0; i < text.length; i += 1) {
        const glyph = MONO_FONT[text.charAt(i)];
        if (glyph) {
          for (let r = 0; r < 5; r += 1) {
            for (let c = 0; c < 3; c += 1) {
              if (glyph.charAt(r * 3 + c) === '1') {
                seq += 1;
                bits.push(
                  h('rect', {
                    key: 'p' + seq,
                    x: cursor + c * scale,
                    y: props.y + r * scale,
                    width: scale,
                    height: scale,
                  }),
                );
              }
            }
          }
        }
        cursor += 4 * scale;
      }

      return h('g', { fill: props.fill || '#000' }, bits);
    }

    // 荧光屏底噪：黑底上的白点，密度自上而下加浓，像一张有颗粒的 CRT
    function MonoScreenNoise(props) {
      const cells = [];
      for (let c = 0; c < props.cols; c += 1) {
        for (let r = 0; r < props.rows; r += 1) {
          const density = 0.05 + (0.14 * r) / props.rows;
          if (monoBayer(c, r) >= density) continue;
          cells.push(
            h('rect', {
              key: c + ':' + r,
              x: props.x + c * props.unit,
              y: props.y + r * props.unit,
              width: props.unit,
              height: props.unit,
            }),
          );
        }
      }
      return h('g', { fill: '#fff', opacity: 0.42 }, cells);
    }

    // -----------------------------------------------------------------------
    // 挂件：一台老式一体机，黑屏里跑着白色的抖动柱状图
    // -----------------------------------------------------------------------

    const MONO_BEZEL = { cols: 15, rows: 5, unit: 2, x: 9, y: 8 };

    function MonoScreen(props) {
      const bezel = MONO_BEZEL;
      const textWidth = monoTextWidth(props.text, 1);
      return h('g', null, [
        h('rect', { key: 'crt', x: 7, y: 6, width: 36, height: 20, fill: '#000' }),
        h(MonoScreenNoise, {
          key: 'noise',
          cols: bezel.cols,
          rows: bezel.rows,
          unit: bezel.unit,
          x: bezel.x,
          y: bezel.y,
        }),
        h(MonoBars, {
          key: 'bars',
          x: bezel.x,
          y: bezel.y,
          cols: bezel.cols,
          rows: bezel.rows,
          unit: bezel.unit,
          values: props.values,
          fill: '#fff',
        }),
        h(MonoPixelText, {
          key: 'readout',
          text: props.text,
          x: Math.round(25 - textWidth / 2),
          y: 20,
          scale: 1,
          fill: '#fff',
        }),
      ]);
    }

    function MonoMachine(props) {
      // 宿主的 selector 必须在渲染期按固定顺序无条件调用：把它们提到组件顶层，
      // 而不是塞进 useMemo 的工厂里（deps 命中时工厂不跑，hook 顺序就错位了）。
      const conversation = monoSnapshot(props, 'useConversation');
      const chat = monoSnapshot(props, 'useChat');

      const reading = React.useMemo(function () {
        try {
          return monoReadTokens([conversation, chat]);
        } catch (error) {
          return null;
        }
      }, [conversation, chat]);

      // 没有真实读数时，屏幕跑一段自检波形：依然是 4×4 Bayer，只是不假装有数字
      const [tick, setTick] = React.useState(0);
      React.useEffect(function () {
        if (reading) return undefined;
        const id = window.setInterval(function () {
          setTick(function (n) {
            return n + 1;
          });
        }, 900);
        return function () {
          window.clearInterval(id);
        };
      }, [reading]);

      const values = reading && reading.values
        ? reading.values
        : Array.from({ length: MONO_BEZEL.cols }, function (_, index) {
            // 一段 640K 自检的锯齿波，每一步都跳，像老机器在扫内存
            const wave = Math.sin((index + (tick % MONO_BEZEL.cols)) * 0.9);
            return 0.18 + 0.68 * Math.abs(wave) * (0.55 + 0.45 * Math.abs(Math.cos(index + tick * 0.4)));
          });

      const value = reading ? monoFormat(reading.limit ? reading.used : reading.total || reading.used) : '640K';
      const label = reading
        ? (reading.limit ? 'TOKENS ' + monoFormat(reading.used) + ' / ' + monoFormat(reading.limit) : 'TOKENS ' + value)
        : 'MEMORY OK · 640K · 没有读数';

      return h(
        'div',
        { className: 'onebit-machine' },
        h(
          'div',
          { className: 'onebit-machine__plate' },
          h('span', { className: 'onebit-machine__brand' }, reading ? 'TOK' : 'MEM'),
          h('span', { className: 'onebit-machine__read' }, value),
        ),
        h(
          'svg',
          {
            className: 'onebit-machine__art',
            viewBox: '0 0 56 48',
            width: 112,
            height: 96,
            shapeRendering: 'crispEdges',
            role: 'img',
            'aria-label': label,
          },
          h('rect', { key: 'shadow', x: 3, y: 3, width: 50, height: 42, fill: '#000' }),
          h('path', {
            key: 'body',
            d: 'M2 0 H48 L50 2 V40 L48 42 H2 L0 40 V2 Z',
            fill: '#fff',
            stroke: '#000',
            strokeWidth: 1,
          }),
          h('rect', {
            key: 'housing',
            x: 5,
            y: 4,
            width: 40,
            height: 24,
            fill: '#fff',
            stroke: '#000',
            strokeWidth: 1,
          }),
          h(MonoScreen, { key: 'screen', values: values, text: value }),
          h('rect', { key: 'slot', x: 16, y: 31, width: 18, height: 1, fill: '#000' }),
          h('rect', { key: 'notch', x: 17, y: 32, width: 2, height: 1, fill: '#000' }),
          h('rect', { key: 'vent1', x: 10, y: 35, width: 30, height: 1, fill: '#000' }),
          h('rect', { key: 'vent2', x: 10, y: 37, width: 30, height: 1, fill: '#000' }),
          h('rect', {
            key: 'led',
            className: 'onebit-machine__led',
            x: 4,
            y: 36,
            width: 2,
            height: 2,
            fill: '#000',
          }),
        ),
      );
    }

    // -----------------------------------------------------------------------
    // 品牌与题签
    // -----------------------------------------------------------------------

    function MonoMonitorGlyph() {
      return h(
        'svg',
        {
          className: 'onebit-mark__glyph',
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          shapeRendering: 'crispEdges',
          'aria-hidden': 'true',
        },
        h('rect', { x: 0, y: 1, width: 16, height: 12, fill: 'none', stroke: 'currentColor', strokeWidth: 1, shapeRendering: 'crispEdges' }),
        // 屏幕里是一块 50% 抖动，不是灰
        h('g', { fill: 'currentColor' }, [
          h('rect', { key: 'a', x: 2, y: 3, width: 1, height: 1 }),
          h('rect', { key: 'b', x: 4, y: 3, width: 1, height: 1 }),
          h('rect', { key: 'c', x: 6, y: 3, width: 1, height: 1 }),
          h('rect', { key: 'd', x: 8, y: 3, width: 1, height: 1 }),
          h('rect', { key: 'e', x: 10, y: 3, width: 1, height: 1 }),
          h('rect', { key: 'f', x: 12, y: 3, width: 1, height: 1 }),
          h('rect', { key: 'g', x: 3, y: 5, width: 1, height: 1 }),
          h('rect', { key: 'h', x: 5, y: 5, width: 1, height: 1 }),
          h('rect', { key: 'i', x: 7, y: 5, width: 1, height: 1 }),
          h('rect', { key: 'j', x: 9, y: 5, width: 1, height: 1 }),
          h('rect', { key: 'k', x: 11, y: 5, width: 1, height: 1 }),
          h('rect', { key: 'l', x: 2, y: 7, width: 1, height: 1 }),
          h('rect', { key: 'm', x: 4, y: 7, width: 1, height: 1 }),
          h('rect', { key: 'n', x: 6, y: 7, width: 1, height: 1 }),
          h('rect', { key: 'o', x: 8, y: 7, width: 1, height: 1 }),
          h('rect', { key: 'p', x: 10, y: 7, width: 1, height: 1 }),
          h('rect', { key: 'q', x: 12, y: 7, width: 1, height: 1 }),
          h('rect', { key: 'r', x: 3, y: 9, width: 1, height: 1 }),
          h('rect', { key: 's', x: 5, y: 9, width: 1, height: 1 }),
          h('rect', { key: 't', x: 7, y: 9, width: 1, height: 1 }),
          h('rect', { key: 'u', x: 9, y: 9, width: 1, height: 1 }),
          h('rect', { key: 'v', x: 11, y: 9, width: 1, height: 1 }),
        ]),
        h('rect', { x: 5, y: 13, width: 6, height: 1, fill: 'currentColor' }),
        h('rect', { x: 3, y: 14, width: 10, height: 1, fill: 'currentColor' }),
      );
    }

    function MonoSidebarMark() {
      return h('span', { className: 'onebit-mark' }, h(MonoMonitorGlyph));
    }

    /**
     * 侧边栏顶部的品牌行，直接做成 System 7 的活动标题栏：
     * 1px 横条密排 + 白色挖空里的标题文字。
     */
    function MonoBrandName() {
      return h(
        'span',
        { className: 'onebit-titlebar' },
        h('span', { className: 'onebit-titlebar__text' }, 'DSH'),
        h('span', { className: 'onebit-titlebar__year' }, '2026'),
      );
    }

    function MonoHeroMark() {
      return h(
        'div',
        { className: 'onebit-hero' },
        h('span', { className: 'onebit-hero__from' }, '1984'),
        h('span', { className: 'onebit-hero__bridge', 'aria-hidden': 'true' }),
        h('span', { className: 'onebit-hero__to' }, '2026'),
        h('span', { className: 'onebit-hero__note' }, 'ONE BIT IS ENOUGH'),
      );
    }

    function MonoSoundChip() {
      const mode = useMonoSound();
      const map = {
        send: { text: '咔 发送', title: '只有发送键与回车有键声 · 点一下：全部按键' },
        all: { text: '咔 全部', title: '每个按钮都有键声 · 点一下：静音' },
        off: { text: '静音', title: '已静音 · 点一下：只恢复发送键' },
      };
      const state = map[mode] || map.send;
      return h(
        'button',
        {
          type: 'button',
          className: 'onebit-chip',
          'data-mode': mode,
          title: state.title,
          'aria-label': state.title,
          'data-onebit-silent': 'true',
          onClick: function () {
            monoSound.cycle();
          },
        },
        h('span', { className: 'onebit-chip__led', 'aria-hidden': 'true' }),
        h('span', { className: 'onebit-chip__text' }, state.text),
      );
    }

    // -----------------------------------------------------------------------
    // 全屏层：抖动画布、网点爬行、选区抖动描边
    // -----------------------------------------------------------------------

    function MonoAtmosphere() {
      const [boxes, setBoxes] = React.useState([]);
      const measureRef = React.useRef(0);

      React.useEffect(function () {
        const root = document.documentElement;
        for (const name of Object.keys(MONO_TEXTURES)) {
          root.style.setProperty(name, MONO_TEXTURES[name]);
        }
        return function () {
          for (const name of Object.keys(MONO_TEXTURES)) {
            root.style.removeProperty(name);
          }
        };
      }, []);

      // ---- 网点爬行：滚动位移取整到 1px，纹理一格一格地挪 ----
      React.useEffect(function () {
        const root = document.documentElement;
        const last = new Map();
        let phase = 0;
        let frame = 0;

        const paint = function () {
          frame = 0;
          root.style.setProperty('--b1-crawl', Math.round(phase) + 'px');
        };

        const onScroll = function (event) {
          const target = event.target;
          if (!target || typeof target.scrollTop !== 'number') return;
          const previous = last.get(target) || 0;
          const top = target.scrollTop;
          last.set(target, top);
          const delta = top - previous;
          if (!delta) return;
          phase += delta;
          if (!frame) frame = window.requestAnimationFrame(paint);
        };

        window.addEventListener('scroll', onScroll, { capture: true, passive: true });
        root.style.setProperty('--b1-crawl', '0px');
        return function () {
          window.removeEventListener('scroll', onScroll, true);
          if (frame) window.cancelAnimationFrame(frame);
          root.style.removeProperty('--b1-crawl');
        };
      }, []);

      // ---- 选区：反白之后补一圈 1px 抖动描边 ----
      React.useEffect(function () {
        let frame = 0;
        let previous = [];

        const same = function (a, b) {
          if (a.length !== b.length) return false;
          for (let i = 0; i < a.length; i += 1) {
            if (a[i].x !== b[i].x || a[i].y !== b[i].y || a[i].w !== b[i].w || a[i].h !== b[i].h) return false;
          }
          return true;
        };

        const measure = function () {
          frame = 0;
          let next = [];
          try {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && selection.rangeCount) {
              const rects = selection.getRangeAt(0).getClientRects();
              for (let i = 0; i < rects.length && next.length < 64; i += 1) {
                const rect = rects[i];
                if (rect.width < 2 || rect.height < 2) continue;
                next.push({
                  x: Math.round(rect.left) - 2,
                  y: Math.round(rect.top) - 2,
                  w: Math.round(rect.width) + 4,
                  h: Math.round(rect.height) + 4,
                });
              }
            }
          } catch (error) {
            next = [];
          }
          if (!same(previous, next)) {
            previous = next;
            setBoxes(next);
          }
        };

        const schedule = function () {
          if (!frame) frame = window.requestAnimationFrame(measure);
        };

        document.addEventListener('selectionchange', schedule);
        window.addEventListener('scroll', schedule, true);
        window.addEventListener('resize', schedule);
        schedule();

        return function () {
          document.removeEventListener('selectionchange', schedule);
          window.removeEventListener('scroll', schedule, true);
          window.removeEventListener('resize', schedule);
          if (frame) window.cancelAnimationFrame(frame);
        };
      }, []);

      // ---- 键声：指针按下 + 回车发送 ----
      React.useEffect(function () {
        const onPointerDown = function (event) {
          const mode = monoSound.get();
          if (mode === 'off') return;
          const target = event.target;
          const control =
            target && target.closest
              ? target.closest('button,[role="button"],[role="switch"],[role="menuitem"],[role="tab"],summary')
              : null;
          if (!control) return;
          if (control.getAttribute && control.getAttribute('data-onebit-silent') === 'true') return;
          if (mode === 'send') {
            if (!monoIsSendControl(control)) return;
            monoSound.play(true);
            return;
          }
          monoSound.play(monoIsSendControl(control));
        };

        const onKeyDown = function (event) {
          if (event.key !== 'Enter') return;
          if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.isComposing) return;
          if (monoSound.get() === 'off') return;
          const target = event.target;
          if (!target) return;
          const editable =
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'INPUT' ||
            target.isContentEditable === true;
          if (!editable) return;
          monoSound.play(true);
        };

        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        return function () {
          document.removeEventListener('pointerdown', onPointerDown, true);
          document.removeEventListener('keydown', onKeyDown, true);
        };
      }, []);

      return h(
        'div',
        { className: 'onebit-atmosphere', 'aria-hidden': 'true' },
        h('span', { className: 'onebit-atmosphere__crawl' }),
        h('span', { className: 'onebit-atmosphere__frame' }),
        h('span', { className: 'onebit-atmosphere__corner onebit-atmosphere__corner--tl' }),
        h('span', { className: 'onebit-atmosphere__corner onebit-atmosphere__corner--tr' }),
        h('span', { className: 'onebit-atmosphere__corner onebit-atmosphere__corner--bl' }),
        h('span', { className: 'onebit-atmosphere__corner onebit-atmosphere__corner--br' }),
        boxes.length
          ? h(
              'span',
              { key: 'selection', className: 'onebit-selection' },
              boxes.map(function (box, index) {
                return h('i', {
                  key: index,
                  className: 'onebit-selection__box',
                  style: { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' },
                });
              }),
            )
          : null,
      );
    }

    // -----------------------------------------------------------------------
    // 启动：软盘 · 自检 · 窗口从中心展开
    // -----------------------------------------------------------------------

    function monoFloppy() {
      return h(
        'svg',
        {
          className: 'onebit-boot__floppy',
          viewBox: '0 0 32 34',
          width: 64,
          height: 68,
          shapeRendering: 'crispEdges',
          'aria-hidden': 'true',
        },
        h('rect', { x: 1, y: 1, width: 30, height: 32, fill: '#fff', stroke: '#000', strokeWidth: 1 }),
        // 金属滑盖
        h('rect', { x: 9, y: 2, width: 14, height: 9, fill: '#fff', stroke: '#000', strokeWidth: 1 }),
        h('rect', { x: 18, y: 3, width: 4, height: 7, fill: '#000' }),
        // 标签纸
        h('rect', { x: 4, y: 16, width: 24, height: 14, fill: '#fff', stroke: '#000', strokeWidth: 1 }),
        // 标签上的抖动横线
        h('g', { fill: '#000' }, [
          h('rect', { key: 'l1', x: 6, y: 19, width: 20, height: 1 }),
          h('rect', { key: 'l2', x: 6, y: 22, width: 14, height: 1 }),
          h('rect', { key: 'l3', x: 6, y: 25, width: 18, height: 1 }),
        ]),
        // 写保护缺口
        h('rect', { x: 25, y: 2, width: 3, height: 2, fill: '#000' }),
      );
    }

    function monoBootAllowed() {
      try {
        if (typeof window === 'undefined') return false;
        const value = new URLSearchParams(window.location.search).get('boot');
        if (value === '0') return false;
        if (value === '1') return true;
        return window.sessionStorage.getItem(MONO_BOOT_KEY) !== '1';
      } catch (error) {
        return true;
      }
    }

    function MonoBoot() {
      const [visible, setVisible] = React.useState(monoBootAllowed);
      const [step, setStep] = React.useState(0);
      const [leaving, setLeaving] = React.useState(false);

      React.useEffect(function () {
        if (!visible) return undefined;
        try {
          window.sessionStorage.setItem(MONO_BOOT_KEY, '1');
        } catch (error) {
          /* 无存储时会重播，无伤大雅 */
        }

        const reduced =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const timers = [];
        const at = function (delay, fn) {
          timers.push(window.setTimeout(fn, reduced ? Math.min(delay, 120) : delay));
        };

        // 自检逐行打出来：MEMORY OK / 640K / READY
        at(180, function () {
          setStep(1);
        });
        at(520, function () {
          setStep(2);
        });
        at(860, function () {
          setStep(3);
        });
        // 窗口从中心展开
        at(1080, function () {
          setStep(4);
        });
        at(1780, function () {
          setLeaving(true);
        });
        at(2060, function () {
          setVisible(false);
        });

        const dismiss = function (event) {
          if (event && typeof event.preventDefault === 'function') event.preventDefault();
          setLeaving(true);
          window.setTimeout(function () {
            setVisible(false);
          }, 200);
        };
        window.addEventListener('keydown', dismiss, { once: true, capture: true });
        window.addEventListener('pointerdown', dismiss, { once: true, capture: true });

        return function () {
          timers.forEach(function (id) {
            window.clearTimeout(id);
          });
          window.removeEventListener('keydown', dismiss, true);
          window.removeEventListener('pointerdown', dismiss, true);
        };
      }, [visible]);

      if (!visible) return null;

      return h(
        'div',
        {
          className: 'onebit-boot' + (leaving ? ' onebit-boot--leaving' : '') + ' onebit-boot--step' + step,
          role: 'presentation',
          'aria-hidden': 'true',
        },
        h('span', { className: 'onebit-boot__halftone' }),
        // 从中心展开的那扇窗
        h(
          'span',
          { className: 'onebit-boot__window' },
          h('span', { className: 'onebit-boot__bar' }),
          h('span', { className: 'onebit-boot__windowbody' }),
        ),
        h(
          'div',
          { className: 'onebit-boot__content' },
          monoFloppy(),
          h(
            'div',
            { className: 'onebit-boot__selftest' },
            h('span', { className: 'onebit-boot__line onebit-boot__line--1' }, 'MEMORY OK'),
            h('span', { className: 'onebit-boot__line onebit-boot__line--2' }, '640K'),
            h('span', { className: 'onebit-boot__line onebit-boot__line--3' }, 'READY'),
          ),
          h('span', { className: 'onebit-boot__prompt' }, '›'),
        ),
      );
    }
