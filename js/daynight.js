// Gün/gece döngüsü: güneş, ay, yıldızlar, gökyüzü/sis rengi, ışık şiddeti, fenerler.
// timeOfDay: 0 = gece yarısı, 0.25 = şafak, 0.5 = öğle, 0.75 = akşam.

const DAY_LENGTH = 840;   // saniye (14 dk = 1 oyun günü)

World.prototype._buildDayNight = function () {
  this.timeOfDay = 0.33;
  this.night = 0;
  this.lightDir = new THREE.Vector3(0, 1, 0);
  this._c = { a: new THREE.Color(), b: new THREE.Color(), day: new THREE.Color(0xffffff), nite: new THREE.Color(0x141a3a), dusk: new THREE.Color(0xff9a68) };
  this._fogDay = new THREE.Color(CONFIG.sky.horizon);
  this._fogNight = new THREE.Color(0x0b1226);
  this._fogDusk = new THREE.Color(0xe0906a);
  this._hemiSky = { day: new THREE.Color(0xcfe8ff), night: new THREE.Color(0x3a4a88) };
  this._hemiGnd = { day: new THREE.Color(0xc9a66b), night: new THREE.Color(0x1a1a2c) };

  this.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(12, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe8eeff, fog: false, depthWrite: false }));
  this.moonMesh.renderOrder = -1; this.moonMesh.frustumCulled = false;
  this.scene.add(this.moonMesh);

  const rng = mulberry32(2024), n = 600, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = rng() * 6.283, e = Math.asin(0.05 + rng() * 0.95), R = 400;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * R; pos[i * 3 + 1] = Math.sin(e) * R; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * R;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  this.stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  this.stars.renderOrder = -1.5; this.stars.frustumCulled = false;
  this.scene.add(this.stars);
  this._applyDayNight(new THREE.Vector3(), { position: new THREE.Vector3() });
};

World.prototype.clockText = function () {
  const m = Math.floor(this.timeOfDay * 24 * 60), h = Math.floor(m / 60) % 24;
  return String(h).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
};

World.prototype.isNight = function () { return this.night > 0.5; };

World.prototype._updateDayNight = function (dt, playerPos, camera) {
  this.timeOfDay = (this.timeOfDay + dt / DAY_LENGTH) % 1;
  this._applyDayNight(playerPos, camera);
};

World.prototype._applyDayNight = function (playerPos, camera) {
  const t = this.timeOfDay, th = (t - 0.25) * Math.PI * 2;
  const elev = Math.sin(th);
  const dayK = sstep(-0.12, 0.25, elev);               // 0 gece → 1 gündüz
  const twi = Math.exp(-Math.pow(elev / 0.2, 2));      // ufuk çizgisinde yüksek
  this.night = 1 - dayK;
  this.sunDir.set(Math.cos(th), elev, 0.35).normalize();

  // gökyüzü ve sis rengi
  const c = this._c;
  c.a.copy(c.nite).lerp(c.day, dayK).lerp(c.dusk, twi * 0.55);
  this.sky.material.color.copy(c.a);
  c.b.copy(this._fogNight).lerp(this._fogDay, dayK).lerp(this._fogDusk, twi * 0.5);
  this.scene.fog.color.copy(c.b);

  // ışık: gündüz güneş, gece ay
  const sunI = 0.95 * sstep(0, 0.3, elev), moonI = 0.34 * sstep(0, 0.3, -elev);
  const useSun = elev >= 0;
  this.lightDir.copy(this.sunDir); if (!useSun) this.lightDir.negate();
  this.light.intensity = useSun ? sunI : moonI;
  this.light.color.setHex(useSun ? 0xfff1d0 : 0x9db4ff).lerp(c.dusk, useSun ? twi * 0.5 : 0);
  this.light.position.copy(playerPos).addScaledVector(this.lightDir, 110);
  this.light.target.position.copy(playerPos);
  this.hemi.intensity = 0.24 + 0.41 * dayK;
  this.hemi.color.copy(this._hemiSky.night).lerp(this._hemiSky.day, dayK);
  this.hemi.groundColor.copy(this._hemiGnd.night).lerp(this._hemiGnd.day, dayK);

  // gök cisimleri
  const cp = camera.position;
  this.sunMesh.visible = elev > -0.12;
  this.sunMesh.position.copy(cp).addScaledVector(this.sunDir, 380);
  this.sunMesh.material.color.setHex(0xfff3c0).lerp(c.dusk, twi * 0.7);
  this.moonMesh.visible = elev < 0.12;
  this.moonMesh.position.copy(cp).addScaledVector(this.sunDir, -380);
  this.stars.position.copy(cp);
  this.stars.material.opacity = clamp((this.night - 0.35) / 0.5, 0, 1);

  // fenerler geceleri parlar
  if (this.lanternMat) this.lanternMat.color.setHex(0x6a5a40).lerp(c.b.setHex(0xffd070), this.night);
  if (this.lanternRed) this.lanternRed.color.setHex(0xa8322a).lerp(c.b.setHex(0xff8a4a), this.night);
};
