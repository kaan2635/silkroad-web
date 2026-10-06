// Canavarlar: modeller, yapay zeka (dolaşma, kovalama, saldırı, geri dönüş), yeniden doğma.

const SAFE_HALF = TOWN_HALF + 3;   // şehir ve çevresi: canavar girmez, saldırmaz
function inSafeZone(x, z) { return Math.max(Math.abs(x), Math.abs(z)) < SAFE_HALF; }
const LEASH = 45;          // canavar yuvasından bu kadar uzaklaşırsa geri döner
const RESPAWN_TIME = 18;

// Canavar türleri: çarpanlar (seviyeye göre formülle ölçeklenir). magic: büyü saldırısı. status: oyuncuya etki.
const MONSTER_TYPES = {
  wolf:     { name: 'Kurt',       hpM: 1.1, dmgM: 0.9, defM: 0.8, expM: 1.0, speed: 6.5, aggro: 11, range: 2.0, atkInt: 1.4, hit: 1.2, scale: 1.0, labelY: 2.5 },
  scorpion: { name: 'Dev Akrep',  hpM: 1.3, dmgM: 1.0, defM: 1.2, expM: 1.15, speed: 4.6, aggro: 8, range: 2.3, atkInt: 1.8, hit: 1.5, scale: 1.25, labelY: 3.3, status: { kind: 'poison', chance: 0.15, dur: 6 } },
  golem:    { name: 'Kum Devi',   hpM: 1.8, dmgM: 1.25, defM: 1.5, expM: 1.5, speed: 3.8, aggro: 9, range: 2.8, atkInt: 2.0, hit: 2.0, scale: 1.5, labelY: 3.6, status: { kind: 'stun', chance: 0.08, dur: 1.2 } },
  bandit:   { name: 'Haydut',     hpM: 1.2, dmgM: 1.1, defM: 1.0, expM: 1.2, speed: 5.5, aggro: 12, range: 2.4, atkInt: 1.6, hit: 1.3, scale: 1.0, labelY: 3.3 }
};
// Rütbe: normal / şampiyon / dev (Silkroad'daki Champion ve Giant canavarlar). Unique'ler ayrıca tanımlanır.
const MOB_RANKS = {
  normal:   { label: '', hp: 1, dmg: 1, exp: 1, scale: 1, zerk: 0.25, drop: 1, color: '#ffb0a0' },
  champion: { label: 'Şampiyon', hp: 3, dmg: 1.4, exp: 3, scale: 1.2, zerk: 1, drop: 2.5, color: '#ffd23a' },
  giant:    { label: 'Dev', hp: 12, dmg: 2.2, exp: 14, scale: 1.9, zerk: 2.5, drop: 6, color: '#ff7a3a' },
  unique:   { label: 'Unique', hp: 1, dmg: 1, exp: 1, scale: 1, zerk: 5, drop: 20, color: '#ff4ad8' }
};
const mobHp = M => 30 + 22 * M + 1.6 * M * M;
const mobDmg = M => 8 + 4 * M + 0.05 * M * M;
const mobDef = M => 2 + 4 * M;
const mobExp = M => 10 + 6 * M + 0.4 * M * M;
function rollRank() { const r = Math.random(); return r < 0.012 ? 'giant' : r < 0.06 ? 'champion' : 'normal'; }

function buildWolf() {
  const g = new THREE.Group();
  const fur = new THREE.MeshLambertMaterial({ color: 0x7a7a82 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x3a3a42 });
  const eye = new THREE.MeshBasicMaterial({ color: 0xff3a2a });
  const box = (w, h, d, mat, x, y, z, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
  };
  box(0.7, 0.65, 1.5, fur, 0, 0.95, 0);
  box(0.5, 0.45, 0.6, fur, 0, 1.12, 0.95);
  box(0.26, 0.2, 0.4, dark, 0, 1.0, 1.4);
  box(0.12, 0.2, 0.12, fur, -0.17, 1.45, 0.85);
  box(0.12, 0.2, 0.12, fur, 0.17, 1.45, 0.85);
  box(0.08, 0.08, 0.05, eye, -0.14, 1.2, 1.24);
  box(0.08, 0.08, 0.05, eye, 0.14, 1.2, 1.24);
  const tail = box(0.15, 0.15, 0.8, dark, 0, 1.05, -1.1); tail.rotation.x = 0.6;
  const legs = [];
  for (const [lx, lz] of [[-0.25, 0.55], [0.25, 0.55], [-0.25, -0.55], [0.25, -0.55]]) {
    const pivot = new THREE.Group(); pivot.position.set(lx, 0.7, lz);
    box(0.18, 0.7, 0.18, dark, 0, -0.35, 0, pivot);
    g.add(pivot); legs.push(pivot);
  }
  return { group: g, legs };
}

function buildScorpion() {
  const g = new THREE.Group();
  const shell = new THREE.MeshLambertMaterial({ color: 0x8a3a1c });
  const dark = new THREE.MeshLambertMaterial({ color: 0x4a1e0e });
  const sphere = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m;
  };
  sphere(0.7, shell, 0, 0.55, 0, 1.0, 0.55, 1.5);
  sphere(0.38, shell, 0, 0.6, 0.95);
  // kıskaçlar
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.9), dark);
    arm.position.set(sx * 0.7, 0.6, 1.2); arm.rotation.y = -sx * 0.35; arm.castShadow = true; g.add(arm);
    sphere(0.3, shell, sx * 0.95, 0.6, 1.75, 0.8, 0.5, 1.2);
  }
  // kuyruk
  const seg = [[0, 0.75, -0.95, 0.3], [0, 1.1, -1.4, 0.27], [0, 1.55, -1.45, 0.24], [0, 1.95, -1.1, 0.22]];
  for (const [x, y, z, r] of seg) sphere(r, shell, x, y, z);
  const sting = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0xe0b020 }));
  sting.position.set(0, 2.0, -0.7); sting.rotation.x = Math.PI * 0.8; g.add(sting);
  // bacaklar
  for (const sx of [-1, 1]) for (const lz of [-0.5, 0, 0.5]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), dark);
    leg.position.set(sx * 0.85, 0.3, lz); leg.rotation.z = sx * -0.5; g.add(leg);
  }
  return { group: g, legs: [] };
}

function buildGolem() {
  const h = buildHumanoid({ robe: 0xb08a58, robeDark: 0x7a5c36, hat: null });
  h.group.traverse(o => { if (o.material && o.material.color) { o.material = o.material.clone(); o.material.color.lerp(new THREE.Color(0xa07a4c), 0.55); } });
  return { group: h.group, legs: [h.legL, h.legR], arms: [h.armL, h.armR], armR: h.armR };
}

function pushOut(p, radius, obstacles) {
  for (const o of obstacles) {
    const dx = p.x - o.x, dz = p.z - o.z, min = o.r + radius;
    if (Math.abs(dx) > min || Math.abs(dz) > min) continue;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min) {
      const d = Math.sqrt(d2) || 0.001;
      p.x = o.x + (dx / d) * min; p.z = o.z + (dz / d) * min;
    }
  }
}

class Monster {
  constructor(world, typeKey, level, home, opts = {}) {
    this.world = world;
    this.typeKey = typeKey;
    this.type = MONSTER_TYPES[typeKey];
    this.level = level;
    this.home = { x: home.x, z: home.z };
    this.status = {};
    this.fixedRank = opts.rank || null;
    this._stats(this.fixedRank || rollRank());
    this.state = 'idle';
    this.dead = false;
    this.provoked = false;
    this.atkCd = 0;
    this.attackAnim = 0;
    this.deadT = 0;
    this.walkPhase = Math.random() * 6;
    this.heading = Math.random() * 6.283;
    this.wanderT = Math.random() * 4;
    this.wanderTarget = null;
    this.moving = false;

    this.group = new THREE.Group();
    let parts;
    if (typeKey === 'wolf') parts = buildWolf();
    else if (typeKey === 'scorpion') parts = buildScorpion();
    else if (typeKey === 'golem') parts = buildGolem();
    else {
      const h = buildHumanoid({ robe: 0x3a3a44, robeDark: 0x24242c, hat: 'band' });
      parts = { group: h.group, legs: [h.legL, h.legR], arms: [h.armL, h.armR], armR: h.armR };
    }
    this.body = parts.group;
    this.legs = parts.legs;
    this.arms = parts.arms || [];
    this.armR = parts.armR || null;
    this.group.add(this.body);
    this.mats = [];
    this.body.traverse(o => { if (o.material && o.material.emissive) { o.material = o.material.clone(); this.mats.push(o.material); } });
    this.group.scale.setScalar(this.baseScale);

    // Tıklama için görünmez, cömert bir vuruş alanı (dokunmatik için de rahat)
    const s = this.type.hit;
    this.hit = new THREE.Mesh(new THREE.CylinderGeometry(s, s, 2.4, 8), new THREE.MeshBasicMaterial({ visible: false }));
    this.hit.position.y = 1.2;
    this.hit.userData.monster = this;
    this.group.add(this.hit);

    this._makeLabel();

    this.group.position.set(home.x, terrainHeight(home.x, home.z), home.z);
    world.scene.add(this.group);
  }

  _stats(rank) {
    const t = this.type, M = this.level, rk = MOB_RANKS[rank];
    this.rank = rank;
    const u = t.unique || {};
    this.maxHp = Math.round(t.hpM * mobHp(M) * rk.hp * (u.hp || 1));
    this.hp = this.maxHp;
    this.dmg = Math.round(t.dmgM * mobDmg(M) * rk.dmg * (u.dmg || 1));
    this.pdef = Math.round(t.defM * mobDef(M) * (t.magic ? 0.8 : 1.1));
    this.mdef = Math.round(t.defM * mobDef(M) * (t.magic ? 1.1 : 0.8));
    this.exp = Math.round(t.expM * mobExp(M) * rk.exp * (u.exp || 1));
    this.zerkPts = rk.zerk;
    this.dropMult = rk.drop * (u.drop || 1);
    this.baseScale = t.scale * (1 + 0.012 * (M - 1)) * rk.scale;
    this.displayName = (rk.label && rank !== 'unique' ? rk.label + ' ' : '') + t.name;
  }
  _makeLabel() {
    if (this.label) { this.group.remove(this.label); this.label.material.map.dispose(); this.label.material.dispose(); }
    const rk = MOB_RANKS[this.rank];
    this.label = makeLabel(this.displayName, 'Sv. ' + this.level + (this.rank !== 'normal' ? ' · ' + rk.label : ''), rk.color, '#ffd9a0');
    this.label.scale.set(this.rank === 'normal' ? 3.8 : 4.6, this.rank === 'normal' ? 1.2 : 1.45, 1);
    this.label.position.y = this.type.labelY / this.type.scale / (this.rank === 'giant' ? 1.1 : 1);
    this.group.add(this.label);
  }

  // Durum etkisi uygula (yanma, kanama, sersemleme, donma, yere serme, yavaşlatma)
  applyStatus(kind, dur, hitDmg) {
    const resist = this.rank === 'unique' ? 0.3 : this.rank === 'giant' ? 0.6 : 1;
    const st = this.status[kind];
    const dps = kind === 'burn' ? Math.max(1, Math.round(hitDmg * 0.15)) : kind === 'bleed' ? Math.max(1, Math.round(hitDmg * 0.12)) : 0;
    const t = (kind === 'stun' || kind === 'freeze' || kind === 'knock') ? dur * resist : dur;
    if (st) { st.t = Math.max(st.t, t); st.dps = Math.max(st.dps, dps); }
    else this.status[kind] = { t, dps, tick: 1 };
    this._tint();
  }
  disabled() { return !!(this.status.stun || this.status.freeze || this.status.knock); }
  _tint() {
    const s = this.status;
    const c = s.freeze ? 0x2a5aa8 : s.burn ? 0x6a2200 : s.stun || s.knock ? 0x4a4a00 : s.slow ? 0x1a3a5a : s.bleed ? 0x5a0000 : 0x000000;
    for (const m of this.mats) m.emissive.setHex(c);
  }
  _updateStatus(dt, combat) {
    let changed = false;
    for (const k in this.status) {
      const st = this.status[k];
      st.t -= dt;
      if (st.dps) { st.tick -= dt; if (st.tick <= 0) { st.tick = 1; combat.damageMonster(this, st.dps, false, k === 'burn' ? 'fire' : null, true); if (this.dead) return; } }
      if (st.t <= 0) { delete this.status[k]; changed = true; }
    }
    if (changed) this._tint();
  }

  get x() { return this.group.position.x; }
  get z() { return this.group.position.z; }

  // Hasar aldı: pasif olsa bile kovalamaya başla
  provoke() { this.provoked = true; if (this.state === 'idle' || this.state === 'return') this.state = 'chase'; }

  die() {
    this.dead = true; this.state = 'dead'; this.deadT = 0; this.moving = false;
    this.label.visible = false;
    this.status = {}; this._tint();
  }

  respawn() {
    const old = this.rank;
    this._stats(this.fixedRank || rollRank());
    if (old !== this.rank) this._makeLabel();
    this.dead = false; this.state = 'idle'; this.hp = this.maxHp; this.provoked = false;
    this.group.position.set(this.home.x, terrainHeight(this.home.x, this.home.z), this.home.z);
    this.group.rotation.z = 0; this.group.visible = true; this.group.scale.setScalar(this.baseScale);
    this.wanderTarget = null;
  }

  _moveToward(tx, tz, speed, dt) {
    const p = this.group.position;
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { this.moving = false; return d; }
    this.heading += angleDiff(this.heading, Math.atan2(dx, dz)) * Math.min(1, dt * 10);
    const step = Math.min(d, speed * dt);
    p.x += (dx / d) * step; p.z += (dz / d) * step;
    pushOut(p, 0.6 * this.baseScale, this.world.obstacles);
    this.moving = true;
    return d - step;
  }

  update(dt, player, combat) {
    const p = this.group.position;

    if (this.state === 'dead') {
      this.deadT += dt;
      const k = Math.min(1, this.deadT / 0.5);
      this.group.rotation.z = k * (Math.PI / 2);
      p.y = terrainHeight(p.x, p.z) + k * 0.35 * this.baseScale;
      if (this.deadT > 4) this.group.visible = false;
      if (this.deadT >= (this.respawnTime || RESPAWN_TIME)) { if (this.noRespawn) { this.removed = true; return; } this.respawn(); }
      return;
    }

    const dpx = player.pos.x - p.x, dpz = player.pos.z - p.z, dp = Math.hypot(dpx, dpz);
    if (dp > 140 && this.state === 'idle') return;          // uzaktaki canavarlar uyur
    this.label.visible = dp < 48 && Settings.data.names;
    if (this.atkCd > 0) this.atkCd -= dt;
    if (this.attackAnim > 0) this.attackAnim = Math.max(0, this.attackAnim - dt);
    this._updateStatus(dt, combat);
    if (this.dead) return;
    if (this.disabled()) {
      this.moving = false;
      if (this.status.knock) this.group.rotation.z = Math.min(1.2, this.group.rotation.z + dt * 8);
      p.y = terrainHeight(p.x, p.z);
      return;
    }
    if (this.group.rotation.z) this.group.rotation.z = 0;
    const slow = this.status.slow ? 0.5 : 1;

    const playerSafe = player.dead || inSafeZone(player.pos.x, player.pos.z);
    const homeDist = Math.hypot(p.x - this.home.x, p.z - this.home.z);
    this.moving = false;

    if (this.state === 'idle') {
      if (!playerSafe && dp < this.type.aggro) { this.state = 'chase'; }
      else {
        this.wanderT -= dt;
        if (this.wanderTarget) {
          const rem = this._moveToward(this.wanderTarget.x, this.wanderTarget.z, this.type.speed * 0.35, dt);
          if (rem < 0.4) { this.wanderTarget = null; this.wanderT = 2 + Math.random() * 4; }
        } else if (this.wanderT <= 0) {
          const a = Math.random() * 6.283, r = 2 + Math.random() * 7;
          this.wanderTarget = { x: this.home.x + Math.cos(a) * r, z: this.home.z + Math.sin(a) * r };
        }
      }
    } else if (this.state === 'chase') {
      if (playerSafe || homeDist > LEASH) { this.state = 'return'; this.provoked = false; }
      else if (dp > this.type.range * 0.85) {
        this._moveToward(player.pos.x, player.pos.z, this.type.speed * slow, dt);
      } else {
        this.heading = Math.atan2(dpx, dpz);
        if (this.atkCd <= 0) {
          this.atkCd = this.type.atkInt / slow;
          this.attackAnim = 0.3;
          combat.damagePlayer(this.dmg, this, this.type.magic ? 'mag' : 'phys');
        }
      }
    } else if (this.state === 'return') {
      const rem = this._moveToward(this.home.x, this.home.z, this.type.speed * 1.4, dt);
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.3 * dt);
      if (rem < 1.2) { this.state = 'idle'; this.hp = this.maxHp; this.wanderT = 2; }
      else if (!playerSafe && dp < this.type.aggro * 0.6 && this.provoked) this.state = 'chase';
    }

    p.y = terrainHeight(p.x, p.z);
    this.group.rotation.y = this.heading;
    this._animate(dt);
  }

  _animate(dt) {
    if (this.moving) this.walkPhase += dt * (this.state === 'chase' || this.state === 'return' ? 12 : 7);
    const s = this.moving ? Math.sin(this.walkPhase) * 0.8 : 0;
    if (this.typeKey === 'wolf') {
      this.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 3 ? s : -s); });
    } else if (this.typeKey === 'bandit' || this.typeKey === 'golem') {
      this.legs[0].rotation.x = s; this.legs[1].rotation.x = -s;
      this.arms[0].rotation.x = -s * 0.8; this.arms[1].rotation.x = s * 0.8;
      if (this.attackAnim > 0) this.armR.rotation.x = -2.3 * Math.sin((1 - this.attackAnim / 0.3) * Math.PI);
    }
    // saldırı: öne atılma efekti (kurt ve akrep için de)
    const lunge = this.attackAnim > 0 ? Math.sin((1 - this.attackAnim / 0.3) * Math.PI) * 0.5 : 0;
    this.body.position.z = lunge;
    if (this.typeKey === 'scorpion') this.body.rotation.y = Math.sin(this.walkPhase * 0.5) * 0.05;
  }
}

class MonsterManager {
  constructor(world) {
    this.world = world;
    this.list = [];
    this._spawn();
  }

  _spawn() {
    const rng = mulberry32(4242);
    const rand = (a, b) => a + rng() * (b - a);
    const w = this.world;
    const freeSpot = (x, z) => {
      if (Math.abs(x) > 270 || Math.abs(z) > 270) return false;
      if (Math.max(Math.abs(x), Math.abs(z)) < SAFE_HALF + 12) return false;
      for (const o of w.obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + 2) return false;
      return true;
    };
    const ring = (type, count, d0, d1, l0, l1) => {
      let made = 0, tries = 0;
      while (made < count && tries++ < 500) {
        const a = rng() * 6.283, d = rand(d0, d1), x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (!freeSpot(x, z)) continue;
        // yol üstünde doğmasınlar
        if (Math.abs(x - roadCenterX(z)) < 8) continue;
        const lvl = Math.round(l0 + (l1 - l0) * clamp((d - d0) / (d1 - d0), 0, 1)) ;
        this.list.push(new Monster(w, type, lvl, { x, z }));
        made++;
      }
    };
    ring('wolf', 20, 40, 105, 1, 4);
    ring('scorpion', 14, 100, 190, 4, 8);
    ring('golem', 12, 200, 270, 10, 14);
    // Harabelerde haydut kampları
    for (const c of RUINS) {
      for (let i = 0; i < 4; i++) {
        const a = rng() * 6.283, d = rand(3, 6);
        const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
        if (!freeSpot(x, z)) { i--; if (rng() < 0.2) break; continue; }
        this.list.push(new Monster(w, 'bandit', 6 + Math.floor(rng() * 5), { x, z }));
      }
    }
  }

  update(dt, player, combat) {
    for (const m of this.list) m.update(dt, player, combat);
    for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i].removed) { this.world.scene.remove(this.list[i].group); this.list.splice(i, 1); }
  }

  nearest(pos, maxDist) {
    let best = null, bd = maxDist;
    for (const m of this.list) {
      if (m.dead) continue;
      const d = Math.hypot(m.x - pos.x, m.z - pos.z);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  hitMeshes() { return this.list.filter(m => !m.dead).map(m => m.hit); }
}
