// İpek Yolu şehir mimarisi: prosedürel Çin salonları (kıvrık saçaklı kiremit çatılar), pagoda,
// takı kapılar (paifang), gözetleme kuleleri, kerpiç evler ve kubbeler, taş döşeme, kâğıt fenerler,
// sancaklar, ağaçlar. Bütün parçalar malzemeye göre tek ağ halinde birleştirilir (az çizim çağrısı).
// Bölgeye göre üslup: Jangan (gri kiremit), Donwhang (toprak kiremit + kerpiç), Hotan (turkuaz + kubbe).

const ARCH_STYLE = {
  jangan:   { roof: '#3b424e', roofHi: '#6b7586', ridge: 0x2a2f38, wood: 0xa3271c, beam: 0x5e1810, trim: 0xd9a92e, wall: '#ece1c8', wallLo: '#c9b994', stone: '#9b948a', pave: ['#bcae8f', '#ad9e7e', '#c6b899', '#a89878'], leaf: [0xf2a6bf, 0xe88aa8, 0xf7c4d4], res: 'hall', banner: '#a8281e' },
  donwhang: { roof: '#7a4a2c', roofHi: '#ad7650', ridge: 0x4a2a18, wood: 0x98321c, beam: 0x55200e, trim: 0xd9a92e, wall: '#eed4a2', wallLo: '#cfae78', stone: '#b59a72', pave: ['#d2b88a', '#c4a878', '#dcc496', '#bc9f70'], leaf: [0x8aa04a, 0x7a9440, 0x9ab25a], res: 'adobe', banner: '#c06a1a' },
  hotan:    { roof: '#2c6c6a', roofHi: '#5aaca2', ridge: 0x1c4644, wood: 0x8c2a24, beam: 0x4a1410, trim: 0xe0b440, wall: '#f0e9dc', wallLo: '#cfc6b4', stone: '#9fa3a8', pave: ['#b4ada0', '#a49c8e', '#c0b9ac', '#988f80'], leaf: [0x6aa04a, 0x5a9040, 0x82b45a], res: 'dome', banner: '#2a7a8a' }
};
const ARCH = ARCH_STYLE[ZONE.id] || ARCH_STYLE.jangan;

// ---------- Canvas dokuları ----------
const _archTex = {};
function archCanvasTex(key, w, h, draw, repeat) {
  if (_archTex[key]) return _archTex[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  _archTex[key] = t;
  return t;
}
const _rng = mulberry32(4242);
const _shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
const _noise = (x, w, h, a, n = 1400) => { for (let i = 0; i < n; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,' + a + ')' : 'rgba(255,255,255,' + a + ')'; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };

// Kiremit: yamaçtan aşağı inen oluklu sıralar (u = yatay, v = yamaç boyunca)
const texRoof = () => archCanvasTex('roof', 128, 128, (x, W, H) => {
  x.fillStyle = _shade(ARCH.roof, 0.7); x.fillRect(0, 0, W, H);
  const n = 8, cw = W / n;
  for (let i = 0; i < n; i++) {
    const g = x.createLinearGradient(i * cw, 0, (i + 1) * cw, 0);
    g.addColorStop(0, _shade(ARCH.roof, 0.55)); g.addColorStop(0.45, ARCH.roofHi); g.addColorStop(0.6, ARCH.roof); g.addColorStop(1, _shade(ARCH.roof, 0.5));
    x.fillStyle = g; x.fillRect(i * cw + 1, 0, cw - 2, H);
  }
  for (let r = 0; r < 4; r++) {   // sıra kenarları
    const y = r * H / 4;
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, y, W, 3);
    x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, y + 3, W, 2);
  }
  _noise(x, W, H, 0.06, 600);
}, true);
// Sıva duvar: açık sıva, alt kısım koyu (su lekesi), ahşap kuşak
const texWall = () => archCanvasTex('wall', 128, 128, (x, W, H) => {
  x.fillStyle = ARCH.wall; x.fillRect(0, 0, W, H);
  _noise(x, W, H, 0.05, 1600);
  const g = x.createLinearGradient(0, H * 0.72, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, ARCH.wallLo);
  x.fillStyle = g; x.fillRect(0, H * 0.72, W, H * 0.28);
}, true);
// Kafes pencere: ahşap çerçeve + pirinç kâğıdı arkasında geometrik kafes
const texLattice = () => archCanvasTex('lattice', 128, 128, (x, W, H) => {
  const paper = x.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 80); paper.addColorStop(0, '#f4e2b8'); paper.addColorStop(1, '#c9a874');
  x.fillStyle = paper; x.fillRect(0, 0, W, H);
  const wood = _shade(new THREE.Color(ARCH.beam).getHex(), 1.3);
  x.strokeStyle = wood; x.lineWidth = 5;
  for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(i * W / 6, 0); x.lineTo(i * W / 6, H); x.stroke(); x.beginPath(); x.moveTo(0, i * H / 6); x.lineTo(W, i * H / 6); x.stroke(); }
  x.lineWidth = 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const cx = (i + 0.5) * W / 3, cy = (j + 0.5) * H / 3; x.strokeRect(cx - 9, cy - 9, 18, 18); }
  x.lineWidth = 12; x.strokeStyle = _shade(new THREE.Color(ARCH.beam).getHex(), 0.9); x.strokeRect(0, 0, W, H);
}, false);
// Kapı: iki kanat, altın çiviler
const texDoor = () => archCanvasTex('door', 128, 192, (x, W, H) => {
  const red = '#' + new THREE.Color(ARCH.wood).getHexString();
  x.fillStyle = _shade(ARCH.wood, 0.55); x.fillRect(0, 0, W, H);
  for (const s of [0, 1]) {
    const x0 = 8 + s * (W / 2 - 4), w = W / 2 - 12;
    const g = x.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, _shade(ARCH.wood, 0.85)); g.addColorStop(0.5, red); g.addColorStop(1, _shade(ARCH.wood, 0.7));
    x.fillStyle = g; x.fillRect(x0, 10, w, H - 14);
    x.fillStyle = '#e8c050';
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { x.beginPath(); x.arc(x0 + 9 + c * (w - 18) / 3, 30 + r * 26, 3.2, 0, 6.283); x.fill(); }
    x.beginPath(); x.arc(s ? x0 + 8 : x0 + w - 8, H * 0.52, 6, 0, 6.283); x.strokeStyle = '#e8c050'; x.lineWidth = 3; x.stroke();
  }
}, false);
// Taş blok (kaide, kule)
const texStone = () => archCanvasTex('stone', 128, 128, (x, W, H) => {
  x.fillStyle = _shade(ARCH.stone, 0.6); x.fillRect(0, 0, W, H);
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? 32 : 0;
    for (let c = -1; c < 3; c++) {
      const bx = c * 64 + off, by = r * 32;
      x.fillStyle = _shade(ARCH.stone, 0.88 + Math.random() * 0.24);
      x.fillRect(bx + 2, by + 2, 60, 28);
      x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(bx + 2, by + 2, 60, 3);
    }
  }
  _noise(x, W, H, 0.07, 900);
}, true);
// Sokak döşemesi: düzensiz taş levhalar
const texPave = () => archCanvasTex('pave', 512, 512, (x, W, H) => {
  x.fillStyle = '#5e5446'; x.fillRect(0, 0, W, H);
  const rows = 8, rh = H / rows;
  for (let r = 0; r < rows; r++) {
    let cx = -(r % 2) * 30;
    while (cx < W) {
      const w = 48 + Math.floor(Math.random() * 40);
      x.fillStyle = ARCH.pave[Math.floor(Math.random() * ARCH.pave.length)];
      x.fillRect(cx + 2, r * rh + 2, w - 4, rh - 4);
      x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(cx + 2, r * rh + 2, w - 4, 3);
      x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(cx + 2, r * rh + rh - 6, w - 4, 4);
      cx += w;
    }
  }
  _noise(x, W, H, 0.05, 5000);
}, true);
// Meydan: iç içe halka döşeme ve merkez rozet
const texPlaza = () => archCanvasTex('plaza', 512, 512, (x, W, H) => {
  const c = W / 2;
  x.fillStyle = '#5e5446'; x.fillRect(0, 0, W, H);
  for (let ring = 0; ring < 10; ring++) {
    const r0 = 30 + ring * 22.5, r1 = r0 + 22.5, n = 10 + ring * 6;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * 6.2832 + ring * 0.13, a1 = (i + 1) / n * 6.2832 + ring * 0.13;
      x.beginPath(); x.arc(c, c, r1 - 1.5, a0 + 0.012, a1 - 0.012); x.arc(c, c, r0 + 1.5, a1 - 0.012, a0 + 0.012, true); x.closePath();
      x.fillStyle = ring === 9 || ring === 4 ? _shade(ARCH.stone, 0.95) : ARCH.pave[(i + ring) % ARCH.pave.length];
      x.fill();
    }
  }
  // merkez: sekiz köşeli yıldız rozet
  x.fillStyle = '#8a6a3a'; x.beginPath();
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832, r = i % 2 ? 18 : 30; x.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
  x.closePath(); x.fill();
  _noise(x, W, H, 0.05, 4000);
}, false);
// Tabela: lake zemin, altın çerçeve, ikon + yazı
function texSign(iconKey, label, sub) {
  return archCanvasTex('sign:' + iconKey + label, 256, 96, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1410'); g.addColorStop(1, '#14090a');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#d9a92e'; x.lineWidth = 6; x.strokeRect(5, 5, W - 10, H - 10);
    x.strokeStyle = '#8a6a1e'; x.lineWidth = 2; x.strokeRect(13, 13, W - 26, H - 26);
    if (iconKey && typeof ICON_PATHS !== 'undefined' && ICON_PATHS[iconKey]) {
      x.save(); x.translate(20, 18); x.scale(60 / 512, 60 / 512);
      x.fillStyle = '#f0c850'; x.fill(new Path2D(ICON_PATHS[iconKey])); x.restore();
    }
    x.fillStyle = '#f4d26a'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'bold 26px Cinzel, Georgia, serif';
    x.fillText(label, 160, sub ? 40 : 48, 160);
    if (sub) { x.font = '15px "Alegreya Sans", Georgia, sans-serif'; x.fillStyle = '#e8d8b0'; x.fillText(sub, 160, 68, 160); }
  }, false);
}
// Sancak: uzun kumaş, ikon
function texBanner(color, iconKey) {
  return archCanvasTex('banner:' + color + iconKey, 64, 192, (x, W, H) => {
    x.fillStyle = color; x.fillRect(0, 0, W, H - 20);
    x.beginPath(); x.moveTo(0, H - 20); x.lineTo(W / 2, H); x.lineTo(W, H - 20); x.fill();
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, W, 10);
    x.strokeStyle = '#e8c050'; x.lineWidth = 3; x.strokeRect(5, 14, W - 10, H - 44);
    if (iconKey && ICON_PATHS[iconKey]) { x.save(); x.translate(10, 60); x.scale(44 / 512, 44 / 512); x.fillStyle = '#f0d070'; x.fill(new Path2D(ICON_PATHS[iconKey])); x.restore(); }
    _noise(x, W, H, 0.05, 300);
  }, false);
}

// ---------- Birleştirme (draw call azaltma) ----------
class ArchBatch {
  constructor() { this.groups = new Map(); }
  add(mat, geo, m, color) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(m);
    if (color !== undefined) {
      const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    }
    if (!this.groups.has(mat)) this.groups.set(mat, []);
    this.groups.get(mat).push(g);
  }
  build(scene, shadow = true) {
    const out = [];
    for (const [mat, list] of this.groups) {
      const names = ['position', 'normal', 'uv', 'color'].filter(k => list[0].attributes[k]);
      let total = 0; for (const g of list) total += g.attributes.position.count;
      const merged = new THREE.BufferGeometry();
      for (const k of names) {
        const size = list[0].attributes[k].itemSize, arr = new Float32Array(total * size);
        let off = 0;
        for (const g of list) { const a = g.attributes[k]; if (a) arr.set(a.array, off); off += g.attributes.position.count * size; }
        merged.setAttribute(k, new THREE.BufferAttribute(arr, size));
      }
      merged.computeBoundingSphere();
      for (const g of list) g.dispose();
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = shadow && !mat.userData.noShadow; mesh.receiveShadow = true;
      scene.add(mesh); out.push(mesh);
    }
    this.groups.clear();
    return out;
  }
}

const _am = new THREE.Matrix4(), _aq = new THREE.Quaternion(), _ae = new THREE.Euler(0, 0, 0, 'YXZ'), _av = new THREE.Vector3(), _as = new THREE.Vector3();
// yerel dönüşüm matrisi
function AM(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  _ae.set(rx, ry, rz, 'YXZ'); _aq.setFromEuler(_ae);
  return new THREE.Matrix4().compose(_av.set(x, y, z), _aq, _as.set(sx, sy, sz));
}
// İki nokta arasında kiriş (x ekseni boyunca uzanan kutu)
function AMbeam(a, b, t = 0.2, h = t) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.normalize());
  return new THREE.Matrix4().compose(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), q, new THREE.Vector3(L, h, t));
}

// ---------- Kıvrık saçaklı kalça çatı ----------
// W×D taban, H yükseklik; saçaklar içbükey, köşeler yukarı kalkık. Yükseklik fonksiyonu da döner.
function archRoof(W, D, H, up = 0.6, seg = 14) {
  const hw = W / 2, hd = D / 2, m = Math.min(hw, hd);
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hAt = (x, z) => {
    const ex = hw - Math.abs(x), ez = hd - Math.abs(z), t = clamp(Math.min(ex, ez) / m, 0, 1);
    const cx = Math.abs(x) / hw, cz = Math.abs(z) / hd;
    const corner = sm(0.5, 1, cx) * sm(0.5, 1, cz);
    return H * Math.pow(t, 1.55) + up * corner * corner + up * 0.22 * Math.pow(1 - t, 3);
  };
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= seg; j++) for (let i = 0; i <= seg; i++) {
    const x = -hw + W * i / seg, z = -hd + D * j / seg, y = hAt(x, z);
    pos.push(x, y, z);
    const ex = hw - Math.abs(x), ez = hd - Math.abs(z);
    if (ez <= ex) uv.push(x / 1.6, (hd - Math.abs(z)) / 1.2); else uv.push(z / 1.6, (hw - Math.abs(x)) / 1.2);
  }
  for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) {
    const a = j * (seg + 1) + i, b = a + 1, c = a + seg + 1, d = c + 1;
    // köşegeni kalça çizgisine göre seç (kırışık olmasın)
    const xm = -hw + W * (i + 0.5) / seg, zm = -hd + D * (j + 0.5) / seg;
    if ((xm > 0) === (zm > 0)) { idx.push(a, c, b, b, c, d); } else { idx.push(a, c, d, a, d, b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // normaller yukarı baksın (DoubleSide ile alt yüz de görünür)
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) if (n.getY(i) < 0) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  return { geo: g, hAt, W, D, H };
}

// ---------- Mimari kit ----------
class ArchKit {
  constructor(world) {
    this.world = world; this.scene = world.scene;
    this.b = new ArchBatch();
    const L = (o) => new THREE.MeshLambertMaterial(o);
    this.m = world._archMats || (world._archMats = {
      roof: L({ map: texRoof(), side: THREE.DoubleSide }),
      wall: L({ map: texWall() }),
      lattice: L({ map: texLattice() }),
      door: L({ map: texDoor() }),
      stone: L({ map: texStone() }),
      vc: L({ vertexColors: true }),
      lantern: new THREE.MeshBasicMaterial({ color: 0x8a2a1e }),
      water: L({ color: 0x3a8ab0, transparent: true, opacity: 0.85 }),
      banner: L({ map: texBanner(ARCH.banner, 'm_bicheon'), side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 })
    });
    this.m.lantern.userData.noShadow = true; this.m.water.userData.noShadow = true;
    world.lanternRed = this.m.lantern;
    this.rects = [];     // mini harita ve yerleşim için dikdörtgenler
  }
  // dönüşüm T ile yerel parçayı ekle
  put(mat, geo, T, local, color) { this.b.add(mat, geo, T ? T.clone().multiply(local) : local, color); }

  // dikdörtgeni engel dairelerle kapla
  block(x, z, w, d, ry, type = 'bld') {
    const long = Math.max(w, d), short = Math.min(w, d), r = short / 2 * 1.08;
    const n = Math.max(1, Math.ceil((long - short) / (r * 1.2)) + 1);
    const ax = w >= d ? [Math.cos(ry), -Math.sin(ry)] : [Math.sin(ry), Math.cos(ry)];
    for (let i = 0; i < n; i++) {
      const o = n === 1 ? 0 : (i / (n - 1) - 0.5) * (long - short);
      this.world.obstacles.push({ x: x + ax[0] * o, z: z + ax[1] * o, r, type });
    }
    this.rects.push({ x, z, w, d, ry, type });
  }

  // Çatı + mahya + kalça kirişleri + köşe süsleri
  roof(T, y, W, D, H, up) {
    const R = archRoof(W, D, H, up);
    this.put(this.m.roof, R.geo, T, AM(0, y, 0));
    R.geo.dispose();
    const rc = ARCH.ridge, hw = W / 2, hd = D / 2;
    const P = (x, z, lift = 0.1) => new THREE.Vector3(x, y + R.hAt(x, z) + lift, z);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const along = W >= D, rl = Math.abs(hw - hd);
    const e1 = along ? P(-rl, 0, 0.12) : P(0, -rl, 0.12), e2 = along ? P(rl, 0, 0.12) : P(0, rl, 0.12);
    if (rl > 0.05) this.put(this.m.vc, box, T, AMbeam(e1, e2, 0.34, 0.34), rc);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const start = along ? new THREE.Vector3(sx * rl, 0, 0) : new THREE.Vector3(0, 0, sz * rl);
      let prev = P(start.x, start.z, 0.12);
      for (let k = 1; k <= 4; k++) {
        const t = k / 4, x = start.x + (sx * hw - start.x) * t * 0.97, z = start.z + (sz * hd - start.z) * t * 0.97;
        const p = P(x, z, 0.1);
        this.put(this.m.vc, box, T, AMbeam(prev, p, 0.24, 0.24), rc);
        prev = p;
      }
      // kalkık uç süsü
      const tip = new THREE.ConeGeometry(0.12, 0.55, 5);
      this.put(this.m.vc, tip, T, AM(prev.x, prev.y + 0.2, prev.z, 0, 1, 1, 1, sz * 0.5, -sx * 0.5), ARCH.trim);
    }
    // mahya uç süsleri (balık kuyruğu) ya da tepe topuzu
    if (rl > 0.05) {
      for (const e of [e1, e2]) {
        const s = along ? Math.sign(e.x) : Math.sign(e.z);
        this.put(this.m.vc, box, T, AM(e.x, e.y + 0.38, e.z, along ? 0 : Math.PI / 2, 0.22, 0.75, 0.3, 0, -s * 0.35), rc);
      }
      this.put(this.m.vc, new THREE.SphereGeometry(0.2, 8, 6), T, AM(0, e1.y + 0.28, 0), ARCH.trim);
    } else {
      this.put(this.m.vc, new THREE.CylinderGeometry(0.08, 0.14, 0.7, 6), T, AM(0, y + H + 0.4, 0), ARCH.trim);
      this.put(this.m.vc, new THREE.SphereGeometry(0.22, 8, 6), T, AM(0, y + H + 0.85, 0), ARCH.trim);
    }
  }

  // Sütunlu salon: kaide, kırmızı sütunlar, sıva duvar, kafes pencere, kapı, kirişler, çatı
  hall(x, z, ry, o = {}) {
    const w = o.w || 7, d = o.d || 5.5, h = o.h || 3.2, floors = o.floors || 1, P = o.podium == null ? 0.5 : o.podium;
    const oh = o.oh || 1.15, up = o.up == null ? 0.65 : o.up, roofH = o.roofH || Math.min(w, d) * 0.36;
    const T = AM(x, terrainHeight(x, z), z, ry);
    const box = new THREE.BoxGeometry(1, 1, 1), col = new THREE.CylinderGeometry(0.17, 0.2, 1, 8), plane = new THREE.PlaneGeometry(1, 1);
    if (P > 0) {
      this.put(this.m.stone, box, T, AM(0, P / 2, 0, 0, w + 1.3, P, d + 1.3));
      this.put(this.m.stone, box, T, AM(0, P * 0.25, d / 2 + 0.65 + 0.45, 0, 2.6, P * 0.5, 0.9));
    }
    let y = P;
    for (let f = 0; f < floors; f++) {
      const fw = w - f * 1.6, fd = d - f * 1.3, fh = f ? h * 0.78 : h;
      // sütunlar
      const nx = Math.max(2, Math.round(fw / 2.3) + 1), nz = Math.max(2, Math.round(fd / 2.3) + 1);
      const pts = [];
      for (let i = 0; i < nx; i++) { const px = -fw / 2 + fw * i / (nx - 1); pts.push([px, -fd / 2], [px, fd / 2]); }
      for (let i = 1; i < nz - 1; i++) { const pz = -fd / 2 + fd * i / (nz - 1); pts.push([-fw / 2, pz], [fw / 2, pz]); }
      for (const [px, pz] of pts) {
        this.put(this.m.vc, col, T, AM(px, y + fh / 2, pz, 0, 1, fh, 1), ARCH.wood);
        if (!f) this.put(this.m.vc, box, T, AM(px, y + 0.08, pz, 0, 0.5, 0.16, 0.5), 0x8a8478);
      }
      // duvar gövdesi
      this.put(this.m.wall, box, T, AM(0, y + fh / 2, 0, 0, fw - 0.5, fh, fd - 0.5));
      const fz = (fd - 0.5) / 2 + 0.012, fx = (fw - 0.5) / 2 + 0.012;
      if (!f) {
        if (o.door !== false) this.put(this.m.door, plane, T, AM(0, y + 1.1, fz, 0, 1.7, 2.2, 1));
        if (fw > 5.2) for (const s of [-1, 1]) this.put(this.m.lattice, plane, T, AM(s * (fw / 2 - 1.45), y + fh * 0.56, fz, 0, 1.35, 1.25, 1));
        for (const s of [-1, 1]) this.put(this.m.lattice, plane, T, AM(s * fx, y + fh * 0.56, 0, s * Math.PI / 2, 1.2, 1.15, 1));
      } else {
        const n = Math.max(2, Math.floor(fw / 1.9));
        for (let i = 0; i < n; i++) this.put(this.m.lattice, plane, T, AM(-fw / 2 + 0.25 + (fw - 0.5) * (i + 0.5) / n, y + fh * 0.55, fz, 0, (fw - 0.5) / n - 0.25, fh * 0.55, 1));
        for (const s of [-1, 1]) this.put(this.m.lattice, plane, T, AM(s * fx, y + fh * 0.55, 0, s * Math.PI / 2, fd * 0.5, fh * 0.5, 1));
        // balkon korkuluğu
        this.put(this.m.vc, box, T, AM(0, y + 0.55, fd / 2 + 0.35, 0, fw + 0.4, 0.08, 0.08), ARCH.wood);
        this.put(this.m.vc, box, T, AM(0, y + 0.1, fd / 2 + 0.35, 0, fw + 0.4, 0.2, 0.7), ARCH.beam);
      }
      // kiriş kuşağı + altın şerit + bindirmeler
      this.put(this.m.vc, box, T, AM(0, y + fh + 0.17, 0, 0, fw + 0.36, 0.34, fd + 0.36), ARCH.beam);
      this.put(this.m.vc, box, T, AM(0, y + fh + 0.02, 0, 0, fw + 0.4, 0.07, fd + 0.4), ARCH.trim);
      for (const [px, pz] of pts) this.put(this.m.vc, box, T, AM(px * 1.04, y + fh + 0.42, pz * 1.04, 0, 0.42, 0.18, 0.42), ARCH.trim);
      const top = f === floors - 1;
      this.roof(T, y + fh + 0.34, fw + oh * 2, fd + oh * 2, top ? roofH : 0.85, top ? up : up * 0.55);
      y += fh + 0.34 + (top ? 0 : 0.35);
    }
    if (o.sign) this.sign(T, o.sign, 0, P + h - 0.5, (d - 0.5) / 2 + 0.06);
    if (o.lanterns !== false) for (const s of [-1, 1]) this.hangLantern(T, s * (w / 2 + 0.05), P + h - 0.1, d / 2 + 0.05, 0.85);
    this.block(x, z, w + 1.3, d + 1.3, ry);
    return T;
  }

  // Asılı kâğıt fener (yerel)
  hangLantern(T, x, y, z, s = 1) {
    const sph = new THREE.SphereGeometry(0.32, 8, 6), cap = new THREE.CylinderGeometry(0.16, 0.2, 0.1, 8), cord = new THREE.BoxGeometry(0.03, 0.4, 0.03);
    this.put(this.m.vc, cord, T, AM(x, y - 0.2 * s, z, 0, s, s, s), 0x2a1a10);
    this.put(this.m.lantern, sph, T, AM(x, y - 0.62 * s, z, 0, s, 1.25 * s, s));
    this.put(this.m.vc, cap, T, AM(x, y - 0.24 * s, z, 0, s, s, s), ARCH.trim);
    this.put(this.m.vc, cap, T, AM(x, y - 1.0 * s, z, 0, s, s, s), ARCH.trim);
    this.put(this.m.vc, new THREE.BoxGeometry(0.04, 0.3, 0.04), T, AM(x, y - 1.2 * s, z, 0, s, s, s), 0xd83a2a);
  }
  // Ayaklı fener
  lampPost(x, z) {
    const T = AM(x, terrainHeight(x, z), z, _rng() * 6);
    this.put(this.m.stone, new THREE.BoxGeometry(0.6, 0.35, 0.6), T, AM(0, 0.17, 0));
    this.put(this.m.vc, new THREE.CylinderGeometry(0.09, 0.12, 3.4, 6), T, AM(0, 1.9, 0), 0x2e2016);
    this.put(this.m.vc, new THREE.BoxGeometry(0.9, 0.08, 0.08), T, AM(0.35, 3.45, 0), 0x2e2016);
    this.hangLantern(T, 0.72, 3.45, 0, 0.85);
    this.world.obstacles.push({ x, z, r: 0.35, type: 'lamp' });
  }
  // Tabela (ayrı doku → ayrı ağ)
  sign(T, s, x, y, z) {
    const mat = new THREE.MeshLambertMaterial({ map: texSign(s.icon, s.label, s.sub) });
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.95, 0.12), [this.m.vc, this.m.vc, this.m.vc, this.m.vc, mat, this.m.vc]);
    m.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(m.geometry.attributes.position.count * 3).fill(0.35), 3));
    m.applyMatrix4(T.clone().multiply(AM(x, y, z)));
    m.castShadow = true;
    this.scene.add(m);
  }
  // Sancak direği
  bannerPole(x, z, ry, h = 5.5) {
    const T = AM(x, terrainHeight(x, z), z, ry);
    this.put(this.m.vc, new THREE.CylinderGeometry(0.07, 0.09, h, 6), T, AM(0, h / 2, 0), 0x3a2416);
    this.put(this.m.vc, new THREE.BoxGeometry(1.0, 0.07, 0.07), T, AM(0.45, h - 0.15, 0), 0x3a2416);
    this.put(this.m.vc, new THREE.SphereGeometry(0.11, 6, 5), T, AM(0, h + 0.05, 0), ARCH.trim);
    this.put(this.m.banner, new THREE.PlaneGeometry(1, 1), T, AM(0.48, h - 1.65, 0.02, 0, 0.82, 2.9, 1));
    this.world.obstacles.push({ x, z, r: 0.3, type: 'lamp' });
  }

  // Pagoda: kademeli kule
  pagoda(x, z, tiers = 5) {
    const T = AM(x, terrainHeight(x, z), z, Math.PI / 4 * 0);
    const box = new THREE.BoxGeometry(1, 1, 1), col = new THREE.CylinderGeometry(0.15, 0.17, 1, 8);
    this.put(this.m.stone, box, T, AM(0, 0.4, 0, 0, 7.4, 0.8, 7.4));
    this.put(this.m.stone, box, T, AM(0, 0.95, 0, 0, 6.2, 0.3, 6.2));
    let y = 1.1, s = 5.2;
    for (let i = 0; i < tiers; i++) {
      const hh = i ? 2.1 - i * 0.08 : 2.8;
      this.put(this.m.wall, box, T, AM(0, y + hh / 2, 0, 0, s - 0.4, hh, s - 0.4));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.put(this.m.vc, col, T, AM(sx * s / 2, y + hh / 2, sz * s / 2, 0, 1, hh, 1), ARCH.wood);
      const pl = new THREE.PlaneGeometry(1, 1);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; this.put(i ? this.m.lattice : this.m.door, pl, T, AM(Math.sin(a) * ((s - 0.4) / 2 + 0.01), y + (i ? hh * 0.5 : 1.1), Math.cos(a) * ((s - 0.4) / 2 + 0.01), a, i ? s * 0.4 : 1.4, i ? hh * 0.5 : 2.1, 1)); }
      this.put(this.m.vc, box, T, AM(0, y + hh + 0.15, 0, 0, s + 0.3, 0.3, s + 0.3), ARCH.beam);
      this.put(this.m.vc, box, T, AM(0, y + hh + 0.01, 0, 0, s + 0.34, 0.06, s + 0.34), ARCH.trim);
      const top = i === tiers - 1;
      this.roof(T, y + hh + 0.3, s + 2.0, s + 2.0, top ? 1.8 : 0.8, 0.55);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.hangLantern(T, sx * (s / 2 + 0.95), y + hh + 0.35, sz * (s / 2 + 0.95), 0.55);
      y += hh + 0.3 + (top ? 0 : 0.55);
      s -= 0.7;
    }
    // tepe: halkalı mızrak
    this.put(this.m.vc, new THREE.CylinderGeometry(0.07, 0.1, 3.2, 6), T, AM(0, y + 2.6, 0), ARCH.trim);
    for (let k = 0; k < 5; k++) this.put(this.m.vc, new THREE.TorusGeometry(0.28 - k * 0.035, 0.05, 5, 12), T, AM(0, y + 2.0 + k * 0.32, 0, 0, 1, 1, 1, Math.PI / 2), ARCH.trim);
    this.put(this.m.vc, new THREE.SphereGeometry(0.22, 8, 6), T, AM(0, y + 4.3, 0), ARCH.trim);
    this.block(x, z, 7.4, 7.4, 0);
  }

  // Takı kapı (paifang): 4 sütun, kirişler, üç çatı, isim levhası
  paifang(x, z, ry, span = 14, name = '', h = 7) {
    const T = AM(x, terrainHeight(x, z), z, ry);
    const box = new THREE.BoxGeometry(1, 1, 1), col = new THREE.CylinderGeometry(0.42, 0.48, 1, 10);
    const outer = span / 2, inner = span * 0.2;
    for (const px of [-outer, -inner, inner, outer]) {
      const ph = Math.abs(px) < outer ? h : h - 1.3;
      this.put(this.m.stone, box, T, AM(px, 0.5, 0, 0, 1.3, 1.0, 1.6));
      this.put(this.m.vc, col, T, AM(px, ph / 2, 0, 0, 1, ph, 1), ARCH.wood);
      this.put(this.m.stone, box, T, AM(px, 0.75, 0.95, 0, 0.6, 1.5, 0.35, -0.5));     // payanda taşı
      this.put(this.m.stone, box, T, AM(px, 0.75, -0.95, 0, 0.6, 1.5, 0.35, 0.5));
      this.world.obstacles.push({ x: x + Math.cos(ry) * px, z: z - Math.sin(ry) * px, r: 0.85, type: 'gate' });
    }
    // orta kısım
    this.put(this.m.vc, box, T, AM(0, h - 0.35, 0, 0, inner * 2 + 1.2, 0.55, 0.7), ARCH.beam);
    this.put(this.m.vc, box, T, AM(0, h - 1.75, 0, 0, inner * 2 + 0.9, 0.45, 0.6), ARCH.beam);
    this.put(this.m.vc, box, T, AM(0, h - 0.08, 0, 0, inner * 2 + 1.3, 0.1, 0.75), ARCH.trim);
    this.roof(T, h, inner * 2 + 2.6, 2.4, 1.0, 0.55);
    // yan kısımlar
    for (const s of [-1, 1]) {
      const cx = s * (inner + outer) / 2, w = outer - inner;
      this.put(this.m.vc, box, T, AM(cx, h - 1.6, 0, 0, w + 0.9, 0.5, 0.65), ARCH.beam);
      this.put(this.m.vc, box, T, AM(cx, h - 1.38, 0, 0, w + 1.0, 0.08, 0.7), ARCH.trim);
      this.roof(T, h - 1.3, w + 2.0, 2.1, 0.8, 0.45);
    }
    if (name) {
      const mat = new THREE.MeshLambertMaterial({ map: texSign('crown', name, '') });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(inner * 2 - 0.4, 1.0), mat);
      for (const s of [1, -1]) {
        const m = pl.clone(); m.applyMatrix4(T.clone().multiply(AM(0, h - 1.05, s * 0.33, s > 0 ? 0 : Math.PI))); this.scene.add(m);
      }
    }
    for (const s of [-1, 1]) this.hangLantern(T, s * inner * 0.55, h - 1.95, 0, 0.9);
  }

  // Gözetleme kulesi: taş gövde + sütunlu köşk
  watchtower(x, z) {
    const T = AM(x, terrainHeight(x, z), z, 0);
    const box = new THREE.BoxGeometry(1, 1, 1), col = new THREE.CylinderGeometry(0.16, 0.18, 1, 8);
    this.put(this.m.stone, box, T, AM(0, 3.6, 0, 0, 5.6, 7.2, 5.6));
    this.put(this.m.stone, box, T, AM(0, 7.35, 0, 0, 6.2, 0.3, 6.2));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.put(this.m.vc, col, T, AM(sx * 2.4, 8.8, sz * 2.4, 0, 1, 2.6, 1), ARCH.wood);
    for (const s of [-1, 1]) {   // korkuluk
      this.put(this.m.vc, box, T, AM(0, 8.0, s * 2.4, 0, 4.8, 0.1, 0.1), ARCH.wood);
      this.put(this.m.vc, box, T, AM(s * 2.4, 8.0, 0, 0, 0.1, 0.1, 4.8), ARCH.wood);
    }
    this.put(this.m.vc, box, T, AM(0, 10.2, 0, 0, 5.2, 0.3, 5.2), ARCH.beam);
    this.roof(T, 10.35, 7.0, 7.0, 1.9, 0.75);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.hangLantern(T, sx * 3.0, 10.3, sz * 3.0, 0.7);
    this.world.obstacles.push({ x, z, r: 3.2, type: 'wall' });
  }

  // Kerpiç ev (Donwhang / Hotan): düz dam, korkuluk, çıkıntılı kiriş uçları
  adobe(x, z, ry, w, d, h, dome = false) {
    const T = AM(x, terrainHeight(x, z), z, ry);
    const box = new THREE.BoxGeometry(1, 1, 1), plane = new THREE.PlaneGeometry(1, 1);
    this.put(this.m.wall, box, T, AM(0, h / 2, 0, 0, w, h, d));
    this.put(this.m.wall, box, T, AM(0, h + 0.25, 0, 0, w + 0.2, 0.5, d + 0.2));
    this.put(this.m.vc, box, T, AM(0, h + 0.02, 0, 0, w + 0.3, 0.12, d + 0.3), 0x6a4a2a);
    for (let i = 0; i < Math.floor(w / 0.9); i++) this.put(this.m.vc, new THREE.CylinderGeometry(0.08, 0.08, 0.5, 5), T, AM(-w / 2 + 0.45 + i * 0.9, h - 0.25, d / 2 + 0.15, 0, 1, 1, 1, Math.PI / 2), 0x5a3a1e);
    this.put(this.m.door, plane, T, AM(0, 1.05, d / 2 + 0.012, 0, 1.3, 2.1, 1));
    this.put(this.m.vc, box, T, AM(0, 2.3, d / 2 + 0.18, 0, 1.8, 0.12, 0.36), 0x5a3a1e);   // kapı saçağı
    for (const s of [-1, 1]) if (w > 4.4) this.put(this.m.lattice, plane, T, AM(s * (w / 2 - 1.0), h * 0.6, d / 2 + 0.012, 0, 0.8, 0.9, 1));
    for (const s of [-1, 1]) this.put(this.m.lattice, plane, T, AM(s * (w / 2 + 0.012), h * 0.6, 0, s * Math.PI / 2, 0.8, 0.9, 1));
    if (dome) {
      const r = Math.min(w, d) * 0.36;
      this.put(this.m.wall, new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.6, 16), T, AM(0, h + 0.6, 0));
      this.put(this.m.roof, new THREE.SphereGeometry(r, 16, 10, 0, 6.2832, 0, Math.PI / 2), T, AM(0, h + 0.9, 0, 0, 1, 1.15, 1));
      this.put(this.m.vc, new THREE.CylinderGeometry(0.05, 0.08, 0.8, 6), T, AM(0, h + 0.9 + r * 1.15 + 0.35, 0), ARCH.trim);
      this.put(this.m.vc, new THREE.SphereGeometry(0.14, 8, 6), T, AM(0, h + 0.9 + r * 1.15 + 0.8, 0), ARCH.trim);
    } else if (_rng() < 0.5) {   // dam üstü gölgelik
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.put(this.m.vc, new THREE.CylinderGeometry(0.05, 0.05, 1.6, 5), T, AM(sx * w * 0.3, h + 1.3, sz * d * 0.3), 0x5a3a1e);
      this.put(this.m.vc, box, T, AM(0, h + 2.1, 0, 0, w * 0.68, 0.06, d * 0.68), _rng() < 0.5 ? 0xc0502a : 0x2a6a8a);
    }
    this.block(x, z, w + 0.2, d + 0.2, ry);
  }

  // Ağaç: gövde + alçak poligon taç (erik çiçeği / söğüt)
  tree(x, z, s = 1) {
    const T = AM(x, terrainHeight(x, z), z, _rng() * 6, s, s, s);
    this.put(this.m.vc, new THREE.CylinderGeometry(0.18, 0.3, 2.6, 6), T, AM(0, 1.3, 0, 0, 1, 1, 1, 0.08), 0x5a3a24);
    this.put(this.m.vc, new THREE.CylinderGeometry(0.08, 0.14, 1.4, 5), T, AM(0.5, 2.4, 0, 0, 1, 1, 1, 0, -0.8), 0x5a3a24);
    const ico = new THREE.IcosahedronGeometry(1, 0);
    const blobs = [[0, 3.3, 0, 1.5], [1.0, 3.0, 0.3, 1.1], [-0.8, 3.1, -0.4, 1.15], [0.2, 3.9, -0.5, 1.0], [-0.3, 2.9, 0.9, 0.95]];
    for (const [bx, by, bz, br] of blobs) this.put(this.m.vc, ico, T, AM(bx, by, bz, _rng() * 3, br, br * 0.85, br), ARCH.leaf[Math.floor(_rng() * ARCH.leaf.length)]);
    this.world.obstacles.push({ x, z, r: 0.5 * s, type: 'palm' });
  }

  // Meydan ortası: sekizgen havuz, nilüfer, taş fener
  centerpiece() {
    const T = AM(0, 0, 0);
    this.put(this.m.stone, new THREE.CylinderGeometry(3.3, 3.5, 0.7, 8), T, AM(0, 0.35, 0));
    this.put(this.m.water, new THREE.CircleGeometry(2.95, 16), T, AM(0, 0.62, 0, 0, 1, 1, 1, -Math.PI / 2));
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3, r = 1.6 + (i % 2) * 0.6; this.put(this.m.vc, new THREE.CircleGeometry(0.32, 8), T, AM(Math.cos(a) * r, 0.64, Math.sin(a) * r, 0, 1, 1, 1, -Math.PI / 2), 0x4a8a3a); }
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.9; this.put(this.m.vc, new THREE.SphereGeometry(0.13, 6, 5), T, AM(Math.cos(a) * 2.1, 0.72, Math.sin(a) * 2.1), 0xf6a8c0); }
    // taş fener
    const box = new THREE.BoxGeometry(1, 1, 1);
    this.put(this.m.stone, new THREE.CylinderGeometry(0.7, 0.85, 0.5, 6), T, AM(0, 0.85, 0));
    this.put(this.m.stone, new THREE.CylinderGeometry(0.22, 0.3, 1.6, 6), T, AM(0, 1.9, 0));
    this.put(this.m.stone, new THREE.CylinderGeometry(0.75, 0.6, 0.25, 6), T, AM(0, 2.8, 0));
    this.put(this.m.lantern, box, T, AM(0, 3.25, 0, 0, 0.6, 0.65, 0.6));
    this.put(this.m.stone, new THREE.ConeGeometry(0.95, 0.75, 6), T, AM(0, 3.95, 0));
    this.put(this.m.vc, new THREE.SphereGeometry(0.16, 8, 6), T, AM(0, 4.4, 0), ARCH.trim);
    this.world.obstacles.push({ x: 0, z: 0, r: 3.5, type: 'fountain' });
  }

  // Meydan çevresinde fener dizileri (sarkık ip + küçük fenerler)
  lanternString(a, b, n = 6) {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 0.9, a.z + (b.z - a.z) * t)); }
    for (let i = 0; i < 12; i++) this.put(this.m.vc, new THREE.BoxGeometry(1, 1, 1), null, AMbeam(pts[i], pts[i + 1], 0.03, 0.03), 0x2a1a10);
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1), p = new THREE.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 0.9, a.z + (b.z - a.z) * t);
      this.put(this.m.lantern, new THREE.SphereGeometry(0.2, 8, 6), null, AM(p.x, p.y - 0.3, p.z, 0, 1, 1.25, 1));
      this.put(this.m.vc, new THREE.CylinderGeometry(0.1, 0.12, 0.06, 6), null, AM(p.x, p.y - 0.06, p.z), ARCH.trim);
    }
  }

  // Taş döşeme ve meydan
  pavement(half) {
    const tex = texPave(); tex.repeat.set(half * 2 / 6, half * 2 / 6);
    const pave = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), new THREE.MeshLambertMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    pave.rotation.x = -Math.PI / 2; pave.position.y = 0.03; pave.receiveShadow = true;
    this.scene.add(pave);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(12, 48), new THREE.MeshLambertMaterial({ map: texPlaza(), polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.05; plaza.receiveShadow = true;
    this.scene.add(plaza);
  }

  // Basit mal yığınları (dükkân önleri)
  goods(T, kind) {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const table = () => {
      this.put(this.m.vc, box, T, AM(0, 0.8, 0, 0, 2.4, 0.1, 0.9), 0x6a4426);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.put(this.m.vc, box, T, AM(sx * 1.05, 0.4, sz * 0.35, 0, 0.1, 0.8, 0.1), 0x4a2e18);
    };
    if (kind === 'merchant') {           // iksir rafı
      table();
      const cols = [0xd03a2a, 0x2a5ad0, 0xd03a2a, 0x2a9a5a, 0xd8a830, 0x2a5ad0, 0xd03a2a];
      cols.forEach((c, i) => {
        this.put(this.m.vc, new THREE.CylinderGeometry(0.09, 0.12, 0.3, 7), T, AM(-0.95 + i * 0.32, 1.0, (i % 2) * 0.2 - 0.1), c);
        this.put(this.m.vc, new THREE.CylinderGeometry(0.035, 0.05, 0.1, 5), T, AM(-0.95 + i * 0.32, 1.2, (i % 2) * 0.2 - 0.1), 0xe8d8b0);
      });
      this.put(this.m.vc, new THREE.SphereGeometry(0.28, 8, 6), T, AM(0.95, 1.12, -0.1, 0, 1, 1.1, 1), 0xc8a060);  // su kabağı
    } else if (kind === 'acc') {          // mücevher tezgâhı
      table();
      this.put(this.m.vc, box, T, AM(0, 0.88, 0, 0, 2.0, 0.06, 0.7), 0x5a1a2a);
      const gem = new THREE.OctahedronGeometry(0.1);
      [0xff4a6a, 0x4ad8ff, 0x7aff7a, 0xffd23a, 0xc86aff, 0xffffff].forEach((c, i) => this.put(this.m.vc, gem, T, AM(-0.75 + i * 0.3, 1.0, (i % 2) * 0.2 - 0.1), c));
    } else if (kind === 'special') {      // ipek topları ve baharat çuvalları
      table();
      [0xc8302a, 0x2a7ac8, 0xe8c040].forEach((c, i) => this.put(this.m.vc, new THREE.CylinderGeometry(0.2, 0.2, 0.75, 10), T, AM(-0.7 + i * 0.5, 1.05, 0, 0, 1, 1, 1, 0, Math.PI / 2), c));
      for (const [sx, c] of [[-1.6, 0xb8742a], [1.6, 0x8a2a1a]]) {
        this.put(this.m.vc, new THREE.CylinderGeometry(0.32, 0.4, 0.75, 8), T, AM(sx, 0.38, 0.2), 0xd8c49a);
        this.put(this.m.vc, new THREE.SphereGeometry(0.33, 8, 5, 0, 6.28, 0, 1.4), T, AM(sx, 0.72, 0.2), c);
      }
    } else if (kind === 'storage' || kind === 'job') {
      for (let i = 0; i < 4; i++) this.put(this.m.vc, box, T, AM(-1.3 + (i % 2) * 0.85, 0.35 + Math.floor(i / 2) * 0.7, 0.3 + (i % 2) * 0.1, i * 0.2, 0.75, 0.7, 0.75), 0x8a6238);
      if (kind === 'job') { table(); this.put(this.m.vc, new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6), T, AM(0.4, 0.9, 0, 0, 1, 1, 1, 0, 1.4), 0xe8dcc0); this.put(this.m.vc, new THREE.BoxGeometry(0.5, 0.06, 0.38), T, AM(-0.3, 0.88, 0), 0xe8dcc0); }
    } else if (kind === 'armor') {        // zırh askısı
      for (const sx of [-1.1, 1.1]) {
        this.put(this.m.vc, new THREE.CylinderGeometry(0.05, 0.05, 1.7, 5), T, AM(sx, 0.85, 0), 0x4a2e18);
        this.put(this.m.vc, box, T, AM(sx, 1.55, 0, 0, 0.9, 0.08, 0.08), 0x4a2e18);
        this.put(this.m.vc, new THREE.CylinderGeometry(0.34, 0.28, 0.75, 8), T, AM(sx, 1.25, 0), sx < 0 ? 0x9aa0a8 : 0x7a3a2a);
        this.put(this.m.vc, new THREE.SphereGeometry(0.22, 8, 6, 0, 6.28, 0, 1.6), T, AM(sx, 1.82, 0), sx < 0 ? 0x9aa0a8 : 0x5a5a5a);
      }
    } else if (kind === 'smith') {        // silah rafı
      this.put(this.m.vc, box, T, AM(0, 1.3, -0.1, 0, 2.2, 0.1, 0.1), 0x4a2e18);
      this.put(this.m.vc, box, T, AM(0, 0.35, 0.1, 0, 2.2, 0.1, 0.4), 0x4a2e18);
      for (const sx of [-1.05, 1.05]) this.put(this.m.vc, box, T, AM(sx, 0.75, 0, 0, 0.1, 1.5, 0.1), 0x4a2e18);
      for (let i = 0; i < 5; i++) {
        const px = -0.8 + i * 0.4;
        this.put(this.m.vc, box, T, AM(px, 1.0, 0, 0, 0.06, 1.25, 0.04, 0.12), 0xc8ccd4);
        this.put(this.m.vc, box, T, AM(px, 0.42, 0.03, 0, 0.22, 0.05, 0.06), 0xc8902a);
      }
    } else if (kind === 'stable') {       // çit, saman, yalak
      for (const sx of [-1.6, 0, 1.6]) this.put(this.m.vc, box, T, AM(sx, 0.6, 0, 0, 0.12, 1.2, 0.12), 0x6a4426);
      for (const y of [0.45, 0.95]) this.put(this.m.vc, box, T, AM(0, y, 0, 0, 3.4, 0.1, 0.08), 0x6a4426);
      this.put(this.m.vc, new THREE.CylinderGeometry(0.45, 0.45, 0.8, 10), T, AM(-2.4, 0.4, 0.6, 0, 1, 1, 1, 0, Math.PI / 2), 0xd8b45a);
      this.put(this.m.vc, box, T, AM(2.3, 0.3, 0.6, 0, 1.3, 0.45, 0.6), 0x5a3a20);
    }
  }

  // Işınlayıcı platformu: taş kaide + parlayan halka
  teleportPad(x, z) {
    const T = AM(x, terrainHeight(x, z), z, 0);
    this.put(this.m.stone, new THREE.CylinderGeometry(2.6, 2.8, 0.4, 12), T, AM(0, 0.2, 0));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; this.put(this.m.stone, new THREE.BoxGeometry(0.45, 2.4, 0.45), T, AM(Math.cos(a) * 2.3, 1.4, Math.sin(a) * 2.3)); this.put(this.m.vc, new THREE.OctahedronGeometry(0.22), T, AM(Math.cos(a) * 2.3, 2.85, Math.sin(a) * 2.3), 0x8ad8ff); }
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.MeshBasicMaterial({ map: typeof vfxRuneTex === 'function' ? vfxRuneTex() : null, color: 0x7ab8ff, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, terrainHeight(x, z) + 0.43, z);
    this.scene.add(ring);
    this.world.spinners = this.world.spinners || [];
    this.world.spinners.push(ring);
  }

  finish() { return this.b.build(this.scene, true); }
}

// ---------- Şehir yerleşimi ----------
// Yol ve doğu-batı geçidini açık bırakarak dükkân yuvalarını meydan çevresine dizer;
// NPC'leri dükkânlarının önüne taşır. World inşası sırasında bir kez çağrılır.
const NPC_SHOP = {
  merchant: { icon: 'hp', label: 'Şifahane', sub: 'İksir · Parşömen', goods: 'merchant' },
  smith:    { icon: 'sword', label: 'Demirhane', sub: 'Silah · Tamir · Simya', goods: 'smith' },
  armor:    { icon: 'chest', label: 'Zırhhane', sub: 'Zırh · Kalkan', goods: 'armor' },
  acc:      { icon: 'necklace', label: 'Kuyumcu', sub: 'Takı · Şans Tozu', goods: 'acc' },
  storage:  { icon: 'stexp', label: 'Ambar', sub: 'Depo', goods: 'storage' },
  job:      { icon: 'tg', label: 'Lonca', sub: 'Meslek Loncası', goods: 'job' },
  special:  { icon: 'camel', label: 'Kervansaray', sub: 'Ticaret Malları', goods: 'special' },
  stable:   { icon: 'horse', label: 'Ahır', sub: 'Binek · Evcil', goods: 'stable' },
  market:   { icon: 'gold', label: 'Pazar', sub: 'Emanet Pazarı', goods: 'acc' }
};

function planCity() {
  if (planCity.done) return planCity.done;
  const H = TOWN_HALF, R = 19.6, W = 7.4, D = 5.4;
  const defs = typeof NPC_DEFS !== 'undefined' ? NPC_DEFS : [];
  const roadOK = (x, z, m) => Math.abs(x - roadCenterX(z)) > m;
  const ewOK = (x, z, m) => !(Math.abs(z) < 5 + m && Math.abs(x) > 8);
  // kaptan kuzey kapısının yanında, ışınlayıcı güney kapısının yanında
  const capZ = -H + 6.5, capX = roadCenterX(capZ) + 7.5;
  const telZ = H - 6.5, telX = roadCenterX(telZ) - 7.8;
  const reserved = [[capX, capZ, 4.5], [telX, telZ, 4.5]];
  const rectPts = (cx, cz, ry, w, d) => {
    const pts = [], c = Math.cos(ry), s = Math.sin(ry);
    for (const u of [-0.5, 0, 0.5]) for (const v of [-0.5, 0, 0.5]) { const lx = u * w, lz = v * d; pts.push([cx + lx * c + lz * s, cz - lx * s + lz * c]); }
    return pts;
  };
  const fits = (cx, cz, ry, w, d, extra = 0) => rectPts(cx, cz, ry, w + 1.4 + extra, d + 1.4 + extra).every(([x, z]) =>
    roadOK(x, z, 6.3) && ewOK(x, z, 0.8) && Math.max(Math.abs(x), Math.abs(z)) < H - 2.6 && Math.hypot(Math.abs(x) - H, Math.abs(z) - H) > 5 &&
    reserved.every(([rx, rz, rr]) => Math.hypot(x - rx, z - rz) > rr));
  const slots = [];
  for (let deg = -180; deg < 180; deg += 2) {
    const a = deg * Math.PI / 180, x = Math.cos(a) * R, z = Math.sin(a) * R, ry = Math.atan2(-x, -z);
    if (!fits(x, z, ry, W, D)) continue;
    if (slots.some(s => Math.hypot(s.x - x, s.z - z) < W + 1.6)) continue;
    slots.push({ x, z, ry, a });
  }
  const order = ['merchant', 'smith', 'armor', 'storage', 'acc', 'job', 'special', 'stable', 'market'];
  const shops = [];
  // yuvaları açıya göre sırala, sırayla ata
  slots.sort((p, q) => p.a - q.a);
  order.forEach((id, i) => { if (slots[i]) shops.push({ id, ...slots[i], w: W, d: D }); });
  // NPC'leri dükkân önüne taşı (kalanlar meydan kenarına)
  const free = [];
  for (const n of defs) {
    const s = shops.find(s => s.id === n.id);
    if (s) { const k = (R - D / 2 - 2.3) / R; n.x = s.x * k; n.z = s.z * k; }
    else if (n.id === 'captain') { n.x = capX; n.z = capZ + 2.5; }
    else if (n.id === 'tele') { n.x = telX; n.z = telZ - 3.2; }
    else if (n.id !== 'den') free.push(n);
  }
  // dükkânı olmayan NPC'ler: meydan kenarında tezgâh
  let ang = 0;
  for (const n of free) {
    for (let k = 0; k < 180; k++) {
      const a = (ang + k * 7) * Math.PI / 180, x = Math.cos(a) * 13.2, z = Math.sin(a) * 13.2;
      if (roadOK(x, z, 6.5) && ewOK(x, z, 1) && defs.every(o => o === n || Math.hypot(o.x - x, o.z - z) > 5)) { n.x = x; n.z = z; n.stall = true; ang = (ang + k * 7) + 40; break; }
    }
  }
  planCity.done = { shops, cap: { x: capX, z: capZ }, tele: { x: telX, z: telZ }, fits, roadOK, ewOK };
  return planCity.done;
}

// Şehir kurulumu (town3d.js çağırır): döşeme, dükkânlar, evler, pagoda, kuleler, fener ve ağaçlar
World.prototype._buildCity = function () {
  const plan = planCity(), K = new ArchKit(this), H = TOWN_HALF, rng = mulberry32(99 + Math.round(ZONE.seed * 10));
  this.arch = K;
  K.pavement(H + 1.5);
  K.centerpiece();
  // dükkânlar
  for (const s of plan.shops) {
    const info = NPC_SHOP[s.id];
    const two = s.id === 'storage' || s.id === 'job' || s.id === 'merchant';
    const T = K.hall(s.x, s.z, s.ry, { w: s.w, d: s.d, floors: two ? 2 : 1, sign: { icon: info.icon, label: info.label, sub: info.sub }, h: 3.2 });
    // NPC ile dükkân arasında mal tezgâhı (yanda)
    const G = T.clone().multiply(AM(s.id === 'stable' ? 0 : 2.9, 0, s.d / 2 + 1.9, s.id === 'stable' ? 0 : -0.3));
    K.goods(G, info.goods);
    if (s.id === 'smith' && Assets.has('survival/workbench-anvil')) {
      const p = new THREE.Vector3(-2.9, 0, s.d / 2 + 1.8).applyMatrix4(T);
      this._place('survival/workbench-anvil', p.x, p.z, 4.2, s.ry + 1.2);
      this.obstacles.push({ x: p.x, z: p.z, r: 0.9, type: 'prop' });
    }
    // dükkân yanında sancak
    const bp = new THREE.Vector3(s.w / 2 + 0.9, 0, s.d / 2 + 0.6).applyMatrix4(T);
    K.bannerPole(bp.x, bp.z, s.ry);
  }
  // NPC tezgâhları (dükkânı olmayanlar)
  for (const n of (typeof NPC_DEFS !== 'undefined' ? NPC_DEFS : [])) {
    if (!n.stall) continue;
    const ry = Math.atan2(-n.x, -n.z), back = 1.8;
    const sx = n.x - Math.sin(ry) * back, sz = n.z - Math.cos(ry) * back;
    const T = AM(sx, 0, sz, ry);
    K.goods(T, (NPC_SHOP[n.id] || {}).goods || 'special');
    const box = new THREE.BoxGeometry(1, 1, 1);
    for (const a of [-1.3, 1.3]) for (const b of [-0.6, 0.6]) K.put(K.m.vc, new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5), T, AM(a, 1.3, b), 0x5a3a20);
    K.put(K.m.vc, box, T, AM(0, 2.65, 0, 0, 3.1, 0.06, 1.7, 0.12), _rng() < 0.5 ? 0xb02a20 : 0x2a6a5a);
    this.obstacles.push({ x: sx, z: sz, r: 1.4, type: 'stall' });
  }
  // kaptan: karakol köşkü
  K.hall(plan.cap.x, plan.cap.z - 1.6, 0, { w: 4.6, d: 3.2, h: 2.8, podium: 0.3, door: false, lanterns: true, sign: { icon: 'shield', label: 'Karakol', sub: 'Şehir Muhafızı' } });
  K.bannerPole(plan.cap.x - 3.4, plan.cap.z + 1.2, 0); K.bannerPole(plan.cap.x + 3.4, plan.cap.z + 1.2, 0);
  // ışınlayıcı platformu
  K.teleportPad(plan.tele.x, plan.tele.z);
  this.obstacles.push({ x: plan.tele.x, z: plan.tele.z, r: 2.6, type: 'prop' });

  // köşe kuleleri
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.watchtower(sx * H, sz * H);

  // pagoda: en geniş boş köşe
  const npcOK = (x, z, r) => (typeof NPC_DEFS !== 'undefined' ? NPC_DEFS : []).every(n => Math.hypot(n.x - x, n.z - z) > r);
  const rectFree = (x, z, w, d, ry, pad = 1.2) => plan.fits(x, z, ry, w, d, pad) && npcOK(x, z, Math.max(w, d) * 0.5 + 3) &&
    K.rects.every(r => Math.hypot(r.x - x, r.z - z) > (Math.max(r.w, r.d) + Math.max(w, d)) * 0.5 + pad) && Math.hypot(x, z) > 14;
  let pg = null;
  for (const [cx, cz] of [[-20, -20], [20, 20], [-20, 20], [20, -20], [-21, -9], [21, 9], [9, -21], [-9, 21]]) if (rectFree(cx, cz, 7.4, 7.4, 0)) { pg = [cx, cz]; break; }
  if (pg) K.pagoda(pg[0], pg[1], ZONE.id === 'hotan' ? 4 : 5);

  // konutlar: sur boyunca dış halka
  let made = 0;
  for (let tries = 0; tries < 900 && made < 14; tries++) {
    const x = (rng() * 2 - 1) * (H - 4), z = (rng() * 2 - 1) * (H - 4);
    const w = 4.6 + rng() * 2.2, d = 4.0 + rng() * 1.6;
    const ry = Math.round(Math.atan2(-x, -z) / (Math.PI / 2)) * (Math.PI / 2);
    if (!rectFree(x, z, w, d, ry, 1.0)) continue;
    const kind = ARCH.res === 'hall' ? 'hall' : (rng() < 0.45 ? 'hall' : ARCH.res);
    if (kind === 'hall') K.hall(x, z, ry, { w, d, h: 2.9, floors: rng() < 0.3 ? 2 : 1, podium: 0.35, lanterns: rng() < 0.5 });
    else K.adobe(x, z, ry, w, d, 3.0 + rng() * 0.8, kind === 'dome' && rng() < 0.6);
    made++;
  }
  // ağaçlar ve fenerler
  let trees = 0;
  for (let tries = 0; tries < 400 && trees < 10; tries++) {
    const x = (rng() * 2 - 1) * (H - 3), z = (rng() * 2 - 1) * (H - 3);
    if (!plan.roadOK(x, z, 5.5) || !plan.ewOK(x, z, 0.5) || Math.hypot(x, z) < 12.8 || !npcOK(x, z, 2.5)) continue;
    if (K.rects.some(r => Math.hypot(r.x - x, r.z - z) < Math.max(r.w, r.d) * 0.62 + 1.4)) continue;
    if (this.obstacles.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 1.4)) continue;
    K.tree(x, z, 0.85 + rng() * 0.4); trees++;
  }
  const lamps = [];
  for (let z = -H + 4; z <= H - 4; z += 7.5) { const cx = roadCenterX(z); lamps.push([cx - 5.6, z], [cx + 5.6, z]); }
  for (const x of [-24, -17, 17, 24]) lamps.push([x, -5.6], [x, 5.6]);
  for (const [x, z] of lamps) {
    if (Math.hypot(x, z) < 12.5 || Math.max(Math.abs(x), Math.abs(z)) > H - 1.5) continue;
    if (K.rects.some(r => Math.hypot(r.x - x, r.z - z) < Math.max(r.w, r.d) * 0.6 + 0.6)) continue;
    if (this.obstacles.some(o => o.type !== 'lamp' && Math.hypot(o.x - x, o.z - z) < o.r + 0.8)) continue;
    K.lampPost(x, z);
  }
  // meydan fener dizileri: 8 direk arasında
  const poles = [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * 6.2832 + 0.39, x = Math.cos(a) * 11.4, z = Math.sin(a) * 11.4;
    if (!plan.roadOK(x, z, 4.2) || !npcOK(x, z, 1.6)) { poles.push(null); continue; }
    const T = AM(x, 0, z);
    K.put(K.m.vc, new THREE.CylinderGeometry(0.1, 0.13, 4.6, 6), T, AM(0, 2.3, 0), ARCH.wood);
    K.put(K.m.vc, new THREE.SphereGeometry(0.15, 6, 5), T, AM(0, 4.7, 0), ARCH.trim);
    this.obstacles.push({ x, z, r: 0.3, type: 'lamp' });
    poles.push(new THREE.Vector3(x, 4.5, z));
  }
  for (let i = 0; i < 8; i++) { const a = poles[i], b = poles[(i + 1) % 8]; if (a && b) K.lanternString(a, b, 5); }
  // sur iç yüzünde sancaklar
  for (const [x, z, ry] of [[-10, -H + 1.6, 0], [10, -H + 1.6, 0], [-10, H - 1.6, Math.PI], [10, H - 1.6, Math.PI], [-H + 1.6, -12, Math.PI / 2], [-H + 1.6, 12, Math.PI / 2], [H - 1.6, -12, -Math.PI / 2], [H - 1.6, 12, -Math.PI / 2]]) {
    if (!plan.roadOK(x, z, 7) || K.rects.some(r => Math.hypot(r.x - x, r.z - z) < Math.max(r.w, r.d) * 0.6 + 0.8)) continue;
    K.bannerPole(x, z, ry, 6.2);
  }
  K.finish();
  this.cityRects = K.rects;
  this.houses = K.rects;
};

// Takı kapılar: kuzey ve güney yol geçişleri (world.js'deki basit kapının yerine)
World.prototype._buildGate = function (z) {
  if (!this.arch) this.arch = new ArchKit(this);
  const x = roadCenterX(z);
  this.arch.paifang(x, z, 0, 14, ZONE.name, 7.4);
  if (z > 0) this.arch.finish();   // ikinci kapıdan sonra birleştir
};
