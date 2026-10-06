// Oyuncu karakteri: model, hareket (tıkla-yürü + WASD + joystick), çarpışma, STR/INT statları,
// türetilmiş değerler (saldırı/savunma), güçlendirmeler, durum etkileri, berserk.

function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function makeLabel(name, sub, nameColor = '#ffe9a8', subColor = '#bfe3ff') {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 80;
  const x = c.getContext('2d');
  x.textAlign = 'center';
  x.lineJoin = 'round';
  x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,.85)';
  x.font = 'bold 30px "Trebuchet MS", sans-serif';
  x.fillStyle = nameColor;
  x.strokeText(name, 128, 34); x.fillText(name, 128, 34);
  x.font = '20px "Trebuchet MS", sans-serif';
  x.fillStyle = subColor;
  x.strokeText(sub, 128, 64); x.fillText(sub, 128, 64);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false }));
  sp.scale.set(5, 1.56, 1);
  return sp;
}

// Silah görselleri (sağ kola takılır). Ortak geometriler.
const WEAPON_GEO = {};
function weaponMesh(type) {
  const steel = new THREE.MeshLambertMaterial({ color: 0xc9d2d8 }), gold = new THREE.MeshLambertMaterial({ color: 0xd8a830 }), wood = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
  const g = new THREE.Group();
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
  if (type === 'sword') { box(0.06, 0.06, 1.15, steel, 0, 0, 0.55); box(0.24, 0.05, 0.08, gold, 0, 0, 0); }
  else if (type === 'blade') { box(0.05, 0.16, 1.05, steel, 0, 0.05, 0.5); box(0.26, 0.06, 0.08, gold, 0, 0, 0); }
  else if (type === 'spear') { box(0.06, 0.06, 2.6, wood, 0, 0, 0.6); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 6), steel); tip.rotation.x = Math.PI / 2; tip.position.set(0, 0, 2.1); g.add(tip); box(0.14, 0.14, 0.06, new THREE.MeshLambertMaterial({ color: 0xc0302a }), 0, 0, 1.8); }
  else if (type === 'glaive') { box(0.06, 0.06, 2.4, wood, 0, 0, 0.5); box(0.06, 0.34, 0.75, steel, 0, 0.12, 1.85); }
  else if (type === 'bow') {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 6, 16, Math.PI), wood);
    arc.rotation.y = Math.PI / 2; arc.rotation.z = Math.PI / 2; arc.position.set(0, 0, 0.1); g.add(arc);
    box(0.01, 0.01, 1.5, new THREE.MeshBasicMaterial({ color: 0xeeeeee }), 0, 0, 0.1).rotation.x = Math.PI / 2;
  }
  return g;
}

// İnsansı model: oyuncu, NPC ve haydutlar için ortak
// o: { robe, robeDark, skin, hat: 'straw' | 'band' | null, weapon }
function buildHumanoid(o) {
  const g = new THREE.Group();
  const robe = new THREE.MeshLambertMaterial({ color: o.robe });
  const robeDark = new THREE.MeshLambertMaterial({ color: o.robeDark });
  const skin = new THREE.MeshLambertMaterial({ color: o.skin || 0xe8b98a });
  const add = (parent, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh; };

  const body = add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.52, 0.95, 10), robe), 0, 1.28, 0);       // gövde
  add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.14, 10), robeDark), 0, 1.0, 0);   // kemer
  add(g, new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), skin), 0, 2.0, 0);                  // kafa
  let hat = null;
  if (o.hat === 'straw') hat = add(g, new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.42, 14), new THREE.MeshLambertMaterial({ color: 0xd8b66a })), 0, 2.4, 0);
  if (o.hat === 'band') hat = add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.1, 12), new THREE.MeshLambertMaterial({ color: 0xc0302a })), 0, 2.1, 0);

  const limb = (w, h, d, mat, x, y) => {
    const pivot = new THREE.Group(); pivot.position.set(x, y, 0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.y = -h / 2; m.castShadow = true; pivot.add(m);
    g.add(pivot);
    return pivot;
  };
  const legL = limb(0.28, 0.82, 0.3, robeDark, -0.2, 0.82);
  const legR = limb(0.28, 0.82, 0.3, robeDark, 0.2, 0.82);
  const armL = limb(0.2, 0.78, 0.2, robe, -0.6, 1.66);
  const armR = limb(0.2, 0.78, 0.2, robe, 0.6, 1.66);

  const hand = new THREE.Group(); hand.position.set(0, -0.78, 0); armR.add(hand);
  const handL = new THREE.Group(); handL.position.set(0, -0.72, 0.05); armL.add(handL);
  const h = { group: g, legL, legR, armL, armR, hand, handL, robe, robeDark, body, hat, weapon: null, shield: null };
  h.setWeapon = type => {
    if (h.weapon) { hand.remove(h.weapon); h.weapon = null; }
    if (type) { h.weapon = weaponMesh(type); hand.add(h.weapon); if (type === 'bow') { h.weapon.rotation.x = -Math.PI / 2; h.weapon.position.z = 0.1; } }
  };
  h.setShield = on => {
    if (h.shield) { handL.remove(h.shield); h.shield = null; }
    if (on) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 14), new THREE.MeshLambertMaterial({ color: 0x8a2a1c }));
      s.rotation.z = Math.PI / 2; s.position.set(-0.12, 0, 0.1); s.castShadow = true;
      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshLambertMaterial({ color: 0xd8a830 }));
      boss.position.set(-0.17, 0, 0.1);
      h.shield = new THREE.Group(); h.shield.add(s, boss); handL.add(h.shield);
    }
  };
  h.setWeapon(o.weapon === undefined ? 'sword' : o.weapon);
  return h;
}

const ARMOR_LOOK = {        // zırh türüne göre giysi rengi
  none: [0xb03a2e, 0x5a1d16], garment: [0x2e6aa8, 0x1c3f68], protector: [0x8a5a2e, 0x4a2e16], armor: [0x8a8f98, 0x4a4e56]
};

class Player {
  constructor(world, name) {
    this.world = world;
    this.name = name;
    this.group = new THREE.Group();   // konum + yön
    this.heading = 0;
    this.target = null;               // {x, z} — yürünecek hedef
    this.walkPhase = 0;
    this.walkBlend = 0;
    this.stuckT = 0;
    this.moving = false;
    this.manualMove = false;          // WASD / joystick basılı mı

    // Savaş durumu (Combat sınıfı yönetir)
    this.dead = false;
    this.attackCd = 0;
    this.swingT = 0;
    this.swingKind = 'slash';
    this.combatT = 0;
    this.buffs = {};                  // id -> { t, max, icon, name, st: {stat: değer} }
    this.imbue = null;                // { elem, val, t, max, status, chance, sdur, icon }
    this.absorb = null;               // { amt, t }
    this.status = {};                 // burn/poison/slow/stun/freeze -> { t, dps }
    this.zerkT = 0;
    this.speedScrollT = 0;

    this.stats = { level: 1, hp: 150, maxHp: 150, mp: 120, maxMp: 120, exp: 0, maxExp: 120, gold: 0,
      str: 20, int: 20, statPts: 0, zerk: 0, STR: 20, INT: 20 };
    this.d = {};                       // türetilmiş değerler
    this.inv = new Inventory(this);
    this.book = new SkillBook(this);

    const h = buildHumanoid({ robe: 0xb03a2e, robeDark: 0x5a1d16, hat: 'straw', weapon: null });
    this.h = h;
    this.model = h.group;
    this.legL = h.legL; this.legR = h.legR; this.armL = h.armL; this.armR = h.armR;
    this.group.add(this.model);

    // Kalkan / aura görselleri
    this.shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.22, depthWrite: false }));
    this.shieldMesh.position.y = 1.3;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);
    this.aura = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    this.aura.rotation.x = -Math.PI / 2; this.aura.position.y = 0.12; this.aura.visible = false;
    this.group.add(this.aura);
    this.zerkAura = new THREE.PointLight(0xff3a1a, 0, 7);
    this.zerkAura.position.y = 1.5;
    this.group.add(this.zerkAura);

    this.setName(name);
    this.recalc();
    this.onGearChange = () => this.refreshLook();
    world.scene.add(this.group);
  }

  get pos() { return this.group.position; }

  setName(name) {
    this.name = name;
    if (this.label) { this.group.remove(this.label); this.label.material.map.dispose(); this.label.material.dispose(); }
    this.label = makeLabel(name, 'Sv. ' + this.stats.level);
    this.label.position.y = 3.3;
    this.group.add(this.label);
  }

  // Ekipmana göre görünüm: silah, kalkan, giysi rengi
  refreshLook() {
    const eq = this.inv.equip;
    this.h.setWeapon(this.inv.weaponType());
    this.h.setShield(!!eq.shield);
    const ch = eq.chest && ITEM_BASES[eq.chest.base];
    const look = ARMOR_LOOK[ch ? ch.atype : 'none'];
    this.h.robe.color.setHex(look[0]); this.h.robeDark.color.setHex(look[1]);
    if (this.h.hat) this.h.hat.visible = !eq.head;
    this.recalc();
  }

  teleport(x, z) {
    this.pos.set(x, terrainHeight(x, z), z);
    this.target = null;
  }

  revive() {
    this.dead = false;
    this.model.rotation.x = 0;
    this.model.position.y = 0;
    this.buffs = {}; this.imbue = null; this.absorb = null; this.status = {}; this.zerkT = 0;
    this.recalc();
  }

  // --- Güçlendirmeler ---
  addBuff(id, b) { this.buffs[id] = b; this.recalc(); }
  buffSum() {
    const t = {};
    for (const id in this.buffs) for (const k in this.buffs[id].st) t[k] = (t[k] || 0) + this.buffs[id].st[k];
    return t;
  }
  disabled() { return !!(this.status.stun || this.status.freeze); }

  // --- Türetilmiş değerler ---
  recalc() {
    const s = this.stats, L = s.level, eq = this.inv.equip;
    const pas = this.book.passives(), bf = this.buffSum();
    let STR = s.str, INT = s.int, hpF = 0, mpF = 0, hpPct = 0, mpPct = 0, crit = 0, pdef = 0, mdef = 0, block = 0, wPhy = 3, wMag = 2;
    for (const k in eq) {
      const it = eq[k]; if (!it) continue;
      const n = itemInfo(it);
      if (n.req > L) continue;
      pdef += n.pdef; mdef += n.mdef; hpF += n.hp; mpF += n.mp;
      if (k === 'weapon') { wPhy = n.phy; wMag = n.mag; }
      if (k === 'shield' && !n.broken) block += n.block;
      if (!n.broken) { const b = n.blues; STR += b.str || 0; INT += b.int || 0; hpPct += b.hp || 0; mpPct += b.mp || 0; crit += b.crit || 0; }
    }
    s.STR = STR; s.INT = INT;
    const wt = this.inv.weaponType(), wm = wt ? Object.keys(MASTERIES).find(m => (MASTERIES[m].weapons || []).includes(wt)) : null;
    const weapM = wm ? this.book.mastery[wm] : 0;
    const oldMax = s.maxHp, oldMp = s.maxMp;
    s.maxHp = Math.round((40 + STR * 6 + L * 10 + hpF) * (1 + (hpPct + (pas.hpPct || 0) + (bf.hpPct || 0)) / 100));
    s.maxMp = Math.round((30 + INT * 6 + L * 7 + mpF) * (1 + (mpPct + (pas.mpPct || 0)) / 100));
    if (oldMax) s.hp = Math.min(s.maxHp, s.hp * (s.maxHp > oldMax ? 1 : 1)); else s.hp = s.maxHp;
    s.hp = Math.min(s.hp, s.maxHp); s.mp = Math.min(s.mp, s.maxMp);
    void oldMp;
    const zerk = this.zerkT > 0 ? 1.5 : 1;
    const pM = (1 + ((pas.patkPct || 0) + (bf.patkPct || 0)) / 100 + weapM * 0.01) * zerk;
    const mM = (1 + (bf.matkPct || 0) / 100) * zerk;
    const phy = wPhy + STR * 0.55 + L * 1.2, mag = wMag + INT * 0.55 + L * 1.2;
    const d = this.d;
    d.phyMin = Math.round(phy * 0.9 * pM); d.phyMax = Math.round(phy * 1.1 * pM);
    d.magMin = Math.round(mag * 0.9 * mM); d.magMax = Math.round(mag * 1.1 * mM);
    d.pdef = Math.round((pdef + STR * 0.25 + L * 0.8) * (1 + ((pas.pdefPct || 0) + (bf.pdefPct || 0)) / 100));
    d.mdef = Math.round((mdef + INT * 0.25 + L * 0.8) * (1 + ((pas.mdefPct || 0) + (bf.mdefPct || 0)) / 100));
    d.crit = Math.min(60, 5 + crit + (pas.crit || 0) + (bf.crit || 0));
    d.block = eq.shield ? Math.min(50, block + (pas.block || 0) + (bf.block || 0)) : 0;
    d.speed = (1 + (bf.speedPct || 0) / 100) * (this.zerkT > 0 ? 1.6 : 1) * (this.speedScrollT > 0 ? 1.3 : 1) * (this.status.slow ? 0.5 : 1);
    const W = wt ? WEAPON_TYPES[wt] : null;
    d.range = W ? W.range + (W.ranged ? (bf.range || 0) : 0) : 2.4;
    d.atkInt = W ? W.spd : 1;
    d.ranged = !!(W && W.ranged);
    d.dmgTaken = bf.dmgTaken || 1;
    d.regen = bf.regen || 0;
    d.weapM = weapM; d.wtype = wt;
  }

  update(dt, input, camYaw) {
    const pos = this.pos;

    if (this.dead) {
      this.moving = false; this.manualMove = false; this.target = null;
      const k = Math.min(1, dt * 6);
      this.model.rotation.x += (-Math.PI / 2 - this.model.rotation.x) * k;
      this.model.position.y += (0.45 - this.model.position.y) * k;
      this.shieldMesh.visible = false; this.aura.visible = false; this.zerkAura.intensity = 0;
      pos.y = terrainHeight(pos.x, pos.z);
      return;
    }

    // süreler
    let expired = false;
    for (const id in this.buffs) { const b = this.buffs[id]; b.t -= dt; if (b.t <= 0) { delete this.buffs[id]; expired = true; } }
    if (this.imbue) { this.imbue.t -= dt; if (this.imbue.t <= 0) this.imbue = null; }
    if (this.absorb) { this.absorb.t -= dt; if (this.absorb.t <= 0 || this.absorb.amt <= 0) this.absorb = null; }
    for (const k in this.status) { const st = this.status[k]; st.t -= dt; if (st.t <= 0) { delete this.status[k]; expired = true; } }
    if (this.zerkT > 0) { this.zerkT -= dt; if (this.zerkT <= 0) { this.zerkT = 0; expired = true; } }
    if (this.speedScrollT > 0) { this.speedScrollT -= dt; if (this.speedScrollT <= 0) expired = true; }
    if (expired) this.recalc();

    this.shieldMesh.visible = !!(this.buffs.cd_shield || this.absorb);
    if (this.shieldMesh.visible) {
      this.shieldMesh.material.color.setHex(this.absorb ? 0xfff0a0 : 0x7fd8ff);
      this.shieldMesh.rotation.y += dt; this.shieldMesh.scale.setScalar(1 + Math.sin(performance.now() * 0.006) * 0.04);
    }
    this.aura.visible = !!this.imbue;
    if (this.imbue) { this.aura.material.color.setHex(ELEM_COLOR[this.imbue.elem]); this.aura.rotation.z += dt * 2; }
    this.zerkAura.intensity = this.zerkT > 0 ? 1.4 + Math.sin(performance.now() * 0.01) * 0.4 : 0;
    if (this.swingT > 0) this.swingT = Math.max(0, this.swingT - dt);
    if (this.combatT > 0) this.combatT -= dt;

    const sy = Math.sin(camYaw), cy = Math.cos(camYaw);

    // WASD / joystick: kameraya göre yön
    let f = (input.isDown('KeyW', 'ArrowUp') ? 1 : 0) - (input.isDown('KeyS', 'ArrowDown') ? 1 : 0);
    let r = (input.isDown('KeyD', 'ArrowRight') ? 1 : 0) - (input.isDown('KeyA', 'ArrowLeft') ? 1 : 0);
    const jl = Math.hypot(input.joy.x, input.joy.y);
    if (jl > 0.2) { f = -input.joy.y; r = input.joy.x; }
    if (this.disabled()) { f = r = 0; this.target = null; }
    this.manualMove = !!(f || r);

    let dx = 0, dz = 0, targetDist = Infinity;
    if (this.manualMove) {
      this.target = null;
      dx = -sy * f + cy * r;
      dz = -cy * f - sy * r;
    } else if (this.target) {
      dx = this.target.x - pos.x; dz = this.target.z - pos.z;
      targetDist = Math.hypot(dx, dz);
      if (targetDist < 0.25) { this.target = null; dx = dz = 0; }
    }

    const len = Math.hypot(dx, dz);
    this.moving = len > 0.0001;

    if (this.moving) {
      dx /= len; dz /= len;
      const want = Math.atan2(dx, dz);
      this.heading += angleDiff(this.heading, want) * Math.min(1, dt * CONFIG.turnSpeed);

      const speed = CONFIG.playerSpeed * (this.d.speed || 1) * (this.mountSpeed || 1);
      let step = speed * dt;
      if (targetDist < step) step = targetDist;
      const px = pos.x, pz = pos.z;
      pos.x += dx * step; pos.z += dz * step;
      this._collide();
      const lim = CONFIG.worldSize / 2 - 6;
      pos.x = clamp(pos.x, -lim, lim); pos.z = clamp(pos.z, -lim, lim);

      const moved = Math.hypot(pos.x - px, pos.z - pz);
      if (this.target && moved < step * 0.25) { this.stuckT += dt; if (this.stuckT > 0.4) { this.target = null; this.stuckT = 0; } }
      else this.stuckT = 0;
    }

    pos.y = terrainHeight(pos.x, pos.z);
    this.group.rotation.y = this.heading;
    this._animate(dt);
    this._regen(dt);
  }

  _collide() {
    const p = this.pos;
    for (const o of this.world.obstacles) {
      const dx = p.x - o.x, dz = p.z - o.z, min = o.r + 0.45;
      if (Math.abs(dx) > min || Math.abs(dz) > min) continue;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min) {
        const d = Math.sqrt(d2) || 0.001;
        p.x = o.x + (dx / d) * min; p.z = o.z + (dz / d) * min;
      }
    }
  }

  _animate(dt) {
    const sp = (this.d.speed || 1);
    this.walkBlend += ((this.moving ? 1 : 0) - this.walkBlend) * Math.min(1, dt * 10);
    this.walkPhase += dt * 11 * this.walkBlend * Math.min(1.6, sp);
    const s = Math.sin(this.walkPhase) * 0.85 * this.walkBlend;
    this.legL.rotation.x = s; this.legR.rotation.x = -s;
    this.armL.rotation.x = -s * 0.8; this.armR.rotation.x = s * 0.8;
    this.armR.rotation.z = 0; this.armL.rotation.z = 0;
    if (this.swingT > 0) {
      const k = 1 - this.swingT / 0.3;
      if (this.swingKind === 'bow') { this.armR.rotation.x = -1.5; this.armL.rotation.x = -1.5; this.armR.rotation.z = 0.3 * Math.sin(k * Math.PI); }
      else if (this.swingKind === 'cast') { this.armR.rotation.x = -2.6 * Math.sin(k * Math.PI); this.armL.rotation.x = -2.6 * Math.sin(k * Math.PI); }
      else if (this.swingKind === 'thrust') { this.armR.rotation.x = -1.6 + Math.sin(k * Math.PI) * 0.4; this.model.position.z = Math.sin(k * Math.PI) * 0.35; }
      else this.armR.rotation.x = -2.3 * Math.sin(k * Math.PI);
    } else this.model.position.z = 0;
    if (this.d.wtype === 'bow' && !this.moving && this.swingT <= 0) { this.armL.rotation.x = -0.4; }
    const bob = Math.abs(Math.sin(this.walkPhase)) * 0.12 * this.walkBlend + Math.sin(performance.now() * 0.002) * 0.015 * (1 - this.walkBlend);
    this.pos.y += bob;
  }

  _regen(dt) {
    const s = this.stats;
    if (this.d.regen) s.hp = Math.min(s.maxHp, s.hp + s.maxHp * this.d.regen / 100 * dt);
    if (this.combatT > 0) return;               // savaşırken doğal yenilenme yok
    s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.012 * dt);
    s.mp = Math.min(s.maxMp, s.mp + s.maxMp * 0.02 * dt);
  }
}
