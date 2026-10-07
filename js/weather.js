// Hava durumu: bölgeye göre kar (Hotan, Semerkant, Şambala), yağmur (Avrupa), kum fırtınası (Donwhang, İskenderiye).
// Kameranın çevresinde dönen parçacık kutusu; hava periyodik olarak açılıp kapanır (gerçek zamana bağlı, herkes aynı).
class Weather {
  constructor(world) {
    this.world = world; this.kind = IS_DUNGEON ? null : ZONE.weather || null; this.k = 0;
    if (!this.kind) return;
    const N = this.N = CONFIG.isTouch ? 700 : 1600, B = this.B = 46;
    const pos = new Float32Array(N * 3), rng = mulberry32(5);
    for (let i = 0; i < N; i++) { pos[i * 3] = (rng() - 0.5) * B * 2; pos[i * 3 + 1] = rng() * 30; pos[i * 3 + 2] = (rng() - 0.5) * B * 2; }
    this.seed = new Float32Array(N); for (let i = 0; i < N; i++) this.seed[i] = rng();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    const tex = typeof vfxSoftTex === 'function' ? vfxSoftTex() : null;
    const conf = {
      snow: { color: 0xffffff, size: 0.35, op: 0.9 },
      rain: { color: 0xa8c0e0, size: 0.18, op: 0.55 },
      sand: { color: 0xd8b070, size: 0.5, op: 0.5 }
    }[this.kind];
    this.mat = new THREE.PointsMaterial({ color: conf.color, size: conf.size, map: tex, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true });
    this.conf = conf;
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 6;
    world.scene.add(this.points);
    this.center = new THREE.Vector3();
  }
  // 0..1 yoğunluk: 9 dakikalık döngü, yaklaşık yarısı açık
  target() {
    const t = Date.now() / 1000 / 540 + (ZONE.seed || 0);
    const v = Math.sin(t * Math.PI * 2) * 0.6 + Math.sin(t * 5.1) * 0.4;
    return clamp((v - 0.05) * 2, 0, 1);
  }
  update(dt, camera) {
    if (!this.kind) return;
    this.k += (this.target() - this.k) * Math.min(1, dt * 0.3);
    this.mat.opacity = this.conf.op * this.k;
    this.points.visible = this.k > 0.02;
    const W = this.world;
    // sis: kum fırtınasında yoğunlaşır ve renk alır
    if (this.kind === 'sand' && W.scene.fog) { W.scene.fog.near = 100 - 70 * this.k; W.scene.fog.far = 420 - 300 * this.k; if (this.k > 0.05) W.scene.fog.color.lerp(new THREE.Color(0xd8b878), this.k * 0.6); }
    if (this.kind === 'rain' && W.scene.fog) { W.scene.fog.far = 420 - 160 * this.k; }
    if (this.kind === 'snow' && W.scene.fog) { W.scene.fog.far = 420 - 200 * this.k; }
    if (!this.points.visible) return;
    const p = this.points.geometry.attributes.position, a = p.array, B = this.B, c = camera.position;
    this.points.position.set(c.x, 0, c.z);
    const base = terrainHeight(c.x, c.z);
    const vy = this.kind === 'rain' ? -26 : this.kind === 'snow' ? -2.2 : -0.6, vx = this.kind === 'sand' ? 14 : this.kind === 'snow' ? 0.8 : 1.5;
    const t = performance.now() * 0.001;
    for (let i = 0; i < this.N; i++) {
      const s = this.seed[i];
      a[i * 3] += (vx + (this.kind === 'snow' ? Math.sin(t + s * 20) * 0.8 : 0)) * dt;
      a[i * 3 + 1] += vy * (0.7 + s * 0.6) * dt + (this.kind === 'sand' ? Math.sin(t * 2 + s * 30) * dt : 0);
      a[i * 3 + 2] += (this.kind === 'sand' ? 4 : 0) * dt;
      if (a[i * 3 + 1] < base - 1) a[i * 3 + 1] += 30;
      if (a[i * 3 + 1] > base + 30) a[i * 3 + 1] -= 30;
      if (a[i * 3] > B) a[i * 3] -= B * 2; if (a[i * 3] < -B) a[i * 3] += B * 2;
      if (a[i * 3 + 2] > B) a[i * 3 + 2] -= B * 2; if (a[i * 3 + 2] < -B) a[i * 3 + 2] += B * 2;
    }
    p.needsUpdate = true;
  }
}
