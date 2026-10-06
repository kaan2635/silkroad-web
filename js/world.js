// Dünya: arazi, yol, vahalar, bitki örtüsü, kapı, dağlar, gökyüzü, ışık.

const PONDS = [
  { x: -90, z: 60 }, { x: 120, z: -80 }, { x: 80, z: 150 },
  { x: -130, z: -120 }, { x: 170, z: 110 }
];
const POND_RADIUS = 9;
// Harabeler: Faz 2'de haydut kampları da burada
const RUINS = [{ x: 55, z: -75 }, { x: -75, z: -45 }, { x: -20, z: 110 }];

function roadCenterX(z) { return Math.sin(z * 0.012) * 35; }

// Şehir: Jangan benzeri surlu kare (yarı genişlik 30), orijinde
const TOWN_HALF = 30;
const POND_NAMES = ['Yeşim Vahası', 'Ejder Gölü', 'Gümüş Vaha', 'Kervan Vahası', 'Gün Batımı Vahası'];

// Bölge bilgisi: ad ve tavsiye edilen seviye (görev "git" hedefleri ve afiş için)
const REGION_LEVELS = {
  'Jangan Şehri': 'Güvenli bölge', 'Kurt Vadisi': 'Sv. 1–3', 'Akrep Çölü': 'Sv. 3–5',
  'Haydut Harabeleri': 'Sv. 4–7', 'Kızıl Kum Denizi': 'Sv. 7–10'
};
POND_NAMES.forEach(n => { REGION_LEVELS[n] = 'Vaha'; });

function regionAt(x, z) {
  if (Math.max(Math.abs(x), Math.abs(z)) < TOWN_HALF + 3) return 'Jangan Şehri';
  for (const c of RUINS) if (Math.hypot(x - c.x, z - c.z) < 26) return 'Haydut Harabeleri';
  for (let i = 0; i < PONDS.length; i++) if (Math.hypot(x - PONDS[i].x, z - PONDS[i].z) < 30) return POND_NAMES[i];
  const d = Math.hypot(x, z);
  if (d < 110) return 'Kurt Vadisi';
  if (d < 195) return 'Akrep Çölü';
  return 'Kızıl Kum Denizi';
}

// Arazi yüksekliği: hem zemini kurmak hem karakteri yere basmak için kullanılır
function terrainHeight(x, z) {
  let h = Math.sin(x * 0.035) * Math.cos(z * 0.03) * 5
        + Math.sin(x * 0.011 + z * 0.017) * 9
        + Math.sin(x * 0.09 + z * 0.07) * 0.9;
  h *= sstep(TOWN_HALF + 2, TOWN_HALF + 34, Math.max(Math.abs(x), Math.abs(z)));   // şehir düz
  h *= 0.2 + 0.8 * sstep(3, 10, Math.abs(x - roadCenterX(z))); // yol düzleşir
  h *= 1 - sstep(235, 292, Math.max(Math.abs(x), Math.abs(z)));  // dünya kenarı düzleşir
  for (const p of PONDS) {
    const t = sstep(22, POND_RADIUS, Math.hypot(x - p.x, z - p.z));
    if (t > 0) h = h * (1 - t) + (-1.2) * t;               // vaha çukuru
  }
  return h;
}

class World {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(CONFIG.sky.horizon, CONFIG.fog.near, CONFIG.fog.far);
    this.obstacles = [];   // {x, z, r, type} — çarpışma ve mini harita için
    this.time = 0;
    this.sunDir = new THREE.Vector3(0.5, 0.75, 0.35).normalize();
    this._dummy = new THREE.Object3D();
    this._dummy.rotation.order = 'YXZ';

    this._buildLights();
    this._buildSky();
    this._buildTerrain();
    this._buildWater();
    this._buildGate(-TOWN_HALF);
    this._buildGate(TOWN_HALF);
    this._buildTown();
    this._scatter();
    this._buildMountains();
    this._buildMarker();
    this._buildCaravan();
    this._buildDayNight();
  }

  heightAt(x, z) { return terrainHeight(x, z); }

  _buildLights() {
    const hemi = new THREE.HemisphereLight(0xcfe8ff, 0xc9a66b, 0.65);
    this.scene.add(hemi);
    this.hemi = hemi;
    const sun = new THREE.DirectionalLight(0xfff1d0, 0.95);
    sun.castShadow = true;
    sun.shadow.mapSize.set(CONFIG.isTouch ? 1024 : 2048, CONFIG.isTouch ? 1024 : 2048);
    const s = sun.shadow.camera;
    s.left = -55; s.right = 55; s.top = 55; s.bottom = -55; s.near = 1; s.far = 260;
    sun.shadow.bias = -0.0006;
    this.scene.add(sun, sun.target);
    this.light = sun;
  }

  _buildSky() {
    const R = 420;
    const geo = new THREE.SphereGeometry(R, 24, 16);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const hor = new THREE.Color(CONFIG.sky.horizon), zen = new THREE.Color(CONFIG.sky.zenith), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = Math.pow(clamp(pos.getY(i) / R, 0, 1), 0.55);
      c.copy(hor).lerp(zen, t);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.sky.renderOrder = -2;
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);

    this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(16, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff3c0, fog: false, depthWrite: false }));
    this.sunMesh.renderOrder = -1;
    this.sunMesh.frustumCulled = false;
    this.scene.add(this.sunMesh);
  }

  _buildTerrain() {
    const size = CONFIG.worldSize, seg = CONFIG.gridSegments;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const sand = new THREE.Color(0xdcbf86), dark = new THREE.Color(0xc29a5c), road = new THREE.Color(0x9a8260);
    const rock = new THREE.Color(0xa88a62), paved = new THREE.Color(), grass = new THREE.Color(0x7d9a52), c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);
      const n = (Math.sin(x * 0.21 + z * 0.13) + Math.sin(x * 0.07 - z * 0.19)) * 0.25 + 0.5;
      c.copy(sand).lerp(dark, n * 0.7);
      c.lerp(rock, clamp(h / 12, 0, 1) * 0.8);
      let g = 0;
      for (const p of PONDS) g = Math.max(g, sstep(30, 14, Math.hypot(x - p.x, z - p.z)));
      c.lerp(grass, g * 0.85);
      c.lerp(road, sstep(5.5, 3, Math.abs(x - roadCenterX(z))));
      const tm = Math.max(Math.abs(x), Math.abs(z));
      if (tm < TOWN_HALF + 4) {   // şehir içi taş döşeme
        const tile = (Math.floor(x / 3) + Math.floor(z / 3)) & 1;
        paved.setHex(tile ? 0xb7a784 : 0xaa9a78);
        c.lerp(paved, sstep(TOWN_HALF + 4, TOWN_HALF - 2, tm));
      }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    this.ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Dünya sınırının ötesini dolduran büyük düz zemin
    const outer = new THREE.Mesh(new THREE.CircleGeometry(900, 32), new THREE.MeshLambertMaterial({ color: 0xc9a468 }));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.15;
    this.scene.add(outer);
  }

  _buildWater() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x3aa0c8, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88 });
    this.waterMat = mat;
    for (const p of PONDS) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(POND_RADIUS + 1.5, 32), mat);
      w.rotation.x = -Math.PI / 2;
      w.position.set(p.x, -0.35, p.z);
      this.scene.add(w);
      this.obstacles.push({ x: p.x, z: p.z, r: POND_RADIUS, type: 'pond' });
    }
  }

  // Yolun üstünde Çin tarzı şehir kapısı
  _buildGate(z) {
    const cx = roadCenterX(z), y = terrainHeight(cx, z);
    const red = new THREE.MeshLambertMaterial({ color: 0xa8281e });
    const tile = new THREE.MeshLambertMaterial({ color: 0x38302c });
    const gold = new THREE.MeshLambertMaterial({ color: 0xd8a830 });
    const g = new THREE.Group();
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 10, 10), red);
      p.position.set(sx * 7, 5, 0); p.castShadow = true; g.add(p);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.8, 10), new THREE.MeshLambertMaterial({ color: 0x8a8272 }));
      base.position.set(sx * 7, 0.4, 0); g.add(base);
      this.obstacles.push({ x: cx + sx * 7, z, r: 1.3, type: 'gate' });
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(17, 1.1, 1.4), red); beam.position.set(0, 9.2, 0); beam.castShadow = true; g.add(beam);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(17, 0.3, 1.5), gold); trim.position.set(0, 8.5, 0); g.add(trim);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(20, 0.7, 5.2), tile); roof.position.set(0, 10.3, 0); roof.castShadow = true; g.add(roof);
    for (const sx of [-1, 1]) {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 5.2), tile);
      tip.position.set(sx * 10.6, 10.9, 0); tip.rotation.z = sx * -0.35; tip.castShadow = true; g.add(tip);
    }
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 1.4), tile); ridge.position.set(0, 11.0, 0); g.add(ridge);
    g.position.set(cx, y, z);
    this.scene.add(g);
  }

  _matrix(x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) {
    const d = this._dummy;
    d.position.set(x, y, z); d.rotation.set(rx, ry, rz); d.scale.set(sx, sy, sz);
    d.updateMatrix();
    return d.matrix.clone();
  }

  _instanced(geo, mat, mats, shadow = true) {
    const m = new THREE.InstancedMesh(geo, mat, mats.length);
    mats.forEach((mx, i) => m.setMatrixAt(i, mx));
    m.instanceMatrix.needsUpdate = true;
    m.castShadow = shadow;
    m.receiveShadow = true;
    m.frustumCulled = false;   // örnekler dünyaya yayılı, tek kürede kesilmesin
    this.scene.add(m);
    return m;
  }

  _scatter() {
    const rng = mulberry32(1337);
    const half = CONFIG.worldSize / 2 - 14;
    const rand = (a, b) => a + rng() * (b - a);
    const free = (x, z, r) => {
      if (Math.max(Math.abs(x), Math.abs(z)) < TOWN_HALF + 6) return false;
      if (Math.abs(x - roadCenterX(z)) < 6) return false;
      for (const p of PONDS) if (Math.hypot(x - p.x, z - p.z) < POND_RADIUS + 2 + r) return false;
      for (const o of this.obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + r + 0.8) return false;
      return true;
    };
    const place = (type, r, gen, list, extra) => {
      for (let tries = 0; tries < 30; tries++) {
        const [x, z] = gen();
        if (Math.abs(x) > half || Math.abs(z) > half) continue;
        if (!free(x, z, r)) continue;
        this.obstacles.push({ x, z, r, type });
        list.push({ x, z, y: terrainHeight(x, z), ...(extra ? extra() : {}) });
        return;
      }
    };

    const palms = [], cacti = [], rocks = [], pillars = [];

    // Vaha çevresinde palmiyeler
    for (const p of PONDS) {
      for (let i = 0; i < 16; i++) {
        place('palm', 0.6, () => { const a = rng() * 6.283, d = rand(POND_RADIUS + 3, 20); return [p.x + Math.cos(a) * d, p.z + Math.sin(a) * d]; },
          palms, () => ({ h: rand(6, 10), ry: rng() * 6.283 }));
      }
    }
    for (let i = 0; i < 50; i++) place('palm', 0.6, () => [rand(-half, half), rand(-half, half)], palms, () => ({ h: rand(5, 8), ry: rng() * 6.283 }));
    for (let i = 0; i < 90; i++) place('cactus', 0.7, () => [rand(-half, half), rand(-half, half)], cacti, () => ({ h: rand(2, 3.6), ry: rng() * 6.283 }));
    for (let i = 0; i < 130; i++) place('rock', 1, () => [rand(-half, half), rand(-half, half)], rocks, () => ({ s: rand(0.7, 2.8), ry: rng() * 6.283, rx: rng(), rz: rng() }));

    // Harabe sütunları
    for (const c of RUINS) {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * 6.283, x = c.x + Math.cos(a) * 8, z = c.z + Math.sin(a) * 8;
        if (free(x, z, 0.8)) { this.obstacles.push({ x, z, r: 0.85, type: 'pillar' }); pillars.push({ x, z, y: terrainHeight(x, z), h: rand(2, 6.5) }); }
      }
    }

    // --- Instanced mesh'ler ---
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 1, 6); trunkGeo.translate(0, 0.5, 0);
    this._instanced(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x7a5a36 }),
      palms.map(p => this._matrix(p.x, p.y, p.z, 1, p.h, 1, p.ry)));
    const frondGeo = new THREE.BoxGeometry(0.55, 0.06, 3.4); frondGeo.translate(0, 0, 1.7);
    const frondMats = [];
    for (const p of palms) for (let k = 0; k < 7; k++) {
      frondMats.push(this._matrix(p.x, p.y + p.h, p.z, 1, 1, 1, p.ry + (k / 7) * 6.283 + rng() * 0.3, 0.35 + rng() * 0.25));
    }
    this._instanced(frondGeo, new THREE.MeshLambertMaterial({ color: 0x3f7d2a, side: THREE.DoubleSide }), frondMats);

    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.4, 1, 8); bodyGeo.translate(0, 0.5, 0);
    const cactMat = new THREE.MeshLambertMaterial({ color: 0x4f8a3c });
    this._instanced(bodyGeo, cactMat, cacti.map(c => this._matrix(c.x, c.y, c.z, 1, c.h, 1)));
    const armH = new THREE.CylinderGeometry(0.17, 0.17, 1, 6); armH.rotateZ(Math.PI / 2); armH.translate(0.5, 0, 0);
    const armV = new THREE.CylinderGeometry(0.17, 0.17, 1, 6); armV.translate(0, 0.5, 0);
    this._instanced(armH, cactMat, cacti.map(c => this._matrix(c.x, c.y + c.h * 0.5, c.z, 0.9, 1, 1, c.ry)));
    this._instanced(armV, cactMat, cacti.map(c => {
      const ex = c.x + Math.cos(c.ry) * 0.9, ez = c.z - Math.sin(c.ry) * 0.9;
      return this._matrix(ex, c.y + c.h * 0.5, ez, 1, c.h * 0.35, 1);
    }));

    const rockMesh = this._instanced(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }),
      rocks.map(r => this._matrix(r.x, r.y + r.s * 0.2, r.z, r.s, r.s * 0.7, r.s, r.ry, r.rx, r.rz)));
    const rc = new THREE.Color();
    rocks.forEach((r, i) => { rc.setHSL(0.09, 0.22, 0.38 + rng() * 0.18); rockMesh.setColorAt(i, rc); });
    if (rockMesh.instanceColor) rockMesh.instanceColor.needsUpdate = true;
    // Çarpışma yarıçapını kaya boyutuna göre ayarla
    let ri = 0;
    for (const o of this.obstacles) if (o.type === 'rock') o.r = Math.max(0.8, rocks[ri++].s * 0.95);

    const pilGeo = new THREE.CylinderGeometry(0.6, 0.7, 1, 8); pilGeo.translate(0, 0.5, 0);
    this._instanced(pilGeo, new THREE.MeshLambertMaterial({ color: 0xcdbfa4 }), pillars.map(p => this._matrix(p.x, p.y, p.z, 1, p.h, 1)));
  }

  _buildMountains() {
    const rng = mulberry32(99);
    const n = 48, mats = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + rng() * 0.1, r = 335 + rng() * 30;
      const h = 45 + rng() * 55, w = 45 + rng() * 25;
      mats.push(this._matrix(Math.cos(a) * r, h / 2 - 8, Math.sin(a) * r, w, h, w, rng() * 6.283));
    }
    this._instanced(new THREE.ConeGeometry(1, 1, 7), new THREE.MeshLambertMaterial({ color: 0xb89868, flatShading: true }), mats, false);
  }

  _buildMarker() {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.85, 28), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, depthTest: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 5;
    m.visible = false;
    this.marker = m; this.markerT = 1;
    this.scene.add(m);
  }

  showMarker(p) {
    this.marker.position.set(p.x, terrainHeight(p.x, p.z) + 0.2, p.z);
    this.marker.visible = true;
    this.markerT = 0;
  }

  update(dt, playerPos, camera) {
    this.time += dt;
    this.sky.position.copy(camera.position);
    this._updateDayNight(dt, playerPos, camera);
    if (this.marker.visible) {
      this.markerT += dt / 0.9;
      if (this.markerT >= 1) this.marker.visible = false;
      else {
        const s = 1 + this.markerT * 0.8;
        this.marker.scale.set(s, s, s);
        this.marker.material.opacity = 1 - this.markerT;
      }
    }
    this.waterMat.opacity = 0.86 + Math.sin(this.time * 1.6) * 0.03;
  }
}
