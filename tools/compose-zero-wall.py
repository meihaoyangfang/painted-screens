#!/usr/bin/env python3
"""零点以后 · 壁纸：原图直用，只加一层朦胧的光。

不做抠图 —— 人物和背景一起处理，靠"光"造氛围。
用法：python3 tools/compose-zero-wall.py
"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'art/skins/after-zero/assets/maid-source.jpg'
OUT = ROOT / 'art/skins/after-zero/assets/art.jpg'

# 画布做得比 16:10 更宽：在宽屏上 cover 只会裁左右（左边是空的暗部），
# 永远不会裁掉底部的地板和她。
W, H = 3246, 1745
CHAR_SCALE = 0.90      # 人物占画布高度的比例（越小越靠下、头顶留白越多）
TOP_PAD = 210          # 头顶留白（她原来贴顶，被顶栏切掉）
HAZE = 1.0             # 光晕总强度，1.0 为默认


def base_image():
    im = Image.open(SRC).convert('RGB')
    w, h = im.size
    im = im.crop((0, 0, int(h * 16 / 10), h))          # 右边纯黑裁掉，人物贴边
    ih = round(H * CHAR_SCALE)
    iw = round(ih * 16 / 10)
    im = im.resize((iw, ih), Image.LANCZOS)
    canvas = Image.new('RGB', (W, H), (0, 0, 0))
    # 顶栏下方留出头顶；底边对齐画面底部
    top = max(TOP_PAD, H - ih)
    canvas.paste(im, (W - iw, top))
    return canvas


def glow(size, center, radius, color, strength):
    """一团柔和的光，返回可直接 screen 叠上去的 RGB 图。"""
    w, h = size
    layer = Image.new('L', size, 0)
    cx, cy = center[0] * w, center[1] * h
    r = radius * w
    d = ImageDraw.Draw(layer)
    steps = 26
    for i in range(steps, 0, -1):
        k = i / steps
        d.ellipse([cx - r * k, cy - r * k * 0.8, cx + r * k, cy + r * k * 0.8],
                  fill=int(255 * (1 - k) ** 1.6 * strength))
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.16))
    out = Image.new('RGB', size, color)
    return out, layer


def main():
    img = base_image()

    # 1) 雾气：把她周围的暗部提起来
    for center, radius, color, strength in [
        ((0.30, 0.88), 0.34, (196, 138, 66), 0.55),   # 左下木地板方向的暖光
        ((0.74, 0.30), 0.26, (214, 156, 92), 0.34),   # 她身后的烛光余晕
        ((0.90, 0.62), 0.22, (150, 74, 58), 0.28),    # 右侧一点酒红反光
        ((0.10, 0.24), 0.30, (58, 40, 62), 0.30),     # 左上冷调，避免死黑
        ((0.16, 0.62), 0.22, (176, 120, 58), 0.22),   # 左侧中段的环境微光
    ]:
        layer_img, mask = glow((W, H), center, radius, color, strength * HAZE)
        img = Image.composite(Image.blend(img, Image.new('RGB', (W, H), (255, 255, 255)), 0.0), img, mask)
        # screen 叠加
        a = np.asarray(img).astype(np.float32) / 255.0
        g = np.asarray(layer_img).astype(np.float32) / 255.0
        m = (np.asarray(mask).astype(np.float32) / 255.0)[..., None]
        out = 1 - (1 - a * (1 - m)) * (1 - g * m)
        img = Image.fromarray((np.clip(out, 0, 1) * 255).astype('uint8'))

    # 1.5) 环境微光：暗部里几粒被烛光打亮的尘埃 / 反光点
    rng0 = np.random.default_rng(5)
    fl = Image.new('RGB', (W, H), (0, 0, 0))
    fd = ImageDraw.Draw(fl)
    for _ in range(150):
        cx = rng0.uniform(0.02, 0.98) * W
        cy = rng0.uniform(0.10, 0.96) * H
        # 越靠左越暗，避免抢正文
        falloff = min(1.0, (cx / W - 0.02) / 0.55)
        if rng0.random() > falloff * 0.9 + 0.1:
            continue
        r = rng0.uniform(1.2, 4.4)
        alpha = int(18 + 70 * rng0.random() * falloff)
        fd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(alpha, int(alpha * 0.72), int(alpha * 0.42)))
    fl = fl.filter(ImageFilter.GaussianBlur(1.8))
    a0 = np.asarray(img).astype(np.float32) / 255.0
    g0 = np.asarray(fl).astype(np.float32) / 255.0
    img = Image.fromarray((np.clip(1 - (1 - a0) * (1 - g0), 0, 1) * 255).astype('uint8'))

    # 2) 光晕（bloom）：把亮部揉开一层，边缘发雾
    bright = np.asarray(img).astype(np.float32)
    lum = bright.max(axis=2) / 255.0
    mask = np.clip((lum - 0.62) / 0.38, 0, 1) ** 1.4
    blur = img.filter(ImageFilter.GaussianBlur(28))
    a = bright / 255.0
    b = np.asarray(blur).astype(np.float32) / 255.0
    m = (mask * 0.42)[..., None]
    out = 1 - (1 - a) * (1 - b * m)
    img = Image.fromarray((np.clip(out, 0, 1) * 255).astype('uint8'))

    # 3) 细颗粒
    rng = np.random.default_rng(11)
    arr = np.asarray(img).astype(np.float32) + rng.normal(0, 2.6, (H, W, 1))
    img = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))

    img.save(OUT, 'JPEG', quality=90, optimize=True, progressive=True)
    img.resize((900, round(900 * H / W)), Image.LANCZOS).save('/tmp/zero-haze-preview.png')
    print('saved', OUT, OUT.stat().st_size)


if __name__ == '__main__':
    main()
