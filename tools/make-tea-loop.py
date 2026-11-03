#!/usr/bin/env python3
"""三点一刻 · 呼吸循环：从一张静态抠图做出 24 帧的轻微动效。

不是逐帧重画，是「受控的形变」：
  · 整体呼吸（上下 2px + 0.4% 的纵向伸缩）
  · 头发横向摆动（按 x 位置加权的正弦波，越靠右越明显）
  · 托盘上茶壶的热气上升
输出 GIF + 动画 WebP。
"""
import pathlib, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'art/skins/tea-time/assets/maid-cut.png'
OUT = ROOT / '_local/art/anim'
OUT.mkdir(parents=True, exist_ok=True)

W, H = 360, 540          # 输出尺寸
FRAMES = 18              # 帧数
FPS = 12                 # 帧率 → 1.5 秒
CREAM = (255, 248, 240)


def load():
    im = Image.open(SRC).convert('RGBA')
    im = im.resize((W, H), Image.LANCZOS)
    return im


def distort(rgba, t):
    """按帧号做呼吸 + 头发摆动，返回新的 RGBA。"""
    arr = np.asarray(rgba).astype(np.float32)
    h, w, _ = arr.shape

    phase = 2 * math.pi * t / FRAMES
    breath = math.sin(phase) * 3.0          # 整体上下
    stretch = 1.0 + 0.004 * math.sin(phase)  # 纵向伸缩

    # 行索引（含呼吸与伸缩）
    ys = (np.arange(h) - h / 2) / stretch + h / 2 - breath
    ys = np.clip(ys, 0, h - 1).astype(np.int32)

    # 头发摆动的横向位移：靠右越强
    xs_base = np.arange(w)[None, :].repeat(h, axis=0)
    col_weight = np.clip((xs_base[0] - w * 0.42) / (w * 0.58), 0, 1) ** 1.4
    row_wave = np.sin(phase + np.arange(h)[:, None] * 0.012) * 9.0
    dx = (row_wave * col_weight[None, :]).astype(np.int32)
    xs = np.clip(xs_base + dx, 0, w - 1)

    out = np.zeros_like(arr)
    for c in range(4):
        out[:, :, c] = arr[ys[:, None], xs, c]
    return Image.fromarray(np.clip(out, 0, 255).astype('uint8'))


def steam(frame, t):
    """托盘茶壶上方的热气：两缕，向上飘并淡出。"""
    d = ImageDraw.Draw(frame, 'RGBA')
    phase = (t / FRAMES) % 1.0
    bx, by = W * 0.33, H * 0.60
    for i, (ox, sp, rr) in enumerate(((-8, 1.0, 9), (10, 0.85, 7))):
        rise = ((phase * sp + i * 0.42) % 1.0)
        y = by - rise * 120
        a = int(90 * (1 - rise) ** 1.4)
        if a <= 0:
            continue
        wob = math.sin(rise * 6 + i) * 6
        d.ellipse([bx + ox + wob - rr, y - rr, bx + ox + wob + rr, y + rr],
                  fill=(255, 255, 255, a))
    return frame


def main():
    base = load()
    frames = []
    for t in range(FRAMES):
        f = distort(base, t)
        canvas = Image.new('RGBA', (W, H), CREAM + (255,))
        # 柔和的地面影子
        sh = Image.new('L', (W, H), 0)
        ImageDraw.Draw(sh).ellipse([W * 0.18, H * 0.93, W * 0.86, H * 0.99], fill=60)
        sh = sh.filter(ImageFilter.GaussianBlur(18))
        canvas.paste(Image.new('RGB', (W, H), (150, 118, 96)), (0, 0), sh)
        canvas.alpha_composite(f)
        flat = steam(canvas.convert('RGBA'), t)
        frames.append(flat.convert('RGB'))

    gif = OUT / 'tea-loop.gif'
    pal = [f.quantize(colors=64, method=Image.MEDIANCUT, dither=Image.NONE) for f in frames]
    pal[0].save(gif, save_all=True, append_images=pal[1:],
                duration=int(1000 / FPS), loop=0, optimize=True, disposal=2)
    webp = OUT / 'tea-loop.webp'
    frames[0].save(webp, save_all=True, append_images=frames[1:],
                   duration=int(1000 / FPS), loop=0, quality=82, method=4)
    # 挑 6 帧做一张对比条
    picks = [frames[i] for i in range(0, FRAMES, 4)]
    strip = Image.new('RGB', (W // 2 * len(picks) + 8 * (len(picks) - 1), H // 2), (255, 255, 255))
    for i, p in enumerate(picks):
        strip.paste(p.resize((W // 2, H // 2), Image.LANCZOS), (i * (W // 2 + 8), 0))
    strip.save(OUT / 'tea-loop-strip.png')
    print('saved', gif, gif.stat().st_size)
    print('saved', webp, webp.stat().st_size)
    print('saved', OUT / 'tea-loop-strip.png')


if __name__ == '__main__':
    main()
