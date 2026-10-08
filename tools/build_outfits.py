#!/usr/bin/env python3
# Quaternius "Universal Base Characters" + "Modular Character Outfits - Fantasy" (Standard, CC0) → oyun varlıkları.
# Kıyafetler (Peasant / Ranger, erkek / kadın) tam iskeletli GLB olur; başlar süper kahraman gövdesinden yalnızca baş-boyun
# üçgenleri ayıklanarak çıkarılır; saç / kaş / sakal ayrı küçük GLB'ler. Dokular küçültülüp ortak klasöre (tex/) yazılır,
# normal / ORM haritaları atılır (telefon için).
# Kullanım: python3 tools/build_outfits.py <paketlerin açıldığı klasör>
import json, os, sys, struct
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_human import write

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets/models/human')
SRC = sys.argv[1]
UBC = os.path.join(SRC, 'ubc/Universal Base Characters[Standard]')
MCO = os.path.join(SRC, 'mco/Modular Character Outfits - Fantasy[Standard]')
os.makedirs(os.path.join(OUT, 'tex'), exist_ok=True)

def tex(src, name, px, alpha=False):
    im = Image.open(src)
    if max(im.size) > px: im = im.resize((px, px), Image.LANCZOS)
    if alpha:
        im.convert('RGBA').save(os.path.join(OUT, 'tex', name + '.png'), optimize=True); return 'tex/' + name + '.png'
    im.convert('RGB').save(os.path.join(OUT, 'tex', name + '.jpg'), quality=85, optimize=True); return 'tex/' + name + '.jpg'

def load(path):
    j = json.load(open(path)); d = os.path.dirname(path)
    bins = [open(os.path.join(d, b['uri']), 'rb').read() for b in j['buffers']]
    return j, bins

def acc_bytes(j, bins, ai):
    a = j['accessors'][ai]; v = j['bufferViews'][a['bufferView']]
    return bins[v.get('buffer', 0)][v.get('byteOffset', 0): v.get('byteOffset', 0) + v['byteLength']], v

def read_acc(j, bins, ai):
    import array
    a = j['accessors'][ai]; data, v = acc_bytes(j, bins, ai)
    comp = {5126: ('f', 4), 5123: ('H', 2), 5125: ('I', 4), 5121: ('B', 1), 5122: ('h', 2)}[a['componentType']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
    stride = v.get('byteStride', comp[1] * n); off = a.get('byteOffset', 0)
    out = []
    for i in range(a['count']):
        out.append(struct.unpack_from('<' + comp[0] * n, data, off + i * stride))
    return out

def convert(path, out, texmap, keep_mesh=None, tri_keep=None, keep_anim=False):
    """texmap: görüntü uri → çıktı doku yolu (tex/..). keep_mesh: mesh adı süzgeci. tri_keep(j, bins, prim) → indeks listesi"""
    j, bins = load(path)
    for m in j['materials']:
        m.pop('normalTexture', None); m.pop('occlusionTexture', None); m.pop('emissiveTexture', None)
        pb = m.setdefault('pbrMetallicRoughness', {}); pb.pop('metallicRoughnessTexture', None); pb['metallicFactor'] = 0; pb['roughnessFactor'] = 0.9
    used_tex = sorted({m['pbrMetallicRoughness']['baseColorTexture']['index'] for m in j['materials'] if 'baseColorTexture' in m['pbrMetallicRoughness']})
    new_img, img_map, new_tex, tex_map = [], {}, [], {}
    for ti in used_tex:
        s = j['textures'][ti]['source']; uri = j['images'][s]['uri']
        if s not in img_map: img_map[s] = len(new_img); new_img.append({'uri': texmap.get(uri, texmap.get('*', uri))})
        tex_map[ti] = len(new_tex); new_tex.append({'source': img_map[s], **({'sampler': j['textures'][ti]['sampler']} if 'sampler' in j['textures'][ti] else {})})
    for m in j['materials']:
        b = m['pbrMetallicRoughness'].get('baseColorTexture')
        if b: b['index'] = tex_map[b['index']]; b.pop('texCoord', None); b.pop('extensions', None)
    j['images'] = new_img; j['textures'] = new_tex
    j.pop('extensionsUsed', None); j.pop('extensionsRequired', None)
    # ağ süzgeci
    for n in j['nodes']:
        if 'mesh' in n and keep_mesh and not keep_mesh(j['meshes'][n['mesh']]['name']): n.pop('mesh'); n.pop('skin', None)
    used_mesh = {n['mesh'] for n in j['nodes'] if 'mesh' in n}
    out_bin = bytearray(); new_bv = []; new_acc = []
    def put(data, extra=None):
        while len(out_bin) % 4: out_bin.append(0)
        v = {'buffer': 0, 'byteOffset': len(out_bin), 'byteLength': len(data)}
        if extra: v.update(extra)
        out_bin.extend(data); new_bv.append(v); return len(new_bv) - 1
    cache = {}
    def copy_acc(ai):
        if ai in cache: return cache[ai]
        a = dict(j['accessors'][ai]); data, v = acc_bytes(j, bins, ai)
        a['bufferView'] = put(data, {k: v[k] for k in ('byteStride', 'target') if k in v})
        new_acc.append(a); cache[ai] = len(new_acc) - 1; return cache[ai]
    def new_index(idx):
        data = struct.pack('<%dI' % len(idx), *idx)
        a = {'bufferView': put(data, {'target': 34963}), 'componentType': 5125, 'count': len(idx), 'type': 'SCALAR'}
        new_acc.append(a); return len(new_acc) - 1
    meshes = []
    mesh_map = {}
    for mi, me in enumerate(j['meshes']):
        if mi not in used_mesh: continue
        prims = []
        for p in me['primitives']:
            q = {'attributes': {}, 'mode': p.get('mode', 4)}
            if 'material' in p: q['material'] = p['material']
            for k, v in p['attributes'].items():
                if k in ('POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0'): q['attributes'][k] = copy_acc(v)
            if tri_keep:
                idx = tri_keep(j, bins, p)
                if not idx: continue
                q['indices'] = new_index(idx)
            elif 'indices' in p: q['indices'] = copy_acc(p['indices'])
            prims.append(q)
        if prims: mesh_map[mi] = len(meshes); meshes.append({'name': me['name'], 'primitives': prims})
    for n in j['nodes']:
        if 'mesh' in n:
            if n['mesh'] in mesh_map: n['mesh'] = mesh_map[n['mesh']]
            else: n.pop('mesh'); n.pop('skin', None)
    j['meshes'] = meshes
    for s in j.get('skins', []):
        if 'inverseBindMatrices' in s: s['inverseBindMatrices'] = copy_acc(s['inverseBindMatrices'])
    j.pop('animations', None)
    j['accessors'] = new_acc; j['bufferViews'] = new_bv; j['buffers'] = [{'byteLength': len(out_bin)}]
    write(os.path.join(OUT, out), j, bytes(out_bin))
    print(out, len(out_bin) // 1024, 'KB', [m['name'] for m in meshes])

# dokular
T = {}
T['peasant'] = tex(os.path.join(MCO, 'Textures/Peasant/T_Peasant_BaseColor.png'), 'peasant', 1024)
T['peasant2'] = tex(os.path.join(MCO, 'Textures/Peasant/T_Peasant_2_BaseColor.png'), 'peasant2', 1024)
T['ranger'] = tex(os.path.join(MCO, 'Textures/Ranger/T_Ranger_BaseColor.png'), 'ranger', 1024)
T['ranger3'] = tex(os.path.join(MCO, 'Textures/Ranger/T_Ranger_3_BaseColor.png'), 'ranger3', 1024)
T['m_skin'] = tex(os.path.join(UBC, 'Base Characters/Textures/T_Superhero_Male_Ligh.png'), 'm_skin', 1024)
T['f_skin'] = tex(os.path.join(UBC, 'Base Characters/Textures/T_Superhero_Female_Light_BaseColor.png'), 'f_skin', 1024)
T['m_hand'] = tex(os.path.join(MCO, 'Textures/Base/T_Regular_Male_Dark_BaseColor.png'), 'm_hand', 512)
T['f_hand'] = tex(os.path.join(MCO, 'Textures/Base/T_Regular_Female_Dark_BaseColor.png'), 'f_hand', 512)
T['hair1'] = tex(os.path.join(UBC, 'Hairstyles/Textures/T_Hair_1_BaseColor.png'), 'hair1', 512, True)
T['hair2'] = tex(os.path.join(UBC, 'Hairstyles/Textures/T_Hair_2_BaseColor.png'), 'hair2', 512, True)
T['eye'] = tex(os.path.join(UBC, 'Base Characters/Textures/T_Eye_Brown.png'), 'eye', 256)
TM = {'T_Peasant_BaseColor.png': T['peasant'], 'T_Ranger_BaseColor.png': T['ranger'], 'T_Regular_Male_Dark_BaseColor.png': T['m_hand'], 'T_Regular_Female_Dark_BaseColor.png': T['f_hand'],
      'T_Hair_1_BaseColor.png': T['hair1'], 'T_Hair_2_BaseColor.png': T['hair2'], 'T_Hair_1_BaseColor_png.png': T['hair1'], 'T_Hair_2_BaseColor_png.png': T['hair2'], 'T_Eye_Brown.png': T['eye'],
      'T_Superhero_Male_Dark.png': T['m_skin'], 'T_Superhero_Female_Dark_BaseColor.png': T['f_skin']}

OF = os.path.join(MCO, 'Exports/glTF (Godot-Unreal)/Outfits')
for sx, nm in [('m', 'Male'), ('f', 'Female')]:
    for kind in ('Peasant', 'Ranger'):
        convert(os.path.join(OF, '%s_%s.gltf' % (nm, kind)), '%s_%s.glb' % (sx, kind.lower()), TM)

# baş: süper kahraman gövdesinden baş + boyun
def head_tris(j, bins, p):
    if 'JOINTS_0' not in p['attributes']: return list(sum(read_acc(j, bins, p['indices']), ()))
    skin = j['skins'][0]; names = [j['nodes'][k].get('name', '') for k in skin['joints']]
    J = read_acc(j, bins, p['attributes']['JOINTS_0']); W = read_acc(j, bins, p['attributes']['WEIGHTS_0']); P = read_acc(j, bins, p['attributes']['POSITION'])
    hw = []
    for ji, wi, pos in zip(J, W, P):
        s = sum(w for b, w in zip(ji, wi) if names[b] in ('Head', 'neck_01'))
        hw.append(s)
    idx = read_acc(j, bins, p['indices']); out = []
    for t in range(0, len(idx), 3):
        tri = (idx[t][0], idx[t + 1][0], idx[t + 2][0])
        if all(hw[v] > 0.35 for v in tri): out.extend(tri)
    return out
BC = os.path.join(UBC, 'Base Characters/Godot - UE')
convert(os.path.join(BC, 'Superhero_Male_FullBody.gltf'), 'm_head.glb', TM, tri_keep=head_tris)
convert(os.path.join(BC, 'Superhero_Female_FullBody.gltf'), 'f_head.glb', TM, tri_keep=head_tris)
HS = os.path.join(UBC, 'Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)')
for f in sorted(os.listdir(HS)):
    if f.endswith('.gltf'):
        convert(os.path.join(HS, f), 'hair_' + f[:-5].lower().replace('hair_', '') + '.glb', TM)
