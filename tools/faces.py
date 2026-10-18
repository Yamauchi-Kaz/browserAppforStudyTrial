"""モンスターの表情パーツ（顔）の SVG を作る。
python3 tools/faces.py で art/monsters/<名前>-face-<表情>.svg を書き出す。
表情: normal（ふつう）, blink（まばたき）, angry（こうげき）, hurt（いたい）, laugh（あざわらう）, ko（やられた）
"""
import math
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'art', 'monsters')


def svg(body, defs=''):
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">\n'
            + (f'  <defs>{defs}</defs>\n' if defs else '') + body + '</svg>\n')


def swirl(cx, cy, r, color, w=5, turns=2.6):
    """ぐるぐる目"""
    pts = []
    n = 60
    for i in range(n + 1):
        a = i / n * turns * 2 * math.pi
        rr = r * i / n
        pts.append(f'{cx + math.cos(a) * rr:.1f} {cy + math.sin(a) * rr:.1f}')
    return f'  <path d="M{" L".join(pts)}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>\n'


def chevron(cx, cy, size, color, w, left=True):
    """ぎゅっとつぶった目（＞ と ＜）"""
    d = size
    if left:
        p = f'M{cx - d} {cy - d * 0.8} L{cx + d * 0.7} {cy} L{cx - d} {cy + d * 0.8}'
    else:
        p = f'M{cx + d} {cy - d * 0.8} L{cx - d * 0.7} {cy} L{cx + d} {cy + d * 0.8}'
    return f'  <path d="{p}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>\n'


def arc_up(cx, cy, rx, color, w, h=None):
    """にっこり目（∩）"""
    h = h or rx * 0.9
    return f'  <path d="M{cx - rx} {cy + h * 0.3} Q{cx} {cy - h} {cx + rx} {cy + h * 0.3}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>\n'


def line(x1, y1, x2, y2, color, w):
    return f'  <path d="M{x1} {y1} L{x2} {y2}" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>\n'


def sweat(x, y, s=1):
    return (f'  <path d="M{x} {y} C{x - 10 * s} {y + 16 * s} {x - 12 * s} {y + 28 * s} {x} {y + 30 * s} C{x + 12 * s} {y + 28 * s} {x + 10 * s} {y + 16 * s} {x} {y} Z" '
            f'fill="#bfefff" stroke="#2a5a7a" stroke-width="4" stroke-linejoin="round"/>\n'
            f'  <path d="M{x - 3 * s} {y + 14 * s} q-3 6 0 10" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>\n')


def write(name, expr, content):
    with open(os.path.join(OUT, f'{name}-face-{expr}.svg'), 'w') as f:
        f.write(content)


# ---------------- ぷるぷるスライム（のんびり・人なつっこい） ----------------
L = '#1d3b22'
IRIS = ('<radialGradient id="i" cx="50%" cy="38%" r="60%"><stop offset="0" stop-color="#5a8cff"/>'
        '<stop offset="0.55" stop-color="#2440a8"/><stop offset="1" stop-color="#0d1440"/></radialGradient>'
        '<linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0c1c"/><stop offset="1" stop-color="#7a1f35"/></linearGradient>')


def slime_eye(cx, cy, look=0, small=False, half=False):
    pr = 0.55 if small else 1
    out = ''
    if half:  # 上が平らな、きりっとした目
        out += f'  <path d="M{cx - 31} {cy - 6} L{cx + 31} {cy - 14} C{cx + 34} {cy + 20} {cx + 18} {cy + 38} {cx} {cy + 38} C{cx - 20} {cy + 38} {cx - 34} {cy + 20} {cx - 31} {cy - 6} Z" fill="#fff" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>\n'
        out += f'  <ellipse cx="{cx + 6 + look}" cy="{cy + 14}" rx="{19 * pr}" ry="{21 * pr}" fill="url(#i)"/>\n'
        out += f'  <ellipse cx="{cx + 7 + look}" cy="{cy + 16}" rx="{9 * pr}" ry="{11 * pr}" fill="#060818"/>\n'
        out += f'  <circle cx="{cx + look}" cy="{cy + 8}" r="6" fill="#fff"/>\n'
        return out
    out += f'  <ellipse cx="{cx}" cy="{cy}" rx="31" ry="38" fill="#fff" stroke="{L}" stroke-width="6"/>\n'
    out += f'  <ellipse cx="{cx + 6 + look}" cy="{cy + 6}" rx="{21 * pr}" ry="{27 * pr}" fill="url(#i)"/>\n'
    out += f'  <ellipse cx="{cx + 7 + look}" cy="{cy + 9}" rx="{10 * pr}" ry="{14 * pr}" fill="#060818"/>\n'
    out += f'  <circle cx="{cx - 2 + look}" cy="{cy - 6}" r="{8 * pr + 1}" fill="#fff"/>\n'
    out += f'  <circle cx="{cx + 14 + look}" cy="{cy + 20}" r="3.5" fill="#fff" opacity="0.9"/>\n'
    out += f'  <path d="M{cx - 32} {cy - 12} Q{cx} {cy - 46} {cx + 32} {cy - 12}" fill="none" stroke="{L}" stroke-width="8" stroke-linecap="round"/>\n'
    return out


write('slime', 'normal', svg(
    f'  <path d="M168 280 Q196 262 226 274" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>\n'
    f'  <path d="M286 274 Q316 262 344 280" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>\n'
    + slime_eye(200, 326) + slime_eye(312, 326) +
    f'  <path d="M222 384 Q256 392 290 384 Q286 428 256 430 Q226 428 222 384 Z" fill="url(#m)" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>\n'
    '  <path d="M234 416 Q256 404 278 416 Q268 428 256 428 Q244 428 234 416 Z" fill="#ff7f93"/>\n'
    '  <path d="M232 388 L240 398 L248 389 Z" fill="#ffffff"/>\n', IRIS))
SLIME_BROWS = (f'  <path d="M168 280 Q196 262 226 274" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>\n'
               f'  <path d="M286 274 Q316 262 344 280" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>\n')
SLIME_MOUTH = (f'  <path d="M222 384 Q256 392 290 384 Q286 428 256 430 Q226 428 222 384 Z" fill="url(#m)" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>\n'
               '  <path d="M234 416 Q256 404 278 416 Q268 428 256 428 Q244 428 234 416 Z" fill="#ff7f93"/>\n'
               '  <path d="M232 388 L240 398 L248 389 Z" fill="#ffffff"/>\n')
write('slime', 'blink', svg(SLIME_BROWS
    + f'  <path d="M168 326 Q200 350 232 326" fill="none" stroke="{L}" stroke-width="8" stroke-linecap="round"/>\n'
    + f'  <path d="M280 326 Q312 350 344 326" fill="none" stroke="{L}" stroke-width="8" stroke-linecap="round"/>\n'
    + SLIME_MOUTH, IRIS))
write('slime', 'angry', svg(
    line(166, 270, 228, 292, L, 9) + line(346, 270, 284, 292, L, 9)
    + slime_eye(200, 322, half=True) + slime_eye(312, 322, half=True) +
    # 歯をくいしばる口
    f'  <path d="M210 386 Q256 380 302 386 L298 418 Q256 426 214 418 Z" fill="#ffffff" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>\n'
    f'  <path d="M212 402 Q256 408 300 402 M234 384 L232 422 M256 382 L256 424 M278 384 L280 422" fill="none" stroke="{L}" stroke-width="4"/>\n'
    # むんっ（力こぶマーク）
    f'  <path d="M366 236 l14 -14 M376 246 l20 -6 M362 226 l4 -20" stroke="{L}" stroke-width="5" stroke-linecap="round"/>\n', IRIS))
write('slime', 'hurt', svg(
    f'  <path d="M170 262 Q196 278 226 270" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>\n'
    f'  <path d="M286 270 Q316 278 342 262" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>\n'
    + chevron(200, 326, 24, L, 9, True) + chevron(312, 326, 24, L, 9, False) +
    # なみだ
    '  <path d="M176 346 C170 362 172 376 182 380 C192 376 192 362 186 346 Z" fill="#bfefff" stroke="#2a5a7a" stroke-width="3"/>\n'
    # ふにゃっとした口
    f'  <path d="M226 400 Q238 388 250 400 Q262 412 274 400 Q284 390 290 398" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>\n'
    + sweat(352, 236, 1.2)))
write('slime', 'laugh', svg(
    f'  <path d="M168 270 Q196 250 226 262" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>\n'
    f'  <path d="M286 262 Q316 250 344 270" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>\n'
    + arc_up(200, 334, 28, L, 9) + arc_up(312, 334, 28, L, 9) +
    f'  <path d="M206 372 Q256 384 306 372 Q300 440 256 444 Q212 440 206 372 Z" fill="url(#m)" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>\n'
    '  <path d="M226 424 Q256 404 286 424 Q274 440 256 440 Q238 440 226 424 Z" fill="#ff7f93"/>\n'
    '  <path d="M220 376 L230 390 L240 378 Z M272 378 L282 390 L292 376 Z" fill="#ffffff"/>\n', IRIS))
write('slime', 'ko', svg(
    swirl(200, 326, 28, L, 6) + swirl(312, 326, 28, L, 6) +
    f'  <ellipse cx="256" cy="406" rx="22" ry="18" fill="url(#m)" stroke="{L}" stroke-width="6"/>\n'
    '  <path d="M248 414 Q256 440 266 414 Z" fill="#ff7f93" stroke="#1d3b22" stroke-width="3"/>\n', IRIS))

# ---------------- バットン（いたずらっ子） ----------------
L = '#241536'
BAT_DEFS = ('<radialGradient id="i" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#fffbd0"/>'
            '<stop offset="0.45" stop-color="#ffd23f"/><stop offset="1" stop-color="#e07d00"/></radialGradient>'
            '<linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0718"/><stop offset="1" stop-color="#6e1438"/></linearGradient>')
EYE_L = 'M176 262 C176 236 200 246 214 250 C236 256 244 268 244 284 C244 306 226 318 208 318 C188 318 176 300 176 282 Z'
EYE_R = 'M336 262 C336 236 312 246 298 250 C276 256 268 268 268 284 C268 306 286 318 304 318 C324 318 336 300 336 282 Z'


def bat_eyes(pupil_rx=9, pupil_ry=17, dx=0):
    return (f'  <path d="{EYE_L}" fill="url(#i)" stroke="{L}" stroke-width="6"/>\n'
            f'  <path d="{EYE_R}" fill="url(#i)" stroke="{L}" stroke-width="6"/>\n'
            f'  <ellipse cx="{214 + dx}" cy="286" rx="{pupil_rx}" ry="{pupil_ry}" fill="#1a0d24"/>\n'
            f'  <ellipse cx="{298 + dx}" cy="286" rx="{pupil_rx}" ry="{pupil_ry}" fill="#1a0d24"/>\n'
            '  <circle cx="204" cy="274" r="7" fill="#fff"/><circle cx="288" cy="274" r="7" fill="#fff"/>\n'
            '  <circle cx="220" cy="302" r="3" fill="#fff"/><circle cx="304" cy="302" r="3" fill="#fff"/>\n')


FANGS = f'  <path d="M218 322 L226 344 L234 326 Z M294 326 L286 344 L278 322 Z" fill="#fff" stroke="{L}" stroke-width="3" stroke-linejoin="round"/>\n'
write('bat', 'normal', svg(
    line(172, 232, 240, 250, L, 10) + line(340, 232, 272, 250, L, 10) + bat_eyes() +
    f'  <path d="M206 318 Q256 340 306 318 Q296 360 256 362 Q216 360 206 318 Z" fill="url(#m)" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>\n'
    '  <path d="M232 350 Q256 338 280 350 Q270 360 256 360 Q242 360 232 350 Z" fill="#ff7aa8"/>\n' + FANGS, BAT_DEFS))
write('bat', 'blink', svg(
    line(172, 232, 240, 250, L, 10) + line(340, 232, 272, 250, L, 10) +
    f'  <path d="M178 288 Q210 306 242 288" fill="none" stroke="{L}" stroke-width="8" stroke-linecap="round"/>\n'
    f'  <path d="M270 288 Q302 306 334 288" fill="none" stroke="{L}" stroke-width="8" stroke-linecap="round"/>\n'
    f'  <path d="M206 318 Q256 340 306 318 Q296 360 256 362 Q216 360 206 318 Z" fill="url(#m)" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>\n'
    '  <path d="M232 350 Q256 338 280 350 Q270 360 256 360 Q242 360 232 350 Z" fill="#ff7aa8"/>\n' + FANGS, BAT_DEFS))
write('bat', 'angry', svg(
    line(170, 222, 244, 256, L, 12) + line(342, 222, 268, 256, L, 12) + bat_eyes(5, 9) +
    # 大口をあけて かみつく
    f'  <path d="M196 314 Q256 330 316 314 Q306 392 256 396 Q206 392 196 314 Z" fill="url(#m)" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>\n'
    '  <path d="M226 378 Q256 360 286 378 Q272 394 256 394 Q240 394 226 378 Z" fill="#ff7aa8"/>\n'
    f'  <path d="M208 318 L218 352 L230 322 Z M304 318 L294 352 L282 322 Z M214 384 l8 -14 l8 14 M298 384 l-8 -14 l-8 14" fill="#fff" stroke="{L}" stroke-width="3" stroke-linejoin="round"/>\n', BAT_DEFS))
write('bat', 'hurt', svg(
    f'  <path d="M176 246 Q206 262 240 254" fill="none" stroke="{L}" stroke-width="9" stroke-linecap="round"/>\n'
    f'  <path d="M336 246 Q306 262 272 254" fill="none" stroke="{L}" stroke-width="9" stroke-linecap="round"/>\n'
    + chevron(210, 286, 22, L, 9, True) + chevron(302, 286, 22, L, 9, False) +
    f'  <path d="M220 340 Q232 326 244 338 Q256 350 268 338 Q280 326 292 340" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>\n'
    f'  <path d="M228 334 L234 350 L240 336 Z" fill="#fff" stroke="{L}" stroke-width="3"/>\n' + sweat(352, 210)))
write('bat', 'laugh', svg(
    line(172, 238, 240, 246, L, 10) + line(340, 238, 272, 246, L, 10) +
    arc_up(210, 292, 26, L, 9) + arc_up(302, 292, 26, L, 9) +
    f'  <path d="M200 316 Q256 338 312 316 Q300 372 256 374 Q212 372 200 316 Z" fill="url(#m)" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>\n'
    # べろを出して からかう
    f'  <path d="M262 352 C266 384 300 390 300 362 C298 350 286 348 262 352 Z" fill="#ff7aa8" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n'
    f'  <path d="M280 356 L284 374" stroke="#d94f86" stroke-width="3" stroke-linecap="round"/>\n' + FANGS, BAT_DEFS))
write('bat', 'ko', svg(
    swirl(210, 284, 26, L, 6) + swirl(302, 284, 26, L, 6) +
    f'  <path d="M226 330 Q256 346 286 330 Q280 354 256 356 Q232 354 226 330 Z" fill="url(#m)" stroke="{L}" stroke-width="5"/>\n'
    f'  <path d="M246 346 C244 372 270 372 268 346 Z" fill="#ff7aa8" stroke="{L}" stroke-width="4"/>\n', BAT_DEFS))

# ---------------- ダークまどうし（ミステリアス） ----------------
GLOW = ('<radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{c1}" stop-opacity="0.9"/>'
        '<stop offset="0.4" stop-color="{c2}" stop-opacity="0.45"/><stop offset="1" stop-color="{c2}" stop-opacity="0"/></radialGradient>')
Y = GLOW.format(c1='#fff59d', c2='#ffd600')
R = GLOW.format(c1='#ffb3a0', c2='#ff2a00')
P = GLOW.format(c1='#e8c4ff', c2='#9b4dff')
halo = '  <ellipse cx="228" cy="186" rx="38" ry="28" fill="url(#g)"/>\n  <ellipse cx="288" cy="186" rx="38" ry="28" fill="url(#g)"/>\n'
write('mage', 'normal', svg(halo +
    '  <path d="M208 186 C218 172 236 172 248 182 C236 194 220 196 208 186 Z" fill="#fff9c4" stroke="#ffb300" stroke-width="3"/>\n'
    '  <path d="M308 186 C298 172 280 172 268 182 C280 194 296 196 308 186 Z" fill="#fff9c4" stroke="#ffb300" stroke-width="3"/>\n', Y))
write('mage', 'blink', svg(
    '  <path d="M210 188 L246 186 M302 188 L266 186" stroke="#ffd600" stroke-width="3" stroke-linecap="round" opacity="0.8"/>\n'))
write('mage', 'angry', svg(halo.replace('rx="38"', 'rx="46"') +
    '  <path d="M204 174 L250 188 C238 198 216 196 204 174 Z" fill="#ffe0d6" stroke="#ff3d00" stroke-width="4" stroke-linejoin="round"/>\n'
    '  <path d="M312 174 L266 188 C278 198 300 196 312 174 Z" fill="#ffe0d6" stroke="#ff3d00" stroke-width="4" stroke-linejoin="round"/>\n', R))
write('mage', 'hurt', svg(halo +
    chevron(228, 186, 14, '#fff59d', 6, True) + chevron(288, 186, 14, '#fff59d', 6, False), Y))
write('mage', 'laugh', svg(halo +
    arc_up(228, 192, 18, '#fff59d', 6) + arc_up(288, 192, 18, '#fff59d', 6) +
    '  <path d="M236 214 Q256 226 276 214" fill="none" stroke="#fff59d" stroke-width="4" stroke-linecap="round" opacity="0.8"/>\n', Y))
write('mage', 'ko', svg(halo + swirl(228, 186, 14, '#e8c4ff', 4) + swirl(288, 186, 14, '#e8c4ff', 4), P))

# ---------------- ストーンゴーレム（無口な力もち） ----------------
C = GLOW.format(c1='#b8ffff', c2='#3ff2ff')
halo = '  <ellipse cx="240" cy="169" rx="26" ry="16" fill="url(#g)"/>\n  <ellipse cx="280" cy="169" rx="26" ry="16" fill="url(#g)"/>\n'
write('golem', 'normal', svg(halo +
    '  <rect x="228" y="164" width="24" height="9" rx="4" fill="#e0ffff"/>\n  <rect x="268" y="164" width="24" height="9" rx="4" fill="#e0ffff"/>\n', C))
write('golem', 'blink', svg(
    '  <rect x="228" y="167" width="24" height="3" rx="1.5" fill="#7fd8e0"/>\n  <rect x="268" y="167" width="24" height="3" rx="1.5" fill="#7fd8e0"/>\n'))
write('golem', 'angry', svg(halo +
    '  <path d="M226 162 L254 170 L252 177 L226 171 Z" fill="#ffd0c4"/>\n  <path d="M294 162 L266 170 L268 177 L294 171 Z" fill="#ffd0c4"/>\n',
    GLOW.format(c1='#ffb3a0', c2='#ff3d00')))
write('golem', 'hurt', svg(halo + chevron(240, 169, 9, '#e0ffff', 5, True) + chevron(280, 169, 9, '#e0ffff', 5, False), C))
write('golem', 'laugh', svg(halo + arc_up(240, 172, 11, '#e0ffff', 5, 9) + arc_up(280, 172, 11, '#e0ffff', 5, 9), C))
write('golem', 'ko', svg('  <circle cx="240" cy="169" r="4" fill="#556b70"/>\n  <circle cx="280" cy="169" r="4" fill="#556b70"/>\n'))

# ---------------- マグマドラゴン（ほこり高いボス） ----------------
L = '#2a0d0a'
DR = ('<radialGradient id="i" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#fffbd0"/>'
      '<stop offset="0.5" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff8a00"/></radialGradient>'
      '<radialGradient id="f" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fff7b0"/>'
      '<stop offset="0.5" stop-color="#ffb000"/><stop offset="1" stop-color="#ff4d00"/></radialGradient>')
BROW_N = (f'  <path d="M196 122 L246 136 L240 146 L192 134 Z" fill="#8c1a0e" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n'
          f'  <path d="M316 122 L266 136 L272 146 L320 134 Z" fill="#8c1a0e" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n')
EYES_N = (f'  <path d="M200 140 C206 128 224 128 240 140 C232 154 210 156 200 140 Z" fill="url(#i)" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n'
          f'  <path d="M312 140 C306 128 288 128 272 140 C280 154 302 156 312 140 Z" fill="url(#i)" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n'
          '  <ellipse cx="222" cy="142" rx="4" ry="10" fill="#1a0505"/><ellipse cx="290" cy="142" rx="4" ry="10" fill="#1a0505"/>\n'
          '  <circle cx="214" cy="138" r="3.5" fill="#fff"/><circle cx="282" cy="138" r="3.5" fill="#fff"/>\n')
write('dragon', 'normal', svg(EYES_N + BROW_N, DR))
write('dragon', 'blink', svg(
    f'  <path d="M198 142 Q220 152 242 142" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>\n'
    f'  <path d="M270 142 Q292 152 314 142" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>\n' + BROW_N, DR))
write('dragon', 'angry', svg(
    EYES_N.replace('rx="4" ry="10"', 'rx="2.5" ry="7"') +
    f'  <path d="M192 112 L248 138 L242 148 L188 126 Z" fill="#8c1a0e" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n'
    f'  <path d="M320 112 L264 138 L270 148 L324 126 Z" fill="#8c1a0e" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n'
    # ほえる大きな口（鼻づらの下に重ねる）
    f'  <path d="M200 192 C206 250 306 250 312 192 C290 206 222 206 200 192 Z" fill="#3a0606" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>\n'
    '  <ellipse cx="256" cy="222" rx="40" ry="16" fill="url(#f)"/>\n'
    f'  <path d="M210 198 L218 218 L228 202 Z M284 202 L294 218 L302 198 Z M226 240 L234 226 L242 242 Z M270 242 L278 226 L286 240 Z" fill="#fff" stroke="{L}" stroke-width="3" stroke-linejoin="round"/>\n', DR))
write('dragon', 'hurt', svg(
    chevron(220, 142, 16, L, 7, True) + chevron(292, 142, 16, L, 7, False) +
    f'  <path d="M196 116 L244 134 L238 142 L194 126 Z" fill="#8c1a0e" stroke="{L}" stroke-width="5" stroke-linejoin="round" transform="rotate(14 220 128)"/>\n'
    f'  <path d="M316 116 L268 134 L274 142 L318 126 Z" fill="#8c1a0e" stroke="{L}" stroke-width="5" stroke-linejoin="round" transform="rotate(-14 292 128)"/>\n'
    + sweat(330, 96)))
write('dragon', 'laugh', svg(
    # 見くだすような半目
    EYES_N +
    f'  <path d="M196 130 C210 124 232 126 244 138 L240 142 C226 136 208 136 198 142 Z" fill="#c7351a" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n'
    f'  <path d="M316 130 C302 124 280 126 268 138 L272 142 C286 136 304 136 314 142 Z" fill="#c7351a" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n'
    f'  <path d="M196 116 L246 128 L240 136 L192 126 Z" fill="#8c1a0e" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n'
    f'  <path d="M318 108 L266 128 L272 136 L322 120 Z" fill="#8c1a0e" stroke="{L}" stroke-width="5" stroke-linejoin="round"/>\n'
    # 鼻からけむり
    '  <circle cx="226" cy="168" r="8" fill="#bdbdbd" opacity="0.7"/><circle cx="216" cy="156" r="6" fill="#bdbdbd" opacity="0.5"/>\n'
    '  <circle cx="286" cy="168" r="8" fill="#bdbdbd" opacity="0.7"/><circle cx="296" cy="156" r="6" fill="#bdbdbd" opacity="0.5"/>\n', DR))
write('dragon', 'ko', svg(swirl(220, 142, 15, L, 5) + swirl(292, 142, 15, L, 5) +
    f'  <path d="M196 132 L244 132 M268 132 L316 132" stroke="{L}" stroke-width="6" stroke-linecap="round"/>\n'))
print('faces ok')
