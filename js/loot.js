// Yerdeki ganimet: altın ve eşyalar (ekipman, iksir, simya malzemesi, görev eşyası).
// Yaklaşınca otomatik toplanır; ekipmana tıklayınca yürüyüp alırsın.
const MAX_DROPS = 50;
const DROP_LIFE = 120;        // saniye
const PICKUP_RANGE = 2.4;

// Canavar türü → görev eşyası (yalnızca ilgili görev aktifken düşer)
const QUEST_DROPS = { wolf: 'q_fang', scorpion: 'q_tail', snake: 'q_scale', bear: 'q_fur' };

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
    } else {
      const it = data.item, n = itemInfo(it), b = ITEM_BASES[it.base];
      if (n.stack) {
        const c = b.use === 'hp' ? 0xe0483a : b.use === 'mp' ? 0x3a7ae0 : b.cat === 'mat' ? 0x5ad8ff : b.cat === 'quest' ? 0xffd23a : 0xd8c8a0;
        mesh = new THREE.Mesh(b.cat === 'mat' ? this.geo.gem : this.geo.pot, new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.3 }));
        text = n.name + (it.n > 1 ? ' x' + it.n : ''); color = n.color;
        if (it.base === 'astral') beam = 0x5ab4ff;
      } else {
        mesh = new THREE.Mesh(this.geo.box, new THREE.MeshLambertMaterial({ color: n.hex, emissive: n.hex, emissiveIntensity: 0.25 }));
        color = n.color; text = n.name; sub = (it.rarity ? n.rarityName + ' · ' : '') + b.d + '. derece';
        beam = it.rarity >= 1 ? n.hex : 0;
      }
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

  // Canavar öldüğünde ganimet saç (seviye ve rütbeye göre)
  dropFrom(m) {
    const L = m.level, k = (m.dropMult || 1) * (this.player.premT > 0 ? 1.3 : 1);
    const spot = () => { const a = Math.random() * 6.283, r = 0.6 + Math.random() * (1.4 + Math.min(4, k * 0.3)); return [m.x + Math.cos(a) * r, m.z + Math.sin(a) * r]; };
    const item = it => {
      if (it.rarity && this.hud) { const n = itemInfo(it); this.hud.banner(RARITY[it.rarity].name + '!', n.name, 'seal'); this.hud.log('✨ ' + RARITY[it.rarity].name + ' düştü: ' + n.name, 'lvl', n.color); SFX.play('levelup'); }
      return this.spawn('item', ...spot(), { item: it });
    };
    const chance = p => Math.random() < Math.min(0.95, p * k);
    const rolls = Math.min(8, Math.max(1, Math.round(k)));
    // altın
    for (let i = 0; i < Math.min(4, rolls); i++) this.spawn('gold', ...spot(), { amount: Math.max(1, Math.round((5 + 4 * L + 0.15 * L * L) * (0.7 + Math.random() * 0.6))) });
    // ekipman
    for (let i = 0; i < rolls; i++) if (Math.random() < 0.13 * (k > 1 ? 1.6 : 1)) item(randomGear(L, Math.random, m.rank === 'unique' ? 12 : m.rank === 'giant' ? 5 : m.rank === 'champion' ? 2.5 : 1));
    // Unique: garantili mühürlü eşya + simya malzemesi
    if (m.rank === 'unique') {
      for (let i = 0; i < 2; i++) {
        const g = randomGear(L + 4), q = Math.random();
        item(makeSeal(g.base, q < 0.08 ? 3 : q < 0.35 ? 2 : 1));
      }
      item(makeStack('elx_w', 2)); item(makeStack('elx_a', 3)); item(makeStack('luck', 2));
      if (Math.random() < 0.5) item(makeStack('astral', 1));
    }
    // iksirler
    if (chance(0.22)) item(makeStack(potFor(L, Math.random() < 0.6 ? 'hp' : 'mp'), 1 + Math.floor(Math.random() * 3)));
    if (chance(0.03)) item(makeStack('pill', 1));
    if (chance(0.015)) item(makeStack(Math.random() < 0.7 ? 'ret' : 'spd', 1));
    // simya
    if (chance(0.045)) item(makeStack(['elx_w', 'elx_a', 'elx_a', 'elx_s', 'elx_c'][Math.floor(Math.random() * 5)], 1));
    if (chance(0.02)) item(makeStack('luck', 1));
    if (chance(0.012)) item(makeStack('ms_' + Object.keys(BLUES)[Math.floor(Math.random() * 6)], 1));
    if (chance(0.003)) item(makeStack('astral', 1));
    if (chance(0.006)) item(makeStack('zerk', 1));
    if (Math.random() < (m.rank === 'unique' ? 1 : m.rank === 'giant' ? 0.25 : m.rank === 'champion' ? 0.04 : 0.002)) item(makeStack('silkbag', m.rank === 'unique' ? 3 : 1));
    // görev eşyası
    const q = QUEST_DROPS[m.typeKey];
    if (q && this.quests && this.quests.wantsItem(q) && Math.random() < 0.45) item(makeStack(q, 1));
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
    } else {
      const it = d.item, n = itemInfo(it), cnt = it.n || 1;
      if (!this.player.inv.add(it)) {
        d.cool = 4; this.hud.log('Envanter dolu!', 'dmg'); SFX.play('error');
        if (n.stack && it.n !== cnt) { d.label.visible = true; }
        return;
      }
      this.hud.log(n.name + (n.stack && cnt > 1 ? ' x' + cnt : '') + ' aldın.' + (it.rarity ? ' (' + n.rarityName + ')' : ''), 'sys', n.color);
      SFX.play(n.stack ? (ITEM_BASES[it.base].cat === 'mat' ? 'gem' : 'potion') : 'item');
      if (ITEM_BASES[it.base].cat === 'quest' && this.quests) this.quests.onCollect(it.base, cnt);
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
      const range = PICKUP_RANGE + (p.pickRange || 0);
      if (!p.dead && d.cool <= 0 && dist < range) this._collect(d);
    }
  }
}
