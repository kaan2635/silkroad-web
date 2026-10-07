// Görsel efektler: parçacık sistemi (tek çizim çağrısı), mermi izleri, element patlamaları,
// yıldırım dalları, buz dikenleri, göktaşı, büyü çemberi (rün halkası), aşılama parıltısı.
// Dokular çalışma anında canvas ile üretilir; harici dosya yok.

const _vfxTex = {};
function _vfxCanvas(key, size, draw) {
  if (_vfxTex[key]) return _vfxTex[key];
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  _vfxTex[key] = t;
  return t;
}
// Yumuşak parıltı (parçacık)
const vfxSoftTex = () => _vfxCanvas('soft', 64, (x, S) => {
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.75)');
  g.addColorStop(0.55, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
});
// Büyü çemberi: iç içe halkalar, rün çentikleri, altıgen yıldız
const vfxRuneTex = () => _vfxCanvas('rune', 256, (x, S) => {
  const c = S / 2;
  x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round';
  const ring = (r, w, a = 1) => { x.globalAlpha = a; x.lineWidth = w; x.beginPath(); x.arc(c, c, r, 0, 6.2832); x.stroke(); };
  ring(122, 4); ring(112, 1.5, 0.8); ring(78, 3); ring(70, 1, 0.7); ring(30, 2, 0.8);
  // rün çentikleri iki halka arasında
  x.globalAlpha = 0.95;
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * 6.2832; x.save(); x.translate(c + Math.cos(a) * 95, c + Math.sin(a) * 95); x.rotate(a + 1.5708);
    x.lineWidth = 2.2; x.beginPath();
    const k = i % 4;
    if (k === 0) { x.moveTo(-5, -7); x.lineTo(0, 7); x.lineTo(5, -7); }
    else if (k === 1) { x.moveTo(0, -8); x.lineTo(0, 8); x.moveTo(-5, -2); x.lineTo(5, 2); }
    else if (k === 2) { x.moveTo(-5, -7); x.lineTo(5, -7); x.lineTo(-5, 7); x.lineTo(5, 7); }
    else { x.arc(0, 0, 5, 0, 6.2832); x.moveTo(0, -8); x.lineTo(0, 8); }
    x.stroke(); x.restore();
  }
  // iki üçgen (altı köşeli yıldız)
  x.lineWidth = 2.5; x.globalAlpha = 0.9;
  for (let t = 0; t < 2; t++) {
    x.beginPath();
    for (let i = 0; i <= 3; i++) { const a = -1.5708 + t * 3.1416 + i * 2.0944; const px = c + Math.cos(a) * 78, py = c + Math.sin(a) * 78; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
  }
  // merkez parıltı
  const g = x.createRadialGradient(c, c, 0, c, c, 60); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.arc(c, c, 60, 0, 6.2832); x.fill();
});
// Kılıç izi: kenara doğru kaybolan hilal
const vfxSlashTex = () => _vfxCanvas('slash', 128, (x, S) => {
  const g = x.createLinearGradient(0, 0, S, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.6, 'rgba(255,255,255,.55)'); g.addColorStop(0.92, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
});
// Şok dalgası halkası
const vfxShockTex = () => _vfxCanvas('shock', 128, (x, S) => {
  const c = S / 2, g = x.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.62, 'rgba(255,255,255,.05)'); g.addColorStop(0.86, 'rgba(255,255,255,.9)'); g.addColorStop(0.93, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
});

// Element paletleri: [ana, sıcak çekirdek, ikincil]
const VFX_PAL = {
  fire: [0xff6a1a, 0xffd27a, 0xff2a0a], cold: [0x7fd8ff, 0xffffff, 0x3a8aff], lightning: [0xb8a4ff, 0xffffff, 0x6a5aff],
  force: [0xffe680, 0xffffff, 0xffb84a], phys: [0xffe2a0, 0xffffff, 0xff9a3a], heal: [0x7aff8a, 0xeaffd0, 0x2ad86a], blood: [0xc8201a, 0xff6a4a, 0x6a0a06]
};

class VFX {
  constructor(scene, camera) {
    this.scene = scene; this.camera = camera;
    this.list = [];
    this.geo = {
      ball: new THREE.SphereGeometry(0.3, 10, 8),
      arrow: new THREE.BoxGeometry(0.05, 0.05, 1.0),
      shard: new THREE.OctahedronGeometry(0.32),
      ring: new THREE.RingGeometry(0.8, 1.0, 48),
      disk: new THREE.CircleGeometry(1, 32),
      plane: new THREE.PlaneGeometry(1, 1),
      bseg: new THREE.CylinderGeometry(0.05, 0.05, 1, 5, 1, true),
      spike: (() => { const g = new THREE.ConeGeometry(0.28, 1, 5); g.translate(0, 0.5, 0); return g; })(),
      column: (() => { const g = new THREE.CylinderGeometry(0.6, 0.6, 1, 16, 1, true); g.translate(0, 0.5, 0); return g; })()
    };
    this.mats = {};
    this._initParticles();
  }
  _mat(color, opacity = 1, add = true) {
    const k = color + ':' + opacity + ':' + add;
    if (!this.mats[k]) this.mats[k] = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
    return this.mats[k];
  }
  _texMat(tex, color, opacity = 1) {
    return new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  }

  // ---------- Parçacık havuzu ----------
  _initParticles() {
    const N = this.N = CONFIG.isTouch ? 900 : 1800;
    this.pPos = new Float32Array(N * 3); this.pCol = new Float32Array(N * 4); this.pSize = new Float32Array(N);
    this.pVel = new Float32Array(N * 3); this.pLife = new Float32Array(N); this.pMax = new Float32Array(N);
    this.pBase = new Float32Array(N * 4); this.pGrav = new Float32Array(N); this.pDrag = new Float32Array(N); this.pS0 = new Float32Array(N); this.pS1 = new Float32Array(N);
    this.pNext = 0; this.pAlive = 0;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('col', new THREE.BufferAttribute(this.pCol, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.pSize, 1).setUsage(THREE.DynamicDrawUsage));
    this.pUni = { map: { value: vfxSoftTex() }, scale: { value: 400 } };
    const m = new THREE.ShaderMaterial({
      uniforms: this.pUni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float size; attribute vec4 col; varying vec4 vC; uniform float scale;' +
        'void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * scale / max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec4 vC;' +
        'void main(){ vec4 t = texture2D(map, gl_PointCoord); float a = t.a * vC.a; if (a < 0.01) discard; gl_FragColor = vec4(vC.rgb * a, a); }'
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.scene.add(this.points);
    this._c = new THREE.Color();
  }
  // Tek parçacık
  spark(x, y, z, vx, vy, vz, color, life, size, o = {}) {
    const i = this.pNext; this.pNext = (this.pNext + 1) % this.N;
    this.pPos[i * 3] = x; this.pPos[i * 3 + 1] = y; this.pPos[i * 3 + 2] = z;
    this.pVel[i * 3] = vx; this.pVel[i * 3 + 1] = vy; this.pVel[i * 3 + 2] = vz;
    this._c.setHex(color);
    this.pBase[i * 4] = this._c.r; this.pBase[i * 4 + 1] = this._c.g; this.pBase[i * 4 + 2] = this._c.b; this.pBase[i * 4 + 3] = o.a == null ? 1 : o.a;
    this.pLife[i] = life; this.pMax[i] = life;
    this.pS0[i] = size; this.pS1[i] = o.s1 == null ? size * 0.3 : o.s1;
    this.pGrav[i] = o.g || 0; this.pDrag[i] = o.drag || 0;
  }
  // Bir noktadan küresel saçılma
  emit(x, y, z, n, o) {
    const pal = o.pal || VFX_PAL.phys;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.2832, u = o.flat ? 0 : Math.random() * 2 - 1, r = Math.sqrt(1 - u * u);
      const sp = (o.speed || 3) * (0.35 + Math.random() * 0.65);
      const col = pal[Math.random() < 0.25 ? 1 : Math.random() < 0.5 ? 0 : 2];
      this.spark(x + (Math.random() - 0.5) * (o.jitter || 0), y + (Math.random() - 0.5) * (o.jitter || 0) * 0.5, z + (Math.random() - 0.5) * (o.jitter || 0),
        Math.cos(a) * r * sp, (o.flat ? 0 : u * sp) + (o.up || 0), Math.sin(a) * r * sp,
        col, (o.life || 0.5) * (0.6 + Math.random() * 0.6), (o.size || 0.5) * (0.6 + Math.random() * 0.7), { g: o.g, drag: o.drag == null ? 2 : o.drag, s1: o.s1 });
    }
  }
  _updateParticles(dt) {
    const N = this.N, P = this.pPos, V = this.pVel, C = this.pCol, S = this.pSize;
    for (let i = 0; i < N; i++) {
      if (this.pLife[i] <= 0) { if (S[i] !== 0) { S[i] = 0; C[i * 4 + 3] = 0; } continue; }
      const l = this.pLife[i] -= dt;
      if (l <= 0) { S[i] = 0; C[i * 4 + 3] = 0; continue; }
      const k = 1 - l / this.pMax[i], dr = Math.max(0, 1 - this.pDrag[i] * dt);
      V[i * 3] *= dr; V[i * 3 + 1] = V[i * 3 + 1] * dr - this.pGrav[i] * dt; V[i * 3 + 2] *= dr;
      P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt;
      const fade = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
      C[i * 4] = this.pBase[i * 4]; C[i * 4 + 1] = this.pBase[i * 4 + 1]; C[i * 4 + 2] = this.pBase[i * 4 + 2]; C[i * 4 + 3] = this.pBase[i * 4 + 3] * fade;
      S[i] = this.pS0[i] + (this.pS1[i] - this.pS0[i]) * k;
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true; g.attributes.col.needsUpdate = true; g.attributes.size.needsUpdate = true;
    const cam = this.camera;
    const h = window.innerHeight * Math.min(window.devicePixelRatio || 1, CONFIG.isTouch ? 1.5 : 2);
    this.pUni.scale.value = cam && cam.fov ? h / 2 / Math.tan(cam.fov * Math.PI / 360) : 400;
  }

  // ---------- Mermi ----------
  projectile(from, target, kind, onHit) {
    const geo = kind === 'arrow' ? this.geo.arrow : kind === 'ice' ? this.geo.shard : this.geo.ball;
    const pal = kind === 'ice' ? VFX_PAL.cold : kind === 'bolt' ? VFX_PAL.lightning : kind === 'arrow' ? VFX_PAL.phys : VFX_PAL.fire;
    const mesh = new THREE.Mesh(geo, kind === 'arrow' ? new THREE.MeshBasicMaterial({ color: 0xe8d8b0 }) : this._mat(pal[1], 0.95));
    mesh.position.set(from.x, from.y, from.z);
    if (kind !== 'arrow') {   // dış parıltı
      const glow = new THREE.Mesh(this.geo.plane, this._texMat(vfxSoftTex(), pal[0], 0.95));
      glow.scale.setScalar(kind === 'ice' ? 1.6 : 2.2); glow.userData.bill = true;
      mesh.add(glow);
    }
    this.scene.add(mesh);
    this.list.push({ type: 'proj', mesh, target, onHit, speed: kind === 'arrow' ? 34 : 22, kind, pal, acc: 0 });
  }

  // ---------- Yer halkası + parıltı ----------
  burst(x, z, color, radius = 3, life = 0.5) {
    const y = this._decalY(x, z, radius * 0.6) + 0.04;
    const ring = new THREE.Mesh(this.geo.plane, this._texMat(vfxShockTex(), color, 1));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, y, z);
    const disk = new THREE.Mesh(this.geo.disk, this._mat(color, 0.2).clone());
    disk.rotation.x = -Math.PI / 2; disk.position.set(x, y + 0.02, z);
    this.scene.add(ring, disk);
    this.list.push({ type: 'burst', ring, disk, t: 0, life, radius });
  }

  // Işık sütunu (şifa, buff, seviye)
  column(x, z, color, h = 4, life = 0.7) {
    const m = new THREE.Mesh(this.geo.column, this._mat(color, 0.4).clone());
    m.position.set(x, terrainHeight(x, z), z);
    m.scale.set(1, h, 1);
    this.scene.add(m);
    this.list.push({ type: 'col', mesh: m, t: 0, life });
  }

  // Eğimli zeminde decal gömülmesin: çevredeki en yüksek noktanın biraz üstü
  _decalY(x, z, r) {
    let h = terrainHeight(x, z);
    for (let i = 0; i < 6; i++) { const a = i * 1.0472; h = Math.max(h, terrainHeight(x + Math.cos(a) * r, z + Math.sin(a) * r)); }
    return h + 0.06;
  }
  // Büyü çemberi: yerde dönen rün halkası (buff / büyü başlangıcı)
  rune(x, z, color, size = 3.2, life = 1.1, follow = null) {
    const m = new THREE.Mesh(this.geo.plane, this._texMat(vfxRuneTex(), color, 0));
    m.rotation.x = -Math.PI / 2; m.position.set(x, this._decalY(x, z, size * 0.45), z);
    m.scale.setScalar(size); m.renderOrder = 3;
    this.scene.add(m);
    this.list.push({ type: 'rune', mesh: m, t: 0, life, size, follow });
  }

  // Yıldırım: gökten hedefe zikzak + dallar + çarpma kıvılcımı
  bolt(x, z, color = 0xd8c8ff) {
    const y = terrainHeight(x, z);
    const mk = (pts, op) => {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
      this.scene.add(line); this.list.push({ type: 'line', mesh: line, t: 0, life: 0.3, op });
    };
    for (let s = 0; s < 3; s++) {     // ana kanal 3 kez hafif kaydırılarak (kalın görünüm)
      const pts = []; const o = (s - 1) * 0.08;
      for (let i = 0; i <= 9; i++) {
        const j = i && i < 9 ? 1.4 : 0;
        pts.push(new THREE.Vector3(x + o + (Math.random() - 0.5) * j, y + 16 - i * 16 / 9, z + (Math.random() - 0.5) * j));
      }
      mk(pts, s === 1 ? 1 : 0.55);
      if (s === 1) {                       // kalın çekirdek: silindir parçaları
        const up = new THREE.Vector3(0, 1, 0);
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1], d = b.clone().sub(a), L = d.length();
          const seg = new THREE.Mesh(this.geo.bseg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
          seg.position.copy(a).addScaledVector(d, 0.5); seg.quaternion.setFromUnitVectors(up, d.normalize()); seg.scale.set(1, L, 1);
          this.scene.add(seg); this.list.push({ type: 'line', mesh: seg, t: 0, life: 0.28, op: 1, keepGeo: true });
          const halo = new THREE.Mesh(this.geo.bseg, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
          halo.position.copy(seg.position); halo.quaternion.copy(seg.quaternion); halo.scale.set(3.5, L, 3.5);
          this.scene.add(halo); this.list.push({ type: 'line', mesh: halo, t: 0, life: 0.28, op: 0.5, keepGeo: true });
        }
      }
      if (s === 1) for (let b = 0; b < 3; b++) {   // yan dallar
        const st = pts[2 + Math.floor(Math.random() * 5)], bp = [st.clone()];
        let p = st.clone();
        for (let i = 0; i < 3; i++) { p = p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2.2, -1.2 - Math.random(), (Math.random() - 0.5) * 2.2)); bp.push(p); }
        mk(bp, 0.6);
      }
    }
    const flash = new THREE.Mesh(this.geo.plane, this._texMat(vfxSoftTex(), 0xffffff, 1));
    flash.material.opacity = 0.8;
    flash.position.set(x, y + 1, z); flash.scale.setScalar(3); flash.userData.bill = true;
    this.scene.add(flash); this.list.push({ type: 'flash', mesh: flash, t: 0, life: 0.18, size: 3 });
    this.emit(x, y + 0.8, z, 26, { pal: VFX_PAL.lightning, speed: 9, life: 0.35, size: 0.35, g: 6, drag: 3 });
    this.burst(x, z, color, 2.4, 0.4);
  }

  // Kılıç izi: dokulu hilal, elemente göre renk
  slash(x, z, heading, color = 0xffffff) {
    const g = new THREE.RingGeometry(1.2, 2.3, 18, 1, -1.0, 2.0);
    // UV'yi yarıçapa göre ayarla (dış kenar parlak)
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const r = Math.hypot(pos.getX(i), pos.getY(i)); uv.setXY(i, (r - 1.2) / 1.1, 0.5); }
    const m = new THREE.Mesh(g, this._texMat(vfxSlashTex(), color, 0.9));
    m.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; m.rotation.z = heading - Math.PI / 2;
    m.position.set(x, terrainHeight(x, z) + 1.15, z);
    this.scene.add(m);
    this.list.push({ type: 'slash', mesh: m, t: 0, life: 0.22, dispose: g });
  }

  // Vuruş kıvılcımı: element ve kritik vuruşa göre
  hit(ent, elem, crit) {
    const p = ent.group ? ent.group.position : ent.pos || ent;
    const h = 1.1 * (ent.baseScale || 1);
    const pal = VFX_PAL[elem] || VFX_PAL.phys;
    this.emit(p.x, p.y + h, p.z, crit ? 18 : 9, { pal, speed: crit ? 8 : 5, life: 0.32, size: crit ? 0.42 : 0.3, g: 9, drag: 2.5 });
    if (!elem) this.emit(p.x, p.y + h, p.z, crit ? 5 : 2, { pal: VFX_PAL.blood, speed: 3, life: 0.45, size: 0.25, g: 12, drag: 1 });
    if (crit) {
      const f = new THREE.Mesh(this.geo.plane, this._texMat(vfxSoftTex(), pal[1], 1));
      f.position.set(p.x, p.y + h, p.z); f.userData.bill = true; f.scale.setScalar(2.4);
      this.scene.add(f); this.list.push({ type: 'flash', mesh: f, t: 0, life: 0.16, size: 2.4 });
    }
  }

  // Element alan patlaması (nuke): halka + element dolgusu
  nova(x, z, elem, radius) {
    const y = terrainHeight(x, z), pal = VFX_PAL[elem] || VFX_PAL.phys;
    this.burst(x, z, pal[0], radius, 0.6);
    if (elem === 'fire') {
      this.emit(x, y + 0.6, z, 50, { pal, speed: radius * 2.2, up: 2.5, life: 0.75, size: 0.9, s1: 1.6, g: -1, drag: 3, jitter: radius * 0.4 });
      this.emit(x, y + 0.3, z, 20, { pal: VFX_PAL.fire, speed: 6, up: 6, life: 0.9, size: 0.22, g: 9, drag: 0.6 });
    } else if (elem === 'cold') {
      this.spikes(x, z, radius);
      this.emit(x, y + 0.5, z, 34, { pal, speed: radius * 1.8, up: 1, life: 0.9, size: 0.35, g: 1, drag: 2.5, jitter: radius * 0.5 });
    } else if (elem === 'lightning') {
      for (let i = 0; i < 3; i++) this.emit(x + (Math.random() - 0.5) * radius, y + 0.5, z + (Math.random() - 0.5) * radius, 10, { pal, speed: 7, life: 0.3, size: 0.3, g: 5 });
    } else this.emit(x, y + 0.8, z, 30, { pal, speed: radius * 2, up: 1, life: 0.6, size: 0.5, drag: 3 });
  }
  // Yerden fırlayan buz dikenleri
  spikes(x, z, radius) {
    const n = Math.round(6 + radius * 2.2);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.2832, r = Math.sqrt(Math.random()) * radius;
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      const m = new THREE.Mesh(this.geo.spike, new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0xbfefff : 0x7fd0ff, transparent: true, opacity: 0.9, depthWrite: false }));
      m.position.set(px, terrainHeight(px, pz) - 0.1, pz);
      m.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * 6, (Math.random() - 0.5) * 0.6);
      const hgt = 0.8 + Math.random() * 1.6;
      m.scale.set(1, 0.01, 1);
      this.scene.add(m);
      this.list.push({ type: 'spike', mesh: m, t: -Math.random() * 0.12, life: 1.0, hgt });
    }
  }
  // Göktaşı: gökten düşen ateş topu, düşünce patlama (onLand)
  meteor(x, z, radius, onLand) {
    const y = terrainHeight(x, z);
    const m = new THREE.Mesh(this.geo.ball, this._mat(0xffd27a, 1));
    m.scale.setScalar(2.2);
    const glow = new THREE.Mesh(this.geo.plane, this._texMat(vfxSoftTex(), 0xff5a1a, 1)); glow.scale.setScalar(3.5); glow.userData.bill = true; m.add(glow);
    m.position.set(x - 6, y + 22, z - 6);
    this.scene.add(m);
    this.rune(x, z, 0xff6a1a, radius * 2.2, 0.9);
    this.list.push({ type: 'meteor', mesh: m, t: 0, life: 0.45, from: m.position.clone(), to: new THREE.Vector3(x, y + 0.5, z), onLand, radius });
  }
  // Şifa: yükselen yeşil sarmal
  heal(x, z) {
    const y = terrainHeight(x, z);
    this.rune(x, z, 0x7aff8a, 2.8, 1.0);
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * 6.2832 * 2, r = 0.9;
      this.spark(x + Math.cos(a) * r, y + 0.2 + i * 0.05, z + Math.sin(a) * r, -Math.sin(a) * 1.2, 2.2 + Math.random(), Math.cos(a) * 1.2,
        VFX_PAL.heal[i % 3], 0.9 + Math.random() * 0.4, 0.4, { drag: 0.5 });
    }
  }
  // Buff: rün çemberi + yukarı uçuşan kıvılcım
  buffCast(x, z, color, pal) {
    const y = terrainHeight(x, z);
    this.rune(x, z, color, 3.0, 1.2);
    this.emit(x, y + 0.3, z, 26, { pal: pal || [color, 0xffffff, color], speed: 1.2, up: 3.2, life: 1.0, size: 0.32, flat: true, jitter: 1.6, drag: 0.8 });
  }

  // Sürekli efektler (her kare çağrılır): aşılama, berserk, buff
  auras(pl, dt) {
    this._auraAcc = (this._auraAcc || 0) + dt;
    if (this._auraAcc < 0.05) return;
    const step = this._auraAcc; this._auraAcc = 0;
    const P = pl.pos;
    if (pl.imbue && pl.h && pl.h.weapon) {         // silah boyunca element parçacıkları
      const pal = VFX_PAL[pl.imbue.elem] || VFX_PAL.phys;
      const w = pl.h.weapon; w.updateWorldMatrix(true, false);
      const n = Math.max(1, Math.round(step * 40));
      for (let i = 0; i < n; i++) {
        const v = new THREE.Vector3(0, 0.15 + Math.random() * 1.0, 0).applyMatrix4(w.matrixWorld);
        const up = pl.imbue.elem === 'fire' ? 1.6 : pl.imbue.elem === 'cold' ? -0.3 : 0.4;
        this.spark(v.x, v.y, v.z, (Math.random() - 0.5) * 0.8, up + Math.random() * 0.4, (Math.random() - 0.5) * 0.8,
          pal[Math.floor(Math.random() * 3)], 0.35 + Math.random() * 0.25, pl.imbue.elem === 'lightning' ? 0.22 : 0.3, { drag: 1 });
      }
    }
    if (pl.zerkT > 0) {                             // berserk: ayak altından yükselen kızıl alev
      const n = Math.round(step * 60);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.2832, r = 0.6 + Math.random() * 0.4;
        this.spark(P.x + Math.cos(a) * r, P.y + 0.1, P.z + Math.sin(a) * r, 0, 2.2 + Math.random() * 1.5, 0,
          VFX_PAL.fire[Math.floor(Math.random() * 3)], 0.6, 0.55, { s1: 0.1, drag: 0.5 });
      }
    }
    const nb = pl.buffs ? Object.keys(pl.buffs).length : 0;
    if (nb && Math.random() < step * 3) {           // aktif buff: ara sıra altın zerre
      const a = Math.random() * 6.2832;
      this.spark(P.x + Math.cos(a) * 0.7, P.y + 0.4 + Math.random(), P.z + Math.sin(a) * 0.7, 0, 0.8, 0, 0xffe9a8, 1.0, 0.18, { drag: 0.2 });
    }
  }

  _rm(mesh) { this.scene.remove(mesh); for (const c of mesh.children) c.material.dispose(); }

  update(dt) {
    const cam = this.camera;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      if (e.type === 'proj') {
        const t = e.target, tp = t.group ? t.group.position : t;
        const p = e.mesh.position;
        const dx = tp.x - p.x, dy = tp.y + 1.1 - p.y, dz = tp.z - p.z;
        const d = Math.hypot(dx, dy, dz), step = e.speed * dt;
        if (t.dead) { this._rm(e.mesh); this.list.splice(i, 1); continue; }
        if (d < 0.9 || d < step) {
          this._rm(e.mesh); this.list.splice(i, 1);
          if (e.kind !== 'arrow') this.emit(p.x, p.y, p.z, 16, { pal: e.pal, speed: 6, life: 0.35, size: 0.4, g: 4 });
          e.onHit(); continue;
        }
        p.set(p.x + dx / d * step, p.y + dy / d * step, p.z + dz / d * step);
        if (e.kind === 'arrow') { e.mesh.lookAt(tp.x, tp.y + 1.1, tp.z); if (Math.random() < 0.5) this.spark(p.x, p.y, p.z, 0, 0, 0, 0xfff0c0, 0.18, 0.18); }
        else {
          e.mesh.rotation.y += dt * 8;
          if (e.mesh.children[0] && cam) e.mesh.children[0].quaternion.copy(e.mesh.quaternion).invert().multiply(cam.quaternion);
          e.acc += dt;
          while (e.acc > 0.012) {   // iz
            e.acc -= 0.012;
            this.spark(p.x + (Math.random() - 0.5) * 0.3, p.y + (Math.random() - 0.5) * 0.3, p.z + (Math.random() - 0.5) * 0.3,
              (Math.random() - 0.5) * 0.6, e.kind === 'fire' ? 0.8 : -0.2, (Math.random() - 0.5) * 0.6, e.pal[Math.floor(Math.random() * 3)], 0.35, e.kind === 'ice' ? 0.45 : 0.7, { s1: 0.05, drag: 1 });
          }
        }
        continue;
      }
      e.t += dt;
      const k = e.t / e.life;
      if (e.type === 'spike' && e.t < 0) continue;
      if (k >= 1) {
        if (e.type === 'meteor') {
          this._rm(e.mesh);
          this.nova(e.to.x, e.to.z, 'fire', e.radius);
          this.emit(e.to.x, e.to.y + 0.5, e.to.z, 30, { pal: VFX_PAL.fire, speed: 3, up: 5, life: 1.2, size: 1.2, s1: 2.2, drag: 2 });
          if (e.onLand) e.onLand();
          this.list.splice(i, 1); continue;
        }
        if (e.ring) { this.scene.remove(e.ring, e.disk); e.ring.material.dispose(); e.disk.material.dispose(); }
        if (e.mesh) { this.scene.remove(e.mesh); e.mesh.material.dispose(); if (e.type === 'line' && !e.keepGeo) e.mesh.geometry.dispose(); }
        if (e.dispose) e.dispose.dispose();
        this.list.splice(i, 1); continue;
      }
      if (e.mesh && e.mesh.userData.bill && cam) e.mesh.quaternion.copy(cam.quaternion);
      if (e.type === 'burst') {
        const s = e.radius * 2.1 * (0.25 + 0.75 * Math.sqrt(k));
        e.ring.scale.set(s, s, s); e.disk.scale.setScalar(s * 0.48);
        e.ring.material.opacity = 1 - k; e.disk.material.opacity = 0.2 * (1 - k);
      } else if (e.type === 'col') { e.mesh.material.opacity = 0.4 * (1 - k); e.mesh.scale.x = e.mesh.scale.z = 1 + k * 0.6; }
      else if (e.type === 'line') e.mesh.material.opacity = e.op * (1 - k) * (Math.random() < 0.3 ? 0.4 : 1);
      else if (e.type === 'slash') { e.mesh.material.opacity = 0.9 * (1 - k); e.mesh.scale.setScalar(1 + k * 0.35); }
      else if (e.type === 'flash') { e.mesh.material.opacity = 0.8 * (1 - k); e.mesh.scale.setScalar(e.size * (1 + k)); }
      else if (e.type === 'rune') {
        const a = k < 0.15 ? k / 0.15 : k > 0.7 ? (1 - k) / 0.3 : 1;
        e.mesh.material.opacity = 0.85 * a;
        e.mesh.rotation.z += dt * 1.4;
        e.mesh.scale.setScalar(e.size * (0.85 + 0.15 * Math.min(1, k * 4)));
        if (e.follow) { const p = e.follow; e.mesh.position.set(p.x, this._decalY(p.x, p.z, e.size * 0.45), p.z); }
      } else if (e.type === 'spike') {
        const g = e.t < 0.12 ? e.t / 0.12 : 1;
        e.mesh.scale.set(1, e.hgt * g, 1);
        if (k > 0.65) { e.mesh.material.opacity = 0.9 * (1 - k) / 0.35; e.mesh.position.y -= dt * 1.2; }
      } else if (e.type === 'meteor') {
        e.mesh.position.lerpVectors(e.from, e.to, k * k);
        const p = e.mesh.position;
        if (cam) e.mesh.children[0].quaternion.copy(cam.quaternion);
        for (let n = 0; n < 4; n++) this.spark(p.x, p.y, p.z, (Math.random() - 0.5), 1 + Math.random(), (Math.random() - 0.5), VFX_PAL.fire[n % 3], 0.5, 1.4, { s1: 0.3, drag: 1 });
      }
    }
    this._updateParticles(dt);
  }
}
