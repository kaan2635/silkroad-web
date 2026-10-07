// Görünüm: eşyanın derecesi, kademesi, mührü ve +seviyesi karakterin üzerinde görünür.
// Silah: dereceye göre metal rengi, boy ve süsler; +4'ten itibaren parlama (Silkroad'daki gibi).
// Zırh: parça parça (miğfer, omuzluk, göğüs, eldiven, dizlik, çizme) tür ve dereceye göre şekil/renk.
// Avatar (Item Mall): giysi, şapka ve sırt süsü zırhın görünümünü örter.

const DEG_METAL = [0x9a8264, 0xa8a070, 0xa8b0b8, 0xdde4ea, 0x4ed8a0, 0xe8a030, 0xff6a3a, 0x6a9aff, 0xc8a8ff, 0xffe680];
const DEG_HUE = [0.58, 0.0, 0.33, 0.08, 0.45, 0.07, 0.97, 0.62, 0.76, 0.13];
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
// o: { d, tier, plus, rarity }
function weaponMesh(type, o = {}) {
  const d = o.d || 1, tier = o.tier || 0, plus = o.plus || 0, seal = o.rarity || 0;
  const metal = DEG_METAL[d - 1];
  const glow = PLUS_GLOW(plus);
  const steel = new THREE.MeshLambertMaterial({ color: metal });
  if (seal) steel.emissive = new THREE.Color(RARITY[seal].hex).multiplyScalar(0.18);
  if (glow) steel.emissive = new THREE.Color(glow).multiplyScalar(0.35);
  const gold = _lm(d >= 6 ? 0xffd23a : 0xc8902a), wood = _lm(d >= 5 ? 0x3a1a10 : 0x6a4a2a), gem = _lm(seal ? RARITY[seal].hex : 0xd02a2a, 0x401010);
  const g = new THREE.Group();
  const box = (w, h, dd, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
  const L = 1 + d * 0.035 + tier * 0.04;
  if (type === 'sword') {
    box(0.06, 0.06, 1.15 * L, steel, 0, 0, 0.55 * L);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 4), steel); tip.rotation.x = Math.PI / 2; tip.position.z = 1.15 * L + 0.05; g.add(tip);
    box(d >= 4 ? 0.36 : 0.24, 0.05, 0.08, gold, 0, 0, 0);
    if (d >= 4) { box(0.06, 0.12, 0.06, gold, 0.17, 0.04, 0.02); box(0.06, 0.12, 0.06, gold, -0.17, 0.04, 0.02); }
  } else if (type === 'blade') {
    const w = 0.14 + d * 0.006;
    box(0.05, w, 1.05 * L, steel, 0, 0.04, 0.5 * L);
    box(0.05, w * 0.7, 0.25, steel, 0, w * 0.45, 1.0 * L).rotation.x = 0.35;
    box(d >= 4 ? 0.34 : 0.26, 0.06, 0.08, gold, 0, 0, 0);
    if (d >= 7) box(0.03, 0.05, 0.9 * L, gold, 0, w * 0.5 + 0.04, 0.5 * L);
  } else if (type === 'spear') {
    box(0.06, 0.06, 2.6 * L, wood, 0, 0, 0.6);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09 + d * 0.006, 0.45 + d * 0.03, 6), steel); tip.rotation.x = Math.PI / 2; tip.position.set(0, 0, 0.6 + 1.3 * L + 0.25); g.add(tip);
    box(0.16, 0.16, 0.08, _lm(d >= 5 ? 0xffd23a : 0xc0302a), 0, 0, 0.6 + 1.3 * L - 0.1);
    if (d >= 6) { const s = box(0.04, 0.3, 0.12, steel, 0, 0.12, 0.6 + 1.3 * L); s.rotation.x = 0.4; }
  } else if (type === 'glaive') {
    box(0.06, 0.06, 2.4 * L, wood, 0, 0, 0.5);
    box(0.06, 0.34 + d * 0.02, 0.75 + d * 0.03, steel, 0, 0.12, 0.5 + 1.2 * L + 0.15);
    if (d >= 5) box(0.07, 0.07, 0.2, gold, 0, 0, 0.5 + 1.2 * L - 0.25);
  } else if (type === 'bow') {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.75 * L, 0.04 + d * 0.003, 6, 16, Math.PI), d >= 4 ? steel : wood);
    arc.rotation.y = Math.PI / 2; arc.rotation.z = Math.PI / 2; arc.position.set(0, 0, 0.1); g.add(arc);
    box(0.01, 0.01, 1.5 * L, new THREE.MeshBasicMaterial({ color: 0xeeeeee }), 0, 0, 0.1).rotation.x = Math.PI / 2;
    if (d >= 6) for (const sz of [-1, 1]) box(0.05, 0.05, 0.2, gold, 0, sz * 0.72 * L, 0.1);
  }
  if (d >= 6 && type !== 'bow') { const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), gem); p.position.set(0, 0, -0.12); g.add(p); }
  // +seviye parlaması: silahın etrafında katmanlı ışık
  if (glow) {
    const gm = new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
    const len = type === 'spear' || type === 'glaive' ? 2.6 * L : type === 'bow' ? 1.5 : 1.15 * L;
    const aura = new THREE.Mesh(new THREE.CylinderGeometry(0.12 + plus * 0.01, 0.12 + plus * 0.01, len, 8, 1, true), gm);
    aura.rotation.x = Math.PI / 2; aura.position.z = type === 'bow' ? 0.1 : len / 2 + (type === 'spear' || type === 'glaive' ? 0.3 : 0);
    if (type === 'bow') aura.rotation.set(0, 0, 0);
    g.add(aura); g.userData.glow = gm;
  }
  return g;
}

function shieldMesh(o = {}) {
  const d = o.d || 1, seal = o.rarity || 0, glow = PLUS_GLOW(o.plus || 0);
  const g = new THREE.Group();
  const face = _lm(d >= 3 ? DEG_METAL[d - 1] : 0x8a2a1c, glow ? new THREE.Color(glow).multiplyScalar(0.3) : seal ? new THREE.Color(RARITY[seal].hex).multiplyScalar(0.15) : null);
  const r = 0.4 + d * 0.012 + (o.tier || 0) * 0.02;
  const s = new THREE.Mesh(d >= 5 ? new THREE.CylinderGeometry(r, r * 0.85, 0.08, 6) : new THREE.CylinderGeometry(r, r, 0.08, 14), face);
  s.rotation.z = Math.PI / 2; s.position.set(-0.12, 0, 0.1); s.castShadow = true; g.add(s);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 18), _lm(d >= 6 ? 0xffd23a : 0x6a5a4a));
  rim.rotation.y = Math.PI / 2; rim.position.set(-0.16, 0, 0.1); g.add(rim);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.1 + d * 0.006, 8, 6), _lm(d >= 4 ? 0xffd23a : 0xd8a830));
  boss.position.set(-0.18, 0, 0.1); g.add(boss);
  if (d >= 7) for (const a of [0, 2.1, 4.2]) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), _lm(0xe8e8e8)); sp.rotation.z = Math.PI / 2; sp.position.set(-0.2, Math.sin(a) * r * 0.6, 0.1 + Math.cos(a) * r * 0.6); g.add(sp); }
  return g;
}

// --- Zırh / avatar giydirme ---
// eq: ekipman (Inventory.equip), h: buildHumanoid sonucu
function dressHumanoid(h, eq) {
  for (const m of h.outfit || []) m.parent && m.parent.remove(m);
  h.outfit = [];
  const add = (parent, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); h.outfit.push(mesh); return mesh; };
  const B = slot => (eq[slot] ? { b: ITEM_BASES[eq[slot].base], it: eq[slot] } : null);
  const ch = B('chest'), lg = B('legs'), hd = B('head'), sh = B('shoulder'), hn = B('hands'), ft = B('feet');
  const avD = B('av_dress'), avH = B('av_hat'), avA = B('av_attach');

  // gövde ve bacak renkleri
  let robe, robeDark;
  if (avD) { robe = new THREE.Color(avD.b.look.c1); robeDark = new THREE.Color(avD.b.look.c2); }
  else {
    robe = ch ? armorColor(ch.b.atype, ch.b.d, ch.b.tier) : new THREE.Color(0xb03a2e);
    robeDark = lg ? armorColor(lg.b.atype, lg.b.d, lg.b.tier, true) : ch ? armorColor(ch.b.atype, ch.b.d, 0, true) : new THREE.Color(0x5a1d16);
  }
  h.robe.color.copy(robe); h.robeDark.color.copy(robeDark);
  const sealE = x => (x && x.it.rarity ? new THREE.Color(RARITY[x.it.rarity].hex).multiplyScalar(0.18) : null);

  if (avD) {
    // avatar giysisi: uzun cübbe + kuşak
    add(h.group, new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.78, 1.0, 12, 1, true), _lm(avD.b.look.c1)), 0, 0.72, 0).material.side = THREE.DoubleSide;
    add(h.group, new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.16, 12), _lm(avD.b.look.c3 || 0xffd23a)), 0, 1.02, 0);
  } else if (ch) {
    const at = ch.b.atype, d = ch.b.d;
    if (at === 'garment') add(h.group, new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.72, 0.85, 12, 1, true), _lm(robe, sealE(ch))), 0, 0.68, 0).material.side = THREE.DoubleSide;
    if (at === 'armor') {
      add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.16), _lm(DEG_METAL[d - 1], sealE(ch))), 0, 1.38, 0.36);
      if (d >= 4) add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.18), _lm(0xffd23a)), 0, 1.66, 0.37);
      add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.9), _lm(robe)), 0, 0.82, 0);
    }
    if (at === 'protector') { const st = add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.1), _lm(0x3a2010)), 0, 1.3, 0.42); st.rotation.z = 0.6; if (d >= 4) add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.06), _lm(DEG_METAL[d - 1])), 0, 1.38, 0.46); }
  }
  // miğfer / avatar şapka
  if (h.hat) h.hat.visible = !(hd || avH);
  if (avH) {
    const k = avH.b.look.kind;
    if (k === 'crown') { add(h.group, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.2, 8, 1, true), _lm(0xffd23a, 0x3a2a00)), 0, 2.25, 0).material.side = THREE.DoubleSide; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), _lm(0xffd23a)), Math.sin(a) * 0.28, 2.42, Math.cos(a) * 0.28); } }
    else if (k === 'ears') for (const sx of [-1, 1]) add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 4), _lm(avH.b.look.c1)), sx * 0.17, 2.32, 0).rotation.z = -sx * 0.25;
    else { add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.5, 16), _lm(avH.b.look.c1)), 0, 2.42, 0); add(h.group, new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.1, 12), _lm(avH.b.look.c2 || 0xc0302a)), 0, 2.2, 0); }
  } else if (hd) {
    const at = hd.b.atype, d = hd.b.d, c = armorColor(at, d, hd.b.tier);
    if (at === 'garment') { add(h.group, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 12), _lm(c, sealE(hd))), 0, 2.16, 0); if (d >= 4) add(h.group, new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), _lm(0xffd23a)), 0, 2.2, 0.3); }
    else if (at === 'protector') { const m = add(h.group, new THREE.Mesh(new THREE.SphereGeometry(0.31, 12, 8, 0, 6.283, 0, 1.7), _lm(c, sealE(hd))), 0, 2.03, 0); m.scale.set(1, 1.05, 1.05); }
    else {
      add(h.group, new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8, 0, 6.283, 0, 1.75), _lm(DEG_METAL[d - 1], sealE(hd))), 0, 2.02, 0);
      if (d >= 3) add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.5), _lm(d >= 6 ? 0xffd23a : 0xc0302a)), 0, 2.36, -0.02);
      if (d >= 8) for (const sx of [-1, 1]) add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.4, 6), _lm(0xe8e0d0)), sx * 0.28, 2.32, 0).rotation.z = -sx * 0.6;
    }
  }
  // omuzluk
  if (sh && !avD) {
    const at = sh.b.atype, d = sh.b.d, c = at === 'armor' ? DEG_METAL[d - 1] : armorColor(at, d, sh.b.tier);
    const r = (at === 'armor' ? 0.26 : at === 'protector' ? 0.22 : 0.18) + d * 0.008;
    for (const sx of [-1, 1]) {
      const p = add(h.group, new THREE.Mesh(new THREE.SphereGeometry(r, 10, 6, 0, 6.283, 0, 1.6), _lm(c, sealE(sh))), sx * 0.6, 1.7, 0);
      p.scale.set(1.1, 0.8, 1);
      if (d >= 7 && at === 'armor') add(h.group, new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 5), _lm(0xe8e0d0)), sx * 0.66, 1.98, 0);
    }
  }
  // eldiven (kolun ucunda)
  if (hn) { const c = hn.b.atype === 'armor' ? DEG_METAL[hn.b.d - 1] : armorColor(hn.b.atype, hn.b.d, hn.b.tier, true); for (const arm of [h.armL, h.armR]) add(arm, new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.26, 0.25), _lm(c, sealE(hn))), 0, -0.68, 0); }
  // çizme
  if (ft) { const c = ft.b.atype === 'armor' ? DEG_METAL[ft.b.d - 1] : armorColor(ft.b.atype, ft.b.d, ft.b.tier, true); for (const leg of [h.legL, h.legR]) add(leg, new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.3, 0.42), _lm(c, sealE(ft))), 0, -0.7, 0.05); }
  // sırt süsü (avatar)
  if (avA) {
    const k = avA.b.look.kind;
    if (k === 'wings') for (const sx of [-1, 1]) { const w = add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 1.2), new THREE.MeshLambertMaterial({ color: avA.b.look.c1, emissive: new THREE.Color(avA.b.look.c1).multiplyScalar(0.35), transparent: true, opacity: 0.85 })), sx * 0.45, 1.75, -0.45); w.rotation.y = sx * 0.6; w.rotation.z = sx * 0.3; }
    else if (k === 'flag') { add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 0.05), _lm(0x5a3a1a)), 0, 2.0, -0.45); add(h.group, new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.8, 0.6), _lm(avA.b.look.c1)), 0, 2.7, -0.75); }
    else add(h.group, new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 24), new THREE.MeshBasicMaterial({ color: avA.b.look.c1, transparent: true, opacity: 0.8 })), 0, 1.4, -0.5);
  }
}
