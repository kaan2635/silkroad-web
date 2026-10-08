#!/usr/bin/env python3
# Gerçekçi insan karakter: Quaternius Universal Base Characters (Superhero Male, CC0) + Universal Animation Library (CC0).
# Gövde: dokular küçültülüp JPEG/PNG'ye çevrilir, normal/pürüzlülük haritaları atılır (telefon için).
# Animasyonlar: yalnızca oyunda kullanılan klipler, ağsız (sadece iskelet).
# Kaynaklar (repoya konmaz): Universal Base Characters[Standard] → Superhero_Male_FullBody (GLB'ye çevrilmiş) = male_src.glb,
# Universal Animation Library[Standard] → UAL1_Standard.glb = ual_src.glb — ikisi de assets/models/human/ altına.
# Kullanım: python3 tools/build_human.py
import json, struct, io, re, os, sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = os.path.join(ROOT, 'assets/models/human')

def read(path):
    d = open(path, 'rb').read(); off, js, bn = 12, None, b''
    while off < len(d):
        ln, ty = struct.unpack_from('<II', d, off); ch = d[off + 8: off + 8 + ln]
        if ty == 0x4E4F534A: js = json.loads(ch)
        elif ty == 0x004E4942: bn = ch
        off += 8 + ln
    return js, bn

def write(path, js, bn):
    j = json.dumps(js, separators=(',', ':')).encode(); j += b' ' * ((4 - len(j) % 4) % 4)
    bn += b'\0' * ((4 - len(bn) % 4) % 4)
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(j) + 8 + len(bn)))
        f.write(struct.pack('<II', len(j), 0x4E4F534A)); f.write(j)
        f.write(struct.pack('<II', len(bn), 0x004E4942)); f.write(bn)

def repack(js, bn, keep_acc, extra_bv_data=None):
    """kullanılan accessor'ları ve görüntüleri yeni bir ikili tampona yazar"""
    acc_map, new_acc = {}, []
    for i, a in enumerate(js['accessors']):
        if i in keep_acc: acc_map[i] = len(new_acc); new_acc.append(dict(a))
    out = bytearray(); new_bv = []
    def put(data, extra=None):
        while len(out) % 4: out.append(0)
        v = {'buffer': 0, 'byteOffset': len(out), 'byteLength': len(data)}
        if extra: v.update(extra)
        out.extend(data); new_bv.append(v); return len(new_bv) - 1
    bvcache = {}
    for a in new_acc:
        if 'bufferView' not in a: continue
        ob = a['bufferView']
        if ob not in bvcache:
            v = js['bufferViews'][ob]; o = v.get('byteOffset', 0)
            bvcache[ob] = put(bn[o:o + v['byteLength']], {k: v[k] for k in ('byteStride', 'target') if k in v})
        a['bufferView'] = bvcache[ob]
    for im in js.get('images', []):
        if '_data' in im: im['bufferView'] = put(im.pop('_data')); continue
        if 'bufferView' in im:
            v = js['bufferViews'][im['bufferView']]; o = v.get('byteOffset', 0)
            im['bufferView'] = put(bn[o:o + v['byteLength']])
    js['accessors'] = new_acc; js['bufferViews'] = new_bv; js['buffers'] = [{'byteLength': len(out)}]
    return acc_map, bytes(out)

def img_bytes(js, bn, i):
    v = js['bufferViews'][js['images'][i]['bufferView']]; o = v.get('byteOffset', 0)
    return bn[o:o + v['byteLength']]

def body(src, dst, base_px=1024):
    js, bn = read(src)
    # normal / pürüzlülük haritalarını at
    for m in js['materials']:
        m.pop('normalTexture', None); m.get('pbrMetallicRoughness', {}).pop('metallicRoughnessTexture', None)
        m.get('pbrMetallicRoughness', {})['roughnessFactor'] = 0.85
    used_tex = {m['pbrMetallicRoughness']['baseColorTexture']['index'] for m in js['materials'] if 'baseColorTexture' in m.get('pbrMetallicRoughness', {})}
    used_img = {js['textures'][t]['source'] for t in used_tex}
    for i, im in enumerate(js['images']):
        if i not in used_img: continue
        pi = Image.open(io.BytesIO(img_bytes(js, bn, i)))
        name = im.get('name', '')
        px = 256 if 'Eye' in name else 512 if 'Hair' in name else base_px
        if max(pi.size) > px: pi = pi.resize((px, px), Image.LANCZOS)
        buf = io.BytesIO()
        if pi.mode in ('RGBA', 'LA') and pi.getextrema()[-1][0] < 250: pi.save(buf, 'PNG', optimize=True); im['mimeType'] = 'image/png'
        else: pi.convert('RGB').save(buf, 'JPEG', quality=86); im['mimeType'] = 'image/jpeg'
        im['_data'] = buf.getvalue()
    # kullanılmayan görüntü / dokuları ayıkla
    tex_map, new_tex, img_map, new_img = {}, [], {}, []
    for ti in sorted(used_tex):
        s = js['textures'][ti]['source']
        if s not in img_map: img_map[s] = len(new_img); new_img.append(js['images'][s])
        tex_map[ti] = len(new_tex); new_tex.append({**js['textures'][ti], 'source': img_map[s]})
    for m in js['materials']:
        b = m['pbrMetallicRoughness'].get('baseColorTexture')
        if b: b['index'] = tex_map[b['index']]
    for im in js['images']:
        if im not in new_img: im.pop('_data', None)
    js['textures'] = new_tex; js['images'] = new_img
    keep = set()
    for me in js['meshes']:
        for p in me['primitives']:
            for k, v in p['attributes'].items():
                if k in ('POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0'): keep.add(v)
            p['attributes'] = {k: v for k, v in p['attributes'].items() if k in ('POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0')}
            if 'indices' in p: keep.add(p['indices'])
            p.pop('targets', None)
        me.pop('weights', None); me.get('extras', {}).pop('targetNames', None)
    for s in js['skins']:
        if 'inverseBindMatrices' in s: keep.add(s['inverseBindMatrices'])
    js.pop('animations', None)
    m, out = repack(js, bn, keep)
    for me in js['meshes']:
        for p in me['primitives']:
            p['attributes'] = {k: m[v] for k, v in p['attributes'].items()}
            if 'indices' in p: p['indices'] = m[p['indices']]
    for s in js['skins']:
        if 'inverseBindMatrices' in s: s['inverseBindMatrices'] = m[s['inverseBindMatrices']]
    write(dst, js, out); print(dst, len(bn) // 1024, '->', len(out) // 1024, 'KB')

CLIPS = r'^(Idle_Loop|Walk_Loop|Jog_Fwd_Loop|Sprint_Loop|Sword_Attack|Sword_Idle|Punch_Jab|Punch_Cross|Spell_Simple_Shoot|Spell_Simple_Idle_Loop|Death01|Hit_Chest|Sitting_Enter|Sitting_Idle_Loop|Sitting_Exit|Dance_Loop|Roll|Jump_Start|Jump_Loop|Jump_Land|Interact|PickUp_Table|Idle_Talking_Loop|Walk_Formal_Loop|Driving_Loop|Pistol_Shoot|Pistol_Aim_Neutral|Crouch_Idle_Loop|Fixing_Kneeling)$'

def anims(src, dst):
    js, bn = read(src)
    rx = re.compile(CLIPS); keep = set(); A = []
    nodes = js['nodes']
    for a in js['animations']:
        if not rx.match(a['name']): continue
        ch, smp = [], []
        for c in a['channels']:
            s = a['samplers'][c['sampler']]
            if any('bufferView' not in js['accessors'][s[k]] for k in ('input', 'output')): continue
            nm = nodes[c['target']['node']].get('name', '')
            if c['target']['path'] == 'translation' and nm not in ('pelvis', 'root'): continue   # kemik uzunluğu sabit kalsın
            if c['target']['path'] == 'scale': continue
            smp.append(dict(s)); ch.append({'sampler': len(smp) - 1, 'target': c['target']})
            keep.update([s['input'], s['output']])
        A.append({'name': a['name'], 'channels': ch, 'samplers': smp})
    js['animations'] = A
    # ağı at: yalnız iskelet
    for n in nodes: n.pop('mesh', None); n.pop('skin', None)
    js['meshes'] = []; js.pop('skins', None); js['materials'] = []; js.pop('textures', None); js.pop('images', None); js.pop('samplers', None)
    m, out = repack(js, bn, keep)
    for a in A:
        for s in a['samplers']: s['input'] = m[s['input']]; s['output'] = m[s['output']]
    js.pop('meshes', None); js.pop('materials', None)
    write(dst, js, out); print(dst, len(bn) // 1024, '->', len(out) // 1024, 'KB', len(A), 'klip')

if __name__ == '__main__':
    body(os.path.join(H, 'male_src.glb'), os.path.join(H, 'male.glb'))
    anims(os.path.join(H, 'ual_src.glb'), os.path.join(H, 'anims.glb'))
