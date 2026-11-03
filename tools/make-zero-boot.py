#!/usr/bin/env python3
"""零点以后 · 启动幕：把主视觉整体左移，人物不再贴右边缘。

用法：python3 tools/make-zero-boot.py [左移像素]
"""
import sys, pathlib
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'art/skins/after-zero/assets/art.jpg'
OUT = ROOT / 'art/gen/after-zero-boot.jpg'
W, H = 1440, 810


def main():
    shift = int(sys.argv[1]) if len(sys.argv) > 1 else 340

    art = Image.open(SRC).convert('RGB')
    w0 = round(art.width * H / art.height)
    art = art.resize((w0, H), Image.LANCZOS)

    canvas = Image.new('RGB', (W, H), (9, 4, 7))

    # 右侧补的暗场：取原图最右一列拉宽 + 垂直模糊，接得上她身后的光
    edge = art.crop((w0 - 6, 0, w0, H)).resize((shift + 60, H), Image.LANCZOS)
    canvas.paste(edge, (W - (shift + 60), 0))
    canvas = canvas.filter(ImageFilter.GaussianBlur(28))

    x = W - w0 - shift          # 右对齐后再整体左移
    canvas.paste(art, (x, 0))

    # 左侧压暗，给标题留位置
    veil = Image.new('L', (W, H), 0)
    vd = ImageDraw.Draw(veil)
    for i in range(0, int(W * 0.62)):
        vd.line([(i, 0), (i, H)], fill=int(200 * (1 - i / (W * 0.62)) ** 1.25))
    canvas = Image.composite(Image.new('RGB', (W, H), (9, 4, 7)), canvas, veil)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, 'JPEG', quality=88, optimize=True, progressive=True)
    print('saved', OUT, 'shift', shift, OUT.stat().st_size)


if __name__ == '__main__':
    main()
