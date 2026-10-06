// Oyuncu karakteri: model, hareket (tıkla-yürü + WASD), çarpışma, istatistikler.

function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function makeLabel(name, sub) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 80;
  const x = c.getContext('2d');
  x.textAlign = 'center';
  x.lineJoin = 'round';
  x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,.85)';
  x.font = 'bold 30px "Trebuchet MS", sans-serif';
  x.fillStyle = '#ffe9a8';
  x.strokeText(name, 128, 34); x.fillText(name, 128, 34);
  x.font = '20px "Trebuchet MS", sans-serif';
  x.fillStyle = '#bfe3ff';
  x.strokeText(sub, 128, 64); x.fillText(sub, 128, 64);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false }));
  sp.scale.set(5, 1.56, 1);
  return sp;
}

class Player {
  constructor(world, name) {
    this.world = world;
    this.name = name;
    this.group = new THREE.Group();
    this.heading = 0;
    this.target = null;      // {x, z} — tıklanan hedef
    this.walkPhase = 0;
    this.walkBlend = 0;
    this.stuckT = 0;
    this.moving = false;

    this.stats = { level: 1, hp: 100, maxHp: 100, mp: 50, maxMp: 50, exp: 0, maxExp: 100 };

    this._buildModel();
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

  _buildModel() {
    const robe = new THREE.MeshLambertMaterial({ color: 0xb03a2e });
    const robeDark = new THREE.MeshLambertMaterial({ color: 0x5a1d16 });
    const skin = new THREE.MeshLambertMaterial({ color: 0xe8b98a });
    const straw = new THREE.MeshLambertMaterial({ color: 0xd8b66a });
    const steel = new THREE.MeshLambertMaterial({ color: 0xc9d2d8 });
    const add = (parent, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh; };

    add(this.group, new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.52, 0.95, 10), robe), 0, 1.28, 0);      // gövde
    add(this.group, new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.14, 10), robeDark), 0, 1.0, 0);  // kemer
    add(this.group, new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), skin), 0, 2.0, 0);                 // kafa
    add(this.group, new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.42, 14), straw), 0, 2.4, 0);                // hasır şapka

    const limb = (w, h, d, mat, x, y) => {
      const pivot = new THREE.Group(); pivot.position.set(x, y, 0);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.y = -h / 2; m.castShadow = true; pivot.add(m);
      this.group.add(pivot);
      return pivot;
    };
    this.legL = limb(0.28, 0.82, 0.3, robeDark, -0.2, 0.82);
    this.legR = limb(0.28, 0.82, 0.3, robeDark, 0.2, 0.82);
    this.armL = limb(0.2, 0.78, 0.2, robe, -0.6, 1.66);
    this.armR = limb(0.2, 0.78, 0.2, robe, 0.6, 1.66);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 1.15), steel);
    blade.position.set(0, -0.78, 0.55); blade.castShadow = true;
    this.armR.add(blade);
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.08), new THREE.MeshLambertMaterial({ color: 0xd8a830 }));
    hilt.position.set(0, -0.78, 0.0);
    this.armR.add(hilt);
  }

  update(dt, input, camYaw) {
    const pos = this.pos;
    const sy = Math.sin(camYaw), cy = Math.cos(camYaw);

    // WASD: kameraya göre yön
    const f = (input.isDown('KeyW', 'ArrowUp') ? 1 : 0) - (input.isDown('KeyS', 'ArrowDown') ? 1 : 0);
    const r = (input.isDown('KeyD', 'ArrowRight') ? 1 : 0) - (input.isDown('KeyA', 'ArrowLeft') ? 1 : 0);
    let dx = 0, dz = 0, targetDist = Infinity;
    if (f || r) {
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
      // yüzü hareket yönüne çevir
      const want = Math.atan2(dx, dz);
      this.heading += angleDiff(this.heading, want) * Math.min(1, dt * CONFIG.turnSpeed);

      let step = CONFIG.playerSpeed * dt;
      if (targetDist < step) step = targetDist;
      const px = pos.x, pz = pos.z;
      pos.x += dx * step; pos.z += dz * step;
      this._collide();
      const lim = CONFIG.worldSize / 2 - 6;
      pos.x = clamp(pos.x, -lim, lim); pos.z = clamp(pos.z, -lim, lim);

      // Engele takılıp ilerleyemiyorsak hedefi bırak
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
    this.walkPhase += dt * 11 * this.walkBlend;
    const s = Math.sin(this.walkPhase) * 0.85 * this.walkBlend;
    this.legL.rotation.x = s; this.legR.rotation.x = -s;
    this.armL.rotation.x = -s * 0.8; this.armR.rotation.x = s * 0.8;
    // hafif zıplama + durunca nefes alma
    const bob = Math.abs(Math.sin(this.walkPhase)) * 0.12 * this.walkBlend + Math.sin(performance.now() * 0.002) * 0.015 * (1 - this.walkBlend);
    this.pos.y += bob;
  }

  _regen(dt) {
    const s = this.stats;
    s.hp = Math.min(s.maxHp, s.hp + dt * 1.5);
    s.mp = Math.min(s.maxMp, s.mp + dt * 1.0);
  }
}
