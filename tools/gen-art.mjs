#!/usr/bin/env node
/**
 * 用 Flux Art OpenAPI 生成主题素材。
 * 用法: FLUX_API_KEY=... node tools/gen-art.mjs <preset>
 * 结果落盘到 art/gen/<name>.png
 *
 * ⚠️ 生图按张计费，调用前先读 docs/IMAGE-GEN-POLICY.md。
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.FLUX_API_KEY;
if (!KEY) { console.error('missing FLUX_API_KEY'); process.exit(1); }
const BASE = 'https://open-api.flux-art.net';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PRESETS = {
  vellum: [
    {
      name: 'vellum-paper',
      model: 'gemini-2.5-flash-image',
      aspect: '1:1',
      prompt:
        'A seamless tileable texture of antique calfskin vellum parchment, top-down flat scan, ' +
        'warm ivory and pale honey tones, fine animal fibre grain, faint mottling, a few subtle age spots, ' +
        'no text, no folds, no shadows, even diffused lighting, extremely fine detail, 1:1',
    },
    {
      name: 'vellum-seal',
      model: 'gemini-2.5-flash-image',
      aspect: '1:1',
      prompt:
        'A single deep crimson wax seal stamped with an unreadable ornate monogram, photographed straight on, ' +
        'glossy wax ridges, slight sheen, isolated on a pure flat white background, soft even light, ' +
        'no shadow on the background, centered, product shot, 1:1',
    },
  ],
  sakura2: [
    {
      name: 'sakura-art2',
      model: 'gemini-2.5-flash-image',
      aspect: '16:9',
      prompt:
        'Romantic anime background art, one large old cherry tree in full bloom standing on the RIGHT third of the frame, ' +
        'thick curving trunk and heavy blossom canopy, soft petals drifting only around and under the tree, ' +
        'pale spring afternoon light, warm pink and cream palette, blurred distant hills, ' +
        'the left two thirds of the frame is calm empty sky with soft gradient for text, ' +
        'no characters, no people, no text, no logos, painted anime key visual, 16:9',
    },
  ],
  sakura: [
    {
      name: 'sakura-art',
      model: 'gemini-2.5-flash-image',
      aspect: '16:9',
      prompt:
        'A quiet residential street under blooming cherry trees at early morning, pale pink and cream light, ' +
        'petals drifting in the air, soft focus background, cinematic anime background art, ' +
        'gentle gradients, no characters, no text, no logos, 16:9',
    },
  ],
  vellum2: [
    {
      name: 'vellum-corner',
      model: 'gemini-2.5-flash-image',
      aspect: '1:1',
      prompt:
        'A single curled corner of aged parchment paper lifting up, the corner rolls toward the viewer ' +
        'showing the lighter back of the sheet, soft self shadow under the curl, ' +
        'isolated on a pure flat white background, no other objects, no text, macro paper detail, 1:1',
    },
    {
      name: 'vellum-compass',
      model: 'gemini-2.5-flash-image',
      aspect: '1:1',
      prompt:
        'An antique compass rose drawn in brown iron-gall ink on aged parchment, eight point star, ' +
        'fine hatching, hand drawn cartography, isolated on a pure flat white background, ' +
        'no text, no letters, no border, 1:1',
    },
  ],
  map: [
    {
      name: 'vellum-map',
      model: 'gemini-2.5-flash-image',
      aspect: '16:9',
      prompt:
        'An antique treasure map drawn on aged parchment, photographed flat from above, ' +
        'the parchment fills the whole frame and its four edges curl and lift slightly at the corners ' +
        'showing the paper back and soft shadows, hand-drawn ink coastlines, small islands, ' +
        'mountain ranges drawn as little peaks, tiny tree clusters, a dotted route leading to a red X, ' +
        'a large compass rose, a scale bar, a small anchor and a skull mark, ' +
        'brown iron-gall ink on warm ochre parchment, stains and foxing, no text, no letters, no words, ' +
        'even soft daylight, extremely detailed, 16:9',
    },
  ],
  boot: [
    {
      name: 'famicom-boot',
      model: 'gemini-2.5-flash-image',
      aspect: '16:9',
      prompt:
        'A dark room lit only by an old CRT television turning on, soft phosphor green-white glow, ' +
        'visible scanlines and slight bloom, blank screen with no text and no logos, shot straight on, ' +
        'cinematic, subtle film grain, deep blacks, 16:9',
    },
    {
      name: 'vellum-boot',
      model: 'gemini-2.5-flash-image',
      aspect: '16:9',
      prompt:
        'A medieval scriptorium desk at night, a single candle flame lighting a blank sheet of calfskin vellum, ' +
        'a quill and iron-gall inkpot in shadow, warm amber light falloff into darkness, ' +
        'no text, no letters, no faces, shallow depth of field, painterly photorealism, 16:9',
    },
    {
      name: 'rust-boot',
      model: 'gemini-2.5-flash-image',
      aspect: '16:9',
      prompt:
        'A dusty abandoned radio transmitter dial glowing faint amber in the dark, rusted metal casing, ' +
        'floating dust motes in the light beam, cracked glass, no readable numbers and no text, ' +
        'moody wasteland science fiction, cinematic, 16:9',
    },
  ],
  edge: [
    {
      name: 'vellum-edge',
      model: 'gemini-2.5-flash-image',
      aspect: '16:9',
      prompt:
        'A single horizontal strip of torn antique parchment, the top edge is irregularly torn and fibrous ' +
        'with visible deckle fringe, the strip fills the lower half of the frame and fades to pure flat white ' +
        'above the tear, bottom edge of the strip is straight and cut off by the frame, ' +
        'no text, no objects, flat even lighting, macro paper detail, 16:9',
    },
  ],
  famicom: [
    {
      name: 'famicom-plastic',
      model: 'gemini-2.5-flash-image',
      aspect: '1:1',
      prompt:
        'A seamless tileable texture of vintage cream ABS plastic, like a 1980s game console shell, ' +
        'top-down flat scan, warm off-white with faint yellowing, very fine mould grain, a few tiny scuffs, ' +
        'no text, no logos, no shadows, even lighting, macro detail, 1:1',
    },
  ],
  rust: [
    {
      name: 'rust-metal',
      model: 'gemini-2.5-flash-image',
      aspect: '1:1',
      prompt:
        'A seamless tileable texture of weathered rusted steel plate, top-down flat scan, ' +
        'oxidised orange and brown corrosion, vertical water streaks, fine pitting, no rivets, ' +
        'no text, no shadows, even diffused light, photographic macro detail, 1:1',
    },
    {
      name: 'rust-dust',
      model: 'gemini-2.5-flash-image',
      aspect: '1:1',
      prompt:
        'A tileable layer of fine dust and sand haze with subtle scratches, isolated on a pure flat white background, ' +
        'semi transparent dusty film, no objects, no text, even lighting, 1:1',
    },
  ],
};

const which = process.argv[2];
const jobs = PRESETS[which];
if (!jobs) { console.error('unknown preset:', which, '— have:', Object.keys(PRESETS).join(', ')); process.exit(1); }

await mkdir(path.join(root, 'art/gen'), { recursive: true });

for (const job of jobs) {
  const idem = 'huaping-' + job.name + '-' + Date.now();
  const body = {
    model: job.model,
    mode: 'generate',
    prompt: job.prompt,
    count: 1,
    aspect_ratio: job.aspect,
  };
  const created = await fetch(BASE + '/openapi/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', 'Idempotency-Key': idem },
    body: JSON.stringify(body),
  });
  const text = await created.text();
  if (!created.ok) { console.error(job.name, 'create failed', created.status, text.slice(0, 300)); continue; }
  const task = JSON.parse(text).data || JSON.parse(text);
  console.log(job.name, 'task', task.id, task.status);
  let done = null;
  for (let i = 0; i < 90; i += 1) {
    await sleep(2000);
    const res = await fetch(BASE + '/openapi/v1/tasks/' + task.id, { headers: { Authorization: 'Bearer ' + KEY } });
    const json = JSON.parse(await res.text());
    const t = json.data || json;
    if (t.status === 'succeeded') { done = t; break; }
    if (t.status === 'failed' || t.status === 'canceled') { console.error(job.name, 'failed', JSON.stringify(t).slice(0, 300)); break; }
  }
  if (!done) { console.error(job.name, 'timeout'); continue; }
  const out = done.output || {};
  const first = Array.isArray(out.images) ? out.images[0] : null;
  const url = out.url || (typeof first === 'string' ? first : first && first.url);
  if (!url || typeof url !== 'string') { console.error(job.name, 'no url', JSON.stringify(done.output).slice(0, 300)); continue; }
  const img = await fetch(url);
  const buf = Buffer.from(await img.arrayBuffer());
  await writeFile(path.join(root, 'art/gen', job.name + '.png'), buf);
  console.log(job.name, 'saved', buf.length, 'bytes');
}
