// Görünüm: eşyanın derecesi, kademesi, mührü ve +seviyesi karakterin üzerinde görünür.
// Silah: dereceye göre metal rengi, boy ve süsler; +4'ten itibaren parlama (Silkroad'daki gibi).
// Zırh: parça parça (miğfer, omuzluk, göğüs, eldiven, dizlik, çizme) tür ve dereceye göre şekil/renk.
// Avatar (Item Mall): giysi, şapka ve sırt süsü zırhın görünümünü örter.

const DEG_METAL = [0x9a8264, 0xa8a070, 0xa8b0b8, 0xdde4ea, 0x4ed8a0, 0xe8a030, 0xff6a3a, 0x6a9aff, 0xc8a8ff, 0xffe680, 0xe8c070, 0xf4f0ff, 0x7ae8ff, 0xff3a6a];
const DEG_HUE = [0.58, 0.0, 0.33, 0.08, 0.45, 0.07, 0.97, 0.62, 0.76, 0.13, 0.11, 0.7, 0.52, 0.95];
const PLUS_GLOW = p => p >= 11 ? 0xffc83a : p >= 9 ? 0xff4a6a : p >= 7 ? 0xb06aff : p >= 6 ? 0x4a9aff : p >= 4 ? 0xcfe8ff : 0;

// Zırh rengi: tür + derece + kademe
function armorColor(atype, d, tier = 0, dark = false) {
  const c = new THREE.Color();
  if (atype === 'armor') { c.setHex(DEG_METAL[d - 1]); c.lerp(new THREE.Color(0x7a8088), 0.35 - tier * 0.1); }
  else if (atype === 'protector') c.setHSL(DEG_HUE[d - 1], 0.28 + tier * 0.08, 0.32 + d * 0.012);
  else c.setHSL(DEG_HUE[d - 1], 0.45 + tier * 0.1, 0.36 + d * 0.01);
  if (dark) c.multiplyScalar(0.62);
  return c;
}
const _lm = (color, emissive) => { const m = new THREE.MeshLambertMaterial({ color }); if (emissive) m.emissive = new THREE.Color(emissive); return m; };

// --- Silah ---
// Profilden çekilmiş (extrude) bıçaklar, tornalanmış saplar, metal parlaklığı (Phong). o: { d, tier, plus, rarity }
const _wGeo = {};
const _wg = (k, f) => _wGeo[k] || (_wGeo[k] = f());
const _metal = (color, em, shin = 70) => { const m = new THREE.MeshPhongMaterial({ color, specular: 0x9a9a9a, shininess: shin }); if (em) m.emissive = new THREE.Color(em); return m; };
// Düz profil şekli → ince, kenarları pahlı katı
function _bladeGeo(key, pts, thick = 0.035, bevel = 0.012) {
  return _wg(key, () => {
    const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
    const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 1, curveSegments: 4 });
    g.translate(0, 0, -thick / 2);
    g.rotateY(Math.PI / 2); g.rotateX(Math.PI / 2);      // profil y → silahın uzunluğu (+z), kalınlık x
    g.computeVertexNormals();
    return g;
  });
}
function _lathe(key, pts, seg = 10) { return _wg(key, () => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg)); }
function weaponMesh(type, o = {}) {
  const d = o.d || 1, tier = o.tier || 0, plus = o.plus || 0, seal = o.rarity || 0;
  const metal = DEG_METAL[d - 1], glow = PLUS_GLOW(plus);
  let em = null;
  if (seal) em = new THREE.Color(RARITY[seal].hex).multiplyScalar(0.18);
  if (glow) em = new THREE.Color(glow).multiplyScalar(0.35);
  const steel = _metal(new THREE.Color(0xc4c9d0).lerp(new THREE.Color(metal), 0.16 + d * 0.025), em, 90);
  const gold = _metal(d >= 6 ? 0xffc83a : d >= 3 ? 0xc8902a : 0x8a6a3a, null, 60);
  const wood = new THREE.MeshLambertMaterial({ color: d >= 5 ? 0x3a1a10 : 0x6a4426 });
  const wrap = new THREE.MeshLambertMaterial({ color: d >= 7 ? 0x5a0a14 : d >= 4 ? 0x1a1a2a : 0x4a2e18 });
  const tassel = new THREE.MeshLambertMaterial({ color: seal ? RARITY[seal].hex : d >= 6 ? 0xd02a2a : 0xb02a1a });
  const gem = new THREE.MeshPhongMaterial({ color: seal ? RARITY[seal].hex : 0xd02a2a, emissive: new THREE.Color(seal ? RARITY[seal].hex : 0x801010).multiplyScalar(0.5), shininess: 120 });
  const g = new THREE.Group();
  const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; g.add(m); return m; };
  const L = 1 + d * 0.035 + tier * 0.04;
  const grip = _wg('grip', () => { const c = new THREE.CylinderGeometry(0.032, 0.036, 0.26, 8); c.rotateX(Math.PI / 2); return c; });
  const pommel = _wg('pommel', () => new THREE.SphereGeometry(0.05, 8, 6));
  const tasselG = _wg('tassel', () => { const c = new THREE.ConeGeometry(0.05, 0.22, 7); return c; });
  if (type === 'sword') {            // Jian: düz, iki ağızlı, orta sırtlı
    const w = 0.05 + d * 0.002, len = 1.05 * L;
    add(_bladeGeo('sw' + d + tier, [[-w, 0], [-w * 0.92, len * 0.86], [0, len], [w * 0.92, len * 0.86], [w, 0]], 0.022, 0.012), steel, 0, 0, 0.1);
    add(_wg('swguard' + (d >= 4), () => { const gg = new THREE.BoxGeometry(d >= 4 ? 0.3 : 0.2, 0.05, 0.06); return gg; }), gold, 0, 0, 0.08);
    if (d >= 4) for (const sx of [-1, 1]) add(_wg('swwing', () => new THREE.ConeGeometry(0.03, 0.12, 6)), gold, sx * 0.17, 0, 0.12, Math.PI / 2, 0, 0);
    add(grip, wrap, 0, 0, -0.06); add(pommel, gold, 0, 0, -0.2);
    add(tasselG, tassel, 0, -0.12, -0.24, 0, 0, 0);
  } else if (type === 'blade') {     // Dao: tek ağızlı, kavisli
    const len = 0.98 * L, w = 0.075 + d * 0.003, pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([-w * 0.55 + Math.sin(t * 1.2) * 0.05, t * len]); }
    pts.push([w * 0.9 + 0.02, len * 0.96], [w * 1.05, len * 0.8]);
    for (let i = 8; i >= 0; i--) { const t = i / 8 * 0.8; pts.push([w * (0.7 + t * 0.4) + Math.sin(t * 1.2) * 0.05, t * len]); }
    add(_bladeGeo('bl' + d + tier, pts, 0.024, 0.01), steel, 0, 0, 0.1);
    add(_wg('blguard', () => new THREE.CylinderGeometry(0.09, 0.09, 0.03, 12)), gold, 0, 0, 0.08, Math.PI / 2, 0, 0);
    add(grip, wrap, 0, 0, -0.06);
    add(_wg('blring', () => new THREE.TorusGeometry(0.05, 0.012, 6, 12)), gold, 0, 0, -0.23, 0, Math.PI / 2, 0);
    if (d >= 4) add(tasselG, tassel, 0, -0.14, -0.27);
  } else if (type === 'spear' || type === 'glaive') {
    const shaftL = (type === 'spear' ? 2.6 : 2.4) * L;
    add(_wg('shaft' + Math.round(shaftL * 10), () => { const c = new THREE.CylinderGeometry(0.028, 0.034, shaftL, 8); c.rotateX(Math.PI / 2); return c; }), wood, 0, 0, shaftL / 2 - 0.7);
    for (let i = 0; i < 3; i++) add(_wg('band', () => { const c = new THREE.CylinderGeometry(0.038, 0.038, 0.05, 8); c.rotateX(Math.PI / 2); return c; }), gold, 0, 0, -0.55 + i * 0.9);
    const top = shaftL - 0.7;
    add(_wg('collar', () => { const c = new THREE.CylinderGeometry(0.03, 0.05, 0.14, 8); c.rotateX(Math.PI / 2); return c; }), gold, 0, 0, top + 0.05);
    if (type === 'spear') {
      const hl = 0.42 + d * 0.025, hw = 0.07 + d * 0.004;
      add(_bladeGeo('sp' + d, [[0, 0], [-hw, hl * 0.35], [-hw * 0.35, hl * 0.85], [0, hl], [hw * 0.35, hl * 0.85], [hw, hl * 0.35]], 0.03, 0.012), steel, 0, 0, top + 0.1);
      add(_wg('sptassel', () => { const c = new THREE.ConeGeometry(0.1, 0.32, 9, 1, true); c.rotateX(-Math.PI / 2); return c; }), tassel, 0, 0, top - 0.12);
      if (d >= 6) for (const sx of [-1, 1]) add(_bladeGeo('sphook', [[0, 0], [0.12, 0.05], [0.16, 0.16], [0.06, 0.07]], 0.02, 0.008), steel, 0, 0, top + 0.12, 0, 0, sx > 0 ? 0 : Math.PI);
    } else {                         // Guandao: hilal ağız + arka diken
      const bl = 0.7 + d * 0.035, bw = 0.2 + d * 0.012, pts = [[0, 0], [-0.05, 0.1]];
      for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([-0.05 - Math.sin(t * Math.PI * 0.9) * bw, 0.1 + t * bl]); }
      pts.push([0.04, bl + 0.05], [0.06, bl * 0.6], [0.12, bl * 0.45], [0.05, bl * 0.35], [0.05, 0.05]);
      add(_bladeGeo('gl' + d, pts, 0.03, 0.012), steel, 0, 0, top + 0.08);
      if (d >= 5) add(_wg('gldragon', () => new THREE.SphereGeometry(0.06, 8, 6)), gem, 0, 0.0, top + 0.12);
    }
  } else if (type === 'bow') {       // Kompozit yay: çift kavisli kollar
    const k = 0.75 * L, pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12 * 2 - 1; pts.push(new THREE.Vector3(-0.18 * (1 - t * t) + 0.06 * Math.pow(Math.abs(t), 6), 0, t * k)); }
    const tube = _wg('bowc' + d + tier, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.025 + d * 0.0015, 6, false));
    add(tube, d >= 4 ? _metal(new THREE.Color(metal).multiplyScalar(0.7), em, 40) : wood, 0, 0, 0);
    add(grip, wrap, -0.18, 0, 0);
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 2 * k * 0.995, 4), new THREE.MeshBasicMaterial({ color: 0xeeeeee }));
    str.rotation.x = Math.PI / 2; str.position.set(0.06, 0, 0); g.add(str);
    if (d >= 6) for (const sz of [-1, 1]) add(_wg('bowtip', () => new THREE.ConeGeometry(0.03, 0.12, 6)), gold, 0.06, 0, sz * k, sz > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0);
  }
  if (d >= 6 && type !== 'bow' && type !== 'spear' && type !== 'glaive') add(_wg('wgem', () => new THREE.OctahedronGeometry(0.035)), gem, 0, 0.03, 0.08);
  // +seviye parlaması: silahın etrafında katmanlı ışık
  if (glow) {
    const gm = new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
    const len = type === 'spear' || type === 'glaive' ? 2.6 * L : type === 'bow' ? 1.5 : 1.15 * L;
    const aura = new THREE.Mesh(new THREE.CylinderGeometry(0.06 + plus * 0.006, 0.06 + plus * 0.006, len, 8, 1, true), gm);
    aura.rotation.x = Math.PI / 2; aura.position.z = type === 'bow' ? 0 : len / 2 + (type === 'spear' || type === 'glaive' ? 0.3 : 0);

    g.add(aura); g.userData.glow = gm;
  }
  return g;
}

function shieldMesh(o = {}) {
  const d = o.d || 1, seal = o.rarity || 0, glow = PLUS_GLOW(o.plus || 0);
  const g = new THREE.Group();
  const em = glow ? new THREE.Color(glow).multiplyScalar(0.3) : seal ? new THREE.Color(RARITY[seal].hex).multiplyScalar(0.15) : null;
  const face = d >= 3 ? _metal(new THREE.Color(DEG_METAL[d - 1]).multiplyScalar(0.85), em, 50) : new THREE.MeshLambertMaterial({ color: 0x8a2a1c, emissive: em || 0x000000 });
  const r = 0.4 + d * 0.012 + (o.tier || 0) * 0.02;
  // kubbeli gövde
  const dome = new THREE.Mesh(_wg('shd' + Math.round(r * 100) + (d >= 5), () => { const sg = new THREE.SphereGeometry(r * 1.6, d >= 5 ? 6 : 18, 6, 0, Math.PI * 2, 0, 0.62); sg.rotateZ(Math.PI / 2); sg.translate(r * 1.6 * Math.cos(0.62), 0, 0); return sg; }), face);
  dome.scale.set(1, 1, 1); dome.position.set(-0.12, 0, 0.1); dome.castShadow = true; g.add(dome);
  const rimM = _metal(d >= 6 ? 0xffc83a : 0x6a5a4a, null, 60);
  const rim = new THREE.Mesh(_wg('shrim' + Math.round(r * 100), () => new THREE.TorusGeometry(r, 0.03, 6, 22)), rimM);
  rim.rotation.y = Math.PI / 2; rim.position.set(-0.12, 0, 0.1); g.add(rim);
  const boss = new THREE.Mesh(_wg('shboss', () => new THREE.SphereGeometry(1, 10, 8, 0, 6.283, 0, 1.4)), _metal(d >= 4 ? 0xffc83a : 0xd8a830, null, 80));
  boss.scale.setScalar(0.1 + d * 0.006); boss.rotation.z = Math.PI / 2; boss.position.set(-0.11 - r * 1.6 * (1 - Math.cos(0.62)), 0, 0.1); g.add(boss);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; const rv = new THREE.Mesh(_wg('rivet', () => new THREE.SphereGeometry(0.022, 6, 4)), rimM); rv.position.set(-0.16, Math.sin(a) * r * 0.85, 0.1 + Math.cos(a) * r * 0.85); g.add(rv); }
  if (d >= 7) for (const a of [0, 2.1, 4.2]) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), _metal(0xe8e8e8, null, 90)); sp.rotation.z = Math.PI / 2; sp.position.set(-0.22, Math.sin(a) * r * 0.55, 0.1 + Math.cos(a) * r * 0.55); g.add(sp); }
  return g;
}

// --- Zırh / avatar giydirme ---
// Ağır zırh: dereceye göre hafif renk almış çelik plakalar (parlak); hafif zırh: deri; kumaş: cübbe.
function armorMat(atype, d, tier = 0, seal = null, dark = false) {
  if (atype === 'armor') {
    const c = new THREE.Color(0xaab0ba).lerp(new THREE.Color(DEG_METAL[d - 1]), 0.18 + tier * 0.06 + d * 0.015);
    if (dark) c.multiplyScalar(0.7);
    return _metal(c, seal, 55);
  }
  const c = armorColor(atype, d, tier, dark);
  if (atype === 'protector') c.lerp(new THREE.Color(0x6a4428), 0.45);
  const m = new THREE.MeshLambertMaterial({ color: c }); if (seal) m.emissive = seal; return m;
}
// eq: ekipman (Inventory.equip), h: buildHumanoid sonucu
function dressHumanoid(h, eq) {
  for (const m of h.outfit || []) m.parent && m.parent.remove(m);
  h.outfit = [];
  const add = (parent, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); h.outfit.push(mesh); return mesh; };
  const B = slot => (eq[slot] ? { b: ITEM_BASES[eq[slot].base], it: eq[slot] } : null);
  const ch = B('chest'), lg = B('legs'), hd = B('head'), sh = B('shoulder'), hn = B('hands'), ft = B('feet');
  const avD = B('av_dress'), avH = B('av_hat'), avA = B('av_attach');
  const sealE = x => (x && x.it.rarity ? new THREE.Color(RARITY[x.it.rarity].hex).multiplyScalar(0.18) : null);
  const gold = _metal(0xd8a830, null, 70);
  const cyl = (rt, rb, hh, seg = 14, open = false) => new THREE.CylinderGeometry(rt, rb, hh, seg, 1, open);
  const sph = (r, a = 12, b = 8, t0 = 0, tl = Math.PI) => new THREE.SphereGeometry(r, a, b, 0, 6.283, t0, tl);

  // alttaki giysi renkleri
  let robe, robeDark;
  if (avD) { robe = new THREE.Color(avD.b.look.c1); robeDark = new THREE.Color(avD.b.look.c2); }
  else {
    robe = !ch ? new THREE.Color(0xb03a2e) : ch.b.atype === 'garment' ? armorColor('garment', ch.b.d, ch.b.tier) : ch.b.atype === 'armor' ? new THREE.Color(0x5a1a14) : new THREE.Color(0x6a4a30);
    robeDark = lg ? armorColor(lg.b.atype, lg.b.d, lg.b.tier, true) : ch ? robe.clone().multiplyScalar(0.55) : new THREE.Color(0x5a1d16);
    if (lg && lg.b.atype === 'protector') robeDark.lerp(new THREE.Color(0x4a3020), 0.5);
  }
  h.robe.color.copy(robe); h.robeDark.color.copy(robeDark);

  if (avD) {
    add(h.group, new THREE.Mesh(cyl(0.44, 0.76, 1.0, 14, true), _lm(avD.b.look.c1)), 0, 0.62, 0).material.side = THREE.DoubleSide;
    add(h.group, new THREE.Mesh(cyl(0.4, 0.4, 0.15), _lm(avD.b.look.c3 || 0xffd23a)), 0, 1.03, 0);
  } else if (ch) {
    const at = ch.b.atype, d = ch.b.d, M = armorMat(at, d, ch.b.tier, sealE(ch));
    if (at === 'armor') {
      add(h.group, new THREE.Mesh(cyl(0.4, 0.36, 0.62), M), 0, 1.5, 0);                                   // göğüs zırhı
      for (const y of [1.3, 1.5]) add(h.group, new THREE.Mesh(new THREE.TorusGeometry(0.39 + (y - 1.3) * 0.05, 0.014, 4, 18), armorMat(at, d, 0, null, true)), 0, y, 0).rotation.x = Math.PI / 2;
      add(h.group, new THREE.Mesh(new THREE.TorusGeometry(0.405, 0.02, 4, 18), d >= 4 ? gold : armorMat(at, d, 0, null, true)), 0, 1.79, 0).rotation.x = Math.PI / 2;
      for (let i = 0; i < 7; i++) {                                                                          // bel plakaları
        const a = (i / 7) * Math.PI * 2, p = add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.04), armorMat(at, d, ch.b.tier, null, true)), Math.sin(a) * 0.42, 0.9, Math.cos(a) * 0.42);
        p.rotation.y = a; p.rotation.x = 0.22;
      }
      if (d >= 6) add(h.group, new THREE.Mesh(sph(0.08, 10, 8), gold), 0, 1.55, 0.4);
    } else if (at === 'protector') {
      add(h.group, new THREE.Mesh(cyl(0.385, 0.35, 0.58), M), 0, 1.5, 0);
      const st = add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.05), _lm(0x2a1a0e)), 0, 1.48, 0.38); st.rotation.z = 0.62;
      for (let i = 0; i < 6; i++) add(h.group, new THREE.Mesh(sph(0.025, 6, 4), _metal(d >= 4 ? 0xd8a830 : 0xb0b4bc, null, 60)), -0.2 + i * 0.08, 1.2 + i * 0.1 * 0.62 * 1.4, 0.39);
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4, f = add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.035), armorMat(at, d, ch.b.tier, null, true)), Math.sin(a) * 0.42, 0.92, Math.cos(a) * 0.42); f.rotation.y = a; f.rotation.x = 0.16; }
    } else {
      add(h.group, new THREE.Mesh(cyl(0.44, 0.72, 0.92, 14, true), M), 0, 0.62, 0).material.side = THREE.DoubleSide;    // uzun cübbe
      for (const s of [-1, 1]) { const c = add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.03), _lm(robe.clone().multiplyScalar(0.55))), s * 0.09, 1.62, 0.36); c.rotation.z = s * 0.5; }
      add(h.group, new THREE.Mesh(cyl(0.375, 0.375, 0.13), _lm(d >= 4 ? 0xd8a830 : 0x2a1a10)), 0, 1.04, 0);
    }
  }
  // miğfer / avatar şapka
  if (h.hat) h.hat.visible = !(hd || avH);
  if (avH) {
    const k = avH.b.look.kind;
    if (k === 'crown') { add(h.group, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.2, 8, 1, true), _lm(0xffd23a, 0x3a2a00)), 0, 2.25, 0).material.side = THREE.DoubleSide; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), _lm(0xffd23a)), Math.sin(a) * 0.28, 2.42, Math.cos(a) * 0.28); } }
    else if (k === 'ears') for (const sx of [-1, 1]) add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 4), _lm(avH.b.look.c1)), sx * 0.17, 2.32, 0).rotation.z = -sx * 0.25;
    else { add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.5, 16), _lm(avH.b.look.c1)), 0, 2.42, 0); add(h.group, new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.1, 12), _lm(avH.b.look.c2 || 0xc0302a)), 0, 2.2, 0); }
  } else if (hd) {
    const at = hd.b.atype, d = hd.b.d, M = armorMat(at, d, hd.b.tier, sealE(hd));
    if (at === 'armor') {
      add(h.group, new THREE.Mesh(sph(0.3, 14, 10, 0, 1.25), M), 0, 2.04, -0.01);
      add(h.group, new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.022, 5, 18), d >= 4 ? gold : M), 0, 2.13, -0.01).rotation.x = Math.PI / 2;
      add(h.group, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.26, 12, 1, true, Math.PI * 0.55, Math.PI * 0.9), M), 0, 1.97, -0.02).material.side = THREE.DoubleSide;
      add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.05), M), 0, 2.08, 0.29);      // burun siperi
      const plume = add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.36, 8), _lm(d >= 6 ? 0xd8a830 : 0xb02a1a)), 0, 2.42, -0.05); plume.rotation.x = -0.3;
      if (d >= 8) for (const sx of [-1, 1]) add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.36, 6), _lm(0xe8e0d0)), sx * 0.27, 2.25, 0).rotation.z = -sx * 0.7;
    } else if (at === 'protector') {
      add(h.group, new THREE.Mesh(sph(0.3, 12, 8, 0, 1.45), M), 0, 2.03, -0.02);
      add(h.group, new THREE.Mesh(cyl(0.29, 0.29, 0.06), _lm(0x2a1a0e)), 0, 2.1, 0);
      if (d >= 4) add(h.group, new THREE.Mesh(sph(0.04, 6, 4), gold), 0, 2.13, 0.29);
    } else {
      add(h.group, new THREE.Mesh(cyl(0.22, 0.27, 0.26, 12), M), 0, 2.28, -0.02);
      add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.02), M), 0, 2.15, -0.27).rotation.x = 0.25;
      if (d >= 4) add(h.group, new THREE.Mesh(new THREE.OctahedronGeometry(0.05), _metal(0x4ad8ff, null, 100)), 0, 2.3, 0.26);
    }
  }
  // omuzluk
  if (sh && !avD) {
    const at = sh.b.atype, d = sh.b.d, M = armorMat(at, d, sh.b.tier, sealE(sh));
    for (const sx of [-1, 1]) {
      if (at === 'garment') { add(h.group, new THREE.Mesh(sph(0.2, 10, 6, 0, 1.4), M), sx * 0.46, 1.8, 0).scale.set(1.2, 0.6, 1); continue; }
      const p = add(h.group, new THREE.Mesh(sph(at === 'armor' ? 0.23 : 0.2, 12, 6, 0, 1.6), M), sx * 0.5, 1.82, 0); p.scale.set(1.05, 0.75, 1); p.rotation.z = -sx * 0.35;
      if (at === 'armor') { const p2 = add(h.group, new THREE.Mesh(sph(0.21, 12, 6, 0, 1.5), M), sx * 0.56, 1.7, 0); p2.scale.set(1, 0.6, 0.95); p2.rotation.z = -sx * 0.55; }
      if (d >= 7 && at === 'armor') add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 6), _metal(0xe8e8e8, null, 90)), sx * 0.58, 2.0, 0).rotation.z = -sx * 0.4;
    }
  }
  // eldiven ve kolluk (kolun ucunda)
  if (hn) {
    const M = armorMat(hn.b.atype, hn.b.d, hn.b.tier, sealE(hn), hn.b.atype !== 'armor');
    for (const arm of [h.armL, h.armR]) { add(arm, new THREE.Mesh(cyl(0.12, 0.13, 0.28, 10), M), 0, -0.6, 0); add(arm, new THREE.Mesh(sph(0.1, 8, 6), M), 0, -0.78, 0.01).scale.set(1, 1.1, 1.1); }
  }
  // dizlik / baldırlık
  if (lg && lg.b.atype !== 'garment') {
    const M = armorMat(lg.b.atype, lg.b.d, lg.b.tier, sealE(lg));
    for (const leg of [h.legL, h.legR]) { add(leg, new THREE.Mesh(cyl(0.13, 0.115, 0.3, 10), M), 0, -0.56, 0.01); if (lg.b.atype === 'armor') add(leg, new THREE.Mesh(sph(0.085, 8, 6), M), 0, -0.42, 0.1); }
  }
  // çizme
  if (ft) {
    const M = armorMat(ft.b.atype, ft.b.d, ft.b.tier, sealE(ft), ft.b.atype !== 'armor');
    for (const leg of [h.legL, h.legR]) { add(leg, new THREE.Mesh(cyl(0.13, 0.13, 0.2, 10), M), 0, -0.66, 0); add(leg, new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.34), M), 0, -0.77, 0.06); }
  }
  // sırt süsü (avatar)
  if (avA) {
    const k = avA.b.look.kind;
    if (k === 'wings') for (const sx of [-1, 1]) { const w = add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 1.2), new THREE.MeshLambertMaterial({ color: avA.b.look.c1, emissive: new THREE.Color(avA.b.look.c1).multiplyScalar(0.35), transparent: true, opacity: 0.85 })), sx * 0.45, 1.75, -0.45); w.rotation.y = sx * 0.6; w.rotation.z = sx * 0.3; }
    else if (k === 'flag') { add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 0.05), _lm(0x5a3a1a)), 0, 2.0, -0.45); add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.8, 0.6), _lm(avA.b.look.c1)), 0, 2.7, -0.75); }
    else add(h.group, new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 24), new THREE.MeshBasicMaterial({ color: avA.b.look.c1, transparent: true, opacity: 0.8 })), 0, 1.4, -0.5);
  }
}

// --- Yerdeki eşya modelleri ---
// Ganimetin kendisi görünür: silah, kalkan, zırh parçası, takı, şişe, kristal, parşömen, kese.
const _dropGeo = {};
const _dg = (k, f) => _dropGeo[k] || (_dropGeo[k] = f());
function _bottleGeo() {
  return _dg('bottle', () => {
    const pts = [[0, 0], [0.2, 0], [0.26, 0.08], [0.27, 0.22], [0.22, 0.34], [0.09, 0.42], [0.08, 0.56], [0.11, 0.6], [0, 0.6]].map(p => new THREE.Vector2(p[0], p[1]));
    return new THREE.LatheGeometry(pts, 12);
  });
}
function dropModel(it) {
  const b = ITEM_BASES[it.base], g = new THREE.Group();
  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const sealE = it.rarity ? new THREE.Color(RARITY[it.rarity].hex).multiplyScalar(0.25) : null;
  if (b.cat === 'weapon') {
    const w = weaponMesh(b.wtype, { d: b.d, tier: b.tier, plus: it.plus || 0, rarity: it.rarity || 0 });
    const long = b.wtype === 'spear' || b.wtype === 'glaive';
    w.rotation.set(b.wtype === 'bow' ? 0 : -Math.PI / 2, 0, 0.5);
    w.position.y = long ? -0.9 : -0.45;
    w.scale.setScalar(long ? 0.75 : 1.05);
    g.add(w); g.userData.spinY = true;
  } else if (b.cat === 'shield') {
    const s = shieldMesh({ d: b.d, tier: b.tier, plus: it.plus || 0, rarity: it.rarity || 0 });
    s.rotation.z = Math.PI / 2; s.scale.setScalar(1.3); g.add(s);
  } else if (b.cat === 'armor') {
    const c = b.atype === 'armor' ? new THREE.Color(DEG_METAL[b.d - 1]) : armorColor(b.atype, b.d, b.tier);
    const m = _lm(c, sealE), dk = _lm(c.clone().multiplyScalar(0.6)), trim = _lm(b.d >= 6 ? 0xffd23a : 0x8a6a3a);
    if (b.slot === 'head') { add(new THREE.SphereGeometry(0.32, 12, 8, 0, 6.283, 0, b.atype === 'garment' ? 1.2 : 1.75), m); if (b.atype === 'armor' && b.d >= 3) add(new THREE.BoxGeometry(0.07, 0.2, 0.5), trim, 0, 0.32, 0); }
    else if (b.slot === 'shoulder') for (const sx of [-1, 1]) { const p = add(new THREE.SphereGeometry(0.22, 10, 6, 0, 6.283, 0, 1.6), m, sx * 0.24, 0, 0); p.scale.set(1.1, 0.8, 1); }
    else if (b.slot === 'chest') { add(new THREE.CylinderGeometry(0.32, 0.38, 0.55, 10), m); add(new THREE.CylinderGeometry(0.39, 0.39, 0.08, 10), trim, 0, -0.22, 0); if (b.atype !== 'garment') add(new THREE.BoxGeometry(0.4, 0.3, 0.1), dk, 0, 0.05, 0.33); }
    else if (b.slot === 'hands') for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(0.18, 0.24, 0.16), m, sx * 0.14, 0, 0); add(new THREE.BoxGeometry(0.2, 0.06, 0.18), trim, sx * 0.14, -0.1, 0); }
    else if (b.slot === 'legs') for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.2, 0.55, 0.2), m, sx * 0.13, 0, 0).rotation.z = sx * 0.06;
    else if (b.slot === 'feet') for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(0.18, 0.28, 0.2), m, sx * 0.14, 0, 0); add(new THREE.BoxGeometry(0.18, 0.1, 0.34), dk, sx * 0.14, -0.12, 0.08); }
  } else if (b.cat === 'acc') {
    const gold = _lm(b.d >= 5 ? 0xffd23a : 0xc8c8d0, sealE), gem = new THREE.MeshLambertMaterial({ color: it.rarity ? RARITY[it.rarity].hex : 0xd02a4a, emissive: new THREE.Color(it.rarity ? RARITY[it.rarity].hex : 0xd02a4a).multiplyScalar(0.5) });
    if (b.slot === 'ring') { add(new THREE.TorusGeometry(0.2, 0.05, 6, 16), gold); add(new THREE.OctahedronGeometry(0.09), gem, 0, 0.24, 0); }
    else if (b.slot === 'necklace') { add(new THREE.TorusGeometry(0.3, 0.03, 6, 20), gold).rotation.x = 1.2; add(new THREE.OctahedronGeometry(0.11), gem, 0, -0.12, 0.28); }
    else { for (const sx of [-1, 1]) { add(new THREE.TorusGeometry(0.08, 0.025, 5, 10), gold, sx * 0.15, 0.1, 0); add(new THREE.OctahedronGeometry(0.07), gem, sx * 0.15, -0.06, 0); } }
  } else {
    const use = b.use, cat = b.cat, base = it.base;
    const glassM = (c) => new THREE.MeshLambertMaterial({ color: c, emissive: new THREE.Color(c).multiplyScalar(0.35), transparent: true, opacity: 0.9 });
    if (use === 'hp' || use === 'mp' || use === 'petpot' || /^elx_/.test(base) || base === 'zerk') {
      const c = use === 'hp' ? 0xe0302a : use === 'mp' ? 0x2a6ae0 : base === 'elx_w' ? 0xff6a2a : base === 'elx_a' ? 0x4ac8ff : base === 'elx_s' ? 0x6ae07a : base === 'elx_c' ? 0xc06aff : base === 'zerk' ? 0xff3a1a : 0xc8902a;
      const bt = add(_bottleGeo(), glassM(c), 0, -0.3, 0); bt.scale.setScalar(1.1);
      add(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), _lm(0x8a5a2a), 0, 0.38, 0);
    } else if (cat === 'mat') {
      const c = base === 'luck' ? 0xffe066 : base === 'astral' ? 0x5ab4ff : base === 'immortal' ? 0xff8ae8 : /^ms_/.test(base) ? 0x7aa8ff : 0x7ae8ff;
      const cm = new THREE.MeshLambertMaterial({ color: c, emissive: new THREE.Color(c).multiplyScalar(0.45), transparent: true, opacity: 0.92 });
      if (base === 'luck') { add(new THREE.SphereGeometry(0.22, 8, 6), _lm(0xd8c49a)); add(new THREE.ConeGeometry(0.12, 0.2, 6), cm, 0, 0.22, 0); }
      else { add(new THREE.OctahedronGeometry(0.28), cm).scale.set(0.8, 1.3, 0.8); add(new THREE.OctahedronGeometry(0.14), cm, 0.22, -0.12, 0.05); }
    } else if (use === 'return' || use === 'reverse' || use === 'speed' || /^reset|bless/.test(base)) {
      add(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 10), _lm(0xe8dcc0)).rotation.z = Math.PI / 2;
      for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), _lm(use === 'reverse' ? 0x6a5aff : use === 'speed' ? 0x3ab45a : 0xc0302a), sx * 0.28, 0, 0).rotation.z = Math.PI / 2;
    } else if (use === 'cure') { for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.1, 8, 6), _lm([0xffffff, 0x8ad8ff, 0xffd23a][i]), (i - 1) * 0.16, 0, 0).scale.set(1.4, 0.8, 0.8); }
    else if (base === 'arrow') { for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.03, 0.03, 0.7), _lm(0xc8a878), (i - 2) * 0.05, 0, 0).rotation.y = (i - 2) * 0.08; }
    else if (base === 'silkbag' || base === 'sg' || cat === 'quest') {
      add(new THREE.SphereGeometry(0.25, 10, 8), _lm(base === 'silkbag' ? 0xd04aa8 : cat === 'quest' ? 0xc8a060 : 0x6a4a2a)).scale.set(1, 0.9, 1);
      add(new THREE.CylinderGeometry(0.08, 0.12, 0.12, 8), _lm(0xd9a92e), 0, 0.24, 0);
    } else {   // kartlar ve diğerleri: altın çerçeveli tablet
      add(new THREE.BoxGeometry(0.42, 0.56, 0.06), _lm(b.cat === 'use' && b.keep ? 0x8a5a2a : 0x9a3a8a));
      add(new THREE.BoxGeometry(0.46, 0.6, 0.04), _lm(0xd9a92e), 0, 0, -0.02);
    }
  }
  return g;
}
// Altın: miktara göre sikke yığını ya da kese
function goldModel(amount) {
  const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: 0xffd23a, emissive: 0x6a4a00 });
  const coin = _dg('coin', () => new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12));
  const n = amount < 50 ? 2 : amount < 300 ? 4 : amount < 1500 ? 6 : 0;
  if (n) for (let i = 0; i < n; i++) { const c = new THREE.Mesh(coin, mat); c.position.set((i % 2) * 0.12 - 0.06 + Math.sin(i) * 0.05, -0.15 + i * 0.055, Math.cos(i * 2) * 0.06); c.rotation.set(Math.sin(i) * 0.3, 0, Math.cos(i) * 0.3); c.castShadow = true; g.add(c); }
  else {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshLambertMaterial({ color: 0x8a5a2a })); bag.scale.set(1, 0.9, 1); bag.castShadow = true; g.add(bag);
    const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.14, 8), mat); tie.position.y = 0.28; g.add(tie);
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(coin, mat); c.position.set(-0.3 + i * 0.2, -0.22, 0.3); c.rotation.x = 0.4; g.add(c); }
  }
  return g;
}
