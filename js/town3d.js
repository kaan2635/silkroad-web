// Gerçek 3D modellerle şehir, kervan yolu ve doğa dekoru (Kenney CC0 — bkz. CREDITS.md).
// Modeller yüklenemezse town.js ve world.js içindeki prosedürel yedek kullanılır.

World.prototype._modelsOK = function () {
  return Assets.ready && ['nature/tree_palm', 'nature/cactus_tall', 'survival/rock-sand-a', 'nature/statue_column', 'castle/wall-narrow',
    'castle/tower-hexagon-base', 'fantasy-town/wall', 'fantasy-town/roof-point', 'fantasy-town/lantern'].every(k => Assets.has(k));
};

// Dekor için serbest nokta (çarpışma yok, sadece üst üste binmesin)
World.prototype._freeDeco = function (x, z, r) {
  if (Math.max(Math.abs(x), Math.abs(z)) < TOWN_HALF + 6) return false;
  if (Math.abs(x - roadCenterX(z)) < 5.5) return false;
  for (const p of PONDS) if (Math.hypot(x - p.x, z - p.z) < POND_RADIUS + 2 + r) return false;
  for (const o of this.obstacles) if (Math.abs(x - o.x) < o.r + r && Math.abs(z - o.z) < o.r + r && Math.hypot(x - o.x, z - o.z) < o.r + r) return false;
  return true;
};

World.prototype._buildTown = function () {
  if (!this._modelsOK()) return this._buildTownProc();
  // bölgeye göre bina tonu (Donwhang kumtaşı, Hotan soğuk taş)
  if (ZONE.tint) for (const k of ['fantasy-town', 'castle']) if (Assets.matTex[k]) Assets.matTex[k].color.setHex(ZONE.tint);
  const H = TOWN_HALF, rng = mulberry32(777);
  const red = new THREE.MeshLambertMaterial({ color: 0xa8281e });
  const tile = new THREE.MeshLambertMaterial({ color: 0x38302c });
  this.lanternMat = new THREE.MeshBasicMaterial({ color: 0x6a5a40 });
  const sz = k => Assets.parts(k).size;

  // --- Surlar: kale duvar parçaları ---
  const wallMats = [];
  const gapN = roadCenterX(-H), gapS = roadCenterX(H);
  const WS = 3, WH = 3.9 / 1.31;           // parça uzunluğu 3, yükseklik ~3.9
  for (let t = -H; t <= H + 0.01; t += 3) {
    const sides = [
      { x: t, z: -H, run: 'x', gap: Math.abs(t - gapN) < 8.5 },
      { x: t, z: H, run: 'x', gap: Math.abs(t - gapS) < 8.5 },
      { x: -H, z: t, run: 'z', gap: Math.abs(t) < 5 },
      { x: H, z: t, run: 'z', gap: Math.abs(t) < 5 }
    ];
    for (const s of sides) {
      if (s.gap) continue;
      if (Math.abs(s.x) > H - 2 && Math.abs(s.z) > H - 2) continue;       // köşe kuleye bırak
      // wall-narrow: x ∈ [-0.5, 0] (kalınlık), z boyunca uzanır
      if (s.run === 'z') wallMats.push(this._matrix(s.x + 0.75, 0, s.z, WS, WH, WS, 0));
      else wallMats.push(this._matrix(s.x, 0, s.z - 0.75, WS, WH, WS, Math.PI / 2));
      this.obstacles.push({ x: s.x, z: s.z, r: 1.75, type: 'wall' });
    }
  }
  this._inst('castle/wall-narrow', wallMats);

  // doğu/batı kapıları ve tüm şehir içi (arch.js)
  this._buildCity();
  if (!this.arch) this.arch = new ArchKit(this);
  for (const sx of [-1, 1]) this.arch.paifang(sx * H, 0, Math.PI / 2, 11.2, '', 6.2);
  this.arch.finish();
};

// Kervan yolu: vagonlar, yük yığınları, tabelalar
World.prototype._buildCaravan = function () {
  if (!this._modelsOK() || !Assets.has('fantasy-town/cart-high')) return this._buildCaravanProc();
  const rng = mulberry32(31);
  const spots = [[-75, -1], [-140, 1], [-215, -1], [80, 1], [150, -1], [225, 1]];
  for (const [z, side] of spots) {
    const x = roadCenterX(z) + side * 8, ry = rng() * 6.28;
    this._place('fantasy-town/cart-high', x, z, 3.3, ry);
    this.obstacles.push({ x, z, r: 2.3, type: 'wagon' });
    for (const [key, dx, dz, sc] of [['survival/barrel', 3, 1, 3.6], ['survival/box-large', -3, 2, 3], ['survival/barrel', 3.8, -0.5, 3.6]]) {
      if (!Assets.has(key)) continue;
      this._place(key, x + dx, z + dz, sc, rng() * 6);
    }
  }
  // yön tabelaları
  const mats = [];
  for (let z = -260; z <= 260; z += 40) {
    if (Math.abs(z) < 45) continue;
    const x = roadCenterX(z) + 5.6;
    mats.push(this._matrix(x, terrainHeight(x, z), z, 4, 4, 4, 0.4));
  }
  this._inst('survival/signpost', mats);
};

// Doğa: palmiye, kaktüs, kaya, sütun + dekor
World.prototype._scatterModels = function (palms, cacti, rocks, pillars, rng) {
  const rand = (a, b) => a + rng() * (b - a);
  const bucket = {};
  const add = (key, m) => (bucket[key] = bucket[key] || []).push(m);
  const H = key => Assets.parts(key).size.y, W = key => Math.max(Assets.parts(key).size.x, Assets.parts(key).size.z);

  const PV = ['nature/tree_palm', 'nature/tree_palmTall', 'nature/tree_palmDetailedTall', 'nature/tree_palmBend', 'nature/tree_palmShort'].filter(k => Assets.has(k));
  palms.forEach((p, i) => { const k = PV[i % PV.length], s = p.h / H(k); add(k, this._matrix(p.x, p.y - 0.1, p.z, s, s, s, p.ry)); });
  const CV = ['nature/cactus_short', 'nature/cactus_tall'].filter(k => Assets.has(k));
  cacti.forEach((c, i) => { const k = CV[i % CV.length], s = c.h / H(k); add(k, this._matrix(c.x, c.y - 0.05, c.z, s, s, s, c.ry)); });
  const RV = ['survival/rock-sand-a', 'survival/rock-sand-b', 'survival/rock-sand-c', 'survival/rock-sand-a', 'nature/stone_largeA', 'nature/stone_largeB', 'nature/stone_tallA'].filter(k => Assets.has(k));
  rocks.forEach((r, i) => { const k = RV[i % RV.length], s = (1.9 * r.s) / W(k); add(k, this._matrix(r.x, r.y - 0.05, r.z, s, s * (0.8 + rng() * 0.5), s, r.ry)); });
  let ri = 0;
  for (const o of this.obstacles) if (o.type === 'rock') o.r = Math.max(0.8, rocks[ri++].s * 0.95);
  const PI_ = ['nature/tree_pineTallA', 'nature/tree_pineTallB', 'nature/tree_pineRoundA', 'nature/tree_pineRoundC', 'graveyard/pine-crooked'].filter(k => Assets.has(k));
  if (PI_.length) (this._pines || []).forEach((p, i) => { const k = PI_[i % PI_.length], s = p.h / H(k); add(k, this._matrix(p.x, p.y - 0.1, p.z, s, s, s, p.ry)); });
  const PL = ['nature/statue_column', 'nature/statue_columnDamaged'].filter(k => Assets.has(k));
  pillars.forEach((p, i) => { const k = PL[i % PL.length], s = p.h / H(k); add(k, this._matrix(p.x, p.y, p.z, s * 1.15, s, s * 1.15, rng() * 6)); });

  // Dekor (çarpışmasız): çalılar, kuru dallar, vaha otları
  const deco = (keys, count, sc0, sc1, gen, shadow = false) => {
    const ok = keys.filter(k => Assets.has(k)); if (!ok.length) return;
    let made = 0, tries = 0;
    while (made < count && tries++ < count * 6) {
      const [x, z] = gen();
      if (Math.abs(x) > 285 || Math.abs(z) > 285 || !this._freeDeco(x, z, 1)) continue;
      const k = ok[Math.floor(rng() * ok.length)], s = rand(sc0, sc1) / Math.max(0.5, H(k));
      add(k, this._matrix(x, terrainHeight(x, z) - 0.03, z, s, s, s, rng() * 6.28));
      made++;
    }
  };
  deco(['nature/plant_bush', 'nature/plant_bushLarge', 'nature/plant_flatTall'], ZONE.flora.bushes, 1.1, 2.2, () => [rand(-280, 280), rand(-280, 280)]);
  const green = ['hotan', 'asiaminor', 'constantinople', 'samarkand'].includes(ZONE.id);
  if (green) deco(['nature/flower_redA', 'nature/flower_yellowA', 'nature/mushroom_redGroup'], ZONE.id === 'samarkand' ? 50 : 120, 0.5, 0.9, () => [rand(-280, 280), rand(-280, 280)]);
  if (ZONE.flora.trees) {
    const near = ZONE.flora.trees > 50;
    deco(['nature/tree_default', 'nature/tree_oak', 'nature/tree_fat', 'nature/tree_detailed'], ZONE.flora.trees, 4, 7.5, () => {
      if (near || !PONDS.length) return [rand(-275, 275), rand(-275, 275)];
      const p = PONDS[Math.floor(rng() * PONDS.length)], a = rng() * 6.28, d = rand(13, 26); return [p.x + Math.cos(a) * d, p.z + Math.sin(a) * d];
    }, true);
  }
  deco(['nature/log', 'nature/log_stack', 'nature/stump_old'], 26, 0.9, 1.5, () => [rand(-270, 270), rand(-270, 270)], true);
  PONDS.forEach(p => deco(['nature/plant_flatShort', 'nature/grass_large', 'nature/plant_bush'], 22, 0.9, 1.8, () => { const a = rng() * 6.28, d = rand(POND_RADIUS + 1.5, 17); return [p.x + Math.cos(a) * d, p.z + Math.sin(a) * d]; }));

  // Donwhang: mezarlıklar (mumya çölü)
  if (ZONE.flora.crypts) {
    const GV = ['graveyard/gravestone-cross', 'graveyard/gravestone-round', 'graveyard/gravestone-broken', 'graveyard/urn-round'].filter(k => Assets.has(k));
    for (let c = 0; c < ZONE.flora.crypts; c++) {
      const a = rng() * 6.283, d = rand(205, 272), cx = Math.cos(a) * d, cz = Math.sin(a) * d;
      if (!this._freeDeco(cx, cz, 5)) continue;
      const ck = c % 3 ? 'graveyard/crypt-small' : 'graveyard/crypt';
      if (Assets.has(ck)) { this._place(ck, cx, cz, 4, rng() * 6); this.obstacles.push({ x: cx, z: cz, r: 3, type: 'house' }); }
      for (let i = 0; i < 6; i++) {
        const ga = rng() * 6.283, gd = rand(4.5, 8), gx = cx + Math.cos(ga) * gd, gz = cz + Math.sin(ga) * gd;
        if (GV.length) add(GV[i % GV.length], this._matrix(gx, terrainHeight(gx, gz) - 0.05, gz, 2.6, 2.6, 2.6, rng() * 6));
      }
      if (Assets.has('graveyard/fire-basket')) this._place('graveyard/fire-basket', cx + 3.5, cz + 3.5, 3, 0, null, false);
    }
  }

  for (const key in bucket) this._inst(key, bucket[key], !/plant|grass|log|stump|flower|mushroom/.test(key));

  // Haydut kampları: obelisk, çadırlar, kamp ateşi, fıçı ve sandıklar
  const camp = (cx, cz) => {
    const place = (key, x, z, sc, ry, r) => { if (!Assets.has(key)) return; this._place(key, x, z, sc, ry); if (r) this.obstacles.push({ x, z, r, type: 'prop' }); };
    place('nature/statue_obelisk', cx, cz, 6, rng() * 6, 0.9);
    place('survival/campfire-pit', cx + 3.2, cz + 2.4, 5, 0, 0);
    for (let i = 0; i < 3; i++) {
      const a = rand(0, 6.28) + i * 2.1, d = rand(10.5, 12.5), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      place(i === 1 ? 'survival/tent-canvas' : 'survival/tent', x, z, 7, Math.atan2(cx - x, cz - z), 2.2);
    }
    const props = ['survival/barrel', 'survival/box', 'survival/chest', 'survival/barrel', 'survival/box-large'];
    props.forEach((k, i) => { const a = 0.8 + i * 1.3, d = rand(5.2, 7), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; place(k, x, z, 3.6, rng() * 6, 0.7); });
  };
  for (const c of RUINS) camp(c.x, c.z);
};

// Bölge geçiş kapıları: yolun kuzey ucu → sonraki şehir, güney ucu → önceki şehir
World.prototype._buildPortals = function () {
  this.portals = [];
  const mk = (z, zone, arrive) => {
    if (!zone) return;
    const x = roadCenterX(z), y = terrainHeight(x, z), g = new THREE.Group();
    const stone = new THREE.MeshLambertMaterial({ color: 0x8a7a62 }), red = new THREE.MeshLambertMaterial({ color: 0xa8281e });
    for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.6, 9, 1.6), stone); c.position.set(sx * 5, 4.5, 0); c.castShadow = true; g.add(c); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(13, 1.4, 2.2), red); top.position.y = 9.4; top.castShadow = true; g.add(top);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.6), new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.y = 4.4; g.add(glow);
    const label = makeLabel('→ ' + ZONES[zone].name, 'Bölge geçişi', '#7fe3ff', '#ffe9a8');
    label.position.y = 11.6; label.scale.set(7, 2.2, 1); g.add(label);
    g.position.set(x, y, z);
    this.scene.add(g);
    for (const sx of [-1, 1]) this.obstacles.push({ x: x + sx * 5, z, r: 1.1, type: 'gate' });
    this.portals.push({ x, z, zone, arrive, glow });
  };
  mk(-284, ZONE.next, 'S');
  mk(284, ZONE.prev, 'N');
};
