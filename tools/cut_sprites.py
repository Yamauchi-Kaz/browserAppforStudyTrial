"""キャラクター設定画（1枚の絵）から、ポーズごとに切りぬいて背景を透明にした PNG を作る。
python3 tools/cut_sprites.py
紙の色を、切りぬき範囲のふちからつながっているところだけ透明にする（キャラの中の白い毛は残る）。
"""
import os
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..')
# キャラクターごとの設定画と、ポーズ名: (左, 上, 右, 下[, 'l' や 'r']) = 元の絵の中でそのポーズがある範囲。
# 'l' / 'r' を付けると、その辺にふれている となりの絵のかけらを消す（いちばん大きいかたまり＝キャラ本体はのこす）
SHEETS = {
    'kororun': {
        'idle': (540, 340, 765, 668),
        'happy': (785, 340, 1015, 668),
        'angry': (1055, 355, 1445, 668),
        'attack': (8, 722, 478, 1034),
        'hurt': (482, 722, 772, 1034),
        'dizzy': (782, 740, 1088, 1034),
        'down': (1096, 760, 1446, 1034),
    },
    'jureking': {
        'idle': (552, 390, 800, 628, 'lr'),
        'happy': (808, 360, 1055, 628, 'l'),
        'angry': (1058, 378, 1446, 632, 'l'),
        'attack': (4, 674, 470, 1002),
        'hurt': (461, 700, 775, 1002, 'lr'),
        'dizzy': (765, 736, 1082, 1002, 'l'),
        'down': (1084, 740, 1446, 1002),
    },
}
TOL = 34  # 紙の色との ちがいが これより小さければ背景とみなす


def cut(chara, name, box):
    edges = box[4] if len(box) > 4 else ''
    box = box[:4]
    src = os.path.join(ROOT, 'art', 'source', f'{chara}-sheet.png')
    im = Image.open(src).convert('RGB').crop(box)
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
    comps = []
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
                comps.append(comp)
    biggest = max(comps, key=len) if comps else None
    for comp in comps:
        xs = [x for _, x in comp]
        on_edge = ('l' in edges and min(xs) == 0) or ('r' in edges and max(xs) == w - 1)
        if len(comp) < 60 or (on_edge and comp is not biggest):
            for y, x in comp:
                keep[y, x] = False
    alpha = Image.fromarray(np.where(keep, 255, 0).astype(np.uint8))
    # ふちをなめらかに（ギザギザを少しぼかす）
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    bbox = out.getbbox()
    out = out.crop(bbox)
    out_dir = os.path.join(ROOT, 'art', 'monsters', chara)
    os.makedirs(out_dir, exist_ok=True)
    out.save(os.path.join(out_dir, f'{name}.webp'), quality=90, method=6)
    return out.size, bbox


if __name__ == '__main__':
    import sys
    for chara, poses in SHEETS.items():
        if len(sys.argv) > 1 and chara not in sys.argv[1:]:
            continue
        for n, b in poses.items():
            print(chara, n, *cut(chara, n, b))
