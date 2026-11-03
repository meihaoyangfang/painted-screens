#!/usr/bin/env python3
"""鲸歌（whale-song）壁纸：把 2:3 原图切成会话页的背景层。

原图 art/source/whale-song-visual.jpg 是 1664×2496 的 2:3 人像。会话页里它按
`background-size: auto 150vh` 铺满窗口高度，也就是在 1000px 高的窗口上、2 倍屏
里要画出约 3000 个设备像素——所以这里必须按原图宽度出图，不能先缩到 1000。

左边 30% 做一条 alpha 渐隐，让她从海雾里浮出来（不是硬边裁切）。

    python3 tools/make-visual.py                  # → art/skins/whale-song/assets/visual.webp
    python3 tools/make-visual.py --width 1200 --quality 82   # 想再压小一点

Deterministic; no network, no model call.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art/source/whale-song-visual.jpg"
OUT = ROOT / "art/skins/whale-song/assets/visual.webp"


def smoothstep(x: float) -> float:
    return x * x * (3 - 2 * x)


def make(source: Path, out: Path, width: int, quality: int, feather: float) -> Image.Image:
    im = Image.open(source).convert("RGB")
    height = round(im.height * width / im.width)
    im = im.resize((width, height), Image.LANCZOS)

    im = ImageEnhance.Color(im).enhance(1.05)
    im = ImageEnhance.Contrast(im).enhance(1.04)
    im = ImageEnhance.Brightness(im).enhance(0.97)
    im = ImageEnhance.Sharpness(im).enhance(1.08)

    alpha = Image.new("L", (width, height), 255)
    draw = ImageDraw.Draw(alpha)
    ramp = max(1, int(width * feather))
    for x in range(ramp):
        draw.line([(x, 0), (x, height)], fill=int(255 * smoothstep(x / ramp)))

    im = im.convert("RGBA")
    im.putalpha(alpha)
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "WEBP", quality=quality, method=6)
    return im


def main() -> None:
    ap = argparse.ArgumentParser(description="鲸歌壁纸生成")
    ap.add_argument("--source", type=Path, default=SRC)
    ap.add_argument("--out", type=Path, default=OUT)
    ap.add_argument("--width", type=int, default=1664, help="输出宽度，默认跟原图一致")
    ap.add_argument("--quality", type=int, default=88)
    ap.add_argument("--feather", type=float, default=0.30, help="左侧渐隐占比")
    args = ap.parse_args()

    im = make(args.source, args.out, args.width, args.quality, args.feather)
    print(f"{args.out.relative_to(ROOT)}  {im.width}×{im.height}  {args.out.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
