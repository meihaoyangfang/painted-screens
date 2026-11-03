#!/usr/bin/env python3
"""Compose the 16:9 大肥鱼 key visual from the 4:5 generated portrait.

The portrait is the hero (a tall anime poster); the DSH canvas is 16:9, so the
portrait is placed on the right at full height and the remaining ocean on the
left is extended from its own colours: an edge smear, soft caustic shafts, a
few gold/cyan sparkles, and a gentle left scrim so interface text stays legible.

    python3 tools/compose-keyvisual.py \
      --portrait art/big-fat-fish/keyvisual-portrait.jpg \
      --out art/big-fat-fish/keyvisual.jpg

Deterministic (fixed random seed); no network, no model call.
"""
import argparse
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


def compose(portrait_path: Path, out_path: Path, width: int = 2560, height: int = 1440) -> Image.Image:
    src = Image.open(portrait_path).convert("RGB")
    art = src.resize((round(src.width * height / src.height), height), Image.LANCZOS)
    aw = art.width
    x0 = width - aw
    if x0 <= 200:
        raise SystemExit("portrait is too wide for the target canvas")

    # 1. deep-water base, slightly lighter toward the bottom
    base = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(base)
    for y in range(height):
        t = y / (height - 1)
        draw.line([(0, y), (width, y)], fill=(int(2 + 2 * t), int(9 + 10 * t), int(20 + 30 * t)))

    # 2. smear a narrow strip from the portrait's left edge across the extension
    strip = art.crop((0, 0, max(24, aw // 28), height)).resize((x0 + 220, height), Image.LANCZOS)
    strip = strip.filter(ImageFilter.GaussianBlur(64))
    region = base.crop((0, 0, strip.width, height))
    base.paste(Image.blend(region, strip, 0.42), (0, 0))

    # 3. soft caustic shafts
    rays = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rays)
    for cx, spread, alpha in [(1500, 260, 34), (1680, 190, 42), (1820, 130, 26), (1150, 300, 18)]:
        rd.polygon(
            [(cx, -50), (cx + spread, -50), (cx - 380, height), (cx - 760, height)],
            fill=(150, 226, 255, alpha),
        )
    rays = rays.filter(ImageFilter.GaussianBlur(46))
    base = Image.alpha_composite(base.convert("RGBA"), rays).convert("RGB")

    # 4. paste the portrait with a soft left fade
    mask = Image.new("L", (aw, height), 255)
    md = ImageDraw.Draw(mask)
    fade = 230
    for x in range(fade):
        md.line([(x, 0), (x, height)], fill=int(255 * (x / fade) ** 1.25))
    base.paste(art, (x0, 0), mask)

    # 5. sparkles on the open-water side
    stars = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stars)
    random.seed(7)
    for _ in range(26):
        x = random.randint(30, x0 + 220)
        y = random.randint(40, height - 80)
        r = random.choice([1, 1, 1, 2, 2, 3])
        sd.ellipse([x - r, y - r, x + r, y + r], fill=(214, 244, 255, random.randint(70, 170)))
    for x, y, s, a in [(240, 210, 9, 150), (420, 330, 6, 120), (150, 640, 7, 110), (700, 160, 8, 120), (960, 420, 5, 90)]:
        sd.polygon(
            [
                (x, y - s), (x + s * 0.28, y - s * 0.28), (x + s, y), (x + s * 0.28, y + s * 0.28),
                (x, y + s), (x - s * 0.28, y + s * 0.28), (x - s, y), (x - s * 0.28, y - s * 0.28),
            ],
            fill=(255, 226, 150, a),
        )
    glow = stars.filter(ImageFilter.GaussianBlur(2.2))
    base = Image.alpha_composite(base.convert("RGBA"), Image.alpha_composite(glow, stars)).convert("RGB")

    # 6. left scrim for interface copy
    scrim = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    for x in range(x0 + 240):
        a = int(150 * max(0.0, 1 - x / (x0 + 240)) ** 1.15)
        sd.line([(x, 0), (x, height)], fill=(2, 9, 19, a))
    base = Image.alpha_composite(base.convert("RGBA"), scrim).convert("RGB")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    base.save(out_path, quality=94, subsampling=1)
    base.resize((1600, 900), Image.LANCZOS).save(
        out_path.with_name(out_path.stem + "-preview.jpg"), quality=90
    )
    return base


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--portrait", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--width", type=int, default=2560)
    parser.add_argument("--height", type=int, default=1440)
    args = parser.parse_args()
    image = compose(args.portrait, args.out, args.width, args.height)
    print(f"compose: {args.out} ({image.width}x{image.height})")


if __name__ == "__main__":
    main()
