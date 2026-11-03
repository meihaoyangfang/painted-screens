#!/usr/bin/env python3
"""猫在屋檐上走 · 蓝天白云 GIF（扁平矢量风，纯 PIL 绘制，无需生图）。"""
import math, pathlib
from PIL import Image, ImageDraw, ImageFilter

W, H = 900, 340
FRAMES = 16
SKY_TOP, SKY_BOT = (62, 143, 208), (198, 228, 246)
ORANGE, ORANGE_D = (246, 160, 60), (224, 114, 31)
CREAM, PINK, EYE = (255, 245, 232), (255, 150, 170), (40, 30, 20)
LEDGE_TOP, LEDGE_FACE = (236, 241, 245), (126, 168, 196)
OUT = pathlib.Path(__file__).resolve().parent.parent / 'art/skins/cat-sill/assets/cat-walk.gif'

# 猫在画面里的站位
CX, CY = 430, 214          # 身体中心
BODY_W, BODY_H = 196, 84
LEDGE_Y = 300


def sky():
    img = Image.new('RGB', (W, H), SKY_TOP)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(
            round(SKY_TOP[i] * (1 - t) + SKY_BOT[i] * t) for i in range(3)))
    return img


def clouds(img, t):
    d = ImageDraw.Draw(img, 'RGBA')
    drift = (t / FRAMES) * 26
    for cx, cy, s, a in ((150, 76, 1.0, 235), (560, 54, 0.78, 205), (790, 112, 0.6, 165)):
        x = cx + drift * (0.6 if cx > 400 else 1.0)
        blob = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        bd = ImageDraw.Draw(blob)
        for dx, dy, rr in ((-58, 6, 30), (-18, -10, 40), (26, -2, 34), (66, 8, 26)):
            bd.ellipse([x + dx * s - rr * s, cy + dy * s - rr * s,
                        x + dx * s + rr * s, cy + dy * s + rr * s],
                       fill=(255, 255, 255, a))
        blob = blob.filter(ImageFilter.GaussianBlur(6))
        img.alpha_composite(blob) if img.mode == 'RGBA' else img.paste(Image.new('RGB', (W, H), (255, 255, 255)), (0, 0), blob)
    return img


def leg(d, x, y, phase, front=True):
    lift = max(0.0, math.sin(phase)) * 12
    swing = math.cos(phase) * 11
    w = 15 if front else 17
    col = ORANGE if front else ORANGE_D
    top = (x + swing * 0.3, y)
    knee = (x + swing * 0.7, (y + LEDGE_Y) / 2 - lift * 0.6)
    foot = (x + swing, LEDGE_Y - lift)
    d.line([top, knee], fill=col, width=w, joint='curve')
    d.line([knee, foot], fill=col, width=w - 2, joint='curve')
    d.ellipse([foot[0] - w / 2 - 2, foot[1] - 6, foot[0] + w / 2 + 2, foot[1] + 6], fill=CREAM)


def frame(t, with_sky=True):
    img = sky().convert('RGBA') if with_sky else Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if with_sky:
        img = clouds(img, t)
    d = ImageDraw.Draw(img, 'RGBA')
    ph = 2 * math.pi * t / FRAMES

    # 影子：直接画在透明层上，避免被 GIF 调色板压成黑块
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse(
        [CX - BODY_W / 2 + 30, LEDGE_Y - 12, CX + BODY_W / 2 - 20, LEDGE_Y + 16],
        fill=(40, 70, 100, 70))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(9)))

    body_y = CY + math.sin(ph * 2) * 2.4

    # 后腿 / 前腿（远的先画）
    leg(d, CX - 56, body_y + 34, ph + math.pi, front=False)
    leg(d, CX + 58, body_y + 34, ph, front=False)
    leg(d, CX - 36, body_y + 34, ph, front=True)
    leg(d, CX + 76, body_y + 34, ph + math.pi, front=True)

    # 尾巴
    wag = math.sin(ph) * 10
    d.line([(CX - BODY_W / 2 + 16, body_y - 6), (CX - BODY_W / 2 - 14, body_y - 62 + wag),
            (CX - BODY_W / 2 + 6, body_y - 96 + wag * 1.4)],
           fill=ORANGE, width=15, joint='curve')
    d.ellipse([CX - BODY_W / 2 - 2, body_y - 106 + wag * 1.4, CX - BODY_W / 2 + 16, body_y - 90 + wag * 1.4],
              fill=ORANGE)

    # 身体：前胸略高、后腰略收
    d.ellipse([CX - BODY_W / 2, body_y - BODY_H / 2, CX + BODY_W / 2 - 26, body_y + BODY_H / 2], fill=ORANGE)
    d.ellipse([CX + 26, body_y - BODY_H / 2 - 6, CX + BODY_W / 2 + 6, body_y + BODY_H / 2 - 4], fill=ORANGE)

    # 头
    hx, hy = CX + BODY_W / 2 - 4, body_y - 44
    d.ellipse([hx - 44, hy - 40, hx + 40, hy + 44], fill=ORANGE)
    # 耳
    d.polygon([(hx - 34, hy - 32), (hx - 20, hy - 66), (hx + 2, hy - 44)], fill=ORANGE, )
    d.polygon([(hx - 24, hy - 36), (hx - 18, hy - 58), (hx - 4, hy - 44)], fill=PINK)
    d.polygon([(hx + 4, hy - 44), (hx + 22, hy - 62), (hx + 30, hy - 28)], fill=ORANGE)
    d.polygon([(hx + 9, hy - 44), (hx + 20, hy - 56), (hx + 25, hy - 34)], fill=PINK)
    # 口鼻
    d.ellipse([hx + 2, hy + 6, hx + 38, hy + 40], fill=CREAM)
    # 眼
    d.ellipse([hx + 12, hy - 2, hx + 20, hy + 10], fill=EYE)
    d.ellipse([hx + 15, hy, hx + 17, hy + 4], fill=(255, 255, 255))
    # 胡须
    for dy in (-2, 6):
        d.line([(hx + 34, hy + 20 + dy), (hx + 58, hy + 14 + dy)], fill=(255, 255, 255), width=2)

    # 屋檐（透明版不画，让猫直接站在宿主元素上）
    if with_sky:
        d.rectangle([0, LEDGE_Y, W, LEDGE_Y + 12], fill=LEDGE_TOP)
        d.rectangle([0, LEDGE_Y + 12, W, H], fill=LEDGE_FACE)
        return img.convert('RGB')
    return img


frames = [frame(t) for t in range(FRAMES)]
frames[0].save(OUT, save_all=True, append_images=frames[1:], duration=90, loop=0, optimize=True)
frames[4].save('/tmp/catwalk-frame.png')

# 透明版：只留猫，给输入框上沿用
alpha = [f.convert('RGBA') for f in [frame(t, with_sky=False) for t in range(FRAMES)]]
pal = [f.convert('P', palette=Image.ADAPTIVE, colors=64) for f in alpha]
for f in pal:
    f.info['transparency'] = 0
OUT2 = OUT.with_name('cat-walk-alpha.gif')
pal[0].save(OUT2, save_all=True, append_images=pal[1:], duration=90, loop=0,
            optimize=False, disposal=2, transparency=0)
# 构建只内联 jpg/png/webp/svg，动画 WebP 才是可用的那一份
alpha[0].save(OUT2.with_suffix('.webp'), save_all=True, append_images=alpha[1:],
              duration=90, loop=0, quality=82, method=4)
pal[4].save('/tmp/cat-alpha.png')
print('saved', OUT, '|', OUT2, round(OUT2.stat().st_size / 1024), 'KB')
