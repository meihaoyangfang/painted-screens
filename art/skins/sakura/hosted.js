/**
 * 樱花树下 · UNDER THE SAKURA
 *
 * 场景直接搬自设计稿 sakura-5cm.html（Three.js 实时渲染），只做了三件事：
 *   1. 拿掉原稿的铁轨 / 枕木 / 电车 / 电线杆——那是「五厘米」的故事道具，这里不要；
 *   2. 拿掉标题、日文题记、英文副题和右上角提示，皮肤只留画面；
 *   3. 相机压低、抬高视线，把地平线压到 55%，让上半屏是树、下半屏是安静的暗地。
 * 天色、远山、两排樱树、落樱、草与地面花瓣都是原稿的程序化生成，没有贴图。
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-theme-sakura',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    // 构建时由 tools/build.mjs 把 vendor/three.min.js 灌进这个占位符，
    // 皮肤包因此不依赖任何 CDN。
    const THREE_SRC = /*__THREE_SRC__*/ null;

    let threeCache = null;
    function getThree() {
      if (threeCache) return threeCache;
      if (!THREE_SRC) throw new Error('[sakura] three.js 未注入');
      const mod = { exports: {} };
      // three 的 UMD 头会认 module/exports，直接落成 CommonJS 命名空间
      new Function('module', 'exports', THREE_SRC)(mod, mod.exports);
      threeCache = mod.exports && mod.exports.WebGLRenderer ? mod.exports : window.THREE;
      return threeCache;
    }

    // ---------------------------------------------------------------- 色板
    // 强调色只有一个：深樱粉。选中、按钮、开关、链接都往它身上收。
    const PINK = '#FF1F7A';
    const PINK_SOFT = 'rgba(255, 31, 122, 0.18)';
    const PINK_LINE = 'rgba(255, 31, 122, 0.55)';

    const TOKENS = {
      '--dsw-alias-bg-base': 'rgba(12, 8, 15, 0.18)',
      '--dsw-alias-bg-layer-1': 'rgba(21, 14, 23, 0.52)',
      '--dsw-alias-bg-layer-2': 'rgba(27, 18, 29, 0.66)',
      '--dsw-alias-bg-layer-3': 'rgba(33, 23, 35, 0.78)',
      '--dsw-alias-bg-overlay': 'rgba(16, 10, 18, 0.94)',
      '--dsw-alias-bg-module-platform': 'rgba(20, 13, 22, 0.62)',
      '--dsw-alias-bg-skeleton': 'rgba(38, 26, 38, 0.7)',
      '--dsw-alias-bg-accent': PINK_SOFT,
      '--dsw-alias-bg-multi-select': 'rgba(255, 31, 122, 0.20)',
      '--dsw-alias-bg-document-selection': 'rgba(255, 31, 122, 0.38)',
      '--dsw-alias-label-primary': '#F8EFF3',
      '--dsw-alias-label-secondary': '#D5C2CE',
      '--dsw-alias-label-tertiary': '#A58F9D',
      '--dsw-alias-label-quaternary': '#7E6C79',
      '--dsw-alias-label-inverse': '#160E17',
      '--dsw-alias-border-l1': 'rgba(255, 214, 230, 0.10)',
      '--dsw-alias-border-l2': 'rgba(255, 214, 230, 0.18)',
      '--dsw-alias-border-l3': 'rgba(255, 214, 230, 0.28)',
      '--dsw-alias-brand-primary': PINK,
      '--dsw-alias-brand-secondary': '#FF6FA6',
      '--dsw-alias-brand-tertiary': '#8A1F49',
      '--dsw-alias-brand-text': '#FFF2F8',
      '--dsw-alias-link': '#FF7FB2',
      '--dsw-alias-interactive-bg-hover': 'rgba(255, 31, 122, 0.10)',
      '--dsw-alias-interactive-bg-active': 'rgba(255, 31, 122, 0.20)',
      '--dsw-alias-interactive-bg-hover-accent': 'rgba(255, 31, 122, 0.16)',
      '--dsw-alias-button-elevated-fill': PINK,
      '--dsw-alias-button-primary-fill': PINK,
      '--dsw-alias-button-primary-hover': '#FF4A96',
      '--dsw-alias-button-primary-dimmed': 'rgba(255, 31, 122, 0.38)',
      '--dsw-alias-button-ghost-active-fill': PINK_SOFT,
      '--dsw-alias-button-ghost-active-border': PINK_LINE,
      '--dsw-alias-button-ghost-active-hover': 'rgba(255, 31, 122, 0.26)',
      '--dsw-alias-switch-thumb': PINK,
      '--dsw-focus-ring-color': PINK,
      '--dsw-specific-sidebar-fill': 'rgba(12, 8, 15, 0.44)',
      '--dsw-specific-sidebar-nav-item-active': 'rgba(255, 31, 122, 0.22)',
      '--dsw-specific-sidebar-nav-item-active-accent': PINK,
      '--dsw-specific-sidebar-nav-item-hover': 'rgba(255, 31, 122, 0.10)',
    };

    const PAIRS = Object.fromEntries(
      Object.entries(TOKENS).map(([key, value]) => [key, { light: value, dark: value }]),
    );

    const CSS = `
html { background: #0B0710 !important; color-scheme: dark !important; }
html body, html[data-platform='darwin'] body {
  background: transparent !important;
  color-scheme: dark;
}

/* 场景层：画布在最下面，压暗在它上面，两者都在应用表面之下 */
.sk-scene {
  position: fixed; inset: 0; z-index: -2;
  pointer-events: none !important;
  background: radial-gradient(ellipse 70% 48% at 50% 4%, #2A1826 0%, #140D16 46%, #0B0710 100%);
}
.sk-scene canvas { display: block; width: 100%; height: 100%; }

.sk-scrim {
  position: fixed; inset: 0; z-index: -1;
  pointer-events: none !important;
  /* 从左到右：正文列压在深色上，右缘留一截让树和天光透出来 */
  background:
    linear-gradient(100deg,
      rgba(9, 6, 13, 0.58) 0%,
      rgba(9, 6, 13, 0.78) 12%,
      rgba(9, 6, 13, 0.90) 26%,
      rgba(9, 6, 13, 0.92) 44%,
      rgba(9, 6, 13, 0.84) 58%,
      rgba(9, 6, 13, 0.60) 70%,
      rgba(9, 6, 13, 0.30) 82%,
      rgba(9, 6, 13, 0.08) 92%,
      rgba(9, 6, 13, 0) 100%),
    linear-gradient(180deg, rgba(9, 6, 13, 0.46) 0%, rgba(9, 6, 13, 0.04) 14%, rgba(9, 6, 13, 0) 46%, rgba(9, 6, 13, 0.26) 80%, rgba(9, 6, 13, 0.62) 100%);
}

/* 侧栏 / hero */
.sk-brand { display: inline-flex; align-items: center; gap: 8px; }
.sk-brand__name { font: 600 12px/1 "Songti SC", "Source Han Serif SC", serif; letter-spacing: 0.24em; color: #F8EFF3; }
.sk-brand__sub { font: 500 8px/1 "IBM Plex Mono", monospace; letter-spacing: 0.3em; color: rgba(255, 185, 207, 0.62); }

.sk-hero { display: inline-flex; align-items: center; gap: 14px; }
.sk-hero__cn { font: 600 22px/1 "Songti SC", "Source Han Serif SC", serif; letter-spacing: 0.18em; color: #FBEEF3; }
.sk-hero__en { font: 500 8.5px/1 "IBM Plex Mono", monospace; letter-spacing: 0.42em; color: rgba(255, 185, 207, 0.6); }

.sk-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 9px; border-radius: 999px;
  border: 1px solid rgba(255, 160, 190, 0.32);
  background: rgba(24, 14, 24, 0.6);
  font: 500 9.5px/1 "IBM Plex Mono", monospace; letter-spacing: 0.12em;
  color: #FFC2D6;
}

/* 正文压在她身上时给一点投影，别糊成一片 */
[class*="messageBubble"], [class*="markdownBody"] {
  text-shadow: 0 1px 3px rgba(6, 4, 9, 0.55);
}

@media (prefers-reduced-motion: reduce) {
  .sk-scene { display: none; }
}
`;

    // 一整朵樱花：五瓣绕花心。角度、大小、瓣形都带一点手绘偏差，
    // 用完完全全对齐的五瓣会像图钉；颜色走浅粉，压在深底上不刺眼。
    const PETALS = [
      ['M12 11.1C9.1 9.6 7.5 7.2 8.0 5.0C8.4 3.4 9.7 2.5 11.0 2.6C11.45 3.3 11.75 3.85 12 4.05C12.25 3.85 12.55 3.3 13.0 2.6C14.3 2.5 15.6 3.4 16.0 5.0C16.5 7.2 14.9 9.6 12 11.1Z', 140.8, 0.977],
      ['M12 11.2C9.4 9.8 7.9 7.3 8.3 5.1C8.7 3.5 9.9 2.6 11.1 2.7C11.5 3.4 11.8 3.95 12 4.15C12.2 3.95 12.5 3.4 12.9 2.7C14.1 2.6 15.3 3.5 15.7 5.1C16.1 7.3 14.6 9.8 12 11.2Z', 1.3, 1.019],
      ['M12 11.1C9.1 9.6 7.5 7.2 8.0 5.0C8.4 3.4 9.7 2.5 11.0 2.6C11.45 3.3 11.75 3.85 12 4.05C12.25 3.85 12.55 3.3 13.0 2.6C14.3 2.5 15.6 3.4 16.0 5.0C16.5 7.2 14.9 9.6 12 11.1Z', 67.9, 0.946],
      ['M12 11.2C9.4 9.8 7.9 7.3 8.3 5.1C8.7 3.5 9.9 2.6 11.1 2.7C11.5 3.4 11.8 3.95 12 4.15C12.2 3.95 12.5 3.4 12.9 2.7C14.1 2.6 15.3 3.5 15.7 5.1C16.1 7.3 14.6 9.8 12 11.2Z', 283.9, 1.021],
      ['M12 11.1C9.1 9.6 7.5 7.2 8.0 5.0C8.4 3.4 9.7 2.5 11.0 2.6C11.45 3.3 11.75 3.85 12 4.05C12.25 3.85 12.55 3.3 13.0 2.6C14.3 2.5 15.6 3.4 16.0 5.0C16.5 7.2 14.9 9.6 12 11.1Z', 217.9, 0.906],
    ];
    let petalSeq = 0;
    const Svg = (props) => {
      petalSeq += 1;
      const gid = 'sk-blossom-' + petalSeq;
      return h('svg', Object.assign({ viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': 'true' }, props),
        h('defs', null,
          h('radialGradient', { id: gid, cx: '12', cy: '12', r: '9.8', gradientUnits: 'userSpaceOnUse' },
            h('stop', { offset: '0.14', stopColor: '#FFAACB' }),
            h('stop', { offset: '0.58', stopColor: '#FFCBE1' }),
            h('stop', { offset: '1', stopColor: '#FFECF4' }))),
        PETALS.map(([d, angle, scale], i) => h('path', {
          key: i,
          d,
          fill: 'url(#' + gid + ')',
          transform: 'rotate(' + angle + ' 12 12) translate(12 12) scale(' + scale + ') translate(-12 -12)',
        })),
        h('circle', { cx: 12, cy: 12, r: 1.8, fill: '#FFF7E8' }),
        h('circle', { cx: 12, cy: 12, r: 0.8, fill: '#FFD98A', opacity: 0.85 }));
    };

    // ---------------------------------------------------------------- 实时场景
    function mountScene(host, THREE) {

/* ================= 基础环境 ================= */
const canvas = document.createElement('canvas');
canvas.className = 'ms-canvas';
host.appendChild(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const FOG_COLOR = new THREE.Color('#4a3340');
const FOG_DENSITY = 0.0080;
scene.fog = new THREE.FogExp2(FOG_COLOR.clone(), FOG_DENSITY);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 2000);
// 机位：压低视线、往左看一点，让消失点和落日落在画面偏右，
// 左半边留给侧栏和正文列
const CAM_Y = 3.0;
const LOOK_Y = 5.2;
const LOOK_X = 0;
camera.position.set(0, CAM_Y, 8.0);

const clock = new THREE.Clock();
let time = 0;

/* ================= 光照 ================= */
const hemi = new THREE.HemisphereLight(0xb59cb8, 0x1e1620, 0.78);
scene.add(hemi);

const sunLight = new THREE.DirectionalLight(0xffb081, 1.55);
sunLight.position.set(-38, 16, -95);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x7b86d6, 0.42);
fillLight.position.set(26, 22, 40);
scene.add(fillLight);

/* ================= 程序化贴图 ================= */
function makeTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/* 单片花瓣：带顶端缺口的心形轮廓 + 羽化边缘 */
const petalTexture = makeTexture(128, 128, (ctx, w, h) => {
  const s = w * 0.47;
  ctx.translate(w / 2, h / 2);
  ctx.filter = 'blur(1.4px)';
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.95);
  ctx.bezierCurveTo(s * 0.96, -s * 0.72, s * 0.78, s * 0.58, 0, s * 0.98);
  ctx.bezierCurveTo(-s * 0.78, s * 0.58, -s * 0.96, -s * 0.72, 0, -s * 0.95);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // 顶端缺口
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, -s * 0.99, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  // 边缘柔化
  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createRadialGradient(0, 0, s * 0.25, 0, 0, s * 1.3);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.72, 'rgba(255,255,255,0.94)');
  g.addColorStop(1, 'rgba(255,255,255,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(-w / 2, -h / 2, w, h);
});

/* 一朵花团：五瓣柔光 + 中心高光 */
const blossomTexture = makeTexture(128, 128, (ctx, w, h) => {
  const s = w * 0.5;
  ctx.translate(w / 2, h / 2);
  ctx.filter = 'blur(2.2px)';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * s * 0.33;
    const y = Math.sin(a) * s * 0.33;
    const g = ctx.createRadialGradient(x, y, 0, x, y, s * 0.64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,240,246,0.62)');
    g.addColorStop(1, 'rgba(255,205,226,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, s * 0.64, 0, Math.PI * 2); ctx.fill();
  }
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.46);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(1, 'rgba(255,222,236,0)');
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.46, 0, Math.PI * 2); ctx.fill();
});

/* 纯柔光点，用于花簇与草丛，避免出现圆形硬边 */
const softTexture = makeTexture(128, 128, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.32, 'rgba(255,255,255,0.60)');
  g.addColorStop(0.66, 'rgba(255,255,255,0.14)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});

/* 道砟碎石 */
const gravelTexture = makeTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#211c26';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 520; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = Math.random() * 2.4 + 0.4;
    const v = 26 + Math.random() * 48;
    ctx.fillStyle = `rgba(${(v + 16) | 0},${(v + 8) | 0},${(v + 20) | 0},${0.35 + Math.random() * 0.5})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
});
gravelTexture.wrapS = gravelTexture.wrapT = THREE.RepeatWrapping;
gravelTexture.repeat.set(3, 70);

/* 光晕 */
const glowTexture = makeTexture(256, 256, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,236,208,0.95)');
  g.addColorStop(0.22, 'rgba(255,190,150,0.55)');
  g.addColorStop(0.55, 'rgba(255,150,130,0.16)');
  g.addColorStop(1, 'rgba(255,140,130,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});

/* ================= 天空 ================= */
const skyUniforms = {
  uTop:      { value: new THREE.Color('#0d1027') },
  uMid:      { value: new THREE.Color('#6a4362') },
  uHorizon:  { value: new THREE.Color('#ffbe9c') },
  uSun:      { value: new THREE.Color('#ffe7cd') },
  uSunDir:   { value: new THREE.Vector3(-0.07, 0.035, -1).normalize() },
  uFog:      { value: new THREE.Color('#4a3340') }
};

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(520, 40, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: skyUniforms,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTop, uMid, uHorizon, uSun, uSunDir, uFog;
      varying vec3 vDir;

      float hash21(vec2 p){
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise2(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      float fbm2(vec2 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++){
          v += a * noise2(p);
          p *= 2.03;
          a *= 0.5;
        }
        return v;
      }

      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(-0.015, 0.30, h));
        col = mix(col, uTop, smoothstep(0.20, 0.82, h));
        // 地平线辉光，再向下沉入雾色，避免与地面的硬边
        float glow = 1.0 - smoothstep(0.0, 0.055, abs(h));
        col = mix(col, uHorizon, glow * 0.6);
        col = mix(uFog, col, smoothstep(-0.10, -0.008, h));

        float sd = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSun * pow(sd, 11.0) * 0.30;
        col += uSun * pow(sd, 70.0) * 0.75;

        // 卷云：柱面投影 + 各向异性 fbm，横向拉长
        float ang = atan(d.z, d.x + 1e-5);
        vec2 cuv = vec2(ang * 0.55, h * 1.9);
        float cl = fbm2(cuv + vec2(2.7, 0.0));
        cl = smoothstep(0.42, 0.80, cl);
        cl *= smoothstep(0.05, 0.32, h) * (1.0 - smoothstep(0.58, 0.95, h));

        float warm = pow(sd, 2.2);
        vec3 cloudCol = mix(vec3(0.34, 0.19, 0.28), uSun * 0.95, warm);
        col = mix(col, cloudCol, cl * 0.34);

        // 地平线薄雾
        col = mix(col, vec3(1.0, 0.80, 0.72), (1.0 - smoothstep(0.0, 0.08, abs(h))) * 0.10);
        gl_FragColor = vec4(col, 1.0);
      }`
  })
);
sky.renderOrder = -10;
sky.frustumCulled = false;
scene.add(sky);

/* 落日光晕 */
const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTexture, transparent: true, depthWrite: false, depthTest: false,
  blending: THREE.AdditiveBlending, opacity: 0.34, fog: false
}));
sunSprite.position.set(-24, 12, -300);
sunSprite.scale.set(140, 140, 1);
scene.add(sunSprite);

/* ================= 远山剪影 ================= */
function makeRidge(z, height, color, seed) {
  const W = 1100, SEG = 72;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, -30);
  for (let i = 0; i <= SEG; i++) {
    const x = -W / 2 + (W * i) / SEG;
    const n = Math.sin(i * 0.37 + seed) * 0.5 + Math.sin(i * 0.13 + seed * 2.1) * 0.35 + Math.sin(i * 0.91 + seed * 0.6) * 0.15;
    const y = Math.max(2, height * (0.42 + n * 0.58));
    shape.lineTo(x, y);
  }
  shape.lineTo(W / 2, -30);
  shape.closePath();
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color, fog: true })
  );
  mesh.position.set(0, 0, z);
  return mesh;
}
scene.add(makeRidge(-230, 34, '#5c3f5c', 1.3));

/* ================= 地面 ================= */
const groundTexture = makeTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#332b31';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const v = 26 + Math.random() * 38;
    ctx.fillStyle = `rgba(${(v + 14) | 0},${(v + 5) | 0},${(v + 13) | 0},0.55)`;
    ctx.fillRect(x, y, 1.4, Math.random() * 3 + 1);
  }
});
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(46, 46);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900),
  new THREE.MeshBasicMaterial({ map: groundTexture, color: 0x9b8a92, fog: true })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
scene.add(ground);



/* ================= 樱花树 ================= */
const branchMatrices = [];
const blossomPos = [];
const blossomCol = [];

const crownMaterial = new THREE.SpriteMaterial({
  map: softTexture, transparent: true, depthWrite: false,
  blending: THREE.NormalBlending, opacity: 0.07, color: 0xffc9dd
});

// 花簇柔光：以大尺寸点云补足树冠体积，单 draw call
const clusterPos = [];
const clusterCol = [];

function addCluster(pos) {
  clusterPos.push(
    pos.x + (Math.random() - 0.5) * 0.55,
    pos.y + (Math.random() - 0.5) * 0.45,
    pos.z + (Math.random() - 0.5) * 0.55
  );
  _c.setHSL(0.94 + Math.random() * 0.04, 0.28 + Math.random() * 0.3, 0.78 + Math.random() * 0.16);
  clusterCol.push(_c.r, _c.g, _c.b);
}

const _up = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

function addSegment(a, b, radius) {
  _v.subVectors(b, a);
  const len = _v.length();
  if (len < 1e-5) return;
  _v.normalize();
  _q.setFromUnitVectors(_up, _v);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  _s.set(radius, len, radius);
  _m.compose(mid, _q, _s);
  branchMatrices.push(_m.clone());
}

function addBlossoms(center, radius, count) {
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * Math.cbrt(Math.random());
    blossomPos.push(
      center.x + Math.sin(phi) * Math.cos(theta) * r,
      center.y + Math.cos(phi) * r * 0.82,
      center.z + Math.sin(phi) * Math.sin(theta) * r
    );
    if (Math.random() < 0.13) _c.setHSL(0.945 + Math.random() * 0.03, 0.62, 0.5 + Math.random() * 0.1);
    else _c.setHSL(0.938 + Math.random() * 0.05, 0.38 + Math.random() * 0.36, 0.55 + Math.random() * 0.37);
    blossomCol.push(_c.r, _c.g, _c.b);
  }
}

function grow(start, dir, len, rad, depth) {
  const end = start.clone().addScaledVector(dir, len);
  const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(
    (Math.random() - 0.5) * len * 0.26,
    (Math.random() - 0.32) * len * 0.2,
    (Math.random() - 0.5) * len * 0.26
  ));
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

  let prev = start.clone();
  const STEPS = 4;
  for (let i = 1; i <= STEPS; i++) {
    const p = curve.getPoint(i / STEPS);
    addSegment(prev, p, rad * (1 - (i / STEPS) * 0.28));
    prev = p.clone();
  }

  // 花朵沿枝条分布，越靠枝梢越密 —— 让整棵树被花包裹成云
  const perNode = depth === 0 ? 28 : depth === 1 ? 16 : 9;
  for (let i = 0; i < perNode; i++) {
    const t = 0.26 + Math.random() * 0.74;
    addBlossoms(curve.getPoint(t), 0.34 + len * 0.1, 1);
  }

  if (depth <= 0) {
    addBlossoms(end, 0.78 + len * 0.35, 40);
    addBlossoms(end, 0.32, 14);
    addCluster(end);
    addCluster(end);
    return;
  }

  const n = Math.random() < 0.34 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const t = 0.52 + Math.random() * 0.46;
    const base = curve.getPoint(Math.min(t, 1));
    const axis = new THREE.Vector3(
      Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5
    ).normalize();
    const nd = dir.clone().applyAxisAngle(axis, 0.46 + Math.random() * 0.55);
    nd.y = Math.max(nd.y, -0.18);
    nd.normalize();
    grow(base, nd, len * (0.6 + Math.random() * 0.2), rad * 0.7, depth - 1);
  }
}

function buildTree(x, z, opts) {
  const { height = 5.4, lean = 0.3, scale = 1, branches = 4 } = opts;
  const base = new THREE.Vector3(x, 0, z);
  const top = new THREE.Vector3(x + lean * 1.35, height * 0.56, z + (Math.random() - 0.5) * 0.4);

  const trunkCurve = new THREE.QuadraticBezierCurve3(
    base,
    new THREE.Vector3(x + lean * 0.4, height * 0.3, z),
    top
  );
  let prev = base.clone();
  for (let i = 1; i <= 6; i++) {
    const p = trunkCurve.getPoint(i / 6);
    const r = 0.17 * scale * (1 - (i / 6) * 0.4);
    addSegment(prev, p, r);
    prev = p.clone();
  }

  for (let i = 0; i < branches; i++) {
    const a = (i / branches) * Math.PI * 2 + Math.random() * 0.7;
    const startT = Math.min(0.5 + (i / branches) * 0.5, 1);
    const start = trunkCurve.getPoint(startT);
    const dir = new THREE.Vector3(
      Math.cos(a) * 0.85 + lean * 0.55,
      0.42 + Math.random() * 0.32,
      Math.sin(a) * 0.85
    ).normalize();
    grow(start, dir, (1.85 + Math.random() * 0.7) * scale, 0.078 * scale, 3);
  }

  // 树冠柔光，让整棵树像一团发亮的云
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(crownMaterial);
    s.position.set(
      top.x + (Math.random() - 0.5) * 2.4 * scale,
      top.y + 0.7 * scale + Math.random() * 1.1 * scale,
      top.z + (Math.random() - 0.5) * 2.4 * scale
    );
    const sc = (2.4 + Math.random() * 1.8) * scale;
    s.scale.set(sc, sc, 1);
    scene.add(s);
  }
}

// 左岸
buildTree(-5.2, -2,  { height: 5.6, lean: 0.36, scale: 1.05, branches: 4 });
buildTree(-6.0, -13, { height: 5.1, lean: 0.34, scale: 0.95, branches: 4 });
buildTree(-5.0, -25, { height: 6.0, lean: 0.38, scale: 1.0,  branches: 3 });
buildTree(-6.4, -40, { height: 5.2, lean: 0.3,  scale: 0.9,  branches: 3 });
// 右岸
buildTree(5.4, -7,   { height: 5.9, lean: -0.36, scale: 1.06, branches: 4 });
buildTree(8.4, -4,   { height: 5.2, lean: -0.34, scale: 0.98, branches: 4 });
buildTree(6.2, -19,  { height: 5.0, lean: -0.32, scale: 0.94, branches: 4 });
buildTree(5.1, -33,  { height: 5.7, lean: -0.38, scale: 1.0,  branches: 3 });
buildTree(6.6, -48,  { height: 5.3, lean: -0.3,  scale: 0.88, branches: 3 });
// 前景垂枝
buildTree(7.2, 7.6,  { height: 4.6, lean: -0.5, scale: 1.0, branches: 4 });
buildTree(-7.4, 5.4, { height: 4.2, lean: 0.5,  scale: 0.92, branches: 3 });

// 树枝实例网格
{
  const geo = new THREE.CylinderGeometry(0.82, 1, 1, 8, 1, true);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x33242a, roughness: 0.95, metalness: 0.03
  });
  const inst = new THREE.InstancedMesh(geo, mat, branchMatrices.length);
  branchMatrices.forEach((m, i) => inst.setMatrixAt(i, m));
  inst.instanceMatrix.needsUpdate = true;
  inst.frustumCulled = false;
  scene.add(inst);
}

// 花团 —— 两层：实层 + 柔光层
{
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(blossomPos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(blossomCol, 3));

  const solid = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.16, map: blossomTexture, vertexColors: true,
    transparent: true, depthWrite: false, opacity: 0.85,
    sizeAttenuation: true, alphaTest: 0.008
  }));
  solid.frustumCulled = false;
  scene.add(solid);

}

// 树冠柔光层：让整团花连成一片云
{
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(clusterPos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(clusterCol, 3));
  const cloud = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 1.6, map: softTexture, vertexColors: true,
    transparent: true, depthWrite: false, opacity: 0.58,
    sizeAttenuation: true, alphaTest: 0.004
  }));
  cloud.frustumCulled = false;
  scene.add(cloud);
}

/* ================= 落樱（GPU 实例化） ================= */
const petalUniforms = {
  uTime:     { value: 0 },
  uMap:      { value: petalTexture },
  uFogColor: { value: FOG_COLOR.clone() },
  uFogDensity: { value: FOG_DENSITY },
  uFallHeight: { value: 15.0 }
};

const petalMaterial = new THREE.ShaderMaterial({
  uniforms: petalUniforms,
  transparent: true,
  depthWrite: false,
  vertexShader: /* glsl */`
    uniform float uTime;
    uniform float uFallHeight;
    attribute vec3 aOffset;
    attribute float aPhase;
    attribute float aSpeed;
    attribute float aScale;
    attribute vec3 aColor;

    varying vec2 vUv;
    varying vec3 vColor;
    varying float vDepth;
    varying float vFade;

    void main(){
      vUv = uv;
      vColor = aColor;

      float ph = aPhase * 6.2831853;
      float t = uTime * aSpeed + ph;

      // 循环下落
      float y = fract((aOffset.y - uTime * aSpeed * 1.25) / uFallHeight) * uFallHeight;

      vec3 c = vec3(aOffset.x, y, aOffset.z);
      // 风：低频摆动 + 高频抖动
      c.x += sin(t * 0.85) * 0.85 + sin(t * 2.4 + 1.7) * 0.22;
      c.z += cos(t * 0.62 + 0.7) * 0.7;
      c.y += sin(t * 1.9) * 0.06;

      // 自身旋转 + 翻面
      float ang = t * 1.55;
      vec2 p = position.xy * aScale;
      float cs = cos(ang), sn = sin(ang);
      p = vec2(p.x * cs - p.y * sn, p.x * sn + p.y * cs);
      p.y *= 0.34 + 0.66 * abs(cos(t * 1.15));
      p.x *= 0.78 + 0.22 * abs(sin(t * 0.9));

      vec4 mv = modelViewMatrix * vec4(c + vec3(p, 0.0), 1.0);
      vDepth = -mv.z;

      vFade = smoothstep(0.0, 1.4, y) * (1.0 - smoothstep(uFallHeight - 2.6, uFallHeight, y));

      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D uMap;
    uniform vec3 uFogColor;
    uniform float uFogDensity;

    varying vec2 vUv;
    varying vec3 vColor;
    varying float vDepth;
    varying float vFade;

    void main(){
      vec4 tex = texture2D(uMap, vUv);
      if (tex.a < 0.015) discard;

      vec3 col = vColor * tex.rgb;
      float f = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
      col = mix(col, uFogColor, clamp(f, 0.0, 0.82));

      gl_FragColor = vec4(col, tex.a * 0.94 * vFade);
    }`
});

function createPetals(count) {
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute('position', base.attributes.position);
  geo.setAttribute('uv', base.attributes.uv);

  const offsets = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const scales = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    offsets[i * 3]     = (Math.random() - 0.5) * 30;
    offsets[i * 3 + 1] = Math.random() * 15;
    offsets[i * 3 + 2] = 12 - Math.random() * 76;

    phases[i] = Math.random();
    speeds[i] = 0.5 + Math.random() * 1.0;
    scales[i] = 0.055 + Math.random() * 0.09;

    _c.setHSL(0.938 + Math.random() * 0.05, 0.45 + Math.random() * 0.4, 0.68 + Math.random() * 0.2);
    colors[i * 3]     = _c.r;
    colors[i * 3 + 1] = _c.g;
    colors[i * 3 + 2] = _c.b;
  }

  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
  geo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
  geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
  geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));
  geo.instanceCount = count;

  const mesh = new THREE.Mesh(geo, petalMaterial);
  mesh.frustumCulled = false;
  return mesh;
}
scene.add(createPetals(1500));

/* 路两侧的草 */
{
  const pos = [], col = [];
  for (let i = 0; i < 5200; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (0.45 + Math.pow(Math.random(), 0.65) * 9);
    const z = 14 - Math.random() * 74;
    pos.push(x, Math.random() * 0.5, z);
    _c.setHSL(0.10 + Math.random() * 0.07, 0.2 + Math.random() * 0.18, 0.13 + Math.random() * 0.15);
    col.push(_c.r, _c.g, _c.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const mesh = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.085, map: softTexture, vertexColors: true,
    transparent: true, depthWrite: false, opacity: 0.85,
    sizeAttenuation: true, alphaTest: 0.02
  }));
  mesh.frustumCulled = false;
  scene.add(mesh);
}

/* 地面落瓣 */
{
  const pos = [], col = [];
  for (let i = 0; i < 1400; i++) {
    const x = (Math.random() - 0.5) * 24;
    const z = 13 - Math.random() * 62;
    // 让花瓣更集中在树下
    const px = x * (0.5 + Math.random() * 0.5);
    pos.push(px, 0.02 + Math.random() * 0.03, z);
    _c.setHSL(0.945, 0.24 + Math.random() * 0.24, 0.3 + Math.random() * 0.14);
    col.push(_c.r, _c.g, _c.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const mesh = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.07, map: petalTexture, vertexColors: true,
    transparent: true, depthWrite: false, opacity: 0.85,
    sizeAttenuation: true, alphaTest: 0.02
  }));
  mesh.frustumCulled = false;
  scene.add(mesh);
}

/* ================= 交互 & 循环 ================= */
const pointer = { x: 0, y: 0 };
let smoothX = 0, smoothY = 0;

function onPointerMove(e) {
  pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
}
window.addEventListener('pointermove', onPointerMove, { passive: true });

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
}
window.addEventListener('resize', onResize);

let frames = 0, frameAcc = 0, downscaled = false;
let raf = 0;
let paused = false;

function animate() {
  raf = requestAnimationFrame(animate);
  // 弹层打开时冻结画面：画屏面板是一整块 backdrop-filter，
  // 底下这层 WebGL 还每帧重画的话，模糊要跟着每帧重算，滚起来就闪。
  if (paused) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;

  // 首帧后若帧率偏低，自动降低像素比，保证动画顺滑
  if (!downscaled) {
    frames++; frameAcc += dt;
    if (frameAcc > 3) {
      if (frames / frameAcc < 36 && renderer.getPixelRatio() > 1) {
        renderer.setPixelRatio(1);
        downscaled = true;
      }
      frames = 0; frameAcc = 0;
    }
  }

  petalUniforms.uTime.value = time;

  // 相机：极缓的呼吸位移 + 光标视差
  smoothX += (pointer.x - smoothX) * Math.min(1, dt * 2.2);
  smoothY += (pointer.y - smoothY) * Math.min(1, dt * 2.2);

  camera.position.x = Math.sin(time * 0.11) * 0.22 + smoothX * 0.55;
  camera.position.y = CAM_Y + Math.sin(time * 0.42) * 0.032 - smoothY * 0.16;
  camera.position.z = 8.0 + Math.sin(time * 0.075) * 0.55;
  camera.lookAt(
    LOOK_X + smoothX * 0.85,
    LOOK_Y - smoothY * 0.45 + Math.sin(time * 0.3) * 0.05,
    -40
  );

  renderer.render(scene, camera);
}

renderer.render(scene, camera);
animate();

const teardown = function dispose() {
  cancelAnimationFrame(raf);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('pointermove', onPointerMove);
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const m of mats) {
      for (const k of ['map', 'alphaMap']) if (m[k] && m[k].dispose) m[k].dispose();
      m.dispose();
    }
  });
  renderer.dispose();
  canvas.remove();
};

// 供宿主在弹层开合时调用
teardown.pause = (value) => {
  const next = !!value;
  if (next === paused) return;
  paused = next;
  if (!paused) clock.getDelta(); // 丢掉暂停期间累积的时间
  if (host && host.dataset) host.dataset.hpPaused = paused ? '1' : '0';
};

return teardown;
    }

    return {
      inject: ['theme', 'slots'],
      apply(ctx) {
        ctx.effect(() => ctx.theme.overrideTokens('sakura', PAIRS), 'sakura: palette');

        ctx.effect(() => {
          const tag = document.createElement('style');
          tag.dataset.sakura = '1';
          tag.textContent = CSS;
          document.head.appendChild(tag);
          return () => tag.remove();
        }, 'sakura: styles');

        ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register({ name: 'sidebar.brand.mark' }, function SkMark() {
          return h(Svg);
        }));
        ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({ name: 'sidebar.brand.name' }, function SkName() {
          return h('span', { className: 'sk-brand' },
            h('span', { className: 'sk-brand__name' }, '樱花树下'),
            h('span', { className: 'sk-brand__sub' }, 'SAKURA'));
        }));
        ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register({ name: 'conversation.hero.brand.mark' }, function SkHero() {
          return h('span', { className: 'sk-hero' },
            h(Svg, { width: 30, height: 30 }),
            h('span', { className: 'sk-hero__cn' }, '樱花树下'),
            h('span', { className: 'sk-hero__en' }, 'UNDER THE SAKURA'));
        }));
        ctx.slots.inject('conversation.input.left', () => ctx.slots.register({ name: 'conversation.input.left' }, function SkChip() {
          return h('span', { className: 'sk-chip' }, '花见 · 黄昏');
        }));

        // 实时三维场景：一张挂在最底层的 canvas
        ctx.effect(() => {
          const host = document.createElement('div');
          host.className = 'sk-scene';
          host.setAttribute('aria-hidden', 'true');
          const scrim = document.createElement('div');
          scrim.className = 'sk-scrim';
          scrim.setAttribute('aria-hidden', 'true');
          document.body.appendChild(host);
          document.body.appendChild(scrim);

          let dispose = null;
          // 尊重「减少动态效果」：不挂实时场景，留 CSS 里那层黄昏渐变
          const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!reduced) {
            try {
              dispose = mountScene(host, getThree());
            } catch (error) {
              console.warn('[sakura] scene failed', error);
            }
          }

          // 画屏面板一开就冻结场景（面板是一整块 backdrop-filter，
          // 底下还在逐帧重画的话，滚起来会闪）
          let attrObserver = null;
          if (dispose && typeof dispose.pause === 'function') {
            const sync = () => {
              try {
                dispose.pause(document.documentElement.dataset.hpGallery === '1');
              } catch (error) {
                /* ignore */
              }
            };
            sync();
            if (typeof MutationObserver === 'function') {
              attrObserver = new MutationObserver(sync);
              attrObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-hp-gallery'],
              });
            }
          }

          return () => {
            if (attrObserver) attrObserver.disconnect();
            if (dispose) { try { dispose(); } catch (error) { /* ignore */ } }
            host.remove();
            scrim.remove();
          };
        }, 'sakura: scene');
      },
    };
  },
});
