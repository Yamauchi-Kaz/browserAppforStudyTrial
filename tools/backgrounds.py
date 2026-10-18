"""バトル背景の SVG を作る。python3 tools/backgrounds.py で art/bg/<名前>.svg を書き出す。
1536x1024。下 1/4 くらいが地面で、まん中はモンスターが立つ場所としてあけておく。
"""
import math
import os
import random

OUT = os.path.join(os.path.dirname(__file__), '..', 'art', 'bg')
W, H = 1536, 1024
GROUND = 760  # 地面のはじまり


def svg(defs, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'<defs>{defs}</defs>\n{body}</svg>\n')


def lin(id_, stops, x2=0, y2=1):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"{f" stop-opacity={chr(34)}{a}{chr(34)}" if a is not None else ""}/>' for o, c, *rest in stops for a in [rest[0] if rest else None])
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def rad(id_, stops, cx='50%', cy='50%', r='50%'):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"{f" stop-opacity={chr(34)}{a}{chr(34)}" if a is not None else ""}/>' for o, c, *rest in stops for a in [rest[0] if rest else None])
    return f'<radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}">{s}</radialGradient>'


def ridge(y, amp, freq, seed, color, jag=0.35, opacity=1, stroke=None):
    """遠くの山なみ・丘"""
    rnd = random.Random(seed)
    pts = []
    ph = rnd.uniform(0, 6)
    for x in range(-20, W + 40, 24):
        yy = y + math.sin(x * freq + ph) * amp + math.sin(x * freq * 2.3 + ph * 2) * amp * 0.4 + rnd.uniform(-amp, amp) * jag
        pts.append(f'{x} {yy:.0f}')
    st = f' stroke="{stroke}" stroke-width="4" stroke-linejoin="round"' if stroke else ''
    return f'<path d="M-20 {H} L{" L".join(pts)} L{W + 40} {H} Z" fill="{color}" opacity="{opacity}"{st}/>\n'


def cloud(cx, cy, s, fill='#ffffff', shade='#cfe3f2', line='#7f9fbf', shine=True):
    parts = [(-60, 10, 42), (-20, -18, 52), (30, -8, 46), (68, 14, 34), (0, 20, 44)]
    out = ''
    for dx, dy, r in parts:
        out += f'<circle cx="{cx + dx * s:.0f}" cy="{cy + dy * s:.0f}" r="{r * s + 3:.0f}" fill="{line}" opacity="0.5"/>'
    for dx, dy, r in parts:
        out += f'<circle cx="{cx + dx * s:.0f}" cy="{cy + dy * s:.0f}" r="{r * s:.0f}" fill="{fill}"/>'
    out += f'<ellipse cx="{cx + 4 * s:.0f}" cy="{cy + 34 * s:.0f}" rx="{86 * s:.0f}" ry="{14 * s:.0f}" fill="{shade}"/>'
    if shine:
        out += f'<ellipse cx="{cx - 30 * s:.0f}" cy="{cy - 34 * s:.0f}" rx="{22 * s:.0f}" ry="{10 * s:.0f}" fill="#ffffff" opacity="0.9"/>'
    return f'<g>{out}</g>\n'


def tree(x, y, s, leaf, leaf_dark, leaf_light, line='#24401f'):
    return (f'<g stroke="{line}" stroke-width="{4 * s:.1f}" stroke-linejoin="round">'
            f'<path d="M{x - 8 * s} {y} L{x - 5 * s} {y - 60 * s} L{x + 5 * s} {y - 60 * s} L{x + 8 * s} {y} Z" fill="#7a4b2a"/>'
            f'<circle cx="{x}" cy="{y - 92 * s}" r="{44 * s}" fill="{leaf}"/>'
            f'<circle cx="{x - 30 * s}" cy="{y - 66 * s}" r="{28 * s}" fill="{leaf}"/>'
            f'<circle cx="{x + 30 * s}" cy="{y - 66 * s}" r="{30 * s}" fill="{leaf_dark}"/>'
            f'</g><circle cx="{x - 14 * s}" cy="{y - 108 * s}" r="{16 * s}" fill="{leaf_light}" opacity="0.8"/>\n')


def flower(x, y, s, color, rnd):
    out = ''
    for i in range(5):
        a = i / 5 * 2 * math.pi
        out += f'<circle cx="{x + math.cos(a) * 6 * s:.1f}" cy="{y + math.sin(a) * 6 * s:.1f}" r="{5 * s:.1f}" fill="{color}" stroke="#4a2a3a" stroke-width="1.5"/>'
    out += f'<circle cx="{x}" cy="{y}" r="{4 * s:.1f}" fill="#ffe14d"/>'
    return f'<path d="M{x} {y + 6 * s} L{x + rnd.uniform(-3, 3)} {y + 26 * s}" stroke="#3f8a3a" stroke-width="3"/>' + out + '\n'


def tufts(rnd, n, ymin, ymax, colors, avoid=None, size=1.0):
    out = ''
    for _ in range(n):
        x = rnd.uniform(0, W); y = rnd.uniform(ymin, ymax)
        if avoid and avoid[0] < x < avoid[1] and y < avoid[2]:
            continue
        s = size * (0.6 + (y - ymin) / (ymax - ymin + 1) * 0.8)
        c = rnd.choice(colors)
        out += (f'<path d="M{x - 10 * s:.0f} {y:.0f} Q{x - 8 * s:.0f} {y - 18 * s:.0f} {x - 14 * s:.0f} {y - 28 * s:.0f} '
                f'Q{x - 2 * s:.0f} {y - 16 * s:.0f} {x:.0f} {y - 34 * s:.0f} Q{x + 4 * s:.0f} {y - 16 * s:.0f} {x + 14 * s:.0f} {y - 26 * s:.0f} '
                f'Q{x + 8 * s:.0f} {y - 14 * s:.0f} {x + 10 * s:.0f} {y:.0f} Z" fill="{c}"/>')
    return out + '\n'


def rays(cx, cy, n, length, color, opacity, spread=0.9, start=1.2):
    out = ''
    for i in range(n):
        a = start + (i / (n - 1) - 0.5) * spread
        w = 0.04
        p1 = (cx + math.cos(a - w) * length, cy + math.sin(a - w) * length)
        p2 = (cx + math.cos(a + w) * length, cy + math.sin(a + w) * length)
        out += f'<path d="M{cx} {cy} L{p1[0]:.0f} {p1[1]:.0f} L{p2[0]:.0f} {p2[1]:.0f} Z" fill="{color}" opacity="{opacity}"/>'
    return out + '\n'


def write(name, content):
    with open(os.path.join(OUT, f'{name}.svg'), 'w') as f:
        f.write(content)


# ================= 草原（スライム） =================
def field():
    rnd = random.Random(1)
    defs = (lin('sky', [(0, '#3fa6ff'), (0.55, '#9fdcff'), (1, '#e9f8ff')])
            + rad('sun', [(0, '#fffde8'), (0.25, '#fff3b0', 0.9), (1, '#fff3b0', 0)])
            + lin('far', [(0, '#a9c9e8'), (1, '#c9def0')])
            + lin('hill1', [(0, '#9bd77a'), (1, '#6fb85a')])
            + lin('hill2', [(0, '#7cc65c'), (1, '#4f9d44')])
            + lin('ground', [(0, '#93d66b'), (0.5, '#74bf55'), (1, '#4e9a3f')])
            + rad('path', [(0, '#f3e2a8'), (0.7, '#dcc27e'), (1, '#dcc27e', 0)]))
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/>\n'
    b += f'<circle cx="1250" cy="170" r="260" fill="url(#sun)"/><circle cx="1250" cy="170" r="70" fill="#fffbe0"/>\n'
    b += rays(1250, 170, 9, 900, '#fffbe0', 0.12, 1.6, 2.2)
    for cx, cy, s in [(220, 170, 1.1), (620, 110, 0.8), (980, 230, 0.9), (1430, 330, 0.7), (420, 330, 0.6)]:
        b += cloud(cx, cy, s)
    # 遠くの山（雪をかぶる）
    b += ridge(520, 70, 0.006, 3, 'url(#far)', 0.25)
    for x, y, s in [(330, 420, 1), (760, 450, 0.8), (1180, 410, 1.1)]:
        b += f'<path d="M{x - 160 * s} {y + 140 * s} L{x} {y} L{x + 170 * s} {y + 150 * s} Z" fill="#9fbddb" stroke="#86a6c8" stroke-width="2" stroke-linejoin="round"/>'
        b += f'<path d="M{x - 50 * s} {y + 44 * s} L{x} {y} L{x + 52 * s} {y + 46 * s} L{x + 26 * s} {y + 36 * s} L{x + 8 * s} {y + 52 * s} L{x - 16 * s} {y + 36 * s} Z" fill="#ffffff"/>\n'
    b += ridge(600, 30, 0.004, 5, 'url(#hill1)', 0.15, stroke='#4f8a44')
    # 木のなみき
    for i in range(14):
        x = 40 + i * 112 + rnd.uniform(-20, 20)
        if 520 < x < 1010:
            continue
        b += tree(x, 640 + rnd.uniform(-10, 14), 0.8 + rnd.uniform(-0.1, 0.2), '#4fa547', '#2f7d36', '#9fe07a')
    b += ridge(690, 22, 0.005, 9, 'url(#hill2)', 0.1, stroke='#3a7a35')
    b += f'<rect x="0" y="{GROUND}" width="{W}" height="{H - GROUND}" fill="url(#ground)"/>\n'
    b += f'<path d="M-20 {GROUND} Q{W / 2} {GROUND - 20} {W + 20} {GROUND}" fill="none" stroke="#3a7a35" stroke-width="5"/>\n'
    # モンスターが立つ土の道
    b += f'<ellipse cx="{W / 2}" cy="{GROUND + 140}" rx="520" ry="110" fill="url(#path)"/>\n'
    b += tufts(rnd, 220, GROUND + 10, H, ['#5fae4a', '#4a9a3c', '#86cf62'], avoid=(420, 1110, H))
    for _ in range(26):
        x = rnd.uniform(0, W); y = rnd.uniform(GROUND + 40, H - 20)
        if 380 < x < 1150:
            continue
        b += flower(x, y, rnd.uniform(1, 1.6), rnd.choice(['#ff6f91', '#ffffff', '#ffd23f', '#b38cff']), rnd)
    for x, y, s in [(170, 930, 1.3), (1380, 900, 1.1)]:
        b += f'<path d="M{x - 60 * s} {y} Q{x - 54 * s} {y - 44 * s} {x - 6 * s} {y - 50 * s} Q{x + 50 * s} {y - 50 * s} {x + 62 * s} {y} Z" fill="#a7adb6" stroke="#3a3f47" stroke-width="5"/><path d="M{x - 36 * s} {y - 32 * s} Q{x - 10 * s} {y - 44 * s} {x + 16 * s} {y - 40 * s}" stroke="#e6e9ed" stroke-width="5" fill="none" stroke-linecap="round"/>\n'
    write('field', svg(defs, b))


# ================= どうくつ（バットン） =================
def cave():
    rnd = random.Random(2)
    defs = (lin('sky', [(0, '#0d0820'), (0.6, '#241a42'), (1, '#3a2b5e')])
            + lin('wall', [(0, '#2c2150'), (1, '#1a1333')])
            + lin('ground', [(0, '#3a2d5e'), (1, '#1c1533')])
            + rad('cglow', [(0, '#7ff9ff', 0.55), (1, '#7ff9ff', 0)])
            + rad('pglow', [(0, '#e07bff', 0.5), (1, '#e07bff', 0)])
            + lin('crys', [(0, '#e0ffff'), (0.5, '#5ce1ff'), (1, '#2a6fd6')], 1, 1)
            + lin('crysp', [(0, '#ffe0ff'), (0.5, '#c46cff'), (1, '#6a2bc4')], 1, 1)
            + rad('light', [(0, '#6a58b0', 0.6), (1, '#6a58b0', 0)]))
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/>\n'
    b += f'<ellipse cx="{W / 2}" cy="520" rx="700" ry="380" fill="url(#light)"/>\n'
    # 奥のいわかべ
    b += ridge(420, 90, 0.007, 11, '#2a1f4c', 0.5, opacity=0.9)
    b += ridge(560, 60, 0.009, 12, '#22183f', 0.5, stroke='#140e29')
    # つらら石
    for i in range(22):
        x = i * 72 + rnd.uniform(-20, 20); l = rnd.uniform(80, 240); w = rnd.uniform(26, 50)
        b += f'<path d="M{x - w} -10 L{x + w} -10 L{x + 4} {l} Z" fill="#2c2150" stroke="#120c24" stroke-width="5" stroke-linejoin="round"/>'
        b += f'<path d="M{x - w * 0.5} -10 L{x - 2} {l * 0.8}" stroke="#4a3b80" stroke-width="5" stroke-linecap="round"/>\n'
    # 光るクリスタル
    def crystal(x, y, s, grad, glow):
        o = f'<ellipse cx="{x}" cy="{y - 60 * s}" rx="{140 * s}" ry="{110 * s}" fill="url(#{glow})"/>'
        for dx, h, w, a in [(-34, 110, 22, -0.35), (0, 160, 28, 0), (34, 120, 22, 0.3), (60, 70, 16, 0.55), (-62, 66, 16, -0.6)]:
            o += (f'<g transform="translate({x + dx * s} {y}) rotate({math.degrees(a):.0f})">'
                  f'<path d="M{-w * s} 0 L{-w * s} {-h * s * 0.75} L0 {-h * s} L{w * s} {-h * s * 0.75} L{w * s} 0 Z" fill="url(#{grad})" stroke="#0c0a24" stroke-width="5" stroke-linejoin="round"/>'
                  f'<path d="M0 {-h * s} L0 0" stroke="#ffffff" stroke-width="3" opacity="0.6"/></g>')
        return o + '\n'
    b += crystal(170, 760, 1.1, 'crys', 'cglow') + crystal(1380, 740, 1.0, 'crysp', 'pglow') + crystal(1100, 600, 0.55, 'crys', 'cglow') + crystal(420, 610, 0.5, 'crysp', 'pglow')
    b += f'<rect x="0" y="{GROUND}" width="{W}" height="{H - GROUND}" fill="url(#ground)"/>\n'
    b += f'<path d="M-20 {GROUND + 6} Q{W / 2} {GROUND - 16} {W + 20} {GROUND + 6}" fill="none" stroke="#5e4a9a" stroke-width="5"/>\n'
    # 光るキノコ
    for x, y, s, c in [(330, 900, 1.2, '#7ff9ff'), (290, 930, 0.8, '#7ff9ff'), (1240, 910, 1.1, '#ff9cf0'), (1290, 940, 0.7, '#ff9cf0')]:
        b += (f'<ellipse cx="{x}" cy="{y - 30 * s}" rx="{60 * s}" ry="{50 * s}" fill="url(#cglow)"/>'
              f'<path d="M{x - 8 * s} {y} L{x - 6 * s} {y - 34 * s} L{x + 6 * s} {y - 34 * s} L{x + 8 * s} {y} Z" fill="#e8e0ff" stroke="#120c24" stroke-width="4"/>'
              f'<path d="M{x - 36 * s} {y - 30 * s} Q{x} {y - 80 * s} {x + 36 * s} {y - 30 * s} Z" fill="{c}" stroke="#120c24" stroke-width="5" stroke-linejoin="round"/>'
              f'<circle cx="{x - 12 * s}" cy="{y - 48 * s}" r="{5 * s}" fill="#ffffff"/>\n')
    # 地面の石
    for _ in range(40):
        x = rnd.uniform(0, W); y = rnd.uniform(GROUND + 30, H)
        if 420 < x < 1110 and y < 980:
            continue
        r = rnd.uniform(8, 24)
        b += f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{r:.0f}" ry="{r * 0.6:.0f}" fill="#4a3b78" stroke="#120c24" stroke-width="3"/>'
    write('cave', svg(defs, b))


# ================= 夜のお城（ダークまどうし） =================
def castle():
    rnd = random.Random(3)
    defs = (lin('wall', [(0, '#2a2a55'), (1, '#3c3a6e')])
            + lin('win', [(0, '#9fc4ff'), (1, '#3d5ab3')])
            + lin('beam', [(0, '#cfe2ff', 0.35), (1, '#cfe2ff', 0)])
            + lin('floor', [(0, '#4a4680'), (1, '#24224a')])
            + lin('carpet', [(0, '#b3202e'), (1, '#6e0f1a')])
            + lin('pillar', [(0, '#6a68a8'), (0.5, '#4a4884'), (1, '#2a2858')], 1, 0)
            + rad('flame', [(0, '#fff7c0', 0.95), (0.4, '#ffb300', 0.5), (1, '#ff6a00', 0)])
            + lin('banner', [(0, '#c62a3a'), (1, '#7a1220')]))
    b = f'<rect width="{W}" height="{H}" fill="url(#wall)"/>\n'
    # レンガ
    for row in range(0, 24):
        y = row * 34
        off = 0 if row % 2 else 40
        for col in range(-1, 20):
            x = col * 80 + off
            sh = rnd.choice(['#34336a', '#2e2d60', '#3a3973'])
            b += f'<rect x="{x}" y="{y}" width="78" height="32" fill="{sh}" stroke="#1c1b3d" stroke-width="2"/>'
    b += '\n'
    # まどと月の光
    for x in [430, 1106]:
        b += (f'<path d="M{x - 90} 520 L{x - 90} 240 Q{x} 120 {x + 90} 240 L{x + 90} 520 Z" fill="url(#win)" stroke="#14132e" stroke-width="12"/>'
              f'<path d="M{x} 150 L{x} 520 M{x - 90} 340 L{x + 90} 340" stroke="#14132e" stroke-width="10"/>'
              f'<circle cx="{x + 40}" cy="230" r="34" fill="#fffbe6" opacity="0.9"/>'
              f'<path d="M{x - 90} 520 L{x + 90} 520 L{x + 260} {H} L{x - 120} {H} Z" fill="url(#beam)"/>\n')
    # 柱
    for x in [120, 1416, 768]:
        if x == 768:
            continue
        b += (f'<rect x="{x - 70}" y="0" width="140" height="{GROUND + 40}" fill="url(#pillar)" stroke="#14132e" stroke-width="8"/>'
              f'<rect x="{x - 90}" y="{GROUND - 10}" width="180" height="60" fill="#5a5896" stroke="#14132e" stroke-width="8"/>'
              f'<path d="M{x - 40} 0 L{x - 40} {GROUND - 10} M{x} 0 L{x} {GROUND - 10} M{x + 40} 0 L{x + 40} {GROUND - 10}" stroke="#2a2858" stroke-width="5"/>\n')
    # 旗
    for x in [270, 1266]:
        b += (f'<path d="M{x - 60} 60 L{x + 60} 60 L{x + 60} 380 L{x} 340 L{x - 60} 380 Z" fill="url(#banner)" stroke="#2a0a10" stroke-width="7" stroke-linejoin="round"/>'
              f'<path d="M{x - 60} 90 L{x + 60} 90" stroke="#f2c14e" stroke-width="8"/>'
              f'<path d="M{x} 150 L{x + 30} 200 L{x} 260 L{x - 30} 200 Z" fill="#f2c14e" stroke="#2a0a10" stroke-width="5" stroke-linejoin="round"/>\n')
    # ゆか（市松もようを遠近で）
    b += f'<rect x="0" y="{GROUND}" width="{W}" height="{H - GROUND}" fill="url(#floor)"/>\n'
    vx = W / 2
    rows = [GROUND, GROUND + 40, GROUND + 92, GROUND + 160, H]
    for r in range(len(rows) - 1):
        for c in range(-12, 13):
            if (r + c) % 2:
                continue
            def px(cc, y):
                t = (y - (GROUND - 300)) / (H - (GROUND - 300))
                return vx + cc * 130 * t
            y0, y1 = rows[r], rows[r + 1]
            b += f'<path d="M{px(c, y0):.0f} {y0} L{px(c + 1, y0):.0f} {y0} L{px(c + 1, y1):.0f} {y1} L{px(c, y1):.0f} {y1} Z" fill="#2c2a5a" opacity="0.6"/>'
    b += f'\n<path d="M{vx - 160} {GROUND} L{vx + 160} {GROUND} L{vx + 320} {H} L{vx - 320} {H} Z" fill="url(#carpet)" stroke="#2a0a10" stroke-width="6"/>'
    b += f'<path d="M{vx - 140} {GROUND} L{vx - 290} {H} M{vx + 140} {GROUND} L{vx + 290} {H}" stroke="#f2c14e" stroke-width="6"/>\n'
    # しょく台
    for x in [270, 1266]:
        b += (f'<ellipse cx="{x}" cy="{GROUND + 30}" rx="40" ry="10" fill="#14132e"/>'
              f'<path d="M{x - 6} {GROUND + 30} L{x - 6} {GROUND - 120} L{x + 6} {GROUND - 120} L{x + 6} {GROUND + 30} Z" fill="#c9a24a" stroke="#2a1a08" stroke-width="4"/>'
              f'<rect x="{x - 14}" y="{GROUND - 170}" width="28" height="50" fill="#f4ecd8" stroke="#2a1a08" stroke-width="4"/>'
              f'<circle cx="{x}" cy="{GROUND - 190}" r="90" fill="url(#flame)"/>'
              f'<path d="M{x} {GROUND - 214} Q{x + 12} {GROUND - 186} {x} {GROUND - 172} Q{x - 12} {GROUND - 186} {x} {GROUND - 214} Z" fill="#fff4b0" stroke="#ff8a00" stroke-width="3"/>\n')
    write('castle', svg(defs, b))


# ================= 遺跡（ストーンゴーレム） =================
def ruins():
    rnd = random.Random(4)
    defs = (lin('sky', [(0, '#4fb3ff'), (0.6, '#a9dcff'), (1, '#fbe9c4')])
            + rad('sun', [(0, '#fffbe6'), (0.3, '#fff0b8', 0.8), (1, '#fff0b8', 0)])
            + lin('dune1', [(0, '#f4d39a'), (1, '#e3b56e')])
            + lin('dune2', [(0, '#eec47e'), (1, '#d39e55')])
            + lin('sand', [(0, '#f1cf8c'), (1, '#c8914a')])
            + lin('stone', [(0, '#efe0c0'), (0.5, '#d2b98c'), (1, '#9c8358')], 1, 0))
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/>\n'
    b += f'<circle cx="260" cy="190" r="240" fill="url(#sun)"/><circle cx="260" cy="190" r="64" fill="#fffbe6"/>\n'
    for cx, cy, s in [(700, 140, 0.8), (1150, 210, 1.0), (1420, 110, 0.6)]:
        b += cloud(cx, cy, s, shade='#f3dcc0', line='#c9a27a')
    b += ridge(560, 40, 0.004, 21, 'url(#dune1)', 0.1, stroke='#c9965a')
    # くずれた柱
    def pillar(x, base, h, s, broken):
        o = f'<g stroke="#4a3620" stroke-width="{6 * s:.1f}" stroke-linejoin="round">'
        o += f'<rect x="{x - 50 * s}" y="{base - 30 * s}" width="{100 * s}" height="{30 * s}" fill="#c4a87a"/>'
        top = base - 30 * s - h
        if broken:
            o += f'<path d="M{x - 38 * s} {base - 30 * s} L{x - 38 * s} {top + 20 * s} L{x - 20 * s} {top} L{x} {top + 26 * s} L{x + 16 * s} {top + 6 * s} L{x + 38 * s} {top + 30 * s} L{x + 38 * s} {base - 30 * s} Z" fill="url(#stone)"/>'
        else:
            o += f'<rect x="{x - 38 * s}" y="{top}" width="{76 * s}" height="{h}" fill="url(#stone)"/>'
            o += f'<rect x="{x - 54 * s}" y="{top - 24 * s}" width="{108 * s}" height="{26 * s}" fill="#d9c196"/>'
        o += '</g>'
        for dx in (-18, 0, 18):
            o += f'<path d="M{x + dx * s} {base - 34 * s} L{x + dx * s} {top + 34 * s}" stroke="#9c8358" stroke-width="{4 * s:.1f}"/>'
        return o + '\n'
    b += pillar(260, 700, 300, 0.9, False) + pillar(420, 690, 200, 0.75, True) + pillar(1190, 700, 260, 0.9, True) + pillar(1350, 690, 330, 0.8, False)
    # 半分くずれたアーチ
    b += ('<path d="M560 690 L560 420 Q768 260 976 420 L976 520 L930 470 L930 690 L880 690 L880 450 Q768 350 656 450 L656 690 Z" '
          'fill="#e2cfa6" stroke="#8a7350" stroke-width="6" stroke-linejoin="round"/>\n')
    b += ridge(700, 18, 0.006, 22, 'url(#dune2)', 0.1, stroke='#b8823f')
    b += f'<rect x="0" y="{GROUND}" width="{W}" height="{H - GROUND}" fill="url(#sand)"/>\n'
    # 砂の波もよう
    for i in range(28):
        y = rnd.uniform(GROUND + 20, H - 10); x = rnd.uniform(-100, W)
        if 420 < x < 1000 and y < 950:
            continue
        b += f'<path d="M{x:.0f} {y:.0f} q60 -14 120 0 t120 0" fill="none" stroke="#b8823f" stroke-width="4" opacity="0.6" stroke-linecap="round"/>'
    # ころがる石ブロックとサボテン
    for x, y, s in [(150, 920, 1.2), (1400, 880, 1.0), (330, 820, 0.7)]:
        b += f'<path d="M{x - 60 * s} {y} L{x - 50 * s} {y - 60 * s} L{x + 40 * s} {y - 70 * s} L{x + 64 * s} {y - 10 * s} L{x + 50 * s} {y + 10 * s} Z" fill="url(#stone)" stroke="#4a3620" stroke-width="6" stroke-linejoin="round"/>'
    for x, y, s in [(1250, 840, 1), (1480, 960, 1.3)]:
        b += (f'<g stroke="#1f3d1a" stroke-width="5" stroke-linejoin="round" fill="#5fae4a">'
              f'<rect x="{x - 14 * s}" y="{y - 110 * s}" width="{28 * s}" height="{110 * s}" rx="{14 * s}"/>'
              f'<path d="M{x - 14 * s} {y - 60 * s} L{x - 40 * s} {y - 60 * s} L{x - 40 * s} {y - 90 * s}" fill="none" stroke-width="{18 * s}"/>'
              f'</g><path d="M{x - 4 * s} {y - 100 * s} L{x - 4 * s} {y - 20 * s}" stroke="#9fe07a" stroke-width="4"/>\n')
    write('ruins', svg(defs, b))


# ================= 火山（マグマドラゴン） =================
def volcano():
    rnd = random.Random(5)
    defs = (lin('sky', [(0, '#1a0303'), (0.5, '#5c0d08'), (1, '#c2361a')])
            + lin('mount', [(0, '#3a1a14'), (1, '#1a0b08')])
            + rad('crater', [(0, '#ffe08a', 0.95), (0.4, '#ff7a1a', 0.6), (1, '#ff3d00', 0)])
            + lin('lava', [(0, '#fff2a0'), (0.4, '#ffaa1a'), (1, '#ff4400')])
            + lin('rock', [(0, '#3a2420'), (1, '#140807')])
            + rad('heat', [(0, '#ff6a1a', 0.45), (1, '#ff6a1a', 0)]))
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/>\n'
    # けむりの雲
    for cx, cy, s in [(200, 140, 1.3), (620, 90, 1.0), (1100, 160, 1.4), (1450, 260, 0.9)]:
        b += cloud(cx, cy, s, fill='#4a2a26', shade='#2a1412', line='#1a0a08', shine=False)
    # 奥の火山とふん火
    b += f'<circle cx="1060" cy="250" r="300" fill="url(#crater)"/>\n'
    b += ('<path d="M760 700 L960 290 L1020 270 L1100 268 L1160 290 L1400 700 Z" fill="url(#mount)" stroke="#0d0504" stroke-width="8" stroke-linejoin="round"/>'
          '<path d="M1000 276 C990 380 1040 470 1000 600 M1100 276 C1120 360 1080 450 1130 560" fill="none" stroke="url(#lava)" stroke-width="16" stroke-linecap="round"/>'
          '<path d="M1000 276 C990 380 1040 470 1000 600 M1100 276 C1120 360 1080 450 1130 560" fill="none" stroke="#fff2a0" stroke-width="5" stroke-linecap="round" opacity="0.8"/>\n')
    for _ in range(18):
        a = rnd.uniform(-2.6, -0.5); d = rnd.uniform(60, 220)
        x = 1060 + math.cos(a) * d; y = 240 + math.sin(a) * d
        b += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rnd.uniform(6, 14):.0f}" fill="#ffb02e" stroke="#7a1a00" stroke-width="3"/>'
    b += '\n' + ridge(600, 60, 0.006, 31, '#2a1210', 0.4, stroke='#0d0504')
    # 中くらいの岩山
    for x, h in [(140, 300), (380, 220), (1460, 260)]:
        b += f'<path d="M{x - 160} 720 L{x - 40} {720 - h} L{x + 20} {720 - h + 30} L{x + 150} 720 Z" fill="#24100d" stroke="#0d0504" stroke-width="7" stroke-linejoin="round"/><path d="M{x - 40} {720 - h} L{x - 90} 720" stroke="#4a2420" stroke-width="6"/>\n'
    b += f'<rect x="0" y="{GROUND}" width="{W}" height="{H - GROUND}" fill="url(#rock)"/>\n'
    b += f'<ellipse cx="{W / 2}" cy="{H}" rx="900" ry="220" fill="url(#heat)"/>\n'
    # 流れるマグマ
    b += (f'<path d="M-20 {GROUND + 60} C200 {GROUND + 30} 320 {GROUND + 120} 420 {GROUND + 90} C460 {GROUND + 80} 470 {GROUND + 110} 440 {GROUND + 130} C330 {GROUND + 170} 160 {GROUND + 120} -20 {GROUND + 140} Z" fill="url(#lava)" stroke="#7a1a00" stroke-width="6"/>'
          f'<path d="M{W + 20} {GROUND + 110} C1350 {GROUND + 80} 1220 {GROUND + 170} 1120 {GROUND + 150} C1080 {GROUND + 145} 1080 {GROUND + 180} 1120 {GROUND + 200} C1260 {GROUND + 240} 1400 {GROUND + 190} {W + 20} {GROUND + 200} Z" fill="url(#lava)" stroke="#7a1a00" stroke-width="6"/>\n')
    # 地面のヒビ（光る）
    for _ in range(14):
        x = rnd.uniform(0, W); y = rnd.uniform(GROUND + 40, H)
        if 430 < x < 1100 and y < 960:
            continue
        pts = [(x, y)]
        for i in range(4):
            x += rnd.uniform(-40, 40); y += rnd.uniform(-10, 20); pts.append((x, y))
        d = 'M' + ' L'.join(f'{px:.0f} {py:.0f}' for px, py in pts)
        b += f'<path d="{d}" fill="none" stroke="#ff7a1a" stroke-width="5" stroke-linecap="round"/><path d="{d}" fill="none" stroke="#ffe08a" stroke-width="2"/>'
    write('volcano', svg(defs, b))


# ================= 天空の神殿（テンリュウガ） =================
def sky():
    rnd = random.Random(6)
    defs = (lin('sky', [(0, '#16245e'), (0.45, '#4a6fd1'), (0.8, '#f2b98a'), (1, '#ffe2a8')])
            + rad('sun', [(0, '#fffbe6'), (0.2, '#ffe9a8', 0.9), (1, '#ffd27a', 0)])
            + lin('peak', [(0, '#7b8fd6'), (1, '#b9b3e0')])
            + lin('stone', [(0, '#e9e2d0'), (1, '#a99f8a')])
            + lin('cloudsea', [(0, '#fff6ea'), (1, '#c9c2e6')])
            + lin('pillar', [(0, '#f1ead8'), (0.5, '#d2c7ad'), (1, '#9c917a')], 1, 0))
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/>\n'
    # 星（上のほうだけ、のこっている夜明けの星）
    for _ in range(40):
        x = rnd.uniform(0, W); y = rnd.uniform(0, 260)
        b += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rnd.uniform(1, 2.6):.1f}" fill="#ffffff" opacity="{rnd.uniform(0.4, 0.9):.2f}"/>'
    b += '\n<circle cx="1050" cy="600" r="420" fill="url(#sun)"/>\n'
    b += rays(1050, 600, 11, 1200, '#fff3c9', 0.1, 2.2, -1.57)
    # 空にうかぶ山
    for x, y, s in [(250, 360, 1.0), (620, 300, 0.7), (1380, 340, 0.9)]:
        b += (f'<path d="M{x - 120 * s} {y + 60 * s} L{x - 50 * s} {y - 90 * s} L{x - 10 * s} {y - 40 * s} L{x + 30 * s} {y - 130 * s} L{x + 120 * s} {y + 60 * s} '
              f'L{x + 40 * s} {y + 190 * s} L{x - 30 * s} {y + 150 * s} Z" fill="url(#peak)" stroke="#5a6aa8" stroke-width="4" stroke-linejoin="round"/>'
              f'<path d="M{x + 30 * s} {y - 130 * s} L{x + 120 * s} {y + 60 * s} L{x + 40 * s} {y + 190 * s} L{x + 10 * s} {y} Z" fill="#5a6aa8" opacity="0.35"/>')
        b += cloud(x, y + 66 * s, 0.9 * s, fill='#fff3ea', shade='#d9c8e6', line='#a99bc9')
    # 遠くの雲
    for cx, cy, s in [(120, 200, 0.9), (480, 140, 0.6), (900, 180, 0.8), (1250, 120, 0.7), (1480, 230, 0.6)]:
        b += cloud(cx, cy, s, fill='#ffffff', shade='#e7d6f0', line='#b2a4d6')
    # 雲の海
    b += ridge(640, 26, 0.01, 41, 'url(#cloudsea)', 0.4, stroke='#b2a4d6')
    for i in range(16):
        x = i * 104 + rnd.uniform(-20, 20)
        b += f'<circle cx="{x:.0f}" cy="{660 + rnd.uniform(-10, 20):.0f}" r="{rnd.uniform(50, 80):.0f}" fill="#fff8f0"/>'
    b += '\n'
    # 古い神殿の床（遠近つき）
    vx = W / 2
    b += (f'<path d="M{vx - 560} {GROUND} L{vx + 560} {GROUND} L{vx + 820} {H} L{vx - 820} {H} Z" fill="url(#stone)" stroke="#6e6452" stroke-width="7" stroke-linejoin="round"/>')
    for k in range(1, 6):
        y = GROUND + (H - GROUND) * (k / 6) ** 1.4
        hw = 560 + 260 * (y - GROUND) / (H - GROUND)
        b += f'<path d="M{vx - hw:.0f} {y:.0f} L{vx + hw:.0f} {y:.0f}" stroke="#8c816c" stroke-width="3"/>'
    for c in range(-6, 7):
        b += f'<path d="M{vx + c * 93:.0f} {GROUND} L{vx + c * 136:.0f} {H}" stroke="#8c816c" stroke-width="3"/>'
    # 床の紋章（光る円）
    b += (f'<ellipse cx="{vx}" cy="{GROUND + 150}" rx="300" ry="70" fill="none" stroke="#5fe3d0" stroke-width="6" opacity="0.7"/>'
          f'<ellipse cx="{vx}" cy="{GROUND + 150}" rx="220" ry="50" fill="none" stroke="#f2c14e" stroke-width="4" opacity="0.8"/>\n')
    # こわれた柱
    def pillar(x, base, h, s, broken):
        top = base - h
        o = f'<g stroke="#5e5442" stroke-width="{6 * s:.1f}" stroke-linejoin="round">'
        o += f'<rect x="{x - 56 * s}" y="{base - 26 * s}" width="{112 * s}" height="{26 * s}" fill="#cfc4aa"/>'
        if broken:
            o += f'<path d="M{x - 40 * s} {base - 26 * s} L{x - 40 * s} {top + 30 * s} L{x - 14 * s} {top} L{x + 6 * s} {top + 24 * s} L{x + 40 * s} {top + 10 * s} L{x + 40 * s} {base - 26 * s} Z" fill="url(#pillar)"/>'
        else:
            o += f'<rect x="{x - 40 * s}" y="{top}" width="{80 * s}" height="{h - 26 * s}" fill="url(#pillar)"/>'
            o += f'<rect x="{x - 58 * s}" y="{top - 26 * s}" width="{116 * s}" height="{28 * s}" fill="#e3d9bf"/>'
        o += '</g>'
        for dx in (-20, 0, 20):
            o += f'<path d="M{x + dx * s} {base - 30 * s} L{x + dx * s} {top + 36 * s}" stroke="#a99f8a" stroke-width="{4 * s:.1f}"/>'
        o += f'<path d="M{x - 40 * s} {top + 60 * s} q30 20 20 60 t10 80" fill="none" stroke="#6fbf6a" stroke-width="{7 * s:.1f}" stroke-linecap="round"/>'
        return o + '\n'
    b += pillar(150, 900, 520, 1.1, False) + pillar(330, 800, 300, 0.85, True) + pillar(1206, 800, 340, 0.85, True) + pillar(1390, 900, 560, 1.1, False)
    # 手前の雲
    for cx, cy, s in [(40, 1000, 1.4), (1500, 990, 1.3)]:
        b += cloud(cx, cy, s, fill='#ffffff', shade='#ddd0ee', line='#a99bc9')
    # 鳥
    for x, y in [(700, 250), (740, 270), (770, 240)]:
        b += f'<path d="M{x - 14} {y} q7 -8 14 0 q7 -8 14 0" fill="none" stroke="#2a2f5e" stroke-width="3" stroke-linecap="round"/>'
    write('sky', svg(defs, b))


# ================= 氷雪の峰（怪鳥ブリザード） =================
def snow():
    rnd = random.Random(7)
    defs = (lin('sky', [(0, '#5d7fb8'), (0.5, '#a9c4e6'), (1, '#e8f1fb')])
            + lin('peak', [(0, '#ffffff'), (1, '#c9d9ef')], 1, 1)
            + lin('peak2', [(0, '#dfe9f7'), (1, '#9fb6d8')], 1, 1)
            + lin('snowg', [(0, '#ffffff'), (1, '#cfdcef')])
            + lin('ice', [(0, '#e8fbff'), (0.5, '#8fdcf2'), (1, '#3f9fd6')], 1, 1)
            + rad('moon', [(0, '#ffffff'), (0.3, '#eaf4ff', 0.8), (1, '#eaf4ff', 0)]))
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/>\n'
    b += '<circle cx="1180" cy="170" r="220" fill="url(#moon)"/><circle cx="1180" cy="170" r="56" fill="#fbfdff"/>\n'
    # 遠くの氷の山なみ
    def peaks(base, n, hmin, hmax, fill, shade, line, seed):
        r = random.Random(seed)
        o = ''
        x = -100
        while x < W + 100:
            w = r.uniform(180, 320); h = r.uniform(hmin, hmax)
            top = (x + w / 2 + r.uniform(-30, 30), base - h)
            # 稜線をギザギザにする（となりの小さな峰とけずれた岩）
            lpts = [(x, base), (x + w * 0.18, base - h * r.uniform(0.35, 0.5)), (x + w * 0.3, base - h * r.uniform(0.3, 0.42)), top]
            rpts = [(top[0] + w * 0.12, base - h * r.uniform(0.7, 0.8)), (top[0] + w * 0.2, base - h * r.uniform(0.6, 0.7)), (x + w * 0.85, base - h * r.uniform(0.25, 0.4)), (x + w, base)]
            d = 'M' + ' L'.join(f'{px:.0f} {py:.0f}' for px, py in lpts + rpts) + ' Z'
            o += f'<path d="{d}" fill="{fill}" stroke="{line}" stroke-width="4" stroke-linejoin="round"/>'
            # 岩はだのすじ
            o += f'<path d="M{top[0]:.0f} {top[1]:.0f} L{top[0] - w * 0.08:.0f} {base - h * 0.55:.0f} L{top[0] - w * 0.02:.0f} {base - h * 0.3:.0f}" fill="none" stroke="{line}" stroke-width="3" opacity="0.5"/>'
            o += f'<path d="M{top[0]:.0f} {top[1]:.0f} L{x + w:.0f} {base} L{top[0] + w * 0.12:.0f} {base} Z" fill="{shade}" opacity="0.55"/>'
            o += f'<path d="M{top[0] - 8:.0f} {top[1] + 40:.0f} L{top[0]:.0f} {top[1] + 14:.0f} L{top[0] + 10:.0f} {top[1] + 50:.0f}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>'
            x += w * 0.7
        return o + '\n'
    b += peaks(560, 0, 220, 360, 'url(#peak2)', '#7f9cc8', '#6d88b5', 71)
    b += peaks(680, 0, 160, 260, 'url(#peak)', '#a9bfe0', '#7f9cc8', 72)
    # 雪をかぶった木
    for i in range(16):
        x = 30 + i * 100 + rnd.uniform(-20, 20)
        if 470 < x < 1060:
            continue
        y = 720 + rnd.uniform(-10, 14); s = rnd.uniform(0.7, 1.0)
        b += (f'<g stroke="#2c4a5e" stroke-width="{4 * s:.1f}" stroke-linejoin="round">'
              f'<rect x="{x - 6 * s:.0f}" y="{y - 24 * s:.0f}" width="{12 * s:.0f}" height="{24 * s:.0f}" fill="#6b4a32"/>'
              f'<path d="M{x - 50 * s:.0f} {y - 20 * s:.0f} L{x:.0f} {y - 150 * s:.0f} L{x + 50 * s:.0f} {y - 20 * s:.0f} Z" fill="#3f7a6a"/>'
              f'</g><path d="M{x - 24 * s:.0f} {y - 90 * s:.0f} L{x:.0f} {y - 150 * s:.0f} L{x + 24 * s:.0f} {y - 90 * s:.0f} Q{x:.0f} {y - 100 * s:.0f} {x - 24 * s:.0f} {y - 90 * s:.0f} Z" fill="#ffffff"/>'
              f'<path d="M{x - 44 * s:.0f} {y - 34 * s:.0f} Q{x:.0f} {y - 52 * s:.0f} {x + 44 * s:.0f} {y - 34 * s:.0f}" fill="none" stroke="#ffffff" stroke-width="{8 * s:.1f}" stroke-linecap="round"/>\n')
    # 雪の地面
    b += f'<rect x="0" y="{GROUND - 20}" width="{W}" height="{H - GROUND + 20}" fill="url(#snowg)"/>\n'
    b += f'<path d="M-20 {GROUND - 20} Q300 {GROUND - 50} 700 {GROUND - 24} T{W + 20} {GROUND - 30}" fill="none" stroke="#9fb6d8" stroke-width="5"/>\n'
    for _ in range(26):
        x = rnd.uniform(0, W); y = rnd.uniform(GROUND, H)
        if 420 < x < 1110 and y < 980:
            continue
        b += f'<path d="M{x:.0f} {y:.0f} q40 -12 80 0" fill="none" stroke="#a9bfe0" stroke-width="4" stroke-linecap="round" opacity="0.7"/>'
    # 氷の結晶のかたまり
    def crystal(x, y, s):
        o = ''
        for dx, h, w, a in [(-30, 100, 20, -0.35), (0, 150, 26, 0), (32, 110, 20, 0.3), (58, 64, 14, 0.55)]:
            o += (f'<g transform="translate({x + dx * s:.0f} {y}) rotate({math.degrees(a):.0f})">'
                  f'<path d="M{-w * s:.0f} 0 L{-w * s:.0f} {-h * s * 0.75:.0f} L0 {-h * s:.0f} L{w * s:.0f} {-h * s * 0.75:.0f} L{w * s:.0f} 0 Z" fill="url(#ice)" stroke="#2c5a7a" stroke-width="5" stroke-linejoin="round"/>'
                  f'<path d="M0 {-h * s:.0f} L0 0" stroke="#ffffff" stroke-width="3" opacity="0.7"/></g>')
        return o + '\n'
    b += crystal(160, 960, 1.1) + crystal(1390, 930, 1.0) + crystal(330, 840, 0.55)
    write('snow', svg(defs, b))


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    field(); cave(); castle(); ruins(); volcano(); sky(); snow()
    print('backgrounds ok')
