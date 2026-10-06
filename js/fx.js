// Görsel efektler: mermiler (ok, ateş topu, buz), alan patlamaları, yıldırım, iyileşme ışığı.
class VFX {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.geo = {
      ball: new THREE.SphereGeometry(0.35, 10, 8),
      arrow: (() => { const g = new THREE.BoxGeometry(0.06, 0.06, 1.0); return g; })(),
      shard: new THREE.OctahedronGeometry(0.35),
      ring: new THREE.RingGeometry(0.8, 1.0, 40),
      disk: new THREE.CircleGeometry(1, 32),
      column: (() => { const g = new THREE.CylinderGeometry(0.6, 0.6, 1, 12, 1, true); g.translate(0, 0.5, 0); return g; })()
    };
    this.mats = {};
  }
  _mat(color, opacity = 1, add = true) {
    const k = color + ':' + opacity;
    if (!this.mats[k]) this.mats[k] = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
    return this.mats[k];
  }

  // Mermi: hedef varlığa doğru uçar, çarpınca onHit
  projectile(from, target, kind, onHit) {
    const geo = kind === 'arrow' ? this.geo.arrow : kind === 'ice' ? this.geo.shard : this.geo.ball;
    const color = kind === 'arrow' ? 0xe8d8b0 : kind === 'ice' ? 0x9fe3ff : kind === 'bolt' ? 0xd8c8ff : 0xff7a1a;
    const mesh = new THREE.Mesh(geo, kind === 'arrow' ? new THREE.MeshBasicMaterial({ color }) : this._mat(color, 0.95));
    mesh.position.set(from.x, from.y, from.z);
    this.scene.add(mesh);
    this.list.push({ type: 'proj', mesh, target, onHit, speed: kind === 'arrow' ? 34 : 22, kind });
  }

  // Yerde genişleyen halka + parlama
  burst(x, z, color, radius = 3, life = 0.5) {
    const y = terrainHeight(x, z) + 0.15;
    const ring = new THREE.Mesh(this.geo.ring, this._mat(color, 0.85).clone());
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, y, z);
    const disk = new THREE.Mesh(this.geo.disk, this._mat(color, 0.35).clone());
    disk.rotation.x = -Math.PI / 2; disk.position.set(x, y + 0.02, z);
    this.scene.add(ring, disk);
    this.list.push({ type: 'burst', ring, disk, t: 0, life, radius });
  }

  // Işık sütunu (şifa, buff, seviye)
  column(x, z, color, h = 4, life = 0.7) {
    const m = new THREE.Mesh(this.geo.column, this._mat(color, 0.4).clone());
    m.position.set(x, terrainHeight(x, z), z);
    m.scale.set(1, h, 1);
    this.scene.add(m);
    this.list.push({ type: 'col', mesh: m, t: 0, life });
  }

  // Yıldırım: gökten hedefe zikzak çizgi
  bolt(x, z, color = 0xd8c8ff) {
    const y = terrainHeight(x, z), pts = [];
    let px = x, pz = z;
    for (let i = 0; i <= 7; i++) {
      pts.push(new THREE.Vector3(px + (i && i < 7 ? (Math.random() - 0.5) * 1.6 : 0), y + 14 - i * 2, pz + (i && i < 7 ? (Math.random() - 0.5) * 1.6 : 0)));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 }));
    this.scene.add(line);
    this.list.push({ type: 'line', mesh: line, t: 0, life: 0.25 });
    this.burst(x, z, color, 2, 0.35);
  }

  // Kılıç izi: önde kısa yay
  slash(x, z, heading, color = 0xffffff) {
    const g = new THREE.RingGeometry(1.4, 2.2, 16, 1, -0.9, 1.8);
    const m = new THREE.Mesh(g, this._mat(color, 0.5).clone());
    m.rotation.x = -Math.PI / 2; m.rotation.z = heading - Math.PI / 2;
    m.position.set(x, terrainHeight(x, z) + 1.2, z);
    this.scene.add(m);
    this.list.push({ type: 'slash', mesh: m, t: 0, life: 0.18, dispose: g });
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      if (e.type === 'proj') {
        const t = e.target, tp = t.group ? t.group.position : t;
        const p = e.mesh.position;
        const dx = tp.x - p.x, dy = tp.y + 1.1 - p.y, dz = tp.z - p.z;
        const d = Math.hypot(dx, dy, dz), step = e.speed * dt;
        if (t.dead) { this.scene.remove(e.mesh); this.list.splice(i, 1); continue; }
        if (d < 0.9 || d < step) { this.scene.remove(e.mesh); this.list.splice(i, 1); e.onHit(); continue; }
        p.set(p.x + dx / d * step, p.y + dy / d * step, p.z + dz / d * step);
        if (e.kind === 'arrow') e.mesh.lookAt(tp.x, tp.y + 1.1, tp.z);
        else e.mesh.rotation.y += dt * 8;
        continue;
      }
      e.t += dt;
      const k = e.t / e.life;
      if (k >= 1) {
        if (e.ring) { this.scene.remove(e.ring, e.disk); e.ring.material.dispose(); e.disk.material.dispose(); }
        if (e.mesh) { this.scene.remove(e.mesh); if (e.type !== 'proj') e.mesh.material.dispose(); if (e.type === 'line') e.mesh.geometry.dispose(); }
        if (e.dispose) e.dispose.dispose();
        this.list.splice(i, 1); continue;
      }
      if (e.type === 'burst') {
        const s = e.radius * (0.3 + 0.7 * Math.sqrt(k));
        e.ring.scale.set(s, s, s); e.disk.scale.set(s, s, s);
        e.ring.material.opacity = 0.85 * (1 - k); e.disk.material.opacity = 0.35 * (1 - k);
      } else if (e.type === 'col') { e.mesh.material.opacity = 0.4 * (1 - k); e.mesh.scale.x = e.mesh.scale.z = 1 + k * 0.6; }
      else if (e.type === 'line') e.mesh.material.opacity = 1 - k;
      else if (e.type === 'slash') { e.mesh.material.opacity = 0.5 * (1 - k); e.mesh.scale.setScalar(1 + k * 0.3); }
    }
  }
}
