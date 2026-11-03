#!/usr/bin/env python3
"""三点一刻 · 封面：奶油底 + 她（抠好的贴纸）+ 圆体标题。"""
import pathlib
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 1440, 810
MINT = (95, 168, 140)
STRAW = (226, 96, 127)
COCOA = (91, 64, 52)
COCOA2 = (122, 90, 74)
CREAM = (255, 248, 240)

SONGTI = '/System/Library/Fonts/Supplemental/Songti.ttc'
FUTURA = '/System/Library/Fonts/Supplemental/Futura.ttc'
PINY = '/System/Library/Fonts/Hiragino Sans GB.ttc'
MONO = '/System/Library/Fonts/Supplemental/Menlo.ttc'


def background():
    img = Image.new('RGB', (W, H), CREAM)
    d = ImageDraw.Draw(img)
    for cy, r, col in ((0.18, 0.55, (191, 227, 208)), (0.92, 0.5, (255, 214, 224))):
        layer = Image.new('L', (W, H), 0)
        ImageDraw.Draw(layer).ellipse(
            [W * 0.55 - W * r * 0.5, H * cy - H * r * 0.5, W * 0.55 + W * r * 0.5, H * cy + H * r * 0.5],
            fill=120)
        layer = layer.filter(ImageFilter.GaussianBlur(160))
        img.paste(Image.new('RGB', (W, H), col), (0, 0), layer)
    # 顶部格子布
    d = ImageDraw.Draw(img)
    for x in range(0, W, 20):
        d.rectangle([x, 0, x + 10, 6], fill=(255, 189, 203))
    for x in range(0, W, 20):
        d.rectangle([x, 0, x + 20, 3], fill=(196, 228, 213))
    return img


def main():
    img = background()

    # 她
    maid = Image.open(ROOT / 'art/skins/tea-time/assets/maid-cut.png').convert('RGBA')
    mh = int(H * 0.94)
    maid = maid.resize((round(maid.width * mh / maid.height), mh), Image.LANCZOS)
    img.paste(maid, (W - maid.width - 40, H - mh + 10), maid)

    # 左栏：茶杯标记 + 标题 + 说明，整体垂直居中
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x = 96

    # 茶杯标记：杯身 + 把手 + 托盘 + 热气
    d.ellipse([x, 150, x + 88, 238], fill=(191, 227, 208, 170))
    cx, cy = x + 40, 186
    d.rounded_rectangle([cx - 20, cy - 8, cx + 18, cy + 20], radius=7, outline=MINT, width=3)
    d.arc([cx + 14, cy - 2, cx + 38, cy + 16], -70, 70, fill=MINT, width=3)
    d.line([cx - 26, cy + 26, cx + 26, cy + 26], fill=MINT, width=3)
    d.arc([cx - 10, cy - 26, cx - 2, cy - 14], 110, 250, fill=STRAW, width=2)
    d.arc([cx + 4, cy - 26, cx + 12, cy - 14], 110, 250, fill=STRAW, width=2)

    f_title = ImageFont.truetype(SONGTI, 88, index=1)
    d.text((x - 4, 268), '午后三时', font=f_title, fill=COCOA)

    f_latin = ImageFont.truetype(FUTURA, 24)
    d.text((x, 400), 'T E A   A T   T H R E E', font=f_latin, fill=STRAW)

    d.line([x, 452, x + 170, 452], fill=MINT, width=2)
    d.ellipse([x + 178, 448, x + 186, 456], outline=STRAW, width=2)

    f_blurb = ImageFont.truetype(PINY, 19)
    d.text((x, 476), '试用期女仆 · 薄荷奶油与草莓塔', font=f_blurb, fill=COCOA2)

    box = layer.getbbox()
    dy = round((H - (box[3] - box[1])) / 2 - box[1])
    out = img.convert('RGBA')
    out.alpha_composite(layer, (0, dy))
    out = out.convert('RGB')

    png = ROOT / 'art/gen/cover-tea-time.png'
    png.parent.mkdir(parents=True, exist_ok=True)
    out.save(png)
    poster = ROOT / 'art/posters/tea-time.jpg'
    poster.parent.mkdir(parents=True, exist_ok=True)
    out.resize((720, 405), Image.LANCZOS).save(poster, 'JPEG', quality=88, optimize=True, progressive=True)
    print('saved', png, 'shift', dy)
    print('saved', poster, poster.stat().st_size)


if __name__ == '__main__':
    main()
