#!/usr/bin/env python3
"""白底人物精细抠图：边缘泛洪 + 梯度护栏，避免白色围裙被吃穿。

用法：python3 tools/cutout-white.py <src.jpg> <out.png> [tolerance]
"""
import sys, pathlib
from collections import deque
import numpy as np
from PIL import Image, ImageFilter


def sobel(g):
    gx = np.zeros_like(g); gy = np.zeros_like(g)
    gx[:, 1:-1] = g[:, 2:] - g[:, :-2]
    gy[1:-1, :] = g[2:, :] - g[:-2, :]
    return np.sqrt(gx ** 2 + gy ** 2)


def cut(src, out, tol=232.0, edge_gate=14.0):
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape

    lum = a.mean(axis=2)
    grad = sobel(lum)

    mn = a.min(axis=2)
    mx = a.max(axis=2)
    near_white = (mn >= tol) & ((mx - mn) <= 14) & (grad < edge_gate)

    bg = np.zeros((h, w), bool)
    dq = deque()

    def push(y, x):
        if near_white[y, x] and not bg[y, x]:
            bg[y, x] = True
            dq.append((y, x))

    for x in range(w):
        push(0, x); push(h - 1, x)
    for y in range(h):
        push(y, 0); push(y, w - 1)

    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w:
                push(ny, nx)

    # 只保留与画面四边连通的背景块：被人物包住的"白色空洞"要还回来
    keep = np.zeros((h, w), bool)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bg[y, x] and not keep[y, x]:
                keep[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bg[y, x] and not keep[y, x]:
                keep[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and bg[ny, nx] and not keep[ny, nx]:
                keep[ny, nx] = True; dq.append((ny, nx))
    print('enclosed holes restored:', int((bg & ~keep).sum()))

    # 收一圈，去掉白边
    alpha = np.where(keep, 0, 255).astype('uint8')
    al = Image.fromarray(alpha, 'L')
    al = al.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    al = al.filter(ImageFilter.GaussianBlur(1.0))

    res = im.convert('RGBA')
    res.putalpha(al)
    res.save(out)
    print('bg fraction', round(bg.mean(), 3), '->', out)


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    tol = float(sys.argv[3]) if len(sys.argv) > 3 else 232.0
    cut(src, out, tol)
