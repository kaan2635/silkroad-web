#!/usr/bin/env python3
# Kullanıcının hazırlattığı varlık sayfasını (tools/asset_sheet.png) ikon atlaslarına böler.
# Çıktı: assets/ui/icons.webp (64 px hücreler), assets/ui/portraits.webp (96 px), assets/ui/logo.webp,
#        js/sheetmap.js (anahtar → hücre). Çalıştır: python3 tools/slice_sheet.py
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = Image.open(os.path.join(ROOT, 'tools/asset_sheet.png')).convert('RGB')
A = np.asarray(SRC).astype(np.float32)
LUM = A.max(axis=2)
BG = 24.0

def soft_alpha(lum, lo=BG + 6, hi=BG + 40):
    return np.clip((lum - lo) / (hi - lo), 0, 1)

def cut(box, mask=None, opaque=False):
    x0, y0, x1, y1 = box
    rgb = A[y0:y1, x0:x1]
    if opaque:
        a = np.ones(rgb.shape[:2], np.float32)
    else:
        a = soft_alpha(LUM[y0:y1, x0:x1])
        if mask is not None:
            solid = ndimage.gaussian_filter(ndimage.binary_fill_holes(mask).astype(np.float32), 0.7)
            a = np.maximum(a * ndimage.binary_dilation(mask, iterations=2), solid)
    rgba = np.dstack([rgb, a * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

def bust(box, k=0.62):
    # uzun figürlerde üst kısım (baş + gövde) kare olarak
    x0, y0, x1, y1 = box; w, h = x1 - x0, y1 - y0
    if h <= w * 1.25: return box
    s = max(w, round(h * k)); cx = (x0 + x1) // 2
    a = min(max(0, cx - s // 2), A.shape[1] - s)
    return (a, y0, a + s, min(A.shape[0], y0 + s))

def cut_bust(box, m, k=0.62):
    b = bust(box, k)
    if b == box: return cut(box, m)
    mm = np.zeros((b[3] - b[1], b[2] - b[0]), bool)
    ox, oy = box[0] - b[0], box[1] - b[1]
    sub = m[:mm.shape[0] - oy, :]
    xs0, xs1 = max(0, ox), min(mm.shape[1], ox + m.shape[1])
    mm[oy:oy + sub.shape[0], xs0:xs1] = sub[:, xs0 - ox:xs1 - ox]
    return cut(b, mm)

def fit(img, size, pad):
    w, h = img.size
    s = (size - 2 * pad) / max(w, h)
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    r = img.resize((nw, nh), Image.LANCZOS)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(r, ((size - nw) // 2, (size - nh) // 2))
    return out

def comps(x0, y0, x1, y1, th=50, dil=1, min_h=24, min_area=300):
    m = LUM[y0:y1, x0:x1] > th
    md = ndimage.binary_dilation(m, iterations=dil) if dil else m
    lab, n = ndimage.label(md)
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        k = lab[sl] == i + 1
        if k.sum() < min_area or (sl[0].stop - sl[0].start) < min_h: continue
        out.append(((sl[1].start + x0, sl[0].start + y0, sl[1].stop + x0, sl[0].stop + y0), k))
    return out

def rows_sorted(cs, band):
    return sorted(cs, key=lambda c: (round(((c[0][1] + c[0][3]) / 2) / band), c[0][0]))

icons, portraits = {}, {}

# 1) Eşyalar: 5 × 17 çerçeveli ızgara (çerçevenin içi)
ICOLS = [20, 53, 86, 119, 152, 185, 218, 251, 288, 327, 362, 395, 429, 462, 496, 529, 563]
IROWS = [644, 682, 720, 758, 796]
for r, y in enumerate(IROWS):
    for c, x in enumerate(ICOLS):
        icons['it%d' % (r * 17 + c)] = fit(cut((x + 3, y + 3, x + 24, y + 26)), 64, 3)

# 2) Aksesuarlar: 4 × 8 çerçeve
for r, y in enumerate([646, 693, 739, 785]):
    for c in range(8):
        x = 621 + c * 39.1
        icons['ac%d' % (r * 8 + c)] = fit(cut((round(x + 5), y + 5, round(x + 28), y + 33)), 64, 2)

# 3) Yetenekler: 3 × 10 dolu kare
SX = [409, 451, 494, 537, 581, 624, 667, 711, 754, 797]
for r, y in enumerate([878, 921, 964]):
    for c, x in enumerate(SX):
        icons['sk%d' % (r * 10 + c)] = fit(cut((x + 2, y + 2, x + 34, y + 34), opaque=True), 64, 0)

# 4) Silahlar: satır bantları içinde bileşenler
for key, (y0, y1) in {'sw': (66, 140), 'bl': (138, 206), 'sp': (206, 268), 'st': (268, 332), 'bw': (334, 402)}.items():
    cs = [c for c in comps(765, y0, 1262, y1, th=50, min_h=26, min_area=200)]
    cs = sorted(cs, key=lambda c: c[0][0])
    for i, (box, m) in enumerate(cs):
        icons['%s%d' % (key, i)] = fit(cut(box, m), 64, 3)

# 5) Kalkanlar ve hançerler
for i, (box, m) in enumerate(rows_sorted(comps(1272, 62, 1530, 270, th=50), 65)):
    icons['sh%d' % i] = fit(cut(box, m), 64, 3)
for i, (box, m) in enumerate(sorted(comps(1272, 295, 1530, 395, th=50), key=lambda c: c[0][0])):
    icons['dg%d' % i] = fit(cut(box, m), 64, 3)

# 6) Ekipman (tam boy zırh): iki satır
for i, (box, m) in enumerate(rows_sorted(comps(762, 430, 1530, 610, th=45, min_h=40), 95)):
    icons['eq%d' % i] = fit(cut_bust(box, m, 0.55), 64, 2)

# 7) Binekler: elle verilen x aralıklarında en büyük bileşen
for i, (a, b) in enumerate([(950, 1012), (1008, 1086), (1086, 1162), (1162, 1246), (1240, 1332), (1326, 1424), (1418, 1528)]):
    cs = comps(a, 645, b, 830, th=40, min_h=60, min_area=1500)
    if cs: box, m = max(cs, key=lambda c: c[1].sum()); icons['tr%d' % i] = fit(cut_bust(box, m, 0.7), 64, 1)

# 8) Canavar portreleri (satırlar y eşiğiyle, satır içinde soldan sağa)
PNAMES = ['wolf', 'weaktiger', 'blacktiger', 'snowwolf', 'bandit', 'banditarcher', 'horseman', 'ochao',
          'ochaoshaman', 'ochaogeneral', 'snakegirl', 'snakequeen', 'scorpion', 'taoist', 'blader', 'killer',
          'devilspirit', 'cerberus', 'uruchi', 'isyutaru', 'tombgeneral', 'anubis', 'neith', 'horus2', 'horus',
          'shaitan', 'stronguruchi', 'giantyarkan', 'yarkan', 'lordyarkan', 'shaitanp']
pc = [c for c in comps(12, 60, 752, 590, th=40, min_h=40, min_area=1200) if (c[0][2] - c[0][0]) > 20]
rowof = lambda c: sum(((c[0][1] + c[0][3]) / 2) > t for t in (190, 330, 470))
pc.sort(key=lambda c: (rowof(c), c[0][0]))
print('portrait comps', len(pc))
for n, (box, m) in zip(PNAMES, pc):
    portraits[n] = fit(cut_bust(box, m, 0.6), 96, 2)

# 9) Logo
lb = (1312, 892, 1530, 965)
lg = cut(lb, None)
lg = lg.crop(lg.getbbox())
lg.save(os.path.join(ROOT, 'assets/ui/logo.webp'), quality=92)

def atlas(d, cell, cols, path):
    keys = list(d.keys()); rows = (len(keys) + cols - 1) // cols
    at = Image.new('RGBA', (cols * cell, rows * cell), (0, 0, 0, 0))
    idx = {}
    for i, k in enumerate(keys):
        at.paste(d[k], ((i % cols) * cell, (i // cols) * cell)); idx[k] = i
    at.save(os.path.join(ROOT, path), quality=90, method=6)
    return idx, cols, rows

def prune(d):
    out, cnt = {}, {}
    for k, im in d.items():
        if np.asarray(im)[:, :, 3].mean() < 255 * 0.03: continue        # boş / kırıntı
        p = k.rstrip('0123456789'); n = cnt.get(p, 0); cnt[p] = n + 1
        out[p + str(n) if p != k else k] = im
    return out
icons = prune(icons)
ii, ic, ir = atlas(icons, 64, 16, 'assets/ui/icons.webp')
pi, pc, pr = atlas(portraits, 96, 8, 'assets/ui/portraits.webp')
with open(os.path.join(ROOT, 'js/sheetmap.js'), 'w') as f:
    f.write('// Otomatik üretildi: tools/slice_sheet.py — elle düzenleme.\n')
    f.write('const SHEET_ICONS = ' + json.dumps({'cols': ic, 'rows': ir, 'i': ii}, separators=(',', ':')) + ';\n')
    f.write('const SHEET_PORTRAITS = ' + json.dumps({'cols': pc, 'rows': pr, 'i': pi}, separators=(',', ':')) + ';\n')
counts = {}
for k in icons: counts[k.rstrip('0123456789')] = counts.get(k.rstrip('0123456789'), 0) + 1
print('icons', counts, 'portraits', len(portraits))
