#!/usr/bin/env python3
"""三点一刻 · 壁纸：奶油房间 + 她（已抠好的贴纸）+ 柔和的光。"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'art/skins/tea-time/assets/art.jpg'
MAID = ROOT / 'art/skins/tea-time/assets/maid-cut.png'

W, H = 3246, 1745
CHAR_H = 0.86
CHAR_RIGHT = 120          # 离右边缘的距离


def blob(size, cx, cy, rx, ry, color, strength):
    layer = Image.new('L', size, 0)
    ImageDraw.Draw(layer).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=strength)
    layer = layer.filter(ImageFilter.GaussianBlur(min(rx, ry) * 0.55))
    img = Image.new('RGB', size, color)
    return img, layer


def main():
    # 1) 奶油底 + 上下渐变
    yy = np.linspace(0, 1, H)[:, None, None]
    base = np.zeros((H, W, 3), np.float32)
    top = np.array([255, 251, 246], np.float32)
    bot = np.array([253, 239, 228], np.float32)
    base[:] = top * (1 - yy) + bot * yy
    img = Image.fromarray(base.astype('uint8'))

    # 2) 两团柔光
    for cx, cy, rx, ry, color, st in [
        (W * 0.80, H * 0.16, W * 0.34, H * 0.30, (191, 227, 208), 120),
        (W * 0.18, H * 0.86, W * 0.30, H * 0.28, (255, 214, 224), 110),
        (W * 0.62, H * 0.55, W * 0.26, H * 0.34, (255, 255, 255), 150),
    ]:
        gl, mask = blob((W, H), cx, cy, rx, ry, color, st)
        img = Image.composite(gl, img, mask.point(lambda v: v))

    # 2.5) 底部格子布 + 几粒柔光
    d = ImageDraw.Draw(img, 'RGBA')
    band_top = int(H * 0.93)
    d.rectangle([0, band_top, W, H], fill=(255, 250, 244, 190))
    for x in range(0, W, 46):
        d.rectangle([x, band_top, x + 23, H], fill=(255, 189, 203, 70))
        d.rectangle([x + 11, band_top, x + 34, H], fill=(196, 228, 213, 60))
    for cx, cy, r, a in [
        (W * 0.70, H * 0.30, 26, 40), (W * 0.60, H * 0.18, 14, 34),
        (W * 0.78, H * 0.44, 10, 30), (W * 0.34, H * 0.22, 18, 26),
    ]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, a))

    # 3) 她
    maid = Image.open(MAID).convert('RGBA')
    th = int(H * CHAR_H)
    maid = maid.resize((round(maid.width * th / maid.height), th), Image.LANCZOS)
    x = W - maid.width - CHAR_RIGHT
    y = H - th

    # 落地柔影
    sh = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh).ellipse([x + maid.width * 0.12, y + th * 0.94,
                                x + maid.width * 0.95, y + th * 1.02], fill=90)
    sh = sh.filter(ImageFilter.GaussianBlur(46))
    img.paste(Image.new('RGB', (W, H), (150, 118, 96)), (0, 0), sh)
    img.paste(maid, (x, y), maid)

    # 4) 纸面颗粒
    rng = np.random.default_rng(3)
    arr = np.asarray(img).astype(np.float32) + rng.normal(0, 1.8, (H, W, 1))
    img = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))

    img.save(OUT, 'JPEG', quality=90, optimize=True, progressive=True)
    img.resize((900, round(900 * H / W)), Image.LANCZOS).save('/tmp/tea-wall-preview.png')
    print('saved', OUT, OUT.stat().st_size)


if __name__ == '__main__':
    main()
