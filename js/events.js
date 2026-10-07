// Etkinlikler (iSRO): Savaş Arenası, Bayrak Kapmaca (CTF), Hayatta Kalma Arenası, Kale Savaşı (yapay loncalara karşı),
// Gold Time (EXP/SP/ganimet artışı), günlük giriş ödülü takvimi, Magic POP (Silk çarkı), mevsimsel etkinlik, Arena Jetonu mağazası.

const EV_INFO = {
  arena:    { name: 'Savaş Arenası', icon: 'ev_arena', min: 20, dur: 360, goal: 15, desc: '4\'e 4 takım savaşı. 15 öldürmeye ilk ulaşan takım kazanır.' },
  ctf:      { name: 'Bayrak Kapmaca', icon: 'ev_ctf', min: 20, dur: 480, goal: 3, desc: 'Rakip bayrağı kap, kendi üssüne getir. Rakip de seninkini çalmaya çalışır. 3 sayı kazanır.' },
  survival: { name: 'Hayatta Kalma Arenası', icon: 'ev_surv', min: 15, dur: 900, goal: 10, desc: 'Tek başına 10 dalga canavar ve pelerinli savaşçıya karşı dayan. Her dalga ödül verir.' },
  fortress: { name: 'Kale Savaşı', icon: 'ev_fort', min: 30, dur: 720, goal: 1, desc: 'Loncanla bir kaleye saldır: kuleleri ve savunucuları geç, Kale Kalbi\'ni yık. Kale senin olur, her gün vergi toplarsın.' }
};
const FORTS = {
  jangan:         { name: 'Jangan Kalesi', tax: 15000, lv: 30, color: 0xff6a3a },
  hotan:          { name: 'Hotan Kalesi', tax: 30000, lv: 60, color: 0x6ad8ff },
  constantinople: { name: 'Konstantinopolis Kalesi', tax: 45000, lv: 80, color: 0xffd23a },
  bandit:         { name: 'Haydut Kalesi', tax: 70000, lv: 100, color: 0xb070ff }
};
const SEASONS = [
  { id: 'halloween', name: 'Cadılar Bayramı', from: [10, 1], to: [11, 7], item: 'pumpkin', desc: 'Canavarlardan Bal Kabağı düşer. Topla ve ödüllerle değiştir.',
    rewards: [['av_hat_witch', 1, 15], ['silkbag', 1, 5], ['elx_w', 2, 3], ['luck', 2, 2]] },
  { id: 'winter', name: 'Kış Şenliği', from: [12, 15], to: [1, 6], item: 'snowflake', desc: 'Canavarlardan Kar Tanesi düşer. Topla ve ödüllerle değiştir.',
    rewards: [['av_att_halo', 1, 20], ['silkbag', 1, 5], ['elx_a', 3, 3], ['astral', 1, 4]] }
];
const MAGIC_POP_COST = 15;
const MAGIC_POP = [
  { w: 28, kind: 'silk', n: 5 }, { w: 14, kind: 'silk', n: 15 }, { w: 14, kind: 'item', id: 'elx_w', n: 3 }, { w: 10, kind: 'item', id: 'elx_a', n: 5 },
  { w: 10, kind: 'item', id: 'luck', n: 3 }, { w: 6, kind: 'item', id: 'astral', n: 2 }, { w: 4, kind: 'item', id: 'immortal', n: 1 },
  { w: 5, kind: 'seal', r: 2 }, { w: 2, kind: 'seal', r: 3 }, { w: 2, kind: 'avatar' }, { w: 0.6, kind: 'item', id: 'pet_grab2', n: 1 }, { w: 0.4, kind: 'silk', n: 200, jackpot: true }
];
const ARENA_SHOP = [['elx_w', 1, 5], ['elx_a', 2, 5], ['luck', 2, 4], ['astral', 1, 12], ['immortal', 1, 30], ['spd', 5, 3], ['silkbag', 1, 10], ['av_att_flag', 1, 60], ['@moon', 1, 40], ['@sun', 1, 120]];

class Events {
  constructor(o) {
    Object.assign(this, o);    // world, player, monsters, combat, hud, social, loot, vfx
    this.att = { m: '', got: [], last: '' };
    this.forts = {}; Object.keys(FORTS).forEach((k, i) => { this.forts[k] = { owner: SOC_GUILDS[(i * 5 + 3) % SOC_GUILDS.length], since: SOC_EPOCH }; });
    this.taxDay = ''; this.pops = 0; this.best = {};
    this.match = null; this.onChange = null;
    this._patchHud();
    this.season = this.curSeason();
    if (this.season && !IS_DUNGEON) this._decorate();
  }
  changed() { if (this.onChange) this.onChange(); }
  serialize() { return { att: this.att, forts: this.forts, taxDay: this.taxDay, pops: this.pops, best: this.best }; }
  load(d) {
    if (!d) { if (ZONE.event && !this.match) this._setupMatch(); return; }
    if (d.att) this.att = d.att;
    if (d.forts) for (const k in FORTS) if (d.forts[k]) this.forts[k] = d.forts[k];
    this.taxDay = d.taxDay || ''; this.pops = d.pops | 0; this.best = d.best || {};
    // 7 günden eski kale sahipliği: yapay loncalar geri alır
    for (const k in this.forts) { const f = this.forts[k]; if (f.mine && Date.now() - f.since > 7 * 864e5) { f.mine = false; f.owner = SOC_GUILDS[Math.floor(Math.random() * SOC_GUILDS.length)]; f.since = Date.now(); this.hud.log(FORTS[k].name + ' kuşatmada kaybedildi: artık ' + f.owner + ' loncasının.', 'dmg'); } }
    if (ZONE.event && !this.match) this._setupMatch();
  }

  // ---------- Zaman ----------
  today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  // Gold Time: her gün 20:00–22:00, hafta sonu ayrıca 13:00–15:00 (yerel saat)
  goldLeft() {
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600, we = d.getDay() === 0 || d.getDay() === 6;
    if (h >= 20 && h < 22) return (22 - h) * 3600;
    if (we && h >= 13 && h < 15) return (15 - h) * 3600;
    return 0;
  }
  nextGold() {
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60, we = d.getDay() === 0 || d.getDay() === 6;
    if (we && h < 13) return (13 - h) * 3600;
    if (h < 20) return (20 - h) * 3600;
    return (24 - h + ((d.getDay() + 1) % 7 === 6 || (d.getDay() + 1) % 7 === 0 ? 13 : 20)) * 3600;
  }
  expMult() { return this.goldLeft() > 0 ? 1.5 : 1; }
  dropMult() { return this.goldLeft() > 0 ? 1.3 : 1; }
  curSeason() {
    const d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate();
    return SEASONS.find(s => { const a = s.from[0] * 100 + s.from[1], b = s.to[0] * 100 + s.to[1]; return a <= b ? md >= a && md <= b : md >= a || md <= b; }) || null;
  }
  _patchHud() {
    const hud = this.hud, ob = hud.buffList.bind(hud);
    hud.buffList = () => {
      const o = ob(), g = this.goldLeft();
      if (g > 0) o.push({ key: 'gold', ico: icon('ev_gold', 'gold'), t: g, max: 7200, name: 'Gold Time: EXP/SP +%50, ganimet +%30' });
      return o;
    };
  }
  _decorate() {
    // şehir meydanına mevsim süsleri (bal kabağı fenerleri / kardan süsler)
    const s = this.season, g = new THREE.Group();
    const mat = s.id === 'halloween' ? new THREE.MeshLambertMaterial({ color: 0xff7a1a, emissive: 0x6a2a00 }) : new THREE.MeshLambertMaterial({ color: 0xf0f8ff, emissive: 0x2a3a5a });
    const eye = new THREE.MeshBasicMaterial({ color: s.id === 'halloween' ? 0xffe060 : 0x6ad8ff });
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * 6.283, r = 9 + (i % 2) * 2.5, x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (this.world.obstacles.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 0.8)) continue;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat); p.scale.y = 0.8; p.position.set(x, terrainHeight(x, z) + 0.34, z); g.add(p);
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.04), eye); e.position.set(x + Math.sin(a) * 0.4 + Math.cos(a) * sx * 0.14, p.position.y + 0.08, z + Math.cos(a) * 0.4 - Math.sin(a) * sx * 0.14); g.add(e); }
    }
    this.world.scene.add(g);
  }
  onKill(m) {
    const s = this.season;
    if (s && !m.pvp && m.level >= this.player.stats.level - 12 && Math.random() < (m.rank === 'unique' ? 1 : 0.07)) this.loot.spawn('item', m.x + 0.6, m.z + 0.4, { item: makeStack(s.item, m.rank === 'unique' ? 5 : 1) });
    if (this.match && this.match.type === 'survival' && m.evEnemy) this.match.killed++;
  }

  // ---------- Giriş ödülü ----------
  attReward(day) {
    const L = this.player.stats.level;
    if (day % 7 === 0) return [[['silkbag', 2], ['astral', 1]], [['immortal', 1], ['elx_w', 3]], [['silkbag', 4], ['luck', 5]], [['@moon', 1], ['silkbag', 5]]][day / 7 - 1];
    const cyc = [[[potFor(L, 'hp'), 30]], [[potFor(L, 'mp'), 30]], [['elx_w', 1]], [['@gold', 5000 + L * 200]], [['luck', 2]], [['spd', 3]]];
    return cyc[(day - 1) % 6];
  }
  claimAtt() {
    const t = this.today(), m = t.slice(0, 7);
    if (this.att.m !== m) this.att = { m, got: [], last: '' };
    if (this.att.last === t) return { ok: false, msg: 'Bugünün ödülünü zaten aldın. Yarın yine gel!' };
    const day = this.att.got.length + 1;
    if (day > 28) return { ok: false, msg: 'Bu ayın takvimi tamamlandı.' };
    const names = this._give(this.attReward(day));
    this.att.got.push(day); this.att.last = t;
    SFX.play('questdone'); this.changed();
    return { ok: true, msg: day + '. gün ödülü: ' + names.join(', ') };
  }
  _give(list) {
    const pl = this.player, out = [];
    for (const [id, n] of list) {
      if (id === '@gold') { pl.stats.gold += n; out.push(n.toLocaleString('tr-TR') + ' altın'); continue; }
      if (id === '@silk') { pl.stats.silk = (pl.stats.silk || 0) + n; out.push(n + ' Silk'); continue; }
      if (id === '@moon' || id === '@sun') { const it = this._sealGear(id === '@sun' ? 3 : 2); pl.inv.add(it); out.push(itemInfo(it).name); continue; }
      if (isStack(id)) pl.inv.addStack(id, n); else pl.inv.add(makeItem(id));
      out.push(ITEM_BASES[id].name + (n > 1 ? ' x' + n : ''));
    }
    pl.inv.changed();
    return out;
  }
  _sealGear(r) {
    const L = this.player.stats.level, d = degreeOf(L), ws = raceWeapons(), as = raceArmors(), q = Math.random();
    const base = q < 0.4 ? ws[Math.floor(Math.random() * ws.length)] + '_' + d : q < 0.85 ? ARMOR_PARTS[Math.floor(Math.random() * 6)] + '_' + as[Math.floor(Math.random() * as.length)] + '_' + d : ['earring', 'necklace', 'ring'][Math.floor(Math.random() * 3)] + '_' + d;
    return makeSeal(base + tierFor(d, L), r);
  }

  // ---------- Magic POP ----------
  magicPop() {
    const pl = this.player;
    if ((pl.stats.silk || 0) < MAGIC_POP_COST) return { ok: false, msg: 'Magic POP için ' + MAGIC_POP_COST + ' Silk gerekli.' };
    if (pl.inv.free() < 0) return { ok: false, msg: 'Envanterde yer aç.' };
    pl.stats.silk -= MAGIC_POP_COST; this.pops++;
    let r = Math.random() * MAGIC_POP.reduce((a, p) => a + p.w, 0), prize = MAGIC_POP[0];
    for (const p of MAGIC_POP) { r -= p.w; if (r <= 0) { prize = p; break; } }
    let name;
    if (prize.kind === 'silk') { pl.stats.silk += prize.n; name = prize.n + ' Silk'; }
    else if (prize.kind === 'item') name = this._give([[prize.id, prize.n]])[0];
    else if (prize.kind === 'seal') { const it = this._sealGear(prize.r); pl.inv.add(it); name = itemInfo(it).name; }
    else { const ids = Object.keys(AVATARS).filter(k => !AVATARS[k].event), id = ids[Math.floor(Math.random() * ids.length)]; pl.inv.add(makeItem(id)); name = AVATARS[id].name; }
    if (prize.jackpot || prize.kind === 'seal' && prize.r >= 3 || prize.id === 'pet_grab2') this.social.chat.add('global', null, pl.name + ' Magic POP\'tan ' + name + ' kazandı!');
    pl.inv.changed(); this.changed();
    return { ok: true, msg: 'Magic POP: ' + name, prize, name };
  }

  // ---------- Mevsim takası ----------
  seasonTrade(i) {
    const s = this.season, rw = s && s.rewards[i], inv = this.player.inv;
    if (!rw) return { ok: false, msg: '' };
    if (inv.count(s.item) < rw[2]) return { ok: false, msg: rw[2] + ' ' + ITEM_BASES[s.item].name + ' gerekli.' };
    inv.take(s.item, rw[2]);
    const n = this._give([[rw[0], rw[1]]]);
    this.changed();
    return { ok: true, msg: n.join(', ') + ' aldın.' };
  }
  arenaBuy(i) {
    const x = ARENA_SHOP[i], inv = this.player.inv;
    if (!x) return { ok: false };
    if (inv.count('arena_coin') < x[2]) return { ok: false, msg: x[2] + ' Arena Jetonu gerekli.' };
    if (inv.free() < 0) return { ok: false, msg: 'Envanterde yer aç.' };
    inv.take('arena_coin', x[2]);
    const n = this._give([[x[0], x[1]]]); this.changed();
    return { ok: true, msg: n.join(', ') + ' aldın.' };
  }
  claimTax() {
    const t = this.today();
    const mine = Object.keys(this.forts).filter(k => this.forts[k].mine);
    if (!mine.length) return { ok: false, msg: 'Kalen yok. Kale Savaşı\'nda bir kale ele geçir.' };
    if (this.taxDay === t) return { ok: false, msg: 'Bugünün vergisi toplandı.' };
    const g = mine.reduce((a, k) => a + FORTS[k].tax, 0);
    this.player.stats.gold += g; this.taxDay = t; SFX.play('gold'); this.changed();
    return { ok: true, msg: 'Kale vergisi: +' + g.toLocaleString('tr-TR') + ' altın' };
  }

  // ---------- Etkinliğe katılma ----------
  canJoin(type, fort) {
    const pl = this.player, I = EV_INFO[type];
    if (pl.stats.level < I.min) return I.min + '. seviye gerekli.';
    if (IS_DUNGEON && !ZONE.event) return 'Zindandan önce çık.';
    if (ZONE.event) return 'Zaten bir etkinliktesin.';
    if (pl.combatT > 0) return 'Savaştayken katılamazsın.';
    if (type === 'fortress') {
      if (!this.social.guild) return 'Kale Savaşı için bir loncan olmalı (Topluluk → Lonca).';
      if (!FORTS[fort]) return 'Kale seç.';
      if (this.forts[fort].mine) return 'Bu kale zaten senin.';
    }
    return null;
  }
  join(type, fort) {
    const err = this.canJoin(type, fort);
    if (err) return { ok: false, msg: err };
    try { sessionStorage.setItem('srw-ev', JSON.stringify({ type, from: CUR_ZONE_ID, lvl: this.player.stats.level, fort: fort || null, t: Date.now() })); } catch (e) { /* yok */ }
    this.combat.travel(type);
    return { ok: true, msg: EV_INFO[type].name + '\'na gidiliyor…' };
  }
  leave() { try { sessionStorage.removeItem('srw-ev'); } catch (e) { /* yok */ } this.combat.travel(ZONE.parent); }

  // ---------- Maç kurulumu ----------
  _setupMatch() {
    const ev = ZONE.ev;
    if (!ev) { this.hud.log('Etkinlik bitti. Görevliyle konuşup dön.', 'sys'); return; }
    const L = this.player.stats.level, B = Dungeon.bases;
    this.match = { type: ev.type, t: 0, start: 10, dur: EV_INFO[ev.type].dur, us: 0, them: 0, over: false, allies: [], enemies: [], killed: 0, wave: 0, waveT: 0, fort: ev.fort, lvl: L };
    this.social.allyBase = B.ally; this.social.allyGoal = { x: 92, z: 0 };
    this.hud.banner(EV_INFO[ev.type].name, 'Hazırlan: 10 saniye', 'unique');
    const used = new Set(this.social.party);
    const pickBots = (n, filter) => {
      const c = Roster.filter(b => !used.has(b.id) && Math.abs(botLevel(b) - L) <= 8 && (!filter || filter(b)));
      const out = [];
      while (out.length < n && c.length) { const b = c.splice(Math.floor(Math.random() * c.length), 1)[0]; used.add(b.id); out.push(b); }
      while (out.length < n) { const b = Roster[Math.floor(Math.random() * Roster.length)]; if (!used.has(b.id)) { used.add(b.id); out.push(b); } }
      return out;
    };
    // müttefikler: parti üyeleri önce, sonra lonca / rastgele
    const nAlly = ev.type === 'survival' ? 0 : ev.type === 'fortress' ? 5 : 3;
    let allyBots = [];
    if (nAlly) {
      const party = this.social.party.map(id => Roster[id]);
      allyBots = party.slice(0, nAlly);
      if (ev.type === 'fortress' && this.social.guild) for (const id of this.social.guild.members) if (allyBots.length < nAlly && !allyBots.includes(Roster[id])) { allyBots.push(Roster[id]); used.add(id); }
      allyBots = allyBots.concat(pickBots(nAlly - allyBots.length));
    }
    // parti botları müttefik olarak savaşır
    for (const s of this.social.sims) if (this.social.party.includes(s.bot.id)) { s.mode = 'ally'; }
    allyBots.forEach((b, i) => {
      let s = this.social.sim(b.id);
      if (!s) { s = new SimPlayer(this.social, b, 'ally', 2 + i * 1.5, 4); this.social.sims.push(s); }
      s.mode = 'ally'; s.slot = i; s._cape(ev.type === 'fortress' ? null : 0x2a6ad0); s.relabel();
      this.match.allies.push(s);
    });
    this.match.enemyBots = ev.type === 'survival' ? [] : ev.type === 'fortress'
      ? pickBots(6, b => b.g === SOC_GUILDS.indexOf(this.forts[ev.fort].owner)) : pickBots(ev.type === 'ctf' ? 3 : 4);
    if (ev.type === 'ctf') this._flags();
  }
  _go() {
    const M = this.match, B = Dungeon.bases, pl = this.player;
    M.started = true;
    pl.teleport(B.ally.x - 4, B.ally.z);
    M.allies.forEach((s, i) => { s.group.position.set(B.ally.x + 2, 0, B.ally.z - 4 + i * 2.5); });
    this.hud.banner(EV_INFO[M.type].name + ' başladı!', M.type === 'survival' ? 'Dalga 1' : M.type === 'fortress' ? 'Kale Kalbi\'ni yık!' : 'Rakip üs doğuda', 'unique');
    SFX.play('region');
    if (M.type === 'survival') { this._wave(); return; }
    this.social.allyGoal = M.type === 'fortress' ? { x: 112, z: 0 } : { x: 100, z: 0 };
    M.enemyBots.forEach((b, i) => this._spawnEnemy(b, i));
    if (M.type === 'fortress') this._fortSetup();
  }
  _spawnEnemy(b, i) {
    const M = this.match, B = Dungeon.bases;
    const lvl = Math.max(1, M.lvl + (M.type === 'fortress' ? 2 : 0) + Math.floor(Math.random() * 3) - 1);
    const m = this.social.makePvpMob(b, lvl, B.enemy.x - 4 - (i % 3) * 2, B.enemy.z - 6 + (i % 4) * 4, 'event');
    m.type.aggro = 200; m.evEnemy = true; m.home = { x: B.enemy.x - 10, z: B.enemy.z };
    if (M.type === 'fortress' || M.type === 'ctf' && i === 0) { m.guard = true; m.type.aggro = 30; m.state = 'idle'; }
    m.onKilled = () => {
      if (M.over) return;
      if (M.type === 'arena') M.us++;
      this.hud.log(b.name + ' yenildi.', 'exp');
      setTimeout(() => { m.removed = true; if (!M.over) this._spawnEnemy(b, i); }, M.type === 'fortress' ? 9000 : 6000);
    };
    M.enemies[i] = m;
    return m;
  }
  _fortSetup() {
    const M = this.match, B = Dungeon.bases, f = FORTS[M.fort], L = M.lvl;
    MONSTER_TYPES.fw_heart = { name: 'Kale Kalbi', model: 'struct', look: { kind: 'heart', color: f.color }, hpM: 22, dmgM: 0, defM: 1.6, expM: 0, speed: 0, aggro: 0, range: 0, atkInt: 99, hit: 2.6, scale: 1, labelY: 6 };
    MONSTER_TYPES.fw_tower = { name: 'Savunma Kulesi', model: 'struct', look: { kind: 'tower', color: f.color }, hpM: 5, dmgM: 0.8, defM: 1.4, expM: 0, speed: 0, aggro: 18, range: 18, atkInt: 2.4, hit: 2.0, scale: 1, labelY: 8.2, magic: true };
    const heart = new Monster(this.world, 'fw_heart', L + 3, { x: B.enemy.x, z: B.enemy.z }, { rank: 'normal' });
    heart.pvp = 'fort'; heart.evEnemy = true; heart.noRespawn = true; heart.noLeash = true;
    heart.onKilled = () => { if (!M.over) this._end(true); };
    this.monsters.list.push(heart); M.heart = heart;
    M.towers = [-18, 18].map(z => {
      const t = new Monster(this.world, 'fw_tower', L + 2, { x: 118, z }, { rank: 'normal' });
      t.pvp = 'fort'; t.evEnemy = true; t.noRespawn = true; t.noLeash = true;
      t.onKilled = () => { this.hud.log('Savunma kulesi yıkıldı!', 'exp'); SFX.play('kill'); };
      this.monsters.list.push(t); return t;
    });
  }
  _flags() {
    const B = Dungeon.bases, mk = col => {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), new THREE.MeshLambertMaterial({ color: 0x5a3a1a })); pole.position.y = 1.6; g.add(pole);
      const cl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 1.2), new THREE.MeshLambertMaterial({ color: col, emissive: new THREE.Color(col).multiplyScalar(0.3) })); cl.position.set(0, 2.7, 0.6); g.add(cl);
      return g;
    };
    const M = this.match;
    M.ourFlag = { mesh: mk(0x2a6ad0), at: 'base', home: B.ally, pos: { ...B.ally }, t: 0 };
    M.theirFlag = { mesh: mk(0xd02a2a), at: 'base', home: B.enemy, pos: { ...B.enemy }, t: 0 };
    for (const F of [M.ourFlag, M.theirFlag]) { F.mesh.position.set(F.home.x, terrainHeight(F.home.x, F.home.z), F.home.z); this.world.scene.add(F.mesh); }
    M.runT = 40;
  }
  _flagTo(F, where, holder) {
    F.at = where; F.holder = holder || null;
    if (F.mesh.parent) F.mesh.parent.remove(F.mesh);
    if (holder) { F.mesh.position.set(0, 0.6, -0.5); F.mesh.scale.setScalar(0.7); holder.add(F.mesh); }
    else { F.mesh.scale.setScalar(1); if (where === 'base') F.pos = { ...F.home }; F.mesh.position.set(F.pos.x, terrainHeight(F.pos.x, F.pos.z), F.pos.z); this.world.scene.add(F.mesh); }
  }
  _ctf(dt) {
    const M = this.match, pl = this.player, P = pl.pos, T = M.theirFlag, O = M.ourFlag;
    // rakip bayrağı kap / taşı / sayı yap
    if (!pl.dead && (T.at === 'base' || T.at === 'dropped') && Math.hypot(P.x - T.pos.x, P.z - T.pos.z) < 2.6) { this._flagTo(T, 'carried', pl.group); this.hud.banner('Rakip bayrağı kaptın!', 'Kendi üssüne götür', 'quest'); SFX.play('gem'); }
    if (T.at === 'carried' && Math.hypot(P.x - O.home.x, P.z - O.home.z) < 4.5) {
      if (O.at === 'base') { M.us++; this._flagTo(T, 'base'); this.hud.banner('SAYI! ' + M.us + ' – ' + M.them, 'Bayrak üssüne ulaştı', 'quest'); SFX.play('questdone'); this.social.addHonor(4, 'bayrak'); }
      else if (!M._warnO || performance.now() - M._warnO > 4000) { M._warnO = performance.now(); this.hud.log('Sayı için kendi bayrağın üssünde olmalı — çalanı yakala!', 'dmg'); }
    }
    // kendi bayrağını geri al (yere düşmüşse dokun)
    if (O.at === 'dropped' && Math.hypot(P.x - O.pos.x, P.z - O.pos.z) < 2.6) { this._flagTo(O, 'base'); this.hud.log('Bayrağını geri aldın.', 'exp'); }
    for (const F of [T, O]) if (F.at === 'dropped' && (F.t += dt) > 12) { F.t = 0; this._flagTo(F, 'base'); }
    // rakip koşucu: bayrağımızı çalıp kendi üssüne kaçar
    if (O.at === 'base' && !M.runner && (M.runT -= dt) <= 0) {
      M.runT = 45 + Math.random() * 30;
      const b = M.enemyBots[Math.floor(Math.random() * M.enemyBots.length)], B = Dungeon.bases;
      const m = this.social.makePvpMob(b, M.lvl, O.home.x + 2, O.home.z + 3, 'event');
      m.evEnemy = true; m.state = 'idle'; m.displayName = b.name + ' (bayrak hırsızı)'; m._makeLabel();
      m.walker = { path: [{ x: 70, z: 18 }, { x: 105, z: -12 }, { x: B.enemy.x - 2, z: B.enemy.z }], i: 0, speed: 5.2, onEnd: () => { if (M.over) return; M.them++; this._flagTo(O, 'base'); M.runner = null; this.hud.banner('Bayrağın kaçırıldı', M.us + ' – ' + M.them, 'unique'); SFX.play('fail'); } };
      m.onKilled = () => { M.runner = null; if (O.at === 'carried') { O.pos = { x: m.x, z: m.z }; this._flagTo(O, 'base'); } this.hud.log('Bayrak hırsızı durduruldu, bayrak üsse döndü.', 'exp'); };
      this._flagTo(O, 'carried', m.group);
      M.runner = m;
      this.hud.banner('Bayrağın çalınıyor!', b.name + ' kaçıyor — yakala!', 'unique'); SFX.play('region');
    }
  }
  _wave() {
    const M = this.match, L = M.lvl;
    M.wave++; M.waveT = 0;
    if (!M.pool) {
      const keys = Object.keys(MONSTER_TYPES).filter(k => { const t = MONSTER_TYPES[k]; return !t.unique && !t.job && !k.startsWith('pvp_') && !k.startsWith('fw_') && t.model !== 'camel' && t.hpM && t.speed > 2; });
      M.pool = []; for (let i = 0; i < 5; i++) M.pool.push(keys[Math.floor(Math.random() * keys.length)]);
    }
    const n = 2 + M.wave, lvl = Math.max(1, L - 4 + Math.floor(M.wave / 2));
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283, x = 92 + Math.sin(a) * 30, z = Math.cos(a) * 26;
      const m = new Monster(this.world, M.pool[i % M.pool.length], lvl, { x, z }, { rank: M.wave >= 8 && i === 0 ? 'champion' : M.wave % 3 === 0 && i < 2 ? 'strong' : 'normal' });
      m.type = Object.assign({}, m.type, { aggro: 200 }); m.evEnemy = true; m.noRespawn = true; m.respawnTime = 3; m.noLeash = true; m.state = 'chase';
      this.monsters.list.push(m);
    }
    if (M.wave >= 4 && M.wave % 2 === 0) {
      const b = Roster.filter(b => Math.abs(botLevel(b) - L) < 10)[M.wave % 10] || Roster[M.wave];
      const m = this.social.makePvpMob(b, lvl, 92, 0, 'event'); m.type.aggro = 200; m.evEnemy = true;
      m.onKilled = () => { m.dead = true; M.killed++; this.social.addHonor(3, 'arena'); };
    }
    this.hud.banner('Dalga ' + M.wave + ' / 10', n + ' düşman', 'unique'); SFX.play('region');
  }
  // Oyuncu etkinlikte öldü: arenada üste yeniden doğar (EXP kaybı yok)
  handleDeath() {
    const M = this.match; if (!M || !M.started || M.over) return false;
    if (M.type === 'survival') { setTimeout(() => this._end(false), 1500); return false; }
    M.them++;
    if (M.ourFlag && M.theirFlag.at === 'carried' && M.theirFlag.holder === this.player.group) { M.theirFlag.pos = { x: this.player.pos.x, z: this.player.pos.z }; this._flagTo(M.theirFlag, 'dropped'); }
    this.hud.log('Yenildin! 5 saniye sonra üste doğacaksın.', 'dmg');
    setTimeout(() => {
      const pl = this.player; if (!pl.dead) return;
      pl.revive(); pl.stats.hp = pl.stats.maxHp; pl.stats.mp = pl.stats.maxMp;
      const B = Dungeon.bases; pl.teleport(B.ally.x - 4, B.ally.z);
    }, 5000);
    return true;
  }
  _end(win) {
    const M = this.match; if (!M || M.over) return;
    M.over = true;
    const pl = this.player, I = EV_INFO[M.type];
    let coins = 0, honor = 0, gold = 0, exp = 0;
    if (M.type === 'survival') { const w = M.wave - (win ? 0 : 1); coins = w * 2; honor = w * 3; exp = Math.round(pl.stats.maxExp * 0.02 * w); win = w >= 10; this.best.survival = Math.max(this.best.survival || 0, w); }
    else if (M.type === 'fortress') {
      if (win) { const f = this.forts[M.fort]; f.owner = this.social.guild.name; f.mine = true; f.since = Date.now(); coins = 25; honor = 60; gold = FORTS[M.fort].tax; this.social.chat.add('global', null, this.social.guild.name + ' loncası ' + FORTS[M.fort].name + '\'ni ele geçirdi!'); }
      else { coins = 5; honor = 10; }
    } else { coins = win ? 10 : 4; honor = win ? 20 : 6; exp = Math.round(pl.stats.maxExp * (win ? 0.05 : 0.02)); }
    if (coins) pl.inv.addStack('arena_coin', coins);
    if (gold) pl.stats.gold += gold;
    if (exp) this.combat.gainExp(exp);
    if (honor) this.social.addHonor(honor, I.name);
    this.hud.banner(win ? 'ZAFER!' : 'Etkinlik bitti', (M.type === 'survival' ? (M.wave - (win ? 0 : 1)) + ' dalga · ' : M.type === 'fortress' ? '' : M.us + ' – ' + M.them + ' · ') + '+' + coins + ' Arena Jetonu · +' + honor + ' onur', win ? 'quest' : 'unique');
    SFX.play(win ? 'questdone' : 'fail');
    this.hud.log(I.name + ' sona erdi. 10 saniye sonra döneceksin.', 'lvl');
    for (const m of this.monsters.list) if (m.evEnemy && !m.dead) { m.die(); m.noRespawn = true; }
    pl.inv.changed(); this.changed();
    setTimeout(() => { if (this.player.dead) { this.player.revive(); this.player.stats.hp = this.player.stats.maxHp; this.hud.showDeath(false); } this.leave(); }, 10000);
  }

  // ---------- Döngü ----------
  update(dt) {
    const M = this.match; if (!M || M.over) { if (M && M.over) this.hud.setTimer('Dönüş', 0); return; }
    M.t += dt;
    if (!M.started) { this.hud.setTimer('Başlıyor', M.start - M.t); if (M.t >= M.start) { M.t = 0; this._go(); } return; }
    const left = M.dur - M.t;
    const label = M.type === 'survival' ? 'Dalga ' + M.wave + '/10' : M.type === 'fortress' ? FORTS[M.fort].name + (M.heart ? ' · Kalp %' + Math.ceil(M.heart.hp / M.heart.maxHp * 100) : '') : EV_INFO[M.type].name.split(' ')[0] + ' ' + M.us + ' – ' + M.them;
    this.hud.setTimer(label, left);
    // müttefik yenilgileri rakibe sayı
    for (const s of M.allies) { if (s.dead && !s._counted) { s._counted = true; if (M.type === 'arena') M.them++; } if (!s.dead) s._counted = false; }
    // rakipler bazen müttefiklere yönelir
    if ((M.tgtT = (M.tgtT || 0) - dt) <= 0) {
      M.tgtT = 1.5;
      for (const m of M.enemies) if (m && !m.dead && !m.guard && Math.random() < 0.5) {
        const a = M.allies.filter(s => !s.dead).sort((p, q) => Math.hypot(p.x - m.x, p.z - m.z) - Math.hypot(q.x - m.x, q.z - m.z))[0];
        m.targetEnt = a || null;
      }
    }
    // kuleler ateş eder (görsel)
    if (M.towers) for (const t of M.towers) if (!t.dead && t.attackAnim > 0.27 && !t._shot) { t._shot = true; this.combat.vfx.projectile({ x: t.x, y: 6.2, z: t.z }, this.player, 'fire', () => {}); } else if (t.attackAnim <= 0) t._shot = false;
    if (M.type === 'fortress' && M.heart && !M.heart.dead) {
      const towersUp = M.towers.some(t => !t.dead);
      M.heart.dmgTakenMult = towersUp ? 0.35 : 1;          // kuleler ayaktayken kalp güçlü korunur
      if (!towersUp && !M._towersDown) { M._towersDown = true; this.hud.banner('Kuleler düştü!', 'Kale Kalbi artık savunmasız', 'quest'); this.social.allyGoal = { x: 136, z: 0 }; }
    }
    if (M.type === 'ctf') this._ctf(dt);
    if (M.type === 'survival') {
      const alive = this.monsters.list.some(m => m.evEnemy && !m.dead && !m.removed);
      if (!alive) { M.waveT += dt; if (M.wave >= 10) { this._end(true); return; } if (M.waveT > 6) this._wave(); else this.hud.setTimer('Sonraki dalga', 6 - M.waveT); }
    }
    const goal = EV_INFO[M.type].goal;
    if ((M.type === 'arena' || M.type === 'ctf') && (M.us >= goal || M.them >= goal)) { this._end(M.us >= goal); return; }
    if (left <= 0) this._end(M.type === 'survival' ? false : M.type === 'fortress' ? false : M.us > M.them);
  }
}
