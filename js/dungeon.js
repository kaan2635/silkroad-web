// Zindan haritaları: odalar + koridorlar (ızgara üzerinde rastgele ağaç + birkaç döngü), yürünebilirlik ızgarası,
// duvarlar, meşaleler, giriş odası (güvenli), en uzak oda = boss odası. Yalnızca ZONE.kind === 'dungeon' iken çalışır.

const Dungeon = {
  on: typeof IS_DUNGEON !== 'undefined' && IS_DUNGEON,
  C: 1, H: 160, n: 320, grid: null, rooms: [], edges: [],
  build() {
    if (!this.on || this.grid) return;
    const rng = mulberry32(Math.round(ZONE.seed * 1000) + 7);
    const N = ZONE.rooms || 4, S = 58, lo = -Math.floor(N / 2), hi = lo + N - 1;
    this.n = Math.round(this.H * 2 / this.C);
    const g = this.grid = new Uint8Array(this.n * this.n);
    // odalar
    const cells = {};
    for (let i = lo; i <= hi; i++) for (let j = lo; j <= hi; j++) {
      const entry = i === 0 && j === 0;
      const w = entry ? 24 : 22 + Math.floor(rng() * 18), d = entry ? 24 : 22 + Math.floor(rng() * 18);
      const cx = i * S + (entry ? 0 : (rng() - 0.5) * 10), cz = j * S + (entry ? 0 : (rng() - 0.5) * 10);
      cells[i + ',' + j] = { i, j, x: cx, z: cz, w, d, entry, links: [] };
    }
    // yayılan ağaç (DFS) + %25 ek bağlantı
    const key = (i, j) => i + ',' + j, seen = new Set([key(0, 0)]), stack = [cells[key(0, 0)]];
    while (stack.length) {
      const c = stack[stack.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => cells[key(c.i + a, c.j + b)]).filter(x => x && !seen.has(key(x.i, x.j)));
      if (!nb.length) { stack.pop(); continue; }
      const nx = nb[Math.floor(rng() * nb.length)];
      seen.add(key(nx.i, nx.j)); c.links.push(nx); nx.links.push(c); this.edges.push([c, nx]); stack.push(nx);
    }
    for (const k in cells) {
      const c = cells[k];
      for (const [a, b] of [[1, 0], [0, 1]]) {
        const o = cells[key(c.i + a, c.j + b)];
        if (o && !c.links.includes(o) && rng() < 0.25) { c.links.push(o); o.links.push(c); this.edges.push([c, o]); }
      }
    }
    this.rooms = Object.values(cells);
    for (const r of this.rooms) this._rect(r.x - r.w / 2, r.z - r.d / 2, r.x + r.w / 2, r.z + r.d / 2);
    for (const [a, b] of this.edges) {           // L koridor (6 m)
      const W = 3;
      if (rng() < 0.5) { this._rect(Math.min(a.x, b.x) - W, a.z - W, Math.max(a.x, b.x) + W, a.z + W); this._rect(b.x - W, Math.min(a.z, b.z) - W, b.x + W, Math.max(a.z, b.z) + W); }
      else { this._rect(a.x - W, Math.min(a.z, b.z) - W, a.x + W, Math.max(a.z, b.z) + W); this._rect(Math.min(a.x, b.x) - W, b.z - W, Math.max(a.x, b.x) + W, b.z + W); }
    }
    // odaları girişe uzaklığa göre sırala (BFS)
    const dist = new Map([[cells['0,0'], 0]]), q = [cells['0,0']];
    while (q.length) { const c = q.shift(); for (const o of c.links) if (!dist.has(o)) { dist.set(o, dist.get(c) + 1); q.push(o); } }
    this.rooms.forEach(r => { r.depth = dist.get(r) || 0; r.far = Math.hypot(r.x, r.z); });
    this.ordered = this.rooms.filter(r => !r.entry).sort((a, b) => a.depth - b.depth || a.far - b.far);
    this.boss = this.ordered[this.ordered.length - 1];
    this.entry = cells['0,0'];
    // unique konumları
    for (const u of ZONE.uniques || []) {
      const r = u.room === 'boss' ? this.boss : this.ordered[Math.min(this.ordered.length - 2, (u.room | 0) + Math.floor(this.ordered.length / 4))] || this.boss;
      u.x = r.x; u.z = r.z; r.unique = u.id;
    }
  },
  _rect(x0, z0, x1, z1) {
    const n = this.n;
    for (let j = Math.max(0, this.ix(z0)); j <= Math.min(n - 1, this.ix(z1)); j++) for (let i = Math.max(0, this.ix(x0)); i <= Math.min(n - 1, this.ix(x1)); i++) this.grid[j * n + i] = 1;
  },
  ix(v) { return Math.floor((v + this.H) / this.C); },
  wx(i) { return -this.H + (i + 0.5) * this.C; },
  cellWalk(i, j) { return i >= 0 && j >= 0 && i < this.n && j < this.n && this.grid[j * this.n + i] === 1; },
  walk(x, z) { return this.cellWalk(this.ix(x), this.ix(z)); },
  // içeride değilse en yakın yürünebilir noktaya it (duvar çarpışması)
  clamp(p, r = 0.4) {
    if (!this.grid) return;
    const ok = (x, z) => this.walk(x - r, z - r) && this.walk(x + r, z - r) && this.walk(x - r, z + r) && this.walk(x + r, z + r);
    if (ok(p.x, p.z)) return;
    let best = null, bd = 1e9;
    for (let k = 1; k <= 6; k++) for (let a = 0; a < 16; a++) {
      const t = a / 16 * 6.2832, x = p.x + Math.cos(t) * k * 0.4, z = p.z + Math.sin(t) * k * 0.4, d = k;
      if (d < bd && ok(x, z)) { bd = d; best = [x, z]; }
      if (best && k > bd) break;
    }
    if (best) { p.x = best[0]; p.z = best[1]; }
  },
  randomSpot(rng, minD = 18) {
    for (let t = 0; t < 200; t++) {
      const r = this.rooms[Math.floor(rng() * this.rooms.length)];
      if (r.entry) continue;
      const x = r.x + (rng() - 0.5) * (r.w - 4), z = r.z + (rng() - 0.5) * (r.d - 4);
      if (Math.hypot(x, z) > minD && this.walk(x, z)) return [x, z];
    }
    return null;
  }
};
Dungeon.build();

// Dünya: zindan görselleri (zemin rengi world.js'de; burada duvar, meşale, kapı)
World.prototype._buildDungeon = function () {
  const D = Dungeon, n = D.n, walls = [], caps = [];
  // duvar: yürünebilir hücreye komşu her kapalı hücre (2x2 bloklarla)
  for (let j = 0; j < n; j += 2) for (let i = 0; i < n; i += 2) {
    if (D.cellWalk(i, j) || D.cellWalk(i + 1, j) || D.cellWalk(i, j + 1) || D.cellWalk(i + 1, j + 1)) continue;
    let edge = false;
    for (let dj = -1; dj <= 2 && !edge; dj++) for (let di = -1; di <= 2; di++) if (D.cellWalk(i + di, j + dj)) { edge = true; break; }
    if (!edge) continue;
    const x = D.wx(i) + 0.5, z = D.wx(j) + 0.5, h = 3.2 + ((i * 7 + j * 13) % 5) * 0.25;
    walls.push(this._matrix(x, h / 2, z, 2.02, h, 2.02));
    caps.push(this._matrix(x, h + 0.1, z, 2.1, 0.2, 2.1));
  }
  const wallMat = new THREE.MeshLambertMaterial({ map: typeof texStone === 'function' ? texStone() : null, color: new THREE.Color(ZONE.wallCol || '#7a6a52') });
  this._instanced(new THREE.BoxGeometry(1, 1, 1), wallMat, walls, true);
  this._instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x0a0806 }), caps, false);
  // meşaleler: oda kenarlarında
  const torchMat = new THREE.MeshLambertMaterial({ color: 0x3a2414 }), fireMat = new THREE.MeshBasicMaterial({ map: typeof vfxSoftTex === 'function' ? vfxSoftTex() : null, color: ZONE.light || 0xff9a4a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  this.torches = [];
  const tpos = [];
  for (const r of D.rooms) {
    for (const [x, z] of [[r.x - r.w / 2 + 0.6, r.z], [r.x + r.w / 2 - 0.6, r.z], [r.x, r.z - r.d / 2 + 0.6], [r.x, r.z + r.d / 2 - 0.6]]) if (D.walk(x, z)) tpos.push([x, z]);
  }
  for (const [x, z] of tpos) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.4, 6), torchMat); post.position.set(x, 1.2, z); this.scene.add(post);
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireMat.map, color: fireMat.color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    f.position.set(x, 2.6, z); f.scale.set(1.6, 2, 1); this.scene.add(f); this.torches.push(f);
    this.obstacles.push({ x, z, r: 0.3, type: 'lamp' });
  }
  // birkaç ışık (performans için az): giriş + boss odası
  for (const r of [D.entry, D.boss]) { const l = new THREE.PointLight(ZONE.light || 0xffa050, 1.1, 40, 1.6); l.position.set(r.x, 5, r.z); this.scene.add(l); }
  // oda süsleri: sütunlar ve heykeller
  const colMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(ZONE.wallCol || '#8a7a62').multiplyScalar(1.1) });
  const rng = mulberry32(77);
  for (const r of D.rooms) {
    if (r.entry) continue;
    if (r.w > 28 && r.d > 28) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = r.x + sx * (r.w / 2 - 6), z = r.z + sz * (r.d / 2 - 6);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 6, 10), colMat); c.position.set(x, 3, z); c.castShadow = true; this.scene.add(c);
      this.obstacles.push({ x, z, r: 0.9, type: 'pillar' });
    }
    if (r === D.boss) {   // boss odası: kırmızı halı ve iki mangal
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(6, r.d - 6), new THREE.MeshLambertMaterial({ color: 0x6a1010 }));
      rug.rotation.x = -Math.PI / 2; rug.position.set(r.x, 0.04, r.z); this.scene.add(rug);
    }
    if (rng() < 0.5) {   // kemik / moloz yığını
      const x = r.x + (rng() - 0.5) * (r.w - 8), z = r.z + (rng() - 0.5) * (r.d - 8);
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), colMat); rock.position.set(x, 0.5, z); rock.scale.set(1, 0.6, 1); this.scene.add(rock);
      this.obstacles.push({ x, z, r: 1.2, type: 'rock' });
    }
  }
  // giriş odası: ışınlanma çemberi ve iki fener
  if (typeof vfxRuneTex === 'function') {
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: vfxRuneTex(), color: ZONE.light || 0x7ab8ff, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.06, 4); this.scene.add(ring);
    this.spinners = this.spinners || []; this.spinners.push(ring);
  }
  // bir alt kat: boss odasında merdiven kapısı
  this.portals = [];
  if (ZONE.next) {
    const r = D.boss, x = r.x + r.w / 2 - 4, z = r.z;
    const g = new THREE.Group();
    const stone = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
    for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 0.8), stone); c.position.set(0, 2.5, sx * 2.2); g.add(c); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 5.4), stone); top.position.y = 5.2; g.add(top);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.6), new THREE.MeshBasicMaterial({ color: 0xff7a3a, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.rotation.y = Math.PI / 2; glow.position.y = 2.3; g.add(glow);
    const label = makeLabel('↓ ' + ZONES[ZONE.next].town, ZONES[ZONE.next].lv, '#ffb07a', '#ffe9a8'); label.position.y = 6.8; label.scale.set(6, 1.9, 1); g.add(label);
    g.position.set(x, 0, z); this.scene.add(g);
    this.portals.push({ x, z, zone: ZONE.next, arrive: 'T', glow });
  }
};
