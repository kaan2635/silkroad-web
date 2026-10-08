// GLB üçgen sayısını azaltır (meshoptimizer, MIT): köşeler aynı kalır, yalnız indeksler yeniden üretilir → deri ağırlıkları korunur.
// Kullanım: node tools/simplify_glb.mjs dosya.glb oran [hata=0.01]
import fs from 'fs';
import { MeshoptSimplifier } from './vendor/meshopt_simplifier.mjs';
const [file, ratioS, errS] = process.argv.slice(2);
const ratio = +ratioS, maxErr = errS ? +errS : 0.01;
await MeshoptSimplifier.ready;
const d = fs.readFileSync(file);
let off = 12, json, bin;
while (off < d.length) { const ln = d.readUInt32LE(off), ty = d.readUInt32LE(off + 4); const ch = d.subarray(off + 8, off + 8 + ln); if (ty === 0x4E4F534A) json = JSON.parse(ch.toString()); else if (ty === 0x004E4942) bin = Buffer.from(ch); off += 8 + ln; }
const view = (ai) => { const a = json.accessors[ai], v = json.bufferViews[a.bufferView]; return { a, v, o: (v.byteOffset || 0) + (a.byteOffset || 0) }; };
const extra = []; let binLen = bin.length, before = 0, after = 0;
for (const m of json.meshes) for (const p of m.primitives) {
  if (p.indices === undefined) continue;
  const P = view(p.attributes.POSITION), stride = (P.v.byteStride || 12) / 4, n = P.a.count;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = bin.readFloatLE(P.o + (i * stride + k) * 4);
  const I = view(p.indices), ic = I.a.count, ct = I.a.componentType, idx = new Uint32Array(ic);
  for (let i = 0; i < ic; i++) idx[i] = ct === 5125 ? bin.readUInt32LE(I.o + i * 4) : ct === 5123 ? bin.readUInt16LE(I.o + i * 2) : bin.readUInt8(I.o + i);
  const target = Math.min(ic, Math.floor(ic * ratio / 3) * 3);
  if (ratio >= 1) { before += ic / 3; after += ic / 3; continue; }
  const [res] = MeshoptSimplifier.simplify(idx, pos, 3, target, maxErr, ['LockBorder']);
  before += ic / 3; after += res.length / 3;
  const buf = Buffer.from(res.buffer, res.byteOffset, res.byteLength);
  while ((binLen + extra.reduce((s, b) => s + b.length, 0)) % 4) extra.push(Buffer.alloc(1));
  const bo = binLen + extra.reduce((s, b) => s + b.length, 0);
  extra.push(buf);
  json.bufferViews.push({ buffer: 0, byteOffset: bo, byteLength: buf.length, target: 34963 });
  json.accessors.push({ bufferView: json.bufferViews.length - 1, componentType: 5125, count: res.length, type: 'SCALAR' });
  p.indices = json.accessors.length - 1;
}
let nb = Buffer.concat([bin, ...extra]);
// kullanılmayan köşeleri at (her ilkel kendi köşe dizisine sahipse)
{
  const CS = { 5126: 4, 5125: 4, 5123: 2, 5121: 1, 5122: 2, 5120: 1 }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const useCount = {}; for (const m of json.meshes) for (const p of m.primitives) for (const a of Object.values(p.attributes)) useCount[a] = (useCount[a] || 0) + 1;
  const add = [], base = nb.length; let cur = base;
  for (const m of json.meshes) for (const p of m.primitives) {
    if (p.indices === undefined || Object.values(p.attributes).some(a => useCount[a] > 1)) continue;
    const I = json.accessors[p.indices], Iv = json.bufferViews[I.bufferView], io = (Iv.byteOffset || 0) + (I.byteOffset || 0);
    const idx = new Uint32Array(I.count); for (let i = 0; i < I.count; i++) idx[i] = nb.readUInt32LE(io + i * 4);
    const n = json.accessors[p.attributes.POSITION].count, remap = new Int32Array(n).fill(-1); let k = 0;
    for (let i = 0; i < idx.length; i++) { if (remap[idx[i]] < 0) remap[idx[i]] = k++; idx[i] = remap[idx[i]]; }
    if (k === n) continue;
    const order = new Int32Array(k); for (let v = 0; v < n; v++) if (remap[v] >= 0) order[remap[v]] = v;
    const push = (buf, target) => { while (cur % 4) { add.push(Buffer.alloc(1)); cur++; } json.bufferViews.push({ buffer: 0, byteOffset: cur, byteLength: buf.length, ...(target ? { target } : {}) }); add.push(buf); cur += buf.length; return json.bufferViews.length - 1; };
    for (const key in p.attributes) {
      const A = json.accessors[p.attributes[key]], V = json.bufferViews[A.bufferView], es = CS[A.componentType] * NC[A.type], st = V.byteStride || es, o = (V.byteOffset || 0) + (A.byteOffset || 0);
      const out = Buffer.alloc(es * k); for (let j = 0; j < k; j++) nb.copy(out, j * es, o + order[j] * st, o + order[j] * st + es);
      const na2 = { ...A, bufferView: push(out, 34962), count: k }; delete na2.byteOffset;
      if (key === 'POSITION') { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let j = 0; j < k; j++) for (let c = 0; c < 3; c++) { const vv = out.readFloatLE(j * 12 + c * 4); mn[c] = Math.min(mn[c], vv); mx[c] = Math.max(mx[c], vv); } na2.min = mn; na2.max = mx; }
      json.accessors.push(na2); p.attributes[key] = json.accessors.length - 1;
    }
    const ib = Buffer.from(idx.buffer); json.accessors.push({ bufferView: push(ib, 34963), componentType: 5125, count: idx.length, type: 'SCALAR' }); p.indices = json.accessors.length - 1;
  }
  nb = Buffer.concat([nb, ...add]);
}
// kullanılmayan accessor'ları at
const usedA = new Set();
for (const m of json.meshes) for (const p of m.primitives) { Object.values(p.attributes).forEach(a => usedA.add(a)); if (p.indices !== undefined) usedA.add(p.indices); for (const t of p.targets || []) Object.values(t).forEach(a => usedA.add(a)); }
for (const sk of json.skins || []) if (sk.inverseBindMatrices !== undefined) usedA.add(sk.inverseBindMatrices);
for (const an of json.animations || []) for (const sm of an.samplers) { usedA.add(sm.input); usedA.add(sm.output); }
const amap = {}, na = []; json.accessors.forEach((a, i) => { if (usedA.has(i)) { amap[i] = na.length; na.push(a); } });
json.accessors = na;
for (const m of json.meshes) for (const p of m.primitives) { for (const k in p.attributes) p.attributes[k] = amap[p.attributes[k]]; if (p.indices !== undefined) p.indices = amap[p.indices]; if (p.targets) p.targets = p.targets.map(t => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, amap[v]]))); }
for (const sk of json.skins || []) if (sk.inverseBindMatrices !== undefined) sk.inverseBindMatrices = amap[sk.inverseBindMatrices];
for (const an of json.animations || []) for (const sm of an.samplers) { sm.input = amap[sm.input]; sm.output = amap[sm.output]; }
// kullanılmayan bufferView'ları at
const usedBV = new Set(json.accessors.filter(a => a.bufferView !== undefined).map(a => a.bufferView));
for (const im of json.images || []) if (im.bufferView !== undefined) usedBV.add(im.bufferView);
const map = {}, nv = [], parts = []; let cur = 0;
json.bufferViews.forEach((v, i) => { if (!usedBV.has(i)) return; while (cur % 4) { parts.push(Buffer.alloc(1)); cur++; } const s = nb.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); parts.push(s); map[i] = nv.length; nv.push({ ...v, byteOffset: cur }); cur += s.length; });
for (const a of json.accessors) if (a.bufferView !== undefined) a.bufferView = map[a.bufferView];
for (const im of json.images || []) if (im.bufferView !== undefined) im.bufferView = map[im.bufferView];
json.bufferViews = nv; nb = Buffer.concat(parts); while (nb.length % 4) nb = Buffer.concat([nb, Buffer.alloc(1)]);
json.buffers = [{ byteLength: nb.length }];
let js = Buffer.from(JSON.stringify(json)); while (js.length % 4) js = Buffer.concat([js, Buffer.from(' ')]);
const head = Buffer.alloc(12); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + nb.length, 8);
const c1 = Buffer.alloc(8); c1.writeUInt32LE(js.length, 0); c1.writeUInt32LE(0x4E4F534A, 4);
const c2 = Buffer.alloc(8); c2.writeUInt32LE(nb.length, 0); c2.writeUInt32LE(0x004E4942, 4);
fs.writeFileSync(file, Buffer.concat([head, c1, js, c2, nb]));
console.log(file, Math.round(before), '->', Math.round(after), 'üçgen');
