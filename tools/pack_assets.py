#!/usr/bin/env python3
"""Kenney CC0 modellerini (shorepine/kenney yansısı) seçip assets/ altına kopyalar,
paletlerini Silkroad temasına çevirir ve js/assetpack.js (base64) üretir.
Kullanım: python3 tools/pack_assets.py /yol/kenney/3d"""
import sys, os, json, struct, base64, colorsys, io, shutil
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/assets/kenney/3d'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'models')

MODELS = {
  'fantasy-town': ['wall', 'wall-door', 'wall-window-shutters', 'wall-window-small', 'wall-window-round', 'roof-point', 'roof-high-point',
                   'stall-red', 'stall-green', 'cart', 'cart-high', 'lantern', 'fountain-round', 'banner-red', 'banner-green',
                   'fence', 'fence-gate', 'pillar-stone', 'windmill', 'chimney', 'planks', 'wheel', 'stairs-stone'],
  'castle': ['wall', 'wall-narrow', 'wall-narrow-corner', 'wall-corner', 'wall-narrow-gate', 'wall-doorway', 'wall-pillar', 'gate', 'tower-hexagon-base', 'tower-hexagon-mid', 'tower-hexagon-roof',
             'tower-square', 'tower-square-top-roof', 'tower-square-base', 'flag', 'flag-wide', 'flag-banner-long', 'flag-pennant', 'siege-catapult', 'siege-ballista'],
  'survival': ['tent', 'tent-canvas', 'campfire-pit', 'campfire-stand', 'barrel', 'box', 'box-large', 'chest', 'bucket', 'bedroll', 'signpost', 'signpost-single',
               'workbench', 'workbench-anvil', 'workbench-grind', 'resource-wood', 'resource-stone', 'resource-planks', 'rock-sand-a', 'rock-sand-b', 'rock-sand-c', 'fence'],
  'nature': ['cactus_short', 'cactus_tall', 'tree_palm', 'tree_palmTall', 'tree_palmDetailedTall', 'tree_palmBend', 'tree_palmShort', 'plant_bush', 'plant_bushLarge',
             'plant_flatTall', 'plant_flatShort', 'stone_largeA', 'stone_largeB', 'stone_largeC', 'stone_tallA', 'stone_tallB', 'rock_largeA', 'rock_largeB', 'rock_smallA',
             'stump_old', 'log', 'log_stack', 'statue_column', 'statue_columnDamaged', 'statue_obelisk', 'statue_block', 'statue_head', 'campfire_stones',
             'tent_detailedOpen', 'sign', 'pot_large', 'grass_large',
             'tree_pineTallA', 'tree_pineTallB', 'tree_pineRoundA', 'tree_pineRoundC', 'tree_pineSmallA', 'tree_default', 'tree_oak', 'rock_tallA', 'rock_tallC',
             'flower_redA', 'flower_yellowA', 'mushroom_redGroup'],
  'graveyard': ['character-ghost', 'character-skeleton', 'character-zombie', 'character-vampire', 'crypt-small', 'crypt', 'gravestone-cross', 'gravestone-round',
                'gravestone-broken', 'pillar-obelisk', 'urn-round', 'fire-basket', 'coffin-old', 'pine-crooked', 'altar-stone'],
}

KEEP_COLORS = {'graveyard'}   # bu kitlerin özgün renkleri korunur

def recolor(img):
    """Mavi/mor -> kızıl, yeşil -> koyu kırmızı (çatı), soluk mavi-beyaz -> krem kum."""
    img = img.convert('RGBA'); px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255); hd = h * 360
            if s < 0.30 and 190 < hd < 290 and v > 0.45:      # lavanta/gri-mavi duvar → sıcak krem
                h, s = 38 / 360, 0.10 + s * 0.9; v = min(1, v * 0.98 + 0.03)
            elif 185 < hd < 300 and s >= 0.30:                   # mavi / mor / lacivert → kırmızı
                h = 4 / 360; s = min(1, s * 0.85 + 0.1); v = v * 0.92
            elif 80 < hd < 180 and s > 0.25:                     # yeşil / teal → koyu kiremit kırmızısı
                h = 8 / 360; s = min(1, s * 0.9); v = v * 0.78
            elif 300 <= hd < 340 and s > 0.25:                   # pembe → altın
                h = 42 / 360
            r, g, b = colorsys.hsv_to_rgb(h, s, v)
            px[x, y] = (int(r * 255), int(g * 255), int(b * 255), a)
    return img

def glb_json(path):
    d = open(path, 'rb').read(); l = struct.unpack('<I', d[12:16])[0]
    return json.loads(d[20:20 + l])

def main():
    if os.path.isdir(OUT): shutil.rmtree(OUT)
    pack = {'models': {}, 'textures': {}}
    mats = set()
    for kit, names in MODELS.items():
        os.makedirs(os.path.join(OUT, kit), exist_ok=True)
        tex = os.path.join(SRC, kit, 'Textures', 'colormap.png')
        if os.path.exists(tex):
            os.makedirs(os.path.join(OUT, kit, 'Textures'), exist_ok=True)
            im = recolor(Image.open(tex)) if kit not in KEEP_COLORS else Image.open(tex).convert('RGBA')
            im.save(os.path.join(OUT, kit, 'Textures', 'colormap.png'), optimize=True)
            buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
            pack['textures'][kit] = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
        for n in names:
            p = os.path.join(SRC, kit, n + '.glb')
            if not os.path.exists(p): print('YOK:', kit, n); continue
            shutil.copy(p, os.path.join(OUT, kit, n + '.glb'))
            pack['models'][kit + '/' + n] = base64.b64encode(open(p, 'rb').read()).decode()
            for m in glb_json(p).get('materials', []): mats.add(kit + ':' + m.get('name', ''))
    js = '// Otomatik üretildi: tools/pack_assets.py — Kenney CC0 modelleri (base64). Elle düzenleme.\nconst ASSET_PACK = ' + json.dumps(pack, separators=(',', ':')) + ';\n'
    open(os.path.join(ROOT, 'js', 'assetpack.js'), 'w').write(js)
    print('modeller:', len(pack['models']), ' js boyutu: %.2f MB' % (len(js) / 1e6))
    print('materyaller:', sorted(m for m in mats if not m.endswith(':colormap')))

main()
