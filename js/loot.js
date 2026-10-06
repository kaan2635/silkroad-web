// Yerdeki ganimet: altın, eşya, iksir, yükseltme taşı. Yaklaşınca otomatik toplanır.
const MAX_DROPS = 40;
const DROP_LIFE = 90;        // saniye
const PICKUP_RANGE = 2.4;

const DROP_RATES = {         // [eşya, taş, iksir]
  wolf: [0.15, 0.12, 0.22],
  scorpion: [0.22, 0.18, 0.25],
  bandit: [0.40, 0.30, 0.30],
  golem: [0.45, 0.35, 0.30]
};

class LootManager {
  constructor(world, player, hud) {
    this.world = world; this.player = player; this.hud = hud;
    this.drops = [];
    this.geo = {
      coin: new THREE.CylinderGeometry(0.38, 0.38, 0.14, 14),
      gem: new THREE.OctahedronGeometry(0.42),
      box: new THREE.BoxGeometry(0.7, 0.7, 0.7),
      pot: new THREE.SphereGeometry(0.32, 10, 8),
      beam: (() => { const g = new THREE.CylinderGeometry(0.09, 0.09, 10, 6); g.translate(0, 5, 0); return g; })(),
      hit: new THREE.SphereGeometry(1.4, 8, 6)
    };
  }

  _make(kind, data) {
    let mesh, color = '#ffffff', text = '', sub = '', beam = 0;
    if (kind === 'gold') {
      mesh = new THREE.Mesh(this.geo.coin, new THREE.MeshLambertMaterial({ color: 0xffd23a, emissive: 0x554400 }));
      color = '#ffd23a'; text = data.amount + ' Altın';
    } else if (kind === 'stone') {
      mesh = new THREE.Mesh(this.geo.gem, new THREE.MeshLambertMaterial({ color: 0x5ad8ff, emissive: 0x1a5a70 }));
      color = '#7fe3ff'; text = 'Yükseltme Taşı';
    } else if (kind === 'hp' || kind === 'mp') {
      const hp = kind === 'hp';
      mesh = new THREE.Mesh(this.geo.pot, new THREE.MeshLambertMaterial({ color: hp ? 0xe0483a : 0x3a7ae0, emissive: hp ? 0x501410 : 0x102a50 }));
      color = hp ? '#ff8a7a' : '#8ab4ff'; text = hp ? 'Can İksiri' : 'Mana İksiri';
    } else {
      const n = itemInfo(data.item);
      mesh = new THREE.Mesh(this.geo.box, new THREE.MeshLambertMaterial({ color: n.hex, emissive: n.hex, emissiveIntensity: 0.25 }));
      color = n.color; text = n.name; sub = n.rarityName;
      beam = data.item.rarity >= 2 ? n.hex : 0;
    }
    mesh.castShadow = true;
    return { mesh, color, text, sub, beam };
  }

  spawn(kind, x, z, data = {}) {
    const m = this._make(kind, data);
    const g = new THREE.Group();
    const y = terrainHeight(x, z);
    g.position.set(x, y, z);
    m.mesh.position.y = 0.8;
    g.add(m.mesh);
    if (m.beam) {
      const b = new THREE.Mesh(this.geo.beam, new THREE.MeshBasicMaterial({ color: m.beam, transparent: true, opacity: 0.35, depthWrite: false }));
      g.add(b);
    }
    const label = makeLabel(m.text, m.sub, m.color, '#d8d8d8');
    label.scale.set(3.4, 1.06, 1);
    label.position.y = 2.1;
    g.add(label);
    const hit = new THREE.Mesh(this.geo.hit, new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.9;
    g.add(hit);
    this.world.scene.add(g);
    const d = { kind, group: g, mesh: m.mesh, label, hit, x, z, y, age: 0, cool: 0, bob: Math.random() * 6, ...data };
    hit.userData.drop = d;
    this.drops.push(d);
    if (this.drops.length > MAX_DROPS) this.remove(this.drops[0]);
    return d;
  }

  remove(d) {
    this.world.scene.remove(d.group);
    if (d.label.material.map) d.label.material.map.dispose();
    d.label.material.dispose();
    const i = this.drops.indexOf(d);
    if (i >= 0) this.drops.splice(i, 1);
  }

  // Canavar öldüğünde ganimet saç
  dropFrom(m) {
    const lvl = m.level, rates = (DROP_RATES[m.typeKey] || [0.15, 0.1, 0.2]).slice();
    if (this.quests && this.quests.wantsStones()) rates[1] = Math.min(0.6, rates[1] * 2.5);   // taş görevi varsa daha sık düşer
    const spot = () => { const a = Math.random() * 6.283, r = 0.6 + Math.random() * 1.4; return [m.x + Math.cos(a) * r, m.z + Math.sin(a) * r]; };
    const gold = Math.max(1, Math.round((4 + 5 * lvl) * (0.7 + Math.random() * 0.6)));
    this.spawn('gold', ...spot(), { amount: gold });
    if (Math.random() < rates[0]) this.spawn('item', ...spot(), { item: randomDrop(lvl) });
    if (Math.random() < rates[1]) this.spawn('stone', ...spot(), { amount: 1 });
    if (Math.random() < rates[2]) this.spawn(Math.random() < 0.6 ? 'hp' : 'mp', ...spot(), { amount: 1 });
  }

  pick(raycaster) {
    const meshes = this.drops.map(d => d.hit);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    return hit ? hit.object.userData.drop : null;
  }

  _collect(d) {
    const s = this.player.stats, pos = { x: this.player.pos.x, y: this.player.pos.y + 2.8, z: this.player.pos.z };
    if (d.kind === 'gold') {
      s.gold += d.amount;
      this.hud.floatText(pos, '+' + d.amount + ' 💰', 'exp');
      this.hud.log('+' + d.amount + ' altın', 'gold');
      SFX.play('coin');
    } else if (d.kind === 'stone') {
      s.stones += d.amount;
      if (this.quests) this.quests.onCollect('stone');
      this.hud.log('Yükseltme Taşı aldın.', 'sys', '#7fe3ff');
      SFX.play('gem');
    } else if (d.kind === 'hp' || d.kind === 'mp') {
      s[d.kind === 'hp' ? 'hpPots' : 'mpPots'] += d.amount;
      this.hud.log((d.kind === 'hp' ? 'Can' : 'Mana') + ' İksiri aldın.', 'sys');
      SFX.play('potion');
    } else {
      if (!this.player.inv.add(d.item)) { d.cool = 4; this.hud.log('Envanter dolu!', 'dmg'); return; }
      const n = itemInfo(d.item);
      this.hud.log(n.name + ' aldın. (' + n.rarityName + ')', 'sys', n.color);
      SFX.play('item');
    }
    this.remove(d);
  }

  update(dt) {
    const p = this.player;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.age += dt; d.bob += dt * 3;
      if (d.cool > 0) d.cool -= dt;
      if (d.age > DROP_LIFE) { this.remove(d); continue; }
      d.mesh.rotation.y += dt * 1.6;
      d.mesh.position.y = 0.8 + Math.sin(d.bob) * 0.15;
      const dist = Math.hypot(d.x - p.pos.x, d.z - p.pos.z);
      d.label.visible = dist < 30;
      if (!p.dead && d.cool <= 0 && dist < PICKUP_RANGE) this._collect(d);
    }
  }
}
