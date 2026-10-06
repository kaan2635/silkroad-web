// Canavarlar: modeller, yapay zeka (dolaşma, kovalama, saldırı, geri dönüş), yeniden doğma.

const SAFE_RADIUS = 28;    // şehir kapısı çevresi: canavar girmez, saldırmaz
const LEASH = 45;          // canavar yuvasından bu kadar uzaklaşırsa geri döner
const RESPAWN_TIME = 18;

const MONSTER_TYPES = {
  wolf:     { name: 'Kurt',       hp: 40,  dmg: 5,  speed: 6.5, aggro: 11, range: 2.0, atkInt: 1.4, exp: 12, hit: 1.2, scale: 1.0, labelY: 2.5 },
  scorpion: { name: 'Dev Akrep',  hp: 70,  dmg: 8,  speed: 4.6, aggro: 8,  range: 2.3, atkInt: 1.8, exp: 20, hit: 1.5, scale: 1.25, labelY: 3.3 },
  bandit:   { name: 'Haydut',     hp: 120, dmg: 12, speed: 5.5, aggro: 12, range: 2.4, atkInt: 1.6, exp: 35, hit: 1.3, scale: 1.0, labelY: 3.3 }
};

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
  constructor(world, typeKey, level, home) {
    this.world = world;
    this.typeKey = typeKey;
    this.type = MONSTER_TYPES[typeKey];
    this.level = level;
    this.maxHp = Math.round(this.type.hp * (1 + 0.3 * (level - 1)));
    this.hp = this.maxHp;
    this.dmg = Math.round(this.type.dmg * (1 + 0.25 * (level - 1)));
    this.home = { x: home.x, z: home.z };
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
    this.baseScale = this.type.scale * (1 + 0.04 * (level - 1));

    this.group = new THREE.Group();
    let parts;
    if (typeKey === 'wolf') parts = buildWolf();
    else if (typeKey === 'scorpion') parts = buildScorpion();
    else {
      const h = buildHumanoid({ robe: 0x3a3a44, robeDark: 0x24242c, hat: 'band' });
      parts = { group: h.group, legs: [h.legL, h.legR], arms: [h.armL, h.armR], armR: h.armR };
    }
    this.body = parts.group;
    this.legs = parts.legs;
    this.arms = parts.arms || [];
    this.armR = parts.armR || null;
    this.group.add(this.body);
    this.group.scale.setScalar(this.baseScale);

    // Tıklama için görünmez, cömert bir vuruş alanı (dokunmatik için de rahat)
    const s = this.type.hit;
    this.hit = new THREE.Mesh(new THREE.CylinderGeometry(s, s, 2.4, 8), new THREE.MeshBasicMaterial({ visible: false }));
    this.hit.position.y = 1.2;
    this.hit.userData.monster = this;
    this.group.add(this.hit);

    this.label = makeLabel(this.type.name, 'Sv. ' + level, '#ffb0a0', '#ffd9a0');
    this.label.scale.set(3.8, 1.2, 1);
    this.label.position.y = this.type.labelY / this.baseScale;
    this.group.add(this.label);

    this.group.position.set(home.x, terrainHeight(home.x, home.z), home.z);
    world.scene.add(this.group);
  }

  get x() { return this.group.position.x; }
  get z() { return this.group.position.z; }

  // Hasar aldı: pasif olsa bile kovalamaya başla
  provoke() { this.provoked = true; if (this.state === 'idle' || this.state === 'return') this.state = 'chase'; }

  die() {
    this.dead = true; this.state = 'dead'; this.deadT = 0; this.moving = false;
    this.label.visible = false;
  }

  respawn() {
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
      if (this.deadT >= RESPAWN_TIME) this.respawn();
      return;
    }

    const dpx = player.pos.x - p.x, dpz = player.pos.z - p.z, dp = Math.hypot(dpx, dpz);
    if (dp > 140 && this.state === 'idle') return;          // uzaktaki canavarlar uyur
    this.label.visible = dp < 48;
    if (this.atkCd > 0) this.atkCd -= dt;
    if (this.attackAnim > 0) this.attackAnim = Math.max(0, this.attackAnim - dt);

    const playerSafe = player.dead || Math.hypot(player.pos.x, player.pos.z) < SAFE_RADIUS;
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
        this._moveToward(player.pos.x, player.pos.z, this.type.speed, dt);
      } else {
        this.heading = Math.atan2(dpx, dpz);
        if (this.atkCd <= 0) {
          this.atkCd = this.type.atkInt;
          this.attackAnim = 0.3;
          combat.damagePlayer(this.dmg, this);
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
    } else if (this.typeKey === 'bandit') {
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
      if (Math.hypot(x, z) < SAFE_RADIUS + 10) return false;
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
    ring('wolf', 20, 40, 105, 1, 3);
    ring('scorpion', 14, 100, 190, 3, 5);
    // Harabelerde haydut kampları
    for (const c of RUINS) {
      for (let i = 0; i < 4; i++) {
        const a = rng() * 6.283, d = rand(3, 6);
        const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
        if (!freeSpot(x, z)) { i--; if (rng() < 0.2) break; continue; }
        this.list.push(new Monster(w, 'bandit', 4 + Math.floor(rng() * 4), { x, z }));
      }
    }
  }

  update(dt, player, combat) {
    for (const m of this.list) m.update(dt, player, combat);
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
