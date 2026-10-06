// Şehir (Jangan benzeri): surlar, kuleler, evler, meydan, fenerler. Ayrıca kervan yolundaki vagonlar.
// World sınıfına eklenir; world.js'den sonra yüklenmeli.

World.prototype._buildTownProc = function () {
  const H = TOWN_HALF, rng = mulberry32(777);
  const stone = new THREE.MeshLambertMaterial({ color: 0xcdbb98 });
  const red = new THREE.MeshLambertMaterial({ color: 0xa8281e });
  const tile = new THREE.MeshLambertMaterial({ color: 0x38302c });
  this.lanternMat = new THREE.MeshBasicMaterial({ color: 0x6a5a40 });

  // --- Sur parçaları ---
  const wallMats = [], crenMats = [];
  const gapN = roadCenterX(-H), gapS = roadCenterX(H);
  const step = 3;
  for (let t = -H; t <= H + 0.01; t += step) {
    // kuzey (z=-H) ve güney (z=+H): yol geçişinde boşluk
    const sides = [
      { x: t, z: -H, ry: 0, gap: Math.abs(t - gapN) < 8.5 },
      { x: t, z: H, ry: 0, gap: Math.abs(t - gapS) < 8.5 },
      { x: -H, z: t, ry: Math.PI / 2, gap: Math.abs(t) < 5 },     // batı kapısı (açıklık)
      { x: H, z: t, ry: Math.PI / 2, gap: Math.abs(t) < 5 }       // doğu kapısı (açıklık)
    ];
    for (const s of sides) {
      if (s.gap) continue;
      if (Math.abs(s.x) > H - 2 && Math.abs(s.z) > H - 2) continue;   // köşe kuleye bırak
      wallMats.push(this._matrix(s.x, 2.5, s.z, 1, 1, 1, s.ry));
      crenMats.push(this._matrix(s.x, 5.45, s.z, 1, 1, 1, s.ry));
      this.obstacles.push({ x: s.x, z: s.z, r: 1.75, type: 'wall' });
    }
  }
  this._instanced(new THREE.BoxGeometry(3.05, 5, 1.7), stone, wallMats);
  this._instanced(new THREE.BoxGeometry(1.2, 0.9, 1.9), stone, crenMats);

  // doğu/batı kapı direkleri
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 6.5, 8), red);
    post.position.set(sx * H, 3.25, sz * 5.6); post.castShadow = true; this.scene.add(post);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1, 8), tile);
    cap.position.set(sx * H, 7, sz * 5.6); this.scene.add(cap);
    this.obstacles.push({ x: sx * H, z: sz * 5.6, r: 0.9, type: 'gate' });
  }

  // --- Köşe kuleleri ---
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.0, 8, 12), stone); body.position.y = 4; body.castShadow = true; g.add(body);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.5, 12), red); ring.position.y = 8.2; g.add(ring);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 3.2, 8), tile); roof.position.y = 10.1; roof.castShadow = true; g.add(roof);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshLambertMaterial({ color: 0xd8a830 })); tip.position.y = 11.9; g.add(tip);
    g.position.set(sx * H, 0, sz * H);
    this.scene.add(g);
    this.obstacles.push({ x: sx * H, z: sz * H, r: 3.1, type: 'wall' });
  }

  // --- Meydan ---
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(10, 40), new THREE.MeshLambertMaterial({ color: 0xd2c3a0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.04; plaza.receiveShadow = true; this.scene.add(plaza);
  const rim = new THREE.Mesh(new THREE.RingGeometry(9.6, 10.4, 40), new THREE.MeshLambertMaterial({ color: 0x8e7e60, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  rim.rotation.x = -Math.PI / 2; rim.position.y = 0.05; this.scene.add(rim);

  // --- Fenerler: yol boyunca ve meydan çevresinde ---
  const lampPts = [];
  for (let z = -H + 3; z <= H - 3; z += 8) { const cx = roadCenterX(z); lampPts.push([cx - 4.5, z], [cx + 4.5, z]); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + 0.5; lampPts.push([Math.cos(a) * 11.5, Math.sin(a) * 11.5]); }
  const postMats = [], headMats = [];
  for (const [x, z] of lampPts) {
    postMats.push(this._matrix(x, 1.6, z, 1, 1, 1));
    headMats.push(this._matrix(x, 3.4, z, 1, 1, 1));
    this.obstacles.push({ x, z, r: 0.35, type: 'lamp' });
  }
  this._instanced(new THREE.CylinderGeometry(0.1, 0.14, 3.2, 6), new THREE.MeshLambertMaterial({ color: 0x3a2a22 }), postMats);
  const heads = this._instanced(new THREE.BoxGeometry(0.6, 0.8, 0.6), this.lanternMat, headMats, false);
  heads.receiveShadow = false;

  // --- Evler ---
  const spots = [];
  const npcSpots = (typeof NPC_DEFS !== 'undefined' ? NPC_DEFS : []).map(n => [n.x, n.z]);
  let tries = 0;
  while (spots.length < 12 && tries++ < 600) {
    const x = (rng() * 2 - 1) * 25, z = (rng() * 2 - 1) * 25;
    if (Math.hypot(x, z) < 16) continue;
    if (Math.abs(x - roadCenterX(z)) < 10.5 || Math.abs(x - roadCenterX(z - 5)) < 10.5 || Math.abs(x - roadCenterX(z + 5)) < 10.5) continue;
    if (Math.abs(z) < 11) continue;                                         // doğu-batı kapı yolu açık kalsın
    if (npcSpots.some(p => Math.hypot(x - p[0], z - p[1]) < 8)) continue;
    if (spots.some(p => Math.hypot(x - p.x, z - p.z) < 10.5)) continue;
    spots.push({ x, z, w: 5 + rng() * 2.5, d: 5 + rng() * 2.5, h: 3.4 + rng() * 1.2, ry: Math.round(rng() * 3) * Math.PI / 2 });
  }
  const bodyMats = [], roofMats = [], doorMats = [], colors = [];
  for (const s of spots) {
    bodyMats.push(this._matrix(s.x, s.h / 2, s.z, s.w, s.h, s.d, s.ry));
    const rw = Math.max(s.w, s.d) * 0.78;
    roofMats.push(this._matrix(s.x, s.h + 0.9, s.z, rw, 1, rw, s.ry + Math.PI / 4));
    this.obstacles.push({ x: s.x, z: s.z, r: Math.max(s.w, s.d) * 0.62, type: 'house' });
    colors.push(rng() < 0.5 ? 0xe2d3b0 : 0xd7c39a);
  }
  const bodies = this._instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), bodyMats);
  const cc = new THREE.Color();
  colors.forEach((c, i) => { cc.setHex(c); bodies.setColorAt(i, cc); });
  if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  const roofGeo = new THREE.ConeGeometry(1, 1.8, 4);
  this._instanced(roofGeo, new THREE.MeshLambertMaterial({ color: 0x8a2a20, flatShading: true }), roofMats);
  this.houses = spots;
};

// Kervan yolu: yol kenarında vagonlar ve mil taşları
World.prototype._buildCaravanProc = function () {
  const wood = new THREE.MeshLambertMaterial({ color: 0x7a5a36 });
  const cloth = new THREE.MeshLambertMaterial({ color: 0xd9c9a0 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2c2118 });
  const spots = [[-75, -1], [-140, 1], [-215, -1], [80, 1], [150, -1], [225, 1]];
  for (const [z, side] of spots) {
    const x = roadCenterX(z) + side * 7.5, y = terrainHeight(x, z);
    const g = new THREE.Group();
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 4.4), wood); bed.position.y = 1.0; bed.castShadow = true; g.add(bed);
    const cover = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 4, 10, 1, false, 0, Math.PI), cloth);
    cover.rotation.set(Math.PI / 2, 0, Math.PI / 2); cover.position.set(0, 1.25, 0); cover.castShadow = true; g.add(cover);
    for (const sx of [-1, 1]) for (const sz of [-1.4, 1.4]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.18, 12), dark);
      w.rotation.z = Math.PI / 2; w.position.set(sx * 1.4, 0.62, sz); w.castShadow = true; g.add(w);
    }
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 2.4), wood); shaft.position.set(0, 0.9, 3.4); g.add(shaft);
    g.position.set(x, y, z); g.rotation.y = (side > 0 ? 0.15 : -0.1);
    this.scene.add(g);
    this.obstacles.push({ x, z, r: 2.4, type: 'wagon' });
  }
  // mil taşları
  const mats = [];
  for (let z = -260; z <= 260; z += 40) {
    if (Math.abs(z) < 45) continue;
    mats.push(this._matrix(roadCenterX(z) + 5.2, terrainHeight(roadCenterX(z) + 5.2, z) + 0.6, z, 0.5, 1.2, 0.35));
  }
  this._instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xb8a888 }), mats);
};
