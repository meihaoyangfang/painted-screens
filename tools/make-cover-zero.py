#!/usr/bin/env python3
"""零点以后 · 封面：账本里夹着一张照片。

用法：python3 tools/make-cover-zero.py [输出目录]
"""
import sys, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent

W, H = 1440, 810
BRASS = (217, 164, 65)
LIP = (224, 36, 94)
IVORY = (243, 231, 220)
INK2 = (205, 182, 172)

SONGTI = '/System/Library/Fonts/Supplemental/Songti.ttc'
DIDOT = '/System/Library/Fonts/Supplemental/Didot.ttc'
MONO = '/System/Library/Fonts/Supplemental/Menlo.ttc'
PINY = '/System/Library/Fonts/Hiragino Sans GB.ttc'


def background():
    yy, xx = np.mgrid[0:H, 0:W]
    base = np.zeros((H, W, 3), float)
    t = yy / H
    base[..., 0] = 23 - 9 * t
    base[..., 1] = 10 - 5 * t
    base[..., 2] = 16 - 6 * t

    # 左下烛光
    d = np.sqrt(((xx - W * 0.13) / (W * 0.40)) ** 2 + ((yy - H * 0.82) / (H * 0.60)) ** 2)
    g = np.clip(1 - d, 0, 1) ** 2.2
    base[..., 0] += g * 82
    base[..., 1] += g * 54
    base[..., 2] += g * 18

    # 右上冷光
    d2 = np.sqrt(((xx - W * 0.90) / (W * 0.46)) ** 2 + ((yy - H * 0.04) / (H * 0.46)) ** 2)
    g2 = np.clip(1 - d2, 0, 1) ** 2.6
    base[..., 0] += g2 * 58
    base[..., 1] += g2 * 4
    base[..., 2] += g2 * 20

    vig = np.clip(1 - np.sqrt(((xx - W / 2) / (W * 0.74)) ** 2 + ((yy - H / 2) / (H * 0.80)) ** 2), 0, 1) ** 1.15
    base *= (0.40 + 0.60 * vig)[..., None]

    rng = np.random.default_rng(7)
    base += rng.normal(0, 6.5, (H, W, 1))
    return Image.fromarray(np.clip(base, 0, 255).astype('uint8'))


# 新主视觉里她手里是怀表；封面取她上半身这一块
SRC = ROOT / 'art/skins/after-zero/assets/art.jpg'
CROP = (1780, 230, 2500, 1210)


def past_image(size):
    im = Image.open(SRC).convert('RGB').crop(CROP)
    tw, th = size
    tr = tw / th
    w, h = im.size
    if w / h > tr:
        nw = int(h * tr)
        im = im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
    else:
        nh = int(w / tr)
        im = im.crop((0, 0, w, nh))
    return im.resize(size, Image.LANCZOS)


def main():
    # 满版构图：直接用主视觉，左边留黑给标题，右边是她
    art = Image.open(SRC).convert('RGB')
    aw, ah = art.size
    target_h = round(aw * 9 / 16)
    top = max(0, ah - target_h)
    art = art.crop((0, top, aw, top + target_h)).resize((W, H), Image.LANCZOS)
    img = art.copy()

    # 左侧压一层，保证标题在白字上；右边完全不动
    veil = Image.new('L', (W, H), 0)
    vd = ImageDraw.Draw(veil)
    for x in range(0, int(W * 0.58)):
        vd.line([(x, 0), (x, H)], fill=int(190 * (1 - x / (W * 0.58)) ** 1.5))
    img.paste(Image.new('RGB', (W, H), (12, 5, 8)), (0, 0), veil)

    # 左下一点烛色余温
    warm = Image.new('L', (W, H), 0)
    wd = ImageDraw.Draw(warm)
    wd.ellipse([-W * 0.25, H * 0.55, W * 0.35, H * 1.25], fill=46)
    img.paste(Image.new('RGB', (W, H), (120, 74, 24)), (0, 0), warm.filter(ImageFilter.GaussianBlur(90)))

    # ---- 左栏（logo + 文字）先画在透明层上，量出整体高度再垂直居中 ----
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    mark = Image.open(ROOT / 'art/skins/after-zero/assets/watch-mark.png').convert('RGBA')
    mh = 96
    mark = mark.resize((round(mark.width * mh / mark.height), mh), Image.LANCZOS)
    layer.paste(mark, (94, 96), mark)

    d = ImageDraw.Draw(layer)
    x = 96
    f_title = ImageFont.truetype(SONGTI, 96, index=1)
    d.text((x - 4, 214), '零点以后', font=f_title, fill=IVORY)

    f_latin = ImageFont.truetype(DIDOT, 26)
    d.text((x, 350), 'A F T E R   Z E R O', font=f_latin, fill=LIP)

    d.line([x, 402, x + 190, 402], fill=BRASS, width=1)
    d.ellipse([x + 196, 398, x + 204, 406], outline=BRASS, width=1)

    f_blurb = ImageFont.truetype(PINY, 19)
    d.text((x, 426), '夜班女仆长 · 黄铜怀表与丝绒', font=f_blurb, fill=INK2)

    box = layer.getbbox()
    dy = round((H - (box[3] - box[1])) / 2 - box[1])
    img = img.convert('RGBA')
    img.alpha_composite(layer, (0, dy))
    img = img.convert('RGB')

    out_dir = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'art/gen'
    out_dir.mkdir(parents=True, exist_ok=True)
    png = out_dir / 'cover-after-zero.png'
    img.save(png)
    poster = ROOT / 'art/posters/after-zero.jpg'
    poster.parent.mkdir(parents=True, exist_ok=True)
    img.resize((720, 405), Image.LANCZOS).save(poster, 'JPEG', quality=88, optimize=True, progressive=True)
    print('saved', png, 'shift', dy)
    print('saved', poster, poster.stat().st_size)


if __name__ == '__main__':
    main()
