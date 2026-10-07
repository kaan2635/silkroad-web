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

  // şehir içi ve kapılar (arch.js)
  this._buildCity();
  for (const sx of [-1, 1]) this.arch.paifang(sx * H, 0, Math.PI / 2, 11.2, '', 6.2);
  this.arch.finish();
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
