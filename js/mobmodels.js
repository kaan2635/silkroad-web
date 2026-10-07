// Animasyonlu canavar modelleri (CC0: Quaternius, KayKit — bkz. CREDITS.md).
// Her canavar önce prosedürel modelle doğar; GLB yüklenince iskeletli modele geçer (bekleme, yürüme,
// koşma, saldırı, darbe, ölüm animasyonları). Dosya açılamazsa (file://) prosedürel model kalır.

// tür → model: dosya, hedef yükseklik (baseScale 1 iken), renkler, ek parçalar
const MOB_MODEL_DEFS = {
  wolf:      { file: 'wolf', h: 1.35, rot: -Math.PI / 2 },
  boar:      { file: 'bull', h: 1.55, rot: -Math.PI / 2, colors: { Main: 0x4a3222, Main_Light: 0x6a4a32, Muzzle: 0x2a1a10 } },
  scorpion:  { file: 'crab', h: 0.95, len: 1, colors: { Main: 0x8a3a1c, Main_Dark: 0x4a1e0e }, tail: 0x8a3a1c },
  tiger:     { file: 'wolf', h: 1.5, rot: -Math.PI / 2, colors: { Main: 0xc8721a, Main_Light: 0xf0e0c8, Nose: 0x1a1010 } },
  golem:     { file: 'giant', h: 2.6, tint: [0xd8b078, 0.55] },
  bandit:    { file: 'rogue_hooded', h: 2.05, tint: [0x5a5a6a, 0.35], weapon: 'blade' },
  jackal:    { file: 'fox', h: 1.15, rot: -Math.PI / 2, colors: { Main: 0xc8a068, Main_Light: 0xe8d8b8 } },
  sandscorp: { file: 'crab', h: 0.95, colors: { Main: 0xd8b060, Main_Dark: 0x8a6a2a }, tail: 0xd8b060 },
  snake:     { file: 'snake', h: 1.1, len: 1, colors: { DarkGreen: 0x5a6a2a, LightGreen: 0xc8b878 } },
  mummy:     { file: 'zombie', h: 2.15, tint: [0xe8d8b0, 0.55] },
  skeleton:  { file: 'skeleton', h: 2.15, weapon: 'blade' },
  dbandit:   { file: 'barbarian', h: 2.1, tint: [0xd8b078, 0.3], weapon: 'glaive' },
  icewolf:   { file: 'husky', h: 1.45, rot: -Math.PI / 2, tint: [0xd8f0ff, 0.25], glowEye: 0x3ad8ff },
  bear:      { file: 'yeti', h: 2.4 },
  ghost:     { file: 'ghost', h: 2.1, ghost: true, fly: 0.6, colors: { Ghost_Main: 0x2a3a6a } },
  stonegolem:{ file: 'giant', h: 2.9, tint: [0x9a9aa4, 0.7] },
  hbandit:   { file: 'knight', h: 2.1, tint: [0x4a6a4a, 0.3], weapon: 'spear' },
  demon:     { file: 'demon', h: 2.45, colors: { BlueDemon_Main: 0x8a1a12, BlueDemon_Secondary: 0x2a1a10 } },
  kthief:    { file: 'rogue_hooded', h: 2.05, tint: [0x8a2a2a, 0.35], weapon: 'blade' },
  kguard:    { file: 'knight', h: 2.1, tint: [0x3a5aa8, 0.3], weapon: 'spear' },
  u_tiger:   { file: 'rogue', h: 2.1, tint: [0xe07a1a, 0.35], weapon: 'blade' },
  u_uruchi:  { file: 'orc', h: 2.3, colors: { Orc_Main: 0x8a2a1a, Orc_Secondary: 0x3a0a08, Orc_Hair: 0x1a0a0a } },
  u_isyutaru:{ file: 'flydemon', h: 2.4, fly: 0.8, colors: { Demon_Main: 0x5a2a9a }, glow: 0x8a4aff },
  u_yarkan:  { file: 'dragon', h: 2.0, fly: 0.7, colors: { Dragon_Main: 0x6a1010, Dragon_Secondary: 0x1a0606 } },
  // --- Konstantinopolis ---
  gwolf:     { file: 'wolf', h: 1.3, rot: -Math.PI / 2, tint: [0x9a9a9a, 0.4] },
  stag:      { file: 'stag', h: 2.0, rot: -Math.PI / 2 },
  goblin:    { file: 'goblin', h: 1.5 },
  hound:     { file: 'husky', h: 1.45, rot: -Math.PI / 2, colors: { 'Material': 0x3a0a08, 'Material.001': 0x6a1a10, 'Material.003': 0x8a2a1a }, glowEye: 0xffa020 },
  orc:       { file: 'orc', h: 2.2 },
  ewarrior:  { file: 'knight', h: 2.15, tint: [0x2a2a34, 0.6], weapon: 'sword' },
  ebandit:   { file: 'barbarian', h: 2.1, tint: [0x8a4a2a, 0.3], weapon: 'blade' },
  u_cerberus:{ file: 'husky', h: 2.0, rot: -Math.PI / 2, colors: { 'Material': 0x1a0404, 'Material.001': 0x4a0a06, 'Material.003': 0x6a1a0a }, glowEye: 0xffa020, glow: 0xff3a00 },
  // --- Küçük Asya ---
  spider:    { file: 'spider', h: 1.2, len: 1 },
  wasp:      { file: 'wasp', h: 1.3, fly: 1.0 },
  raptor:    { file: 'raptor', h: 1.6, len: 1, colors: { } , tint: [0x4a7a3a, 0.3] },
  mushroom:  { file: 'mushnub', h: 1.6 },
  darkorc:   { file: 'orc', h: 2.35, tint: [0x3a3a3a, 0.55] },
  abandit:   { file: 'rogue_hooded', h: 2.05, tint: [0x2a4a8a, 0.4], weapon: 'blade' },
  u_ivy:     { file: 'rogue', h: 2.1, tint: [0x6a2a8a, 0.45], weapon: 'sword', glow: 0xc86aff },
  // --- Semerkant ---
  raptor2:   { file: 'raptor', h: 1.75, len: 1, tint: [0x8a6a3a, 0.4] },
  tribal:    { file: 'giant', h: 2.7, tint: [0x8a5a3a, 0.4] },
  ninja:     { file: 'rogue_hooded', h: 2.05, tint: [0x1a1a22, 0.75], weapon: 'blade' },
  rocbat:    { file: 'bat', h: 1.4, fly: 1.2, tint: [0x6a5a4a, 0.4] },
  flydemon:  { file: 'flydemon', h: 2.4, fly: 0.8 },
  sbandit:   { file: 'barbarian', h: 2.1, tint: [0x8a6a3a, 0.35], weapon: 'spear' },
  u_shaitan: { file: 'demon', h: 3.2, colors: { BlueDemon_Main: 0x8a1008, BlueDemon_Secondary: 0x1a0a06 }, glow: 0xff3a00 },
  u_roc:     { file: 'dragon', h: 2.4, fly: 1.2, colors: { Dragon_Main: 0x6a4a2a, Dragon_Secondary: 0x2a1a0a } },
  // --- İskenderiye ---
  mummy2:    { file: 'zombie', h: 2.25, tint: [0xd8c070, 0.6] },
  scarab:    { file: 'crab', h: 1.0, len: 1, colors: { Main: 0x1a6a6a, Main_Dark: 0x0a3a3a } },
  anubisw:   { file: 'skeleton_rogue', h: 2.2, tint: [0x2a2418, 0.55], weapon: 'glaive' },
  sandgolem: { file: 'giant', h: 2.9, tint: [0xd8b070, 0.6] },
  kingscorp: { file: 'crab', h: 1.1, len: 1, colors: { Main: 0x6a1010, Main_Dark: 0x2a0606 }, tail: 0x6a1010 },
  egbandit:  { file: 'rogue_hooded', h: 2.05, tint: [0xc8a868, 0.4], weapon: 'blade' },
  u_sphinx:  { file: 'giant', h: 4.0, tint: [0xe0c070, 0.65], glow: 0xffc83a },
  // --- Şambala ---
  frostwolf: { file: 'husky', h: 1.55, rot: -Math.PI / 2, tint: [0xe8f4ff, 0.5], glowEye: 0x3ad8ff },
  iceyeti:   { file: 'yeti', h: 2.6, colors: { Yeti_Main: 0xf0f4f8, Yeti_Secondary: 0x8ab8d8 } },
  icegolem:  { file: 'giant', h: 3.0, tint: [0x9ad0f0, 0.6] },
  lavademon: { file: 'demon', h: 2.6, colors: { BlueDemon_Main: 0xc83a10, BlueDemon_Secondary: 0x2a0a04 }, glow: 0xff3a00 },
  firedragon:{ file: 'dragon', h: 2.0, fly: 0.6, colors: { Dragon_Main: 0xb82a10, Dragon_Secondary: 0x3a0806 }, glow: 0xff3a00 },
  monk:      { file: 'mage', h: 2.05, tint: [0xc8702a, 0.4], weapon: 'spear' },
  u_shadowyarkan: { file: 'dragon', h: 2.6, fly: 1.0, colors: { Dragon_Main: 0x2a0a3a, Dragon_Secondary: 0x0a0414 }, glow: 0xc86aff },
  // --- Zindanlar ---
  cavebat:   { file: 'bat', h: 1.3, fly: 1.2 },
  slime:     { file: 'slime', h: 1.3 },
  skelminion:{ file: 'skeleton_minion', h: 2.0, weapon: 'blade' },
  skelmage:  { file: 'skeleton_mage', h: 2.1, atk: 'Spellcast_Shoot' },
  u_bonelord:{ file: 'skeleton', h: 2.6, weapon: 'glaive', glow: 0x8a4aff },
  terracotta:{ file: 'knight', h: 2.15, tint: [0xa86a4a, 0.75], weapon: 'spear' },
  terracotta2:{ file: 'knight', h: 2.35, tint: [0x8a4a2a, 0.7], weapon: 'glaive' },
  tombspirit:{ file: 'ghostskull', h: 2.0, ghost: true, fly: 0.6 },
  jiangshi:  { file: 'zombie', h: 2.2, tint: [0x9ac8c8, 0.55] },
  jiangshi2: { file: 'zombie', h: 2.35, tint: [0x6a9a9a, 0.65] },
  tombsnake: { file: 'snake', h: 1.4, len: 1, colors: { DarkGreen: 0x4a2a5a, LightGreen: 0xa88ac8 } },
  u_medusa:  { file: 'snake', h: 2.6, len: 1, colors: { DarkGreen: 0x2a8a4a, LightGreen: 0xd8c878 }, glow: 0x3aff8a },
  templeguard:{ file: 'skeleton', h: 2.3, tint: [0xd8b060, 0.45], weapon: 'spear' },
  priestess: { file: 'mage', h: 2.1, tint: [0x1a1a2a, 0.65], atk: 'Spellcast_Shoot' },
  scarab2:   { file: 'crab', h: 1.15, len: 1, colors: { Main: 0xd8a830, Main_Dark: 0x6a4a10 } },
  u_isis:    { file: 'mage', h: 2.6, tint: [0xf0e8d0, 0.55], atk: 'Spellcast_Shoot', glow: 0xffd870 },
  u_anubis:  { file: 'skeleton_rogue', h: 2.8, tint: [0x1a1a1a, 0.6], weapon: 'glaive', glow: 0xffc83a },
  u_haroeris:{ file: 'flydemon', h: 2.8, fly: 0.9, colors: { Demon_Main: 0xd8a830 }, glow: 0xffc83a },
  u_seth:    { file: 'demon', h: 3.0, colors: { BlueDemon_Main: 0x5a2a8a, BlueDemon_Secondary: 0x1a0a2a }, glow: 0x8a4aff },
  gladiator: { file: 'knight', h: 2.2, tint: [0xa88a3a, 0.45], weapon: 'sword' },
  harpy:     { file: 'flydemon', h: 2.3, fly: 0.9, colors: { Demon_Main: 0x2a8a80 } },
  minotaur:  { file: 'giant', h: 3.0, tint: [0x6a4228, 0.6] },
  u_yuno:    { file: 'mage', h: 2.6, tint: [0xf4f4ff, 0.6], atk: 'Spellcast_Shoot', glow: 0xc8d8ff },
  u_jupiter: { file: 'giant', h: 4.2, tint: [0xffd870, 0.6], glow: 0xffc83a },
  icewraith: { file: 'ghostskull', h: 2.1, ghost: true, fly: 0.6, colors: { Ghost_Main: 0x6ab8e8 } },
  u_frostqueen:{ file: 'mage', h: 2.7, tint: [0xc8e8ff, 0.6], atk: 'Spellcast_Shoot', glow: 0x3ad8ff },
  lavagolem: { file: 'giant', h: 3.1, tint: [0xb83a1a, 0.6], glow: 0xff3a00 },
  u_flamelord:{ file: 'demon', h: 3.4, colors: { BlueDemon_Main: 0xff4a10, BlueDemon_Secondary: 0x3a0806 }, glow: 0xff5a00 },
  u_fwboss:  { file: 'dragon', h: 2.6, fly: 1.0, colors: { Dragon_Main: 0x3a1a5a, Dragon_Secondary: 0x140a20 }, glow: 0xff6ae8 },
};
// Klip eşleme (dosyalardaki adların sonu)
const MOB_CLIPS = {
  idle: /(^|[|_])(Idle|Flying_Idle)$/, walk: /(^|[|_])(Walk|Walking_A|Fast_Flying|Flying)$/,
  run: /(^|[|_])(Gallop|Run|Running_A|Fast_Flying|Flying)$/,
  attack: /(^|[|_])(Attack|Attack_Headbutt|Bite_Front|Punch|Headbutt|1H_Melee_Attack_Chop|1H_Melee_Attack_Slice_Diagonal)$/,
  attack2: /(^|[|_])(2H_Melee_Attack_Chop|Weapon|Attack2)$/,
  death: /(^|[|_])(Death|Die|Death_A)$/, hit: /(^|[|_])(HitReact|HitRecieve|Hit_reaction|Hit_A|Idle_HitReact_Left|Hit)$/
};

const MobModels = {
  cache: {}, waiting: {}, loader: null,
  ok: typeof THREE !== 'undefined' && THREE.GLTFLoader && THREE.SkeletonUtils && location.protocol !== 'file:',
  _load(file, cb) {
    if (this.cache[file]) return cb(this.cache[file]);
    if (this.waiting[file]) { this.waiting[file].push(cb); return; }
    this.waiting[file] = [cb];
    this.loader = this.loader || new THREE.GLTFLoader();
    this.loader.load('assets/models/' + file + '.glb', gltf => {
      const root = gltf.scene;
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3());
      const entry = { scene: root, clips: gltf.animations, size, minY: box.min.y, center: box.getCenter(new THREE.Vector3()) };
      this.cache[file] = entry;
      for (const f of this.waiting[file]) f(entry);
      delete this.waiting[file];
    }, undefined, () => { delete this.waiting[file]; this.failed = (this.failed || 0) + 1; });
  },
  // Canavara model takar (yüklenince)
  attach(mob) {
    if (!this.ok) return;
    const def = MOB_MODEL_DEFS[mob.typeKey];
    if (!def) return;
    this._load(def.file, e => { if (!mob.removed) this._apply(mob, def, e); });
  },
  _mats: {},
  // Malzemeleri Lambert'e çevir (telefonda hızlı), türe göre renk
  _material(def, src, key) {
    const k = key + '|' + src.uuid;
    if (this._mats[k]) return this._mats[k];
    const name = src.name || '';
    let col = src.color ? src.color.clone() : new THREE.Color(1, 1, 1);
    if (!src.map) col.convertLinearToSRGB();
    if (def.colors && def.colors[name] != null) col = new THREE.Color(def.colors[name]);
    else if (/^(Eye_White|White)$/.test(name)) col = new THREE.Color(0x1a0806);      // iri beyaz gözler yerine kor gibi parlayan göz
    else if (def.tint && !/eye/i.test(name)) col.lerp(new THREE.Color(def.tint[0]), def.tint[1]);
    if (src.map) { src.map.encoding = THREE.LinearEncoding; }
    const m = new THREE.MeshLambertMaterial({ color: col, map: src.map || null, skinning: true, transparent: !!def.ghost, opacity: def.ghost ? 0.78 : 1 });
    if (/^(Eye_White|White)$/.test(name)) m.emissive = new THREE.Color(def.glowEye || def.glow || 0xc8200a);
    else if (/eye/i.test(name) && (def.glowEye || def.glow)) m.emissive = new THREE.Color(def.glowEye || def.glow);
    if (def.glow && !/eye/i.test(name)) m.emissive = new THREE.Color(def.glow).multiplyScalar(0.18);
    if (def.ghost) m.emissive = new THREE.Color(0x1a3a6a);
    if (key.startsWith('shadow:')) m.emissive = new THREE.Color(0x3a0a5a);
    m.name = name;
    this._mats[k] = m;
    return m;
  },
  _apply(mob, def, e) {
    const model = THREE.SkeletonUtils.clone(e.scene);
    const H = def.len ? Math.max(e.size.x, e.size.z) * 0.62 : e.size.y;
    const s = def.h / Math.max(0.01, H);
    const holder = new THREE.Group();
    if (def.rot) { const r = def.rot; model.rotation.y = r; }
    model.scale.setScalar(s);
    const cx = e.center.x * s, cz = e.center.z * s, c = Math.cos(def.rot || 0), sn = Math.sin(def.rot || 0);
    model.position.set(-(cx * c + cz * sn), -e.minY * s, -(-cx * sn + cz * c));
    holder.add(model);
    // malzemeler: örnek başına kopya (durum renklendirmesi için emissive kullanılır)
    model.traverse(o => {
      if (o.isMesh) {
        const conv = (m) => { const b = this._material(def, m, (mob.shadow ? 'shadow:' : '') + mob.typeKey); const c = b.clone(); c.skinning = o.isSkinnedMesh; c.userData.baseEm = c.emissive.getHex(); return c; };
        o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
        o.castShadow = !CONFIG.isTouch; o.receiveShadow = false; o.frustumCulled = false;
      }
      // KayKit karakterlerinin hazır silah/kalkan parçalarını gizle (kendi silahımızı takarız)
      if (/(Axe|Sword|Knife|Shield|Crossbow|Mug|Staff|Wand|Spellbook|Badge|Throwable|Dagger|Arrow|Quiver|Hood_Hat)/i.test(o.name) && !o.isBone && o !== model) o.visible = false;
    });
    // silah (kendi modellerimiz)
    if (def.weapon) {
      let hand = null; model.traverse(o => { if (!hand && /^handslot\.r$|RightHand$/i.test(o.name)) hand = o; });
      if (hand) {
        const w = weaponMesh(def.weapon, { d: Math.min(10, Math.max(1, Math.round(mob.level / 8))) });
        holder.updateMatrixWorld(true);
        const hs = hand.getWorldScale(new THREE.Vector3()).x || 1;
        w.scale.setScalar(1 / hs); w.rotation.set(def.wrot || 0, 0, 0);
        hand.add(w);
      }
    }
    // akrep kuyruğu (yengeç gövdesine)
    if (def.tail) {
      const mat = new THREE.MeshLambertMaterial({ color: def.tail }), tail = new THREE.Group();
      const pts = [[0, 0.35, -0.55, 0.16], [0, 0.6, -0.8, 0.14], [0, 0.9, -0.85, 0.12], [0, 1.15, -0.7, 0.11], [0, 1.3, -0.45, 0.1]];
      for (const [x, y, z, r] of pts) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat); m.position.set(x, y, z); m.castShadow = true; tail.add(m); }
      const st = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 6), new THREE.MeshLambertMaterial({ color: 0xe0b020 })); st.position.set(0, 1.25, -0.22); st.rotation.x = 2.4; tail.add(st);
      holder.add(tail); mob.tailPart = tail;
    }
    // KayKit karakterleri: daha gerçekçi oran için baş küçültülür (her karede uygulanır)
    model.traverse(o => { if (o.isBone && /^head$/i.test(o.name) && /rogue|barbarian|knight|skeleton/.test(def.file)) mob.headBone = o; });
    mob.labelH = def.h * (def.len ? 1.25 : 1) + 0.55 + (def.fly || 0);
    if (mob.label) mob.label.position.y = mob.labelH;
    // eski gövdeyi değiştir
    mob.group.remove(mob.body);
    mob.body = holder; mob.group.add(holder);
    mob.kind = 'gltf'; mob.fly = def.fly || 0;
    mob.mats = []; holder.traverse(o => { if (o.material && o.material.emissive) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) mob.mats.push(m); } });
    // animasyonlar
    mob.mixer = new THREE.AnimationMixer(model);
    mob.actions = {};
    for (const k in MOB_CLIPS) {
      const c = e.clips.find(c => MOB_CLIPS[k].test(c.name));
      if (c) mob.actions[k] = mob.mixer.clipAction(c);
    }
    if (def.atk) { const c = e.clips.find(c => c.name.endsWith(def.atk)); if (c) mob.actions.attack = mob.mixer.clipAction(c); }
    if (!mob.actions.idle) mob.actions.idle = mob.actions.walk || mob.actions.run;
    if (!mob.actions.walk) mob.actions.walk = mob.actions.run || mob.actions.idle;
    if (!mob.actions.run) mob.actions.run = mob.actions.walk;
    for (const k of ['attack', 'attack2', 'death', 'hit']) if (mob.actions[k]) { mob.actions[k].setLoop(THREE.LoopOnce, 1); mob.actions[k].clampWhenFinished = k === 'death'; }
    mob.base = null; mob.mixer.timeScale = 1;
    mob._tint && mob._tint();
    if (mob.dead) { if (mob.actions.death) { mob.actions.death.play(); mob.actions.death.time = 10; } }
    else mob._play('idle');
    mob.modelReady = true;
  }
  ,
  // Basit kullanım (binek vb.): yüklenince { holder, mixer, actions } döner
  simple(file, def, cb) {
    if (!this.ok) return;
    this._load(file, e => {
      const model = THREE.SkeletonUtils.clone(e.scene), s = def.h / Math.max(0.01, e.size.y), holder = new THREE.Group();
      model.rotation.y = def.rot || 0; model.scale.setScalar(s);
      const cx = e.center.x * s, cz = e.center.z * s, c = Math.cos(def.rot || 0), sn = Math.sin(def.rot || 0);
      model.position.set(-(cx * c + cz * sn), -e.minY * s, -(-cx * sn + cz * c));
      model.traverse(o => { if (o.isMesh) { const conv = m => { const b = this._material(def, m, file + '_simple').clone(); b.skinning = o.isSkinnedMesh; return b; }; o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); o.castShadow = true; o.frustumCulled = false; } });
      holder.add(model);
      const mixer = new THREE.AnimationMixer(model), actions = {};
      for (const k in MOB_CLIPS) { const cl = e.clips.find(c => MOB_CLIPS[k].test(c.name)); if (cl) actions[k] = mixer.clipAction(cl); }
      cb({ holder, mixer, actions });
    });
  }
};
