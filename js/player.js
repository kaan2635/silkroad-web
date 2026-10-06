// Oyuncu karakteri: model, hareket (tıkla-yürü + WASD + joystick), çarpışma, istatistikler.

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

// İnsansı model: oyuncu ve haydutlar için ortak
// o: { robe, robeDark, skin, hat: 'straw' | 'band' | null }
function buildHumanoid(o) {
  const g = new THREE.Group();
  const robe = new THREE.MeshLambertMaterial({ color: o.robe });
  const robeDark = new THREE.MeshLambertMaterial({ color: o.robeDark });
  const skin = new THREE.MeshLambertMaterial({ color: o.skin || 0xe8b98a });
  const steel = new THREE.MeshLambertMaterial({ color: 0xc9d2d8 });
  const add = (parent, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh; };

  add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.52, 0.95, 10), robe), 0, 1.28, 0);       // gövde
  add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.14, 10), robeDark), 0, 1.0, 0);   // kemer
  add(g, new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), skin), 0, 2.0, 0);                  // kafa
  if (o.hat === 'straw') add(g, new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.42, 14), new THREE.MeshLambertMaterial({ color: 0xd8b66a })), 0, 2.4, 0);
  if (o.hat === 'band') add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.1, 12), new THREE.MeshLambertMaterial({ color: 0xc0302a })), 0, 2.1, 0);

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

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 1.15), steel);
  blade.position.set(0, -0.78, 0.55); blade.castShadow = true;
  armR.add(blade);
  const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.08), new THREE.MeshLambertMaterial({ color: 0xd8a830 }));
  hilt.position.set(0, -0.78, 0.0);
  armR.add(hilt);
  return { group: g, legL, legR, armL, armR };
}

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
    this.combatT = 0;
    this.buffs = { haste: 0, shield: 0 };

    this.stats = { level: 1, hp: 100, maxHp: 100, mp: 50, maxMp: 50, exp: 0, maxExp: 100, hpPots: 10, mpPots: 10 };

    const h = buildHumanoid({ robe: 0xb03a2e, robeDark: 0x5a1d16, hat: 'straw' });
    this.model = h.group;
    this.legL = h.legL; this.legR = h.legR; this.armL = h.armL; this.armR = h.armR;
    this.group.add(this.model);

    // Buz kalkanı görseli
    this.shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.22, depthWrite: false }));
    this.shieldMesh.position.y = 1.3;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);

    this.setName(name);
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

  teleport(x, z) {
    this.pos.set(x, terrainHeight(x, z), z);
    this.target = null;
  }

  revive() {
    this.dead = false;
    this.model.rotation.x = 0;
    this.model.position.y = 0;
    this.buffs.haste = 0; this.buffs.shield = 0;
  }

  update(dt, input, camYaw) {
    const pos = this.pos;

    if (this.dead) {
      this.moving = false; this.manualMove = false; this.target = null;
      const k = Math.min(1, dt * 6);
      this.model.rotation.x += (-Math.PI / 2 - this.model.rotation.x) * k;
      this.model.position.y += (0.45 - this.model.position.y) * k;
      this.shieldMesh.visible = false;
      pos.y = terrainHeight(pos.x, pos.z);
      return;
    }

    for (const k in this.buffs) if (this.buffs[k] > 0) this.buffs[k] = Math.max(0, this.buffs[k] - dt);
    this.shieldMesh.visible = this.buffs.shield > 0;
    if (this.shieldMesh.visible) { this.shieldMesh.rotation.y += dt; this.shieldMesh.scale.setScalar(1 + Math.sin(performance.now() * 0.006) * 0.04); }
    if (this.swingT > 0) this.swingT = Math.max(0, this.swingT - dt);
    if (this.combatT > 0) this.combatT -= dt;

    const sy = Math.sin(camYaw), cy = Math.cos(camYaw);

    // WASD / joystick: kameraya göre yön
    let f = (input.isDown('KeyW', 'ArrowUp') ? 1 : 0) - (input.isDown('KeyS', 'ArrowDown') ? 1 : 0);
    let r = (input.isDown('KeyD', 'ArrowRight') ? 1 : 0) - (input.isDown('KeyA', 'ArrowLeft') ? 1 : 0);
    const jl = Math.hypot(input.joy.x, input.joy.y);
    if (jl > 0.2) { f = -input.joy.y; r = input.joy.x; }
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

      const speed = CONFIG.playerSpeed * (this.buffs.haste > 0 ? 1.7 : 1);
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
    this.walkBlend += ((this.moving ? 1 : 0) - this.walkBlend) * Math.min(1, dt * 10);
    this.walkPhase += dt * 11 * this.walkBlend * (this.buffs.haste > 0 ? 1.4 : 1);
    const s = Math.sin(this.walkPhase) * 0.85 * this.walkBlend;
    this.legL.rotation.x = s; this.legR.rotation.x = -s;
    this.armL.rotation.x = -s * 0.8; this.armR.rotation.x = s * 0.8;
    if (this.swingT > 0) {                     // kılıç savurma
      const k = 1 - this.swingT / 0.3;
      this.armR.rotation.x = -2.3 * Math.sin(k * Math.PI);
    }
    const bob = Math.abs(Math.sin(this.walkPhase)) * 0.12 * this.walkBlend + Math.sin(performance.now() * 0.002) * 0.015 * (1 - this.walkBlend);
    this.pos.y += bob;
  }

  _regen(dt) {
    if (this.combatT > 0) return;               // savaşırken yenilenme yok
    const s = this.stats;
    s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.012 * dt);
    s.mp = Math.min(s.maxMp, s.mp + s.maxMp * 0.02 * dt);
  }
}
