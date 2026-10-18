"""キャラクター設定画（1枚の絵）から、ポーズごとに切りぬいて背景を透明にした PNG を作る。
python3 tools/cut_sprites.py
紙の色を、切りぬき範囲のふちからつながっているところだけ透明にする（キャラの中の白い毛は残る）。
"""
import os
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'art', 'source', 'kororun-sheet.png')
OUT = os.path.join(ROOT, 'art', 'monsters', 'kororun')

# 名前: (左, 上, 右, 下)  元の絵の中の、そのポーズがある範囲
POSES = {
    'idle': (540, 340, 765, 668),
    'happy': (785, 340, 1015, 668),
    'angry': (1055, 355, 1445, 668),
    'attack': (8, 722, 478, 1034),
    'hurt': (482, 722, 772, 1034),
    'dizzy': (782, 740, 1088, 1034),
    'down': (1096, 760, 1446, 1034),
}
TOL = 34  # 紙の色との ちがいが これより小さければ背景とみなす


def cut(name, box):
    im = Image.open(SRC).convert('RGB').crop(box)
    a = np.asarray(im).astype(np.int32)
    h, w, _ = a.shape
    # 紙の色 = ふちの色の中央値
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    paper = np.median(edge, axis=0)
    near = np.sqrt(((a - paper) ** 2).sum(axis=2)) < TOL
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not bg[y, x]:
                bg[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not bg[y, x]:
                bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    keep = ~bg
    # となりの絵や文字のかけらなど、小さくはなれた点を消す
    seen = np.zeros((h, w), bool)
    for sy in range(h):
        for sx in range(w):
            if keep[sy, sx] and not seen[sy, sx]:
                comp = []
                q2 = deque([(sy, sx)]); seen[sy, sx] = True
                while q2:
                    y, x = q2.popleft(); comp.append((y, x))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and keep[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; q2.append((ny, nx))
                if len(comp) < 60:
                    for y, x in comp:
                        keep[y, x] = False
    alpha = Image.fromarray(np.where(keep, 255, 0).astype(np.uint8))
    # ふちをなめらかに（ギザギザを少しぼかす）
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    bbox = out.getbbox()
    out = out.crop(bbox)
    os.makedirs(OUT, exist_ok=True)
    out.save(os.path.join(OUT, f'{name}.webp'), quality=90, method=6)
    return out.size, bbox


if __name__ == '__main__':
    for n, b in POSES.items():
        print(n, *cut(n, b))
