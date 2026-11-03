#!/usr/bin/env python3
"""三点一刻 · 动态壁纸：房间静止 + 她呼吸/摆发 + 热气。输出动画 WebP。"""
import pathlib, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAID = ROOT / 'art/skins/tea-time/assets/maid-cut.png'
OUT = ROOT / 'art/skins/tea-time/assets/live.webp'

W, H = 1800, 968          # 比 1440×900 的窗口更大，避免放大变糊
FRAMES = 12
CHAR_H = 0.86
CHAR_RIGHT = int(W * 0.04)


def room():
    yy = np.linspace(0, 1, H)[:, None, None]
    base = np.zeros((H, W, 3), np.float32)
    top = np.array([255, 251, 246], np.float32)
    bot = np.array([253, 239, 228], np.float32)
    base[:] = top * (1 - yy) + bot * yy
    img = Image.fromarray(base.astype('uint8'))

    def blob(cx, cy, rx, ry, color, st):
        layer = Image.new('L', (W, H), 0)
        ImageDraw.Draw(layer).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=st)
        layer = layer.filter(ImageFilter.GaussianBlur(min(rx, ry) * 0.55))
        return Image.new('RGB', (W, H), color), layer

    for cx, cy, rx, ry, color, st in [
        (W * 0.80, H * 0.16, W * 0.34, H * 0.30, (191, 227, 208), 120),
        (W * 0.18, H * 0.86, W * 0.30, H * 0.28, (255, 214, 224), 110),
        (W * 0.62, H * 0.55, W * 0.26, H * 0.34, (255, 255, 255), 150),
    ]:
        gl, mask = blob(cx, cy, rx, ry, color, st)
        img = Image.composite(gl, img, mask)

    d = ImageDraw.Draw(img, 'RGBA')
    band_top = int(H * 0.93)
    d.rectangle([0, band_top, W, H], fill=(255, 250, 244, 190))
    for x in range(0, W, 34):
        d.rectangle([x, band_top, x + 17, H], fill=(255, 189, 203, 70))
        d.rectangle([x + 8, band_top, x + 25, H], fill=(196, 228, 213, 60))
    return img


def distort(rgba, t):
    """整体上下平移：头跟着动，但不缩放、不变形、头发不摆。"""
    arr = np.asarray(rgba).astype(np.float32)
    h, w, _ = arr.shape

    phase = 2 * math.pi * t / FRAMES
    breath = math.sin(phase) * 1.6          # 纯位移，单位 px

    ys = np.clip(np.arange(h) - breath, 0, h - 1).astype(np.int32)
    xs = np.arange(w)[None, :].repeat(h, axis=0)

    out = np.zeros_like(arr)
    for c in range(4):
        out[:, :, c] = arr[ys[:, None], xs, c]
    return Image.fromarray(np.clip(out, 0, 255).astype('uint8'))


def main():
    base_room = room()
    maid = Image.open(MAID).convert('RGBA')
    th = int(H * CHAR_H)
    maid = maid.resize((round(maid.width * th / maid.height), th), Image.LANCZOS)
    x = W - maid.width - CHAR_RIGHT
    y = H - th + 3          # 往画面外多塞 3px，向上浮动时底部不会露出缝

    frames = []
    for t in range(FRAMES):
        canvas = base_room.convert('RGBA')
        # 影子
        sh = Image.new('L', (W, H), 0)
        ImageDraw.Draw(sh).ellipse([x + maid.width * 0.12, y + th * 0.94,
                                    x + maid.width * 0.95, y + th * 1.02], fill=80)
        canvas.paste(Image.new('RGB', (W, H), (150, 118, 96)), (0, 0), sh.filter(ImageFilter.GaussianBlur(30)))
        canvas.alpha_composite(distort(maid, t), (x, y))
        # 热气
        d = ImageDraw.Draw(canvas, 'RGBA')
        ph = (t / FRAMES) % 1.0
        bx, by = x + maid.width * 0.30, y + th * 0.60
        for i, (ox, sp, rr) in enumerate(((-7, 1.0, 7), (9, 0.85, 5))):
            rise = (ph * sp + i * 0.42) % 1.0
            yy = by - rise * 95
            a = int(80 * (1 - rise) ** 1.4)
            if a > 0:
                wob = math.sin(rise * 6 + i) * 5
                d.ellipse([bx + ox + wob - rr, yy - rr, bx + ox + wob + rr, yy + rr],
                          fill=(255, 255, 255, a))
        frames.append(canvas.convert('RGB'))

    frames[0].save(OUT, save_all=True, append_images=frames[1:],
                   duration=100, loop=0, quality=70, method=4)
    print('saved', OUT, round(OUT.stat().st_size / 1024), 'KB')
    frames[3].save('/tmp/live-frame.jpg', quality=90)


if __name__ == '__main__':
    main()
