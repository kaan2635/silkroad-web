// Meslekler (Silkroad'daki üçgen sistem): Tüccar, Avcı, Hırsız. Sv. 20'de Meslek Loncası'na katılınır.
// Tüccar: şehirde ticaret malı alır, kervan devesiyle başka şehre taşıyıp kârla satar; yolda hırsızlar saldırır.
// Avcı: Tüccar kervanlarını hırsızlara karşı korur (kervan koruma görevi), hırsız avlar.
// Hırsız: NPC kervanlarını soyar, çalıntı malı haydut harabelerindeki simsara satar.

const JOBS = {
  trader: { name: 'Tüccar', icon: '🐫', color: '#ffd23a', cape: 0xe0b020, desc: 'Şehirler arasında mal taşı, kâr et. Yolda hırsızlara dikkat!' },
  hunter: { name: 'Avcı', icon: '🛡️', color: '#6ab4ff', cape: 0x2a6ad8, desc: 'Kervanları koru, hırsızları avla.' },
  thief:  { name: 'Hırsız', icon: '🗡️', color: '#ff7a6a', cape: 0xc02a2a, desc: 'Kervanları soy, çalıntı malı simsara sat.' }
};
const JOB_MIN_LEVEL = 20;
const JOB_EXP = [0, 1000, 3000, 7000, 14000, 26000, 45000];      // 1–7. meslek seviyesi eşikleri
const ZONE_ORDER = ['jangan', 'donwhang', 'hotan'];
const TRADE_GOODS = {
  jangan:   { base: 'tg_silk', name: 'İpek Topu', icon: '🧵', price: 120 },
  donwhang: { base: 'tg_spice', name: 'Baharat Kesesi', icon: '🌶️', price: 220 },
  hotan:    { base: 'tg_jade', name: 'Yeşim Taşı', icon: '💚', price: 380 }
};
const goodOrigin = base => ZONE_ORDER.find(z => TRADE_GOODS[z].base === base);

// Kervan / taşıyıcı varlığı (canavarların saldırabileceği hedef)
class CaravanEnt {
  constructor(world, x, z, hp, label, sub) {
    this.world = world;
    const q = buildCamel(true);
    this.legs = q.legs;
    this.group = new THREE.Group(); this.group.add(q.group);
    this.group.position.set(x, terrainHeight(x, z), z);
    this.maxHp = hp; this.hp = hp; this.dead = false; this.r = 1.2; this.heading = 0; this.phase = 0;
    this.label = null; this.setLabel(label, sub);
    world.scene.add(this.group);
    this.onHurt = null; this.onDie = null;
  }
  get x() { return this.group.position.x; }
  get z() { return this.group.position.z; }
  setLabel(n, sub) {
    if (this.label) { this.group.remove(this.label); this.label.material.map.dispose(); this.label.material.dispose(); }
    this.label = makeLabel(n, sub, '#ffd23a', '#ffe9a8'); this.label.position.y = 3.6; this.label.scale.set(4.4, 1.4, 1); this.group.add(this.label);
  }
  hurt(dmg) {
    if (this.dead || this.removed) return;
    const d = Math.max(1, Math.round(dmg * (this.armor || 1) * (0.85 + Math.random() * 0.3)));
    this.hp -= d;
    if (this.onHurt) this.onHurt(d);
    if (this.hp <= 0) { this.hp = 0; this.dead = true; if (this.onDie) this.onDie(); this.remove(); }
  }
  moveTo(tx, tz, speed, dt, obstacles) {
    const g = this.group.position, dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return 0;
    const st = Math.min(d, speed * dt);
    g.x += dx / d * st; g.z += dz / d * st;
    if (obstacles) pushOut(g, 1.0, obstacles);
    this.heading += angleDiff(this.heading, Math.atan2(dx, dz)) * Math.min(1, dt * 6);
    this.phase += dt * 8;
    return d - st;
  }
  anim(moving) {
    const s = moving ? Math.sin(this.phase) * 0.6 : 0;
    this.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 3 ? s : -s); });
    this.group.rotation.y = this.heading;
    this.group.position.y = terrainHeight(this.x, this.z);
  }
  remove() { this.removed = true; this.dead = true; this.world.scene.remove(this.group); }
}

// Yol boyunca güzergâh (şehir kapısından bölge kapısına)
function roadPath(dir) {
  const pts = [];
  for (let z = 40; z <= 262; z += 14) { const zz = dir * z; pts.push({ x: roadCenterX(zz), z: zz }); }
  return pts;
}

class JobSystem {
  constructor(player, world, mm, combat, hud, loot) {
    this.p = player; this.world = world; this.mm = mm; this.combat = combat; this.hud = hud; this.loot = loot;
    this.job = null; this.jexp = 0;
    this.cargo = {}; this.cargoCost = 0;
    this.transport = null; this.trHp = 0;
    this.ambushT = 40;
    this.mission = null;
    this.onChange = null;
  }
  changed() { if (this.onChange) this.onChange(); }
  level() { let l = 1; JOB_EXP.forEach((e, i) => { if (this.jexp >= e) l = i + 1; }); return l; }
  nextExp() { const l = this.level(); return l >= JOB_EXP.length ? null : JOB_EXP[l]; }
  gainJobExp(n) {
    if (!this.job || n <= 0) return;
    const before = this.level();
    this.jexp += Math.round(n);
    this.hud.log('+' + Math.round(n) + ' ' + JOBS[this.job].name + ' EXP', 'exp', JOBS[this.job].color);
    if (this.level() > before) { this.hud.banner(JOBS[this.job].name + ' Sv. ' + this.level(), 'Meslek seviyen yükseldi!', 'quest'); SFX.play('levelup'); }
    this.changed();
  }
  join(job) {
    const s = this.p.stats;
    if (s.level < JOB_MIN_LEVEL) return { ok: false, msg: 'Meslek için ' + JOB_MIN_LEVEL + '. seviye gerekli.' };
    if (this.transport || this.mission) return { ok: false, msg: 'Önce elindeki işi bitir.' };
    if (this.job === job) return { ok: false, msg: 'Zaten ' + JOBS[job].name + ' loncasındasın.' };
    const had = this.job;
    this.job = job; this.jexp = 0; this.cargo = {}; this.cargoCost = 0;
    this.p.setCape(JOBS[job].cape);
    this.changed();
    return { ok: true, msg: (had ? JOBS[had].name + ' loncasından ayrıldın. ' : '') + JOBS[job].name + ' loncasına katıldın!' };
  }
  leave() {
    if (!this.job) return { ok: false, msg: '' };
    if (this.transport || this.mission) return { ok: false, msg: 'Önce elindeki işi bitir.' };
    const n = JOBS[this.job].name; this.job = null; this.jexp = 0; this.p.setCape(null); this.changed();
    return { ok: true, msg: n + ' loncasından ayrıldın.' };
  }

  // ---------- Tüccar ----------
  capacity() { return 20 + 10 * (this.level() - 1); }
  cargoCount() { let n = 0; for (const k in this.cargo) n += this.cargo[k]; return n; }
  // Bugünkü fiyat: uzak şehirde daha pahalı, günlük ±%8 dalgalanma
  price(base, zone = CUR_ZONE_ID) {
    const o = goodOrigin(base), g = TRADE_GOODS[o];
    const diff = Math.abs(ZONE_ORDER.indexOf(o) - ZONE_ORDER.indexOf(zone));
    const day = Math.floor(Date.now() / 3600e3);
    const wave = 1 + 0.08 * Math.sin(day * 1.7 + ZONE_ORDER.indexOf(zone) * 2.1 + ZONE_ORDER.indexOf(o));
    return Math.round(g.price * (diff === 0 ? 1 : 1 + 0.6 * diff) * wave);
  }
  localGood() { return TRADE_GOODS[CUR_ZONE_ID]; }
  buy(n) {
    const s = this.p.stats, g = this.localGood();
    if (this.job !== 'trader') return { ok: false, msg: 'Ticaret malı yalnızca Tüccarlara satılır. (Meslek Loncası)' };
    if (!this.transport) return { ok: false, msg: 'Önce kervan devesini çağır (Ahır\'dan düdük al).' };
    if (Math.hypot(this.transport.x - this.p.pos.x, this.transport.z - this.p.pos.z) > 14) return { ok: false, msg: 'Deven çok uzakta.' };
    n = Math.min(n, this.capacity() - this.cargoCount());
    if (n <= 0) return { ok: false, msg: 'Kervan dolu (' + this.capacity() + ').' };
    const cost = this.price(g.base) * n;
    if (s.gold < cost) return { ok: false, msg: 'Yeterli altının yok.' };
    s.gold -= cost; this.cargo[g.base] = (this.cargo[g.base] || 0) + n; this.cargoCost += cost;
    this._trLabel(); this.changed();
    return { ok: true, msg: g.name + ' x' + n + ' yüklendi. -' + cost.toLocaleString('tr-TR') + ' altın' };
  }
  sellAll() {
    if (!this.cargoCount()) return { ok: false, msg: 'Kervanında mal yok.' };
    if (!this.transport || Math.hypot(this.transport.x - this.p.pos.x, this.transport.z - this.p.pos.z) > 14) return { ok: false, msg: 'Deven yanında olmalı.' };
    let rev = 0;
    for (const b in this.cargo) rev += this.price(b) * this.cargo[b];
    const profit = rev - this.cargoCost;
    this.p.stats.gold += rev;
    this.cargo = {}; this.cargoCost = 0;
    this._trLabel();
    this.gainJobExp(Math.max(20, profit * 0.6));
    this.changed();
    return { ok: true, msg: 'Mallar satıldı: +' + rev.toLocaleString('tr-TR') + ' altın (' + (profit >= 0 ? 'kâr ' : 'zarar ') + Math.abs(profit).toLocaleString('tr-TR') + ')' };
  }
  summonTransport(hp) {
    if (this.job !== 'trader') { this.hud.log('Kervan devesi sadece Tüccarlar içindir.'); return false; }
    if (this.transport) { this.hud.log('Deven zaten yanında.'); return false; }
    if (this.p.mounted && this.combat.pets) this.combat.pets.toggleMount(false);
    const L = this.p.stats.level, P = this.p.pos;
    const t = this.transport = new CaravanEnt(this.world, P.x - 2, P.z - 2, 400 + 150 * L, 'Kervan Devesi', '');
    t.armor = 0.6;
    if (hp) t.hp = Math.min(t.maxHp, hp);
    t.onHurt = d => { this.hud.floatText({ x: t.x, y: t.group.position.y + 3, z: t.z }, '-' + d, 'player'); this._trLabel(); };
    t.onDie = () => {
      const n = this.cargoCount();
      this.transport = null; this.cargo = {}; this.cargoCost = 0;
      this.hud.banner('Kervan Düştü!', n ? n + ' mal hırsızlara kaldı' : 'Deven öldü', 'zerk'); SFX.play('death');
      this.changed();
    };
    this._trLabel();
    SFX.play('item');
    this.hud.log('Kervan devesi çağrıldı. Malları şehirdeki Ticaret Ustası\'ndan yükle.');
    this.changed();
    return true;
  }
  dismissTransport() {
    if (!this.transport) return;
    if (this.cargoCount()) return this.hud.log('Yüklü deveyi gönderemezsin. Önce malları sat.');
    this.transport.remove(); this.transport = null; this.changed();
  }
  _trLabel() { const t = this.transport; if (t) t.setLabel('Kervan Devesi', 'Yük ' + this.cargoCount() + '/' + this.capacity() + ' · Can ' + Math.ceil(t.hp) + '/' + t.maxHp); }

  // Hırsız baskını: mallar yanındaysa ve şehir dışındaysan
  _spawnThieves(target, n, lvl) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, d = 16 + Math.random() * 6, x = clamp(target.x + Math.cos(a) * d, -280, 280), z = clamp(target.z + Math.sin(a) * d, -280, 280);
      const m = new Monster(this.world, 'kthief', Math.max(1, lvl + Math.floor(Math.random() * 3) - 1), { x, z }, { rank: 'normal' });
      m.noRespawn = true; m.respawnTime = 4; m.noLeash = true; m.lifeT = 150; m.targetEnt = target; m.state = 'chase'; m.provoked = true;
      m.onKilled = () => { if (this.job === 'hunter' || this.job === 'trader') this.gainJobExp(25 + m.level * (this.job === 'hunter' ? 4 : 1.5)); };
      this.mm.list.push(m); list.push(m);
    }
    return list;
  }

  // ---------- Görevler (Avcı: kervan koruma, Hırsız: kervan soygunu) ----------
  _dir() { return ZONE.next ? -1 : 1; }
  startEscort() {
    if (this.job !== 'hunter') return { ok: false, msg: 'Bu görev Avcılar içindir.' };
    if (this.mission) return { ok: false, msg: 'Zaten bir görevin var.' };
    const L = this.p.stats.level, path = roadPath(this._dir()), st = path[0];
    const c = new CaravanEnt(this.world, st.x, st.z, 500 + 150 * L, 'Tüccar Kervanı', 'Korumalısın!');
    c.armor = 0.6;
    c.onHurt = () => c.setLabel('Tüccar Kervanı', 'Can ' + Math.ceil(c.hp) + '/' + c.maxHp);
    c.onDie = () => { this.hud.banner('Görev Başarısız', 'Kervan yağmalandı', 'zerk'); SFX.play('fail'); this.mission = null; this.changed(); };
    this.mission = { kind: 'escort', ent: c, path, i: 1, waves: [0.2, 0.5, 0.78], wave: 0, thieves: [] };
    this.hud.log('Kervan şehir kapısından yola çıkıyor. Hırsızlara karşı koru!', 'lvl');
    this.changed();
    return { ok: true, msg: 'Kervan koruma görevi başladı. Kervan kapının dışında seni bekliyor.' };
  }
  startRaid() {
    if (this.job !== 'thief') return { ok: false, msg: 'Bu görev Hırsızlar içindir.' };
    if (this.mission) return { ok: false, msg: 'Zaten bir görevin var.' };
    const L = this.p.stats.level, path = roadPath(this._dir());
    const st = path[2];
    const camel = new Monster(this.world, 'kcamel', L, { x: st.x, z: st.z }, { rank: 'normal' });
    camel.noRespawn = true; camel.respawnTime = 4;
    camel.walker = { path: path.slice(3), i: 0, speed: 3.2, onEnd: () => { this.hud.banner('Görev Başarısız', 'Kervan kaçtı', 'zerk'); SFX.play('fail'); this.mission = null; this.changed(); } };
    camel.onKilled = () => {
      const n = 6 + 2 * this.level();
      this.loot.spawn('item', camel.x + 1, camel.z, { item: makeStack('sg', n) });
      this.hud.banner('Kervan Soyuldu!', n + ' Çalıntı Mal düştü — Hırsız Simsarı\'na sat', 'quest'); SFX.play('questdone');
      this.mission = null; this.changed();
    };
    this.mm.list.push(camel);
    for (let i = 0; i < 2 + Math.floor(this.level() / 3); i++) {
      const g = new Monster(this.world, 'kguard', L + 1, { x: st.x + (i ? 2 : -2), z: st.z + 2 }, { rank: 'normal' });
      g.noRespawn = true; g.respawnTime = 4; g.follow = camel; g.fOff = { x: i % 2 ? 2.4 : -2.4, z: 1.5 + i }; g.lifeT = 400;
      g.onKilled = () => this.gainJobExp(20 + g.level * 2);
      this.mm.list.push(g);
    }
    this.mission = { kind: 'raid', camel };
    this.hud.log('Bir tüccar kervanı yola çıktı! Yolu takip et, muhafızları geç ve deveyi düşür.', 'lvl');
    this.changed();
    return { ok: true, msg: 'Kervan şehrin dışında, yol üzerinde.' };
  }
  sellStolen() {
    const n = this.p.inv.count('sg');
    if (!n) return { ok: false, msg: 'Satacak çalıntı malın yok.' };
    if (this.job !== 'thief') return { ok: false, msg: 'Simsar sadece Hırsızlarla iş yapar.' };
    const L = this.p.stats.level, gold = n * (60 + 8 * L) * (1 + 0.1 * (this.level() - 1));
    this.p.inv.take('sg', n); this.p.stats.gold += Math.round(gold);
    this.gainJobExp(n * 45);
    return { ok: true, msg: n + ' Çalıntı Mal satıldı: +' + Math.round(gold).toLocaleString('tr-TR') + ' altın' };
  }

  update(dt) {
    const pl = this.p;
    // taşıyıcı deve: oyuncuyu takip eder
    const t = this.transport;
    if (t) {
      const P = pl.pos, a = pl.heading, tx = P.x - Math.sin(a) * 3.2, tz = P.z - Math.cos(a) * 3.2;
      const d = Math.hypot(tx - t.x, tz - t.z);
      let moving = false;
      if (d > 60) { t.group.position.set(tx, 0, tz); }
      else if (d > 1) moving = t.moveTo(tx, tz, CONFIG.playerSpeed * (pl.d.speed || 1) * (d > 8 ? 1.25 : 0.98), dt, this.world.obstacles) > 0;
      t.anim(moving);
      if (!pl.dead && this.cargoCount() > 0 && !inSafeZone(P.x, P.z)) {
        this.ambushT -= dt;
        if (this.ambushT <= 0) {
          this.ambushT = 45 + Math.random() * 35;
          const n = 2 + Math.floor(pl.stats.level / 40) + (this.cargoCount() > 40 ? 1 : 0);
          this._spawnThieves(t, n, pl.stats.level);
          this.hud.banner('Hırsız Baskını!', 'Kervanını koru!', 'zerk'); SFX.play('region');
        }
      }
      if (!inSafeZone(t.x, t.z) || t.hp >= t.maxHp) { /* */ } else t.hp = Math.min(t.maxHp, t.hp + t.maxHp * 0.02 * dt);
    }
    // avcı görevi: kervanı yürüt, dalgalar halinde hırsız
    const ms = this.mission;
    if (ms && ms.kind === 'escort') {
      const c = ms.ent;
      if (c.dead) return;
      const threat = this.mm.list.some(m => !m.dead && m.typeKey === 'kthief' && Math.hypot(m.x - c.x, m.z - c.z) < 12);
      const near = Math.hypot(pl.pos.x - c.x, pl.pos.z - c.z) < 30;
      let moving = false;
      if (!threat && near) {
        const wp = ms.path[ms.i];
        if (!wp) {
          c.remove(); this.mission = null;
          const L = pl.stats.level, gold = Math.round((300 + 45 * L) * (1 + 0.15 * (this.level() - 1)));
          pl.stats.gold += gold;
          this.hud.banner('Kervan Güvende!', '+' + gold.toLocaleString('tr-TR') + ' altın', 'quest'); SFX.play('questdone');
          this.gainJobExp(400 + 25 * L);
          this.changed();
          return;
        }
        if (c.moveTo(wp.x, wp.z, 3.6, dt) < 1) ms.i++;
        moving = true;
        const prog = ms.i / ms.path.length;
        if (ms.wave < ms.waves.length && prog >= ms.waves[ms.wave]) {
          ms.wave++;
          this._spawnThieves(c, 2 + ms.wave + Math.floor(pl.stats.level / 30), pl.stats.level);
          this.hud.banner('Hırsızlar!', 'Kervanı koru (' + ms.wave + '/3)', 'zerk'); SFX.play('region');
        }
      }
      c.anim(moving);
    }
  }

  status() {
    const ms = this.mission;
    if (!ms) return null;
    if (ms.kind === 'escort') return 'Kervan koruma · %' + Math.round(ms.i / ms.path.length * 100) + ' · Can ' + Math.ceil(ms.ent.hp);
    return 'Kervan soygunu · deveyi düşür';
  }

  serialize() { return { j: this.job, e: this.jexp, c: this.cargo, cc: this.cargoCost, tr: this.transport ? Math.ceil(this.transport.hp) : 0 }; }
  load(d) {
    if (!d) return;
    this.job = JOBS[d.j] ? d.j : null; this.jexp = Math.max(0, d.e | 0);
    this.cargo = {}; for (const k in d.c || {}) if (goodOrigin(k)) this.cargo[k] = Math.max(0, d.c[k] | 0);
    this.cargoCost = Math.max(0, d.cc | 0);
    if (this.job) this.p.setCape(JOBS[this.job].cape);
    if (this.job === 'trader' && (d.tr > 0 || this.cargoCount())) this.summonTransport(d.tr || null);
  }
}
