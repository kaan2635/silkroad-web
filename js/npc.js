// NPC'ler: dükkân sahipleri (uzun cübbe, geniş yen, şapka/saç, sakal, rol eşyası, rol hareketi)
// ve şehirde dolaşan halk. Gövde parçaları tek ağa birleştirilir (telefonda az çizim çağrısı).
const NPC_RANGE = 5.5;   // bu mesafeden etkileşime girilir

const NPC_DEFS = [
  { id: 'merchant', title: 'İksir ve Parşömen', x: 5.5,  z: -4.5 },
  { id: 'smith',    title: 'Silah · Tamir · Simya', x: -6.5, z: -5.0 },
  { id: 'armor',    title: 'Zırh ve Kalkan', x: 11.5, z: 5.2 },
  { id: 'acc',      title: 'Takı ve Şans Tozu', x: -11.5, z: 5.2 },
  { id: 'storage',  title: 'Depo', x: 6.5, z: -21 },
  { id: 'captain',  title: 'Şehir Muhafızı', x: -3.5, z: -21 },
  { id: 'tele',     title: 'Işınlayıcı', x: 8, z: 16 },
  { id: 'job',      title: 'Meslek Loncası', x: -8, z: 16 },
  { id: 'stable',   title: 'Ahır · Binek ve Evcil', x: -17, z: -13 },
  { id: 'special',  title: 'Ticaret Malları', x: 17, z: -13 },
  { id: 'market',   title: 'Emanet Pazarı', x: 14, z: 12 },
  { id: 'den',      title: 'Çalıntı Mal Alır', x: RUINS[0].x + 14, z: RUINS[0].z + 9 }
];
NPC_DEFS.forEach(n => { n.name = ZONE.npc[n.id] || ({ market: 'Pazar Ağası' })[n.id] || n.id; });

// Görünüm: cübbe, iç renk, kuşak, şapka, saç, sakal, rol eşyası, hareket
const NPC_LOOK = {
  merchant: { robe: 0x2e6aa8, dark: 0x1c3f68, sash: 0xe8dcc0, hat: 'scholar', hair: 0x2a2a2a, beard: 0x8a8a8a, prop: 'gourd', anim: 'gesture' },
  smith:    { robe: 0x6a5a4a, dark: 0x33281e, sash: 0x8a2a1a, hat: 'band', hair: 0x1a1a1a, beard: 0x1a1a1a, prop: 'hammer', apron: 0x5a3a20, anim: 'hammer', skin: 0xd8a070 },
  armor:    { robe: 0x7a3a5a, dark: 0x3a1a2a, sash: 0xd9a92e, hat: 'bun', hair: 0x1a1a1a, prop: 'shield', anim: 'gesture' },
  acc:      { robe: 0x3a7a5a, dark: 0x1a3a2a, sash: 0xe8c050, hat: 'bun', hair: 0x2a1a10, prop: 'jewel', anim: 'gesture' },
  storage:  { robe: 0x8a7a3a, dark: 0x4a3a1a, sash: 0x5a3a1a, hat: 'scholar', hair: 0x3a3a3a, beard: 0xb8b8b8, prop: 'abacus', anim: 'count' },
  captain:  { robe: 0x8a1c1c, dark: 0x4a0e0e, sash: 0xd9a92e, hat: 'helmet', hair: 0x1a1a1a, beard: 0x1a1a1a, prop: 'spear', armor: 0x8a8f98, anim: 'guard' },
  tele:     { robe: 0x5a3a9a, dark: 0x2a1a4a, sash: 0xd9a92e, hat: 'official', hair: 0x1a1a1a, beard: 0xd8d8d8, prop: 'staff', anim: 'staff' },
  job:      { robe: 0x7a5a1a, dark: 0x3a2a08, sash: 0xc0302a, hat: 'official', hair: 0x1a1a1a, beard: 0x3a3a3a, prop: 'scroll', anim: 'gesture' },
  stable:   { robe: 0x5a4a2a, dark: 0x2a2010, sash: 0x8a6a3a, hat: 'straw', hair: 0x2a1a10, prop: 'whip', anim: 'gesture' },
  special:  { robe: 0xc8902a, dark: 0x6a4a10, sash: 0x8a1a1a, hat: 'official', hair: 0x1a1a1a, beard: 0x1a1a1a, prop: 'abacus', anim: 'count' },
  market:   { robe: 0x2a6a6a, dark: 0x103a3a, sash: 0xe8c050, hat: 'turban', hair: 0x1a1a1a, beard: 0x2a2a2a, prop: 'pouch', anim: 'gesture' },
  den:      { robe: 0x2a2a2a, dark: 0x0a0a0a, sash: 0x5a1a1a, hat: 'hood', hair: 0x1a1a1a, prop: 'dagger', mask: true, anim: 'gesture' }
};
if (ZONE.id === 'hotan') { NPC_LOOK.merchant.hat = 'turban'; NPC_LOOK.storage.hat = 'turban'; NPC_LOOK.stable.hat = 'turban'; }
if (ZONE.id === 'donwhang') { NPC_LOOK.stable.hat = 'turban'; NPC_LOOK.special.hat = 'turban'; }

const _npcMat = new THREE.MeshLambertMaterial({ vertexColors: true });

// Robalı insan modeli. Gövde tek ağ, kollar ayrı (hareket için). o: NPC_LOOK benzeri
function buildRobed(o) {
  const root = new THREE.Group(), B = new ArchBatch(), A = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => AM(x, y, z, ry, sx, sy, sz, rx, rz);
  const skin = o.skin || 0xe8b98a, robe = o.robe, dark = o.dark, sash = o.sash || dark;
  const cyl = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s), sph = (r, a = 10, b = 8) => new THREE.SphereGeometry(r, a, b), box = new THREE.BoxGeometry(1, 1, 1);
  const add = (geo, m, c) => B.add(_npcMat, geo, m, c);
  add(cyl(0.36, 0.6, 1.12), A(0, 0.6, 0), robe);                               // etek
  add(cyl(0.605, 0.62, 0.12), A(0, 0.07, 0), dark);                             // etek bordürü
  add(cyl(0.33, 0.37, 0.78), A(0, 1.52, 0), robe);                              // gövde
  add(cyl(0.385, 0.385, 0.17), A(0, 1.14, 0), sash);                            // kuşak
  add(box, A(0.12, 0.8, 0.36, 0, 0.12, 0.55, 0.03, 0.05), sash);                // kuşak ucu
  for (const s of [-1, 1]) add(box, A(s * 0.09, 1.62, 0.31, 0, 0.07, 0.55, 0.04, -0.12, s * 0.55), dark);   // çapraz yaka
  add(sph(0.4), A(0, 1.86, 0, 0, 1.05, 0.48, 0.82), robe);                      // omuzlar
  add(cyl(0.11, 0.12, 0.16, 8), A(0, 2.0, 0), skin);                            // boyun
  add(sph(0.25), A(0, 2.2, 0, 0, 1, 1.06, 1), skin);                            // baş
  for (const s of [-1, 1]) {
    add(box, A(s * 0.085, 2.23, 0.225, 0, 0.055, 0.035, 0.02), 0x1a1a1a);        // gözler
    add(box, A(s * 0.09, 2.29, 0.228, 0, 0.08, 0.02, 0.02, 0, s * -0.15), o.hair || 0x1a1a1a);   // kaşlar
  }
  add(box, A(0, 2.17, 0.25, 0, 0.04, 0.07, 0.04), 0xd09a70);                   // burun
  if (o.beard) {
    add(new THREE.ConeGeometry(0.11, 0.3, 6), A(0, 1.98, 0.17, 0, 1, 1, 1, Math.PI + 0.25), o.beard);
    for (const s of [-1, 1]) add(box, A(s * 0.07, 2.1, 0.235, 0, 0.1, 0.025, 0.03, 0, s * 0.35), o.beard);
  }
  if (o.mask) add(box, A(0, 2.11, 0.19, 0, 0.42, 0.16, 0.14), 0x1a1a1a);
  // saç / şapka
  const hair = o.hair || 0x1a1a1a, hat = o.hat;
  if (hat !== 'hood' && hat !== 'helmet' && hat !== 'turban') add(sph(0.265), A(0, 2.25, -0.03, 0, 1, 0.92, 1), hair);
  if (hat === 'bun') { add(sph(0.11, 8, 6), A(0, 2.5, -0.08), hair); add(new THREE.BoxGeometry(0.3, 0.025, 0.025), A(0, 2.5, -0.08, 0.6), 0xd9a92e); }
  if (hat === 'straw') add(new THREE.ConeGeometry(0.66, 0.34, 14), A(0, 2.5, 0), 0xd8b66a);
  if (hat === 'band') add(cyl(0.27, 0.27, 0.08, 12), A(0, 2.32, 0), 0xc0302a);
  if (hat === 'scholar') { add(cyl(0.2, 0.24, 0.2, 10), A(0, 2.47, -0.02), 0x1a1a1a); add(box, A(0, 2.47, -0.24, 0, 0.06, 0.4, 0.02, 0.2), 0x1a1a1a); }
  if (hat === 'official') {
    add(new THREE.BoxGeometry(0.44, 0.24, 0.38), A(0, 2.47, -0.02), 0x161616);
    add(new THREE.BoxGeometry(0.32, 0.16, 0.24), A(0, 2.63, -0.06), 0x161616);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.5, 0.035, 0.08), A(s * 0.45, 2.52, -0.08), 0x161616);
  }
  if (hat === 'turban') { add(new THREE.TorusGeometry(0.22, 0.09, 6, 14), A(0, 2.36, 0, 0, 1, 1, 1, Math.PI / 2), 0xf0ead8); add(sph(0.22, 10, 6), A(0, 2.42, 0, 0, 1, 0.8, 1), o.sash || 0x2a6a8a); }
  if (hat === 'helmet') { add(sph(0.29, 12, 8), A(0, 2.3, 0, 0, 1, 0.95, 1), o.armor || 0x8a8f98); add(new THREE.ConeGeometry(0.06, 0.3, 6), A(0, 2.62, 0), 0xc0302a); add(cyl(0.3, 0.32, 0.06), A(0, 2.18, 0), 0xd9a92e); }
  if (hat === 'hood') add(new THREE.ConeGeometry(0.34, 0.75, 10), A(0, 2.35, -0.04, 0, 1, 1, 1, -0.12), o.robe);
  if (o.apron) add(box, A(0, 0.95, 0.42, 0, 0.55, 1.0, 0.04, 0.12), o.apron);
  if (o.armor) {
    add(cyl(0.36, 0.39, 0.6, 10), A(0, 1.56, 0), o.armor);
    for (const s of [-1, 1]) add(sph(0.2, 8, 6), A(s * 0.42, 1.86, 0, 0, 1, 0.6, 1), o.armor);
    add(box, A(0, 1.2, -0.3, 0, 0.7, 1.4, 0.04, -0.1), o.dark);   // pelerin
  }
  if (o.prop === 'gourd') { add(sph(0.11, 8, 6), A(0.36, 1.0, 0.12), 0xc8a060); add(sph(0.08, 8, 6), A(0.36, 1.17, 0.12), 0xc8a060); }
  if (o.prop === 'pouch') add(sph(0.13, 8, 6), A(-0.36, 1.0, 0.12, 0, 1, 1.2, 1), 0xd9a92e);
  if (o.basket) { add(cyl(0.3, 0.22, 0.3, 10), A(0, 2.55, 0), 0xb08a4a); }
  if (o.sack) add(sph(0.3, 8, 6), A(-0.3, 1.95, -0.25, 0, 1, 0.8, 1.2), 0xc8b088);
  B.build(root, true);
  // kollar: geniş yen + el
  const arm = (side) => {
    const pv = new THREE.Group(); pv.position.set(side * 0.47, 1.86, 0);
    const AB = new ArchBatch();
    AB.add(_npcMat, cyl(0.11, 0.2, 0.78, 10), A(0, -0.38, 0), robe);
    AB.add(_npcMat, cyl(0.205, 0.205, 0.08, 10), A(0, -0.76, 0), dark);
    AB.add(_npcMat, sph(0.09, 8, 6), A(0, -0.84, 0.02), skin);
    AB.build(pv, true);
    const hand = new THREE.Group(); hand.position.set(0, -0.86, 0.04); pv.add(hand);
    pv.userData.hand = hand;
    pv.rotation.z = side * 0.1;
    root.add(pv);
    return pv;
  };
  const armL = arm(-1), armR = arm(1);
  // el eşyası
  const P = new ArchBatch(), hp = (geo, m, c) => P.add(_npcMat, geo, m, c);
  const pr = o.prop;
  if (pr === 'hammer') { hp(cyl(0.035, 0.035, 0.6, 6), A(0, -0.05, 0.18, 0, 1, 1, 1, Math.PI / 2), 0x5a3a20); hp(box, A(0, -0.05, 0.48, 0, 0.14, 0.14, 0.26), 0x5a5a60); }
  if (pr === 'spear') { hp(cyl(0.035, 0.035, 2.6, 6), A(0, 0.5, 0.05), 0x5a3a20); hp(new THREE.ConeGeometry(0.07, 0.38, 6), A(0, 1.98, 0.05), 0xd0d4dc); hp(new THREE.BoxGeometry(0.16, 0.1, 0.06), A(0, 1.75, 0.05), 0xc0302a); }
  if (pr === 'staff') { hp(cyl(0.03, 0.04, 2.0, 6), A(0, 0.25, 0.05), 0x4a2e18); hp(new THREE.OctahedronGeometry(0.14), A(0, 1.38, 0.05), 0x8ad8ff); }
  if (pr === 'scroll') { hp(cyl(0.05, 0.05, 0.42, 8), A(0, -0.05, 0.1, 0, 1, 1, 1, 0, Math.PI / 2), 0xe8dcc0); hp(cyl(0.06, 0.06, 0.04, 8), A(0.21, -0.05, 0.1, 0, 1, 1, 1, 0, Math.PI / 2), 0xc0302a); }
  if (pr === 'abacus') { hp(box, A(0, -0.04, 0.16, 0, 0.42, 0.26, 0.04), 0x5a3a20); for (let i = 0; i < 4; i++) hp(box, A(-0.12 + i * 0.08, -0.04, 0.19, 0, 0.05, 0.18, 0.04), 0xd9a92e); }
  if (pr === 'jewel') { hp(box, A(0, -0.02, 0.14, 0, 0.28, 0.16, 0.2), 0x8a1a2a); hp(new THREE.OctahedronGeometry(0.07), A(0, 0.1, 0.14), 0x6ae8ff); }
  if (pr === 'shield') { hp(cyl(0.3, 0.3, 0.05, 12), A(0, -0.05, 0.12, 0, 1, 1, 1, Math.PI / 2), 0x8a8f98); hp(sph(0.07, 6, 5), A(0, -0.05, 0.16), 0xd9a92e); }
  if (pr === 'whip') { hp(cyl(0.025, 0.03, 0.5, 6), A(0, 0.1, 0.1, 0, 1, 1, 1, 0.5), 0x4a2e18); hp(cyl(0.01, 0.01, 0.6, 4), A(0, -0.2, 0.25, 0, 1, 1, 1, -0.6), 0x2a1a10); }
  if (pr === 'dagger') { hp(box, A(0, -0.05, 0.22, 0, 0.04, 0.03, 0.36), 0xc8ccd4); hp(box, A(0, -0.05, 0.03, 0, 0.12, 0.04, 0.04), 0x5a3a20); }
  if (P.groups.size) P.build(armR.userData.hand, true);
  return { group: root, armL, armR };
}

function makeMarkerTexture(ch, color) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  x.font = 'bold 54px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 7; x.strokeStyle = '#2a1a00'; x.strokeText(ch, 32, 34);
  x.fillStyle = color; x.fillText(ch, 32, 34);
  return new THREE.CanvasTexture(c);
}

class NPCManager {
  constructor(world) {
    this.world = world;
    this.list = [];
    this.tex = { '!': makeMarkerTexture('!', '#ffd23a'), '?': makeMarkerTexture('?', '#7fe36a') };
    if (typeof planCity === 'function') planCity();
    for (const def of NPC_DEFS) {
      const look = NPC_LOOK[def.id] || NPC_LOOK.merchant;
      const h = buildRobed(look);
      const g = new THREE.Group();
      g.add(h.group);
      const y = terrainHeight(def.x, def.z);
      g.position.set(def.x, y, def.z);
      const label = makeLabel(def.name, def.title, '#ffe08a', '#a8f0a0');
      label.position.y = 3.25; label.scale.set(4.3, 1.34, 1);
      g.add(label);
      const mk = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex['!'], transparent: true, depthTest: false }));
      mk.scale.set(1.5, 1.5, 1); mk.position.y = 4.6; mk.visible = false; mk.renderOrder = 10;
      g.add(mk);
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 1.5;
      g.add(hit);
      world.scene.add(g);
      const npc = { ...def, look, group: g, model: h, label, hit, marker: mk, mark: null, heading: Math.atan2(-def.x, -def.z), t: Math.random() * 6, act: 0 };
      hit.userData.npc = npc;
      g.rotation.y = npc.heading;
      world.obstacles.push({ x: def.x, z: def.z, r: 0.9, type: 'npc' });
      this.list.push(npc);
    }
    this.folk = new Townsfolk(world);
  }

  // Görev işaretleri: '!' görev alınabilir, '?' teslim edilecek
  refreshMarkers(quests) {
    for (const n of this.list) {
      const m = quests.markerFor(n.id);
      n.mark = m;
      n.marker.visible = !!m;
      if (m) n.marker.material.map = this.tex[m];
    }
  }

  pick(raycaster) {
    const hit = raycaster.intersectObjects(this.list.map(n => n.hit), false)[0];
    return hit ? hit.object.userData.npc : null;
  }

  update(dt, player) {
    for (const n of this.list) {
      n.t += dt;
      const dx = player.pos.x - n.x, dz = player.pos.z - n.z, near = Math.hypot(dx, dz);
      // oyuncu yakındaysa ona dön
      const home = Math.atan2(-n.x, -n.z);
      n.heading += angleDiff(n.heading, near < 14 ? Math.atan2(dx, dz) : home) * Math.min(1, dt * (near < 14 ? 6 : 1.5));
      n.group.rotation.y = n.heading;
      if (n.marker.visible) n.marker.position.y = 4.6 + Math.sin(n.t * 3) * 0.18;
      n.label.visible = near < 24;
      const M = n.model, t = n.t, anim = n.look.anim;
      M.group.scale.y = 1 + Math.sin(t * 1.8) * 0.008;   // nefes
      let rl = Math.sin(t * 1.6) * 0.05, rr = -Math.sin(t * 1.6) * 0.05, rzr = 0.1, rzl = -0.1;
      if (anim === 'hammer' && near > 6) {               // örse vurma
        const c = (t * 1.2) % 1; rr = c < 0.6 ? -1.9 * Math.sin(c / 0.6 * Math.PI * 0.5) : -1.9 * (1 - (c - 0.6) / 0.4);
      } else if (anim === 'count') { rr = -0.9 + Math.sin(t * 6) * 0.08; rl = -0.9 + Math.sin(t * 6 + 1) * 0.06; rzr = -0.25; rzl = 0.25; }
      else if (anim === 'guard') { rr = -0.15; }
      else if (anim === 'staff') { rr = -0.35 + Math.sin(t * 1.2) * 0.05; }
      if (anim !== 'hammer' && anim !== 'count') {       // yaklaşınca selam
        if (near < 7 && n.act <= 0 && !n.greeted) { n.act = 1.6; n.greeted = true; }
        if (near > 10) n.greeted = false;
        if (n.act > 0) { n.act -= dt; const k = Math.sin((1.6 - n.act) / 1.6 * Math.PI); rl = -2.4 * k; rzl = -0.3 * k; }
      }
      M.armL.rotation.x = rl; M.armR.rotation.x = rr; M.armR.rotation.z = rzr; M.armL.rotation.z = rzl;
    }
    if (this.folk) this.folk.update(dt, player);
  }
}

// Şehirde dolaşan halk: meydan ve sokaklar arasında yürür, durup bekler
const FOLK_COLORS = [[0x9a3a2a, 0x4a1a12], [0x2a5a8a, 0x12283a], [0x5a7a3a, 0x283a1a], [0x8a6a3a, 0x3a2a12], [0x7a5a8a, 0x3a2a4a], [0xd8c8a0, 0x7a6a4a], [0x3a6a6a, 0x1a3a3a], [0xb06a2a, 0x5a3010]];
class Townsfolk {
  constructor(world) {
    this.world = world; this.list = [];
    const n = CONFIG.isTouch ? 5 : 9, rng = mulberry32(55);
    const hats = ['straw', 'bun', 'band', 'straw', 'scholar', ZONE.id === 'jangan' ? 'bun' : 'turban'];
    this.points = [];
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; this.points.push([Math.cos(a) * 9.5, Math.sin(a) * 9.5]); }
    for (let z = -24; z <= 24; z += 8) { const x = roadCenterX(z); if (Math.abs(z) > 10) this.points.push([x - 2.5, z], [x + 2.5, z]); }
    for (const x of [-24, -16, 16, 24]) this.points.push([x, -1.5], [x, 1.5]);
    for (let i = 0; i < n; i++) {
      const [c1, c2] = FOLK_COLORS[i % FOLK_COLORS.length];
      const look = { robe: c1, dark: c2, sash: FOLK_COLORS[(i + 3) % 8][0], hat: hats[i % hats.length], hair: rng() < 0.2 ? 0x8a8a8a : 0x1a1a1a, beard: rng() < 0.3 ? 0x2a2a2a : 0, skin: [0xe8b98a, 0xd8a070, 0xc89060][i % 3], basket: i % 4 === 1, sack: i % 4 === 3 };
      if (!look.beard) delete look.beard;
      const m = buildRobed(look);
      const p = this.points[Math.floor(rng() * this.points.length)];
      m.group.position.set(p[0], 0, p[1]);
      m.group.scale.setScalar(0.92 + rng() * 0.12);
      world.scene.add(m.group);
      this.list.push({ m, x: p[0], z: p[1], tx: p[0], tz: p[1], wait: rng() * 4, phase: rng() * 6, heading: 0, speed: 1.4 + rng() * 0.6, stuck: 0 });
    }
  }
  update(dt, player) {
    for (const f of this.list) {
      const g = f.m.group;
      if (f.wait > 0) {
        f.wait -= dt;
        if (f.wait <= 0) { const p = this.points[Math.floor(Math.random() * this.points.length)]; f.tx = p[0] + (Math.random() - 0.5) * 2; f.tz = p[1] + (Math.random() - 0.5) * 2; }
        f.m.armL.rotation.x *= 0.9; f.m.armR.rotation.x *= 0.9;
        continue;
      }
      const dx = f.tx - f.x, dz = f.tz - f.z, d = Math.hypot(dx, dz);
      if (d < 0.6) { f.wait = 2 + Math.random() * 5; continue; }
      const sp = f.speed * dt, ox = f.x, oz = f.z;
      f.x += dx / d * sp; f.z += dz / d * sp;
      // oyuncudan ve engellerden kaçın
      const p = { x: f.x, z: f.z };
      pushOut(p, 0.45, this.world.obstacles);
      const pdx = p.x - player.pos.x, pdz = p.z - player.pos.z, pd = Math.hypot(pdx, pdz);
      if (pd < 1.0 && pd > 0.01) { p.x = player.pos.x + pdx / pd; p.z = player.pos.z + pdz / pd; }
      f.x = p.x; f.z = p.z;
      if (Math.hypot(f.x - ox, f.z - oz) < sp * 0.3) { f.stuck += dt; if (f.stuck > 1.5) { f.stuck = 0; f.wait = 0.5; } } else f.stuck = 0;
      f.heading += angleDiff(f.heading, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
      f.phase += dt * 7;
      g.position.set(f.x, terrainHeight(f.x, f.z) + Math.abs(Math.sin(f.phase)) * 0.05, f.z);
      g.rotation.y = f.heading;
      f.m.armL.rotation.x = Math.sin(f.phase) * 0.45; f.m.armR.rotation.x = -Math.sin(f.phase) * 0.45;
    }
  }
}
