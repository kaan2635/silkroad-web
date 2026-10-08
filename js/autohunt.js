// Oto av (iSRO botları sBot / mBot / phBot örnek alınarak): eğitim alanı, rütbeye göre yetenek setleri,
// güçlendirme / aşılama bakımı, berserk kuralları, koruma (iksir, hap, oturarak dinlenme, evcil bakımı),
// hedef kuralları (kaçınılacak rütbe ve türler, öncelik, başkasının avını çalmama), toplama filtresi,
// şehir döngüsü (dönüş parşömeni → iksir/ok al, tamir, çöp sat, depoya koy → atla alana dön),
// ölünce şehirde dirilip devam, durma koşulları ve saatlik istatistikler.
const BOT_DEFAULTS = {
  r: 28, walkBack: true, horse: true,
  atkN: [], atkS: [], buffs: [], autoSkills: true,     // atkN: normal canavar seti · atkS: güçlü canavar seti
  zerk: 'strong',                                        // never | full | strong
  hpPct: 50, mpPct: 35, pill: true, rest: true, restHp: 45, restMp: 30, petPot: 50, petFood: 30, pets: true,
  avoid: { unique: true, giant: false, party: false, elite: false, champion: false }, ignore: [], prio: 'aggro', noKS: true, maxAbove: 8,
  pick: { gold: true, gear: true, minDeg: 0, sealOnly: false, pots: true, mats: true, quest: true, other: true },
  town: true, hpBelow: 15, mpBelow: 15, arrowBelow: 80, freeBelow: 2, durBelow: 15,
  buyHp: 200, buyMp: 200, buyPill: 20, buyArrow: 1000, repair: true, sellJunk: true, keepBlue: 2, storeSeal: true, storeMats: true,
  onDeath: 'town', stopLevel: 0, stopMin: 0
};

class AutoHunt {
  constructor(player, combat, monsters, hotbar, loot, hud) {
    this.p = player; this.c = combat; this.mm = monsters; this.hb = hotbar; this.loot = loot; this.hud = hud;
    this.npcs = null; this.pets = null; this.social = null;
    this.on = false; this.state = 'idle'; this.anchor = null; this.skip = new WeakSet(); this.t = 0; this.restT = 0;
    this.cfg = JSON.parse(JSON.stringify(BOT_DEFAULTS));
    this.st = this._newStats();
    this.onChange = null; this.onStats = null;
    this._wrap();
  }
  get radius() { return this.cfg.r; }
  _newStats() { return { t0: 0, run: 0, kills: 0, exp: 0, gold: 0, items: 0, deaths: 0, trips: 0, spent: 0 }; }
  // Kayıt: karakter adına göre
  loadCfg() {
    try { const d = JSON.parse(localStorage.getItem('srw-bot:' + this.p.name)); if (d) { this.cfg = Object.assign(JSON.parse(JSON.stringify(BOT_DEFAULTS)), d); this.cfg.avoid = Object.assign({}, BOT_DEFAULTS.avoid, d.avoid); this.cfg.pick = Object.assign({}, BOT_DEFAULTS.pick, d.pick); if (d.area && d.area.zone === CUR_ZONE_ID) this.anchor = { x: d.area.x, z: d.area.z }; } } catch (e) { /* yok */ }
  }
  saveCfg() {
    try { localStorage.setItem('srw-bot:' + this.p.name, JSON.stringify({ ...this.cfg, area: this.anchor ? { zone: CUR_ZONE_ID, x: this.anchor.x, z: this.anchor.z } : null })); } catch (e) { /* yok */ }
  }
  // İstatistik için oyun fonksiyonlarını sar
  _wrap() {
    const c = this.c, self = this, ge = c.gainExp.bind(c);
    c.gainExp = n => { if (self.on) self.st.exp += n; return ge(n); };
    const col = this.loot._collect.bind(this.loot);
    this.loot.filter = d => !self.on || self.wantDrop(d);
    this.loot._collect = d => { if (self.on) { if (d.kind === 'gold') self.st.gold += d.amount; else self.st.items++; } return col(d); };
  }
  setArea() { this.anchor = { x: this.p.pos.x, z: this.p.pos.z }; this.saveCfg(); this.hud.log('Eğitim alanı buraya ayarlandı (' + this.cfg.r + ' m).', 'sys'); }

  toggle(force) {
    const on = force === undefined ? !this.on : force;
    if (on === this.on) return;
    if (on) {
      if (this.p.dead) return;
      if (ZONE.event) { this.hud.log('Etkinliklerde oto av kapalı.', 'dmg'); return; }
      const P = this.p.pos, safe = inSafeZone(P.x, P.z) && !IS_DUNGEON;
      if (!this.anchor || (!safe && Math.hypot(P.x - this.anchor.x, P.z - this.anchor.z) > this.cfg.r + 40)) {
        if (safe) { this.hud.log('Eğitim alanı yok: av alanına yürü ve OTO\'ya bas (ya da Oto Av penceresinde alanı ayarla).', 'dmg'); SFX.play('error'); return; }
        this.anchor = { x: P.x, z: P.z };
      }
      this.on = true; this.st = this._newStats(); this.st.t0 = performance.now(); this.state = safe ? 'back' : 'hunt';
      this._ensureSkills();
      if (this.cfg.pets && this.pets) { if (!this.pets.grab && (this.p.inv.count('pet_grab') || this.p.inv.count('pet_grab2'))) this.pets.toggleGrab(true); }
      this.saveCfg();
      this.hud.log('Oto av başladı: ' + this.cfg.r + ' m alan' + (this.cfg.town ? ', şehir döngüsü açık' : '') + '. Elle yürürsen durur.', 'lvl', '#8ef07a');
      SFX.play('buff');
    } else {
      this.st.run = performance.now() - this.st.t0;
      this.on = false; this.state = 'idle'; this.c.stopAttack(); this.p.target = null;
      if (this.p.sitting && !(this.social && this.social.stall.open)) this.p.sitting = false;
      this.hud.log('Oto av durdu · ' + this.summary(), 'sys');
    }
    if (this.onChange) this.onChange(this.on);
  }
  manual() { if (this.on && this.state !== 'dead') this.toggle(false); }
  summary() {
    const s = this.st, h = Math.max(1 / 60, (this.on ? performance.now() - s.t0 : s.run) / 3.6e6);
    return s.kills + ' av · ' + Math.round(s.exp / h).toLocaleString('tr-TR') + ' EXP/sa · ' + Math.round(s.gold / h).toLocaleString('tr-TR') + ' altın/sa';
  }

  // ---------- Yetenek setleri ----------
  learnedActive() { return SKILL_DEFS.filter(s => this.p.book.r(s.id) > 0 && s.type !== 'passive'); }
  _ensureSkills() {
    const c = this.cfg; if (!c.autoSkills && (c.atkN.length || c.atkS.length || c.buffs.length)) return;
    const L = this.learnedActive(), hot = new Set(); for (const pg of this.hb.pages) for (const e of pg) if (e && e.t === 'sk') hot.add(e.id);
    const pick = f => L.filter(f).sort((a, b) => (hot.has(b.id) - hot.has(a.id)) || b.reqM - a.reqM).map(s => s.id);
    c.atkS = pick(s => s.type === 'atk' || s.type === 'nuke');
    c.atkN = c.atkS.filter(id => { const s = SKILLS_BY_ID[id]; return s.cd <= 10; }).slice(0, 4);
    if (!c.atkN.length) c.atkN = c.atkS.slice(0, 3);
    c.buffs = pick(s => s.type === 'buff' || s.type === 'imbue' || s.type === 'absorb');
  }
  _strong(m) { return m && m.rank && m.rank !== 'normal' && m.rank !== 'strong'; }

  // ---------- Hedef ----------
  _ksTaken(m) {
    if (!this.cfg.noKS || !this.social) return false;
    if (m.targetEnt && m.targetEnt.bot && !this.social.party.includes(m.targetEnt.bot.id)) return true;
    return this.social.sims.some(s => s.target === m && !this.social.party.includes(s.bot.id));
  }
  _validTarget(m, attacker) {
    const c = this.cfg;
    if (!m || m.dead || m.removed || m.walker || m.pvp || m.type.job) return false;
    if (attacker) return Math.hypot(m.x - this.p.pos.x, m.z - this.p.pos.z) < 16;    // bize saldıranla her zaman savaş
    if (c.avoid[m.rank]) return false;
    if (c.ignore.includes(m.typeKey)) return false;
    if (m.level > this.p.stats.level + c.maxAbove) return false;
    if (inSafeZone(m.x, m.z)) return false;
    if (this._ksTaken(m)) return false;
    return Math.hypot(m.x - this.anchor.x, m.z - this.anchor.z) < c.r + 6;
  }
  _attacking(m) { return !m.dead && m.state === 'chase' && !m.targetEnt && Math.hypot(m.x - this.p.pos.x, m.z - this.p.pos.z) < 16; }
  _pickTarget() {
    const P = this.p.pos, pr = this.cfg.prio;
    let best = null, bv = 1e9;
    for (const m of this.mm.list) {
      const agg = this._attacking(m);
      if (!this._validTarget(m, agg)) continue;
      const d = Math.hypot(m.x - P.x, m.z - P.z);
      let v = d;
      if (pr === 'weak') v = m.hp / m.maxHp * 40 + d * 0.5;
      else if (pr === 'strong') v = d - (this._strong(m) ? 60 : 0);
      if (agg) v -= 100;                                   // saldıranlar önce
      if (v < bv) { bv = v; best = m; }
    }
    return best;
  }

  // ---------- Yetenek kullanımı ----------
  _useSkills(t) {
    const c = this.c, pl = this.p, book = pl.book, cfg = this.cfg;
    if (c.gcd > 0 || c.queued || pl.disabled()) return;
    for (const id of cfg.buffs) {
      const s = SKILLS_BY_ID[id]; if (!s || !book.r(id) || c.cd[id] > 0 || pl.stats.mp < rankMp(s, book.r(id)) || c._checkWeapon(s)) continue;
      if (s.type === 'buff' && (!pl.buffs[id] || pl.buffs[id].t < 3) && !(s.buff && s.buff.revive && pl.buffs[id])) { c.castSkill(id); return; }
      if (s.type === 'imbue' && (!pl.imbue || pl.imbue.t < 1.5) && t) { c.castSkill(id); return; }
      if (s.type === 'absorb' && !pl.absorb && t && pl.stats.hp / pl.stats.maxHp < 0.85) { c.castSkill(id); return; }
    }
    for (const s of this.learnedActive()) {   // şifa / arınma her zaman
      if (c.cd[s.id] > 0 || pl.stats.mp < rankMp(s, book.r(s.id)) || c._checkWeapon(s)) continue;
      if (s.type === 'heal' && pl.stats.hp / pl.stats.maxHp < 0.55) { c.castSkill(s.id); return; }
      if (s.type === 'cure' && ['stun', 'freeze', 'burn', 'poison', 'bleed', 'slow'].some(k => pl.status[k])) { c.castSkill(s.id); return; }
    }
    if (!t) return;
    // berserk
    const z = cfg.zerk;
    if (pl.stats.zerk >= ZERK_MAX && pl.zerkT <= 0 && (z === 'full' || (z === 'strong' && this._strong(t)))) c.activateZerk();
    const set = this._strong(t) ? cfg.atkS : cfg.atkN;
    for (const id of set) {
      const s = SKILLS_BY_ID[id]; if (!s || !book.r(id) || c.cd[id] > 0) continue;
      if ((s.type !== 'atk' && s.type !== 'nuke') || pl.stats.mp < rankMp(s, book.r(id)) * 1.3 || c._checkWeapon(s)) continue;
      if (s.at === 'self' && c.dist(t) > (s.aoe || 5)) continue;
      c.target = t; c.castSkill(id); return;
    }
  }
  // ---------- Koruma ----------
  _protect(dt) {
    const c = this.c, s = this.p.stats, inv = this.p.inv, cfg = this.cfg;
    const best = kind => { for (let g = POT_GRADES.length; g >= 1; g--) { const b = kind + g; if (s.level >= ITEM_BASES[b].req && inv.count(b)) return b; } return null; };
    if (!this.p.sitting) {
      if (s.hp / s.maxHp * 100 < cfg.hpPct && !c.cd.pot_hp) { const b = best('hp'); if (b) c.useItem(b); }
      if (s.mp / s.maxMp * 100 < cfg.mpPct && !c.cd.pot_mp) { const b = best('mp'); if (b) c.useItem(b); }
    }
    if (cfg.pill && ['burn', 'poison', 'freeze', 'stun', 'bleed'].some(k => this.p.status[k]) && !c.cd.pill && inv.count('pill')) c.useItem('pill');
    const P = this.pets;
    if (P && P.atk) {
      if (P.atk.hp / P.atk.maxHp * 100 < cfg.petPot && !c.cd.petpot && inv.count('pet_pot')) c.useItem('pet_pot');
      if (P.pstat().hunger < cfg.petFood && inv.count('pet_food') && !c.cd.petpot) c.useItem('pet_food');
    }
  }
  _potCount(kind) { let n = 0; for (let g = 1; g <= POT_GRADES.length; g++) n += this.p.inv.count(kind + g); return n; }
  // Şehre dönme gerekçesi (yoksa null)
  _needTown() {
    const c = this.cfg, inv = this.p.inv;
    if (!c.town || IS_DUNGEON) return null;
    if (c.buyHp && this._potCount('hp') < c.hpBelow) return 'can iksiri bitti';
    if (c.buyMp && this._potCount('mp') < c.mpBelow) return 'mana iksiri bitti';
    if (this.p.d.ammo && inv.count('arrow') < c.arrowBelow) return 'ok bitti';
    if (inv.freeCount() < c.freeBelow) return 'envanter doldu';
    for (const k in inv.equip) { const it = inv.equip[k]; if (it && isGear(it.base) && ITEM_BASES[it.base].cat !== 'avatar' && it.dur / maxDur(it) * 100 < c.durBelow) return 'eşya yıprandı'; }
    return null;
  }

  // ---------- Toplama filtresi ----------
  wantDrop(d) {
    const p = this.cfg.pick;
    if (d.kind === 'gold') return p.gold;
    const it = d.item, b = ITEM_BASES[it.base];
    if (!b) return false;
    if (b.cat === 'quest') return p.quest;
    if (isGear(it.base)) { if (!p.gear) return false; if (p.sealOnly && !it.rarity) return false; return (b.d || 1) >= p.minDeg; }
    if (/^(hp|mp)\d$/.test(it.base) || it.base === 'pill') return p.pots;
    if (b.cat === 'mat') return p.mats;
    return p.other;
  }

  // ---------- Döngü ----------
  update(dt) {
    if (!this.on) return;
    const pl = this.p, c = this.c, cfg = this.cfg, P = pl.pos;
    if (this.st && this.onStats) this.onStats();
    // durma koşulları
    if (cfg.stopLevel && pl.stats.level >= cfg.stopLevel) { this.hud.banner('Oto av durdu', cfg.stopLevel + '. seviyeye ulaşıldı', 'quest'); this.toggle(false); return; }
    if (cfg.stopMin && performance.now() - this.st.t0 > cfg.stopMin * 60000) { this.hud.banner('Oto av durdu', cfg.stopMin + ' dakika doldu', 'quest'); this.toggle(false); return; }
    // ölüm
    if (pl.dead) {
      if (this.state !== 'dead') { this.state = 'dead'; this.st.deaths++; this.deadT = 0; c.stopAttack(); }
      if (cfg.onDeath !== 'town') { this.toggle(false); return; }
      if ((this.deadT += dt) > 5) { c.respawn(); this.state = 'town'; this.townStep = 0; this.stepT = 0; this.st.trips++; this.hud.log('Oto av: şehirde dirildin, ikmalden sonra alana dönülecek.', 'sys'); }
      return;
    }
    this._protect(dt);
    this.t -= dt; if (this.t > 0) return; this.t = 0.25;
    if (pl.disabled()) return;
    const safe = inSafeZone(P.x, P.z) && !IS_DUNGEON;
    if (this.state === 'hunt' || this.state === 'rest') this._hunt(safe);
    else if (this.state === 'toTown') this._toTown(safe);
    else if (this.state === 'town') this._town();
    else if (this.state === 'back') this._back(safe);
  }
  _hunt(safe) {
    const pl = this.p, c = this.c, cfg = this.cfg, P = pl.pos;
    if (safe) { this.state = 'back'; return; }
    // şehre dönüş gerekiyor mu (savaşta değilken)
    const need = this._needTown();
    if (need && !this.mm.list.some(m => this._attacking(m))) { this._goTown(need); return; }
    let t = c.target && !c.target.dead ? c.target : null;
    if (t && !this._validTarget(t, this._attacking(t))) t = null;
    if (!t || (c.dist(t) > 18 && !this._attacking(t))) { const n = this._pickTarget(); if (n) t = n; }
    // dinlenme: düşman yokken oturup yenilen
    const s = pl.stats, low = s.hp / s.maxHp * 100 < cfg.restHp || s.mp / s.maxMp * 100 < cfg.restMp;
    if (this.state === 'rest') {
      if (this.mm.list.some(m => this._attacking(m))) { pl.sitting = false; this.state = 'hunt'; }
      else if (s.hp / s.maxHp > 0.95 && s.mp / s.maxMp > 0.9) { pl.sitting = false; this.state = 'hunt'; }
      else return;
    }
    if (t) {
      if (pl.sitting) pl.sitting = false;
      if (c.target !== t) c.select(t, true); else if (!c.attacking && !c.queued) c.startAttack();
      this._useSkills(t);
      return;
    }
    this._useSkills(null);
    if (cfg.rest && low && !pl.sitting && pl.combatT <= 0) { pl.target = null; if (pl.toggleSit() === true) { this.state = 'rest'; return; } }
    // ganimet
    for (const d of this.loot.drops) if (Math.hypot(d.x - P.x, d.z - P.z) < 1.0) this.skip.add(d);
    const drop = this.loot.drops.filter(d => d.cool <= 0 && !this.skip.has(d) && this.wantDrop(d) && Math.hypot(d.x - P.x, d.z - P.z) < 16 && Math.hypot(d.x - this.anchor.x, d.z - this.anchor.z) < cfg.r + 8)
      .sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
    if (drop) { pl.target = { x: drop.x, z: drop.z }; return; }
    // alanın içinde dolaş / merkeze dön
    const far = Math.hypot(P.x - this.anchor.x, P.z - this.anchor.z);
    if (!pl.target) {
      if (far > cfg.r * 0.6) pl.target = { x: this.anchor.x + (Math.random() - 0.5) * 6, z: this.anchor.z + (Math.random() - 0.5) * 6 };
      else if (Math.random() < 0.15) { const a = Math.random() * 6.283, r = Math.random() * cfg.r * 0.7; pl.target = { x: this.anchor.x + Math.sin(a) * r, z: this.anchor.z + Math.cos(a) * r }; }
    }
  }
  _goTown(why) {
    const pl = this.p, c = this.c;
    this.hud.log('Oto av: ' + why + ' — şehre dönülüyor.', 'sys', '#ffd27a');
    c.stopAttack(); pl.target = null;
    this.state = 'toTown'; this.tries = 0;
  }
  _toTown(safe) {
    const pl = this.p;
    if (safe) { this.state = 'town'; this.st.trips++; this.townStep = 0; this.stepT = 0; if (this.pets && this.pets.mounted) this.pets.toggleMount(false); return; }
    const c = this.c;
    if (c.casting) return;                                           // parşömen okunuyor (kıpırdama)
    if (this.mm.list.some(m => this._attacking(m))) { this.state = 'hunt'; return; }   // önce saldıranı öldür
    if (this.tries < 3 && pl.inv.count('ret') && !(pl.jobs && pl.jobs.mission)) {
      if (c.cd.scroll > 0) { if (this.tries) return; }
      else { pl.target = null; if (!pl.moving) { if (c.useItem('ret')) this.tries++; else this.tries = 3; } return; }
    }
    this._mount(); this._walk(0, 6);
  }
  // Şehir surları: kapılardan geçerek yürü (surların içinden dışına düz çizgi duvara takılır)
  _exits() {
    if (this._ex !== undefined) return this._ex;
    const ob = this.mm.world ? this.mm.world.obstacles : [], walls = ob.filter(o => o.type === 'wall' && Math.hypot(o.x, o.z) < 60);
    if (walls.length < 8) return (this._ex = null);
    const W = Math.max(...walls.map(o => Math.max(Math.abs(o.x), Math.abs(o.z)))), sides = {};
    for (const o of ob) {
      if (o.type !== 'gate') continue;
      const ax = Math.abs(o.x), az = Math.abs(o.z);
      if (Math.abs(Math.max(ax, az) - W) > 3) continue;
      const k = az > ax ? 'z' + Math.sign(o.z) : 'x' + Math.sign(o.x);
      (sides[k] = sides[k] || []).push(o);
    }
    const ex = [];
    for (const k in sides) {
      const g = sides[k], alongX = k[0] === 'z'; g.sort((a, b) => alongX ? a.x - b.x : a.z - b.z);
      const m = g.length >> 1, a = g[m - 1] || g[0], b = g[m] || g[0], cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2, sg = +k.slice(1);
      ex.push(alongX ? { ix: cx, iz: cz - sg * 4, ox: cx, oz: cz + sg * 5 } : { ix: cx - sg * 4, iz: cz, ox: cx + sg * 5, oz: cz });
    }
    return (this._ex = ex.length ? { W, ex } : null);
  }
  _walk(tx, tz) {
    const P = this.p.pos, E = this._exits();
    if (E) {
      const W = E.W - 0.5, inside = (x, z) => Math.abs(x) < W && Math.abs(z) < W, pin = inside(P.x, P.z);
      if (pin !== inside(tx, tz)) {
        let best = null, bd = 1e9;
        for (const e of E.ex) { const d = pin ? Math.hypot(P.x - e.ix, P.z - e.iz) + Math.hypot(e.ox - tx, e.oz - tz) : Math.hypot(P.x - e.ox, P.z - e.oz) + Math.hypot(e.ix - tx, e.iz - tz); if (d < bd) { bd = d; best = e; } }
        const near = pin ? [best.ix, best.iz] : [best.ox, best.oz], far = pin ? [best.ox, best.oz] : [best.ix, best.iz];
        const p = Math.hypot(P.x - near[0], P.z - near[1]) < 2.5 || Math.hypot(P.x - far[0], P.z - far[1]) < Math.hypot(near[0] - far[0], near[1] - far[1]) ? far : near;
        this.p.target = { x: p[0], z: p[1] }; return;
      }
    }
    this.p.target = { x: tx, z: tz };
  }
  _mount() {
    const P = this.pets; if (!this.cfg.horse || !P || P.mounted || this.p.combatT > 0) return;
    const h = this.p.inv.count('horse2') ? 'horse2' : this.p.inv.count('horse') ? 'horse' : null;
    if (h && !this.c.cd.mount) this.c.useItem(h);
  }
  // Şehir adımları: NPC'lere yürü, alışveriş / tamir / satış / depo
  _townPlan() {
    const steps = [], c = this.cfg;
    if (c.buyHp || c.buyMp || c.buyPill) steps.push('merchant');
    if (c.repair || c.sellJunk || (this.p.d.ammo && c.buyArrow)) steps.push('smith');
    if (c.storeSeal || c.storeMats) steps.push('storage');
    return steps;
  }
  _town() {
    const pl = this.p, plan = this._townPlan();
    if (this.townStep >= plan.length) { this.hud.log('Oto av: ikmal bitti, eğitim alanına dönülüyor.', 'sys', '#8ef07a'); this.state = 'back'; return; }
    const id = plan[this.townStep], npc = this.npcs && this.npcs.list.find(n => n.id === id);
    if (!npc) { this.townStep++; return; }
    const d = Math.hypot(npc.x - pl.pos.x, npc.z - pl.pos.z);
    if (d > 3.2) { this._walk(npc.x + (Math.sign(-npc.x) || 1) * 1.8, npc.z + (Math.sign(-npc.z) || 1) * 1.8); this.stepT += 0.25; if (this.stepT > 30) { this.townStep++; this.stepT = 0; } return; }
    pl.target = null; this.stepT = 0;
    this._npcAct(id);
    this.townStep++;
  }
  _buy(base, want) {
    const s = this.p.stats, inv = this.p.inv;
    const have = inv.count(base), n = Math.max(0, want - have);
    if (!n) return 0;
    const unit = base === 'arrow' ? 0.5 : Eco.buyPrice(base);
    const can = Math.min(n, Math.floor(s.gold / Math.max(0.5, unit)));
    if (can <= 0 || !inv.canAdd(base, can)) return 0;
    const cost = Math.ceil(unit * can);
    s.gold -= cost; this.st.spent += cost; inv.add(makeStack(base, can)); Eco.exp('buy', cost);
    return can;
  }
  _npcAct(id) {
    const c = this.cfg, inv = this.p.inv, s = this.p.stats, out = [];
    if (id === 'merchant') {
      const L = s.level, hp = potFor(L, 'hp'), mp = potFor(L, 'mp');
      if (c.buyHp) { const n = this._buy(hp, c.buyHp); if (n) out.push(n + ' ' + ITEM_BASES[hp].name); }
      if (c.buyMp) { const n = this._buy(mp, c.buyMp); if (n) out.push(n + ' ' + ITEM_BASES[mp].name); }
      if (c.buyPill) { const n = this._buy('pill', c.buyPill); if (n) out.push(n + ' Evrensel Hap'); }
      if (!inv.count('ret')) { const n = this._buy('ret', 3); if (n) out.push(n + ' Dönüş Parşömeni'); }
      this.hb.upgradePots(L);
    } else if (id === 'smith') {
      if (c.sellJunk) {
        let g = 0, k = 0;
        inv.slots.forEach((it, i) => {
          if (!it || !isGear(it.base) || ITEM_BASES[it.base].cat === 'avatar') return;
          if (it.rarity || (it.plus || 0) >= 3 || (it.blues || []).length >= c.keepBlue) return;
          const pr = sellPrice(it); g += pr; k++; Eco.onSell(it, pr); inv.slots[i] = null;
        });
        if (k) { s.gold += g; out.push(k + ' eşya satıldı (+' + g.toLocaleString('tr-TR') + ')'); }
      }
      if (c.repair) { const rc = inv.repairCost(); if (rc > 0 && s.gold >= rc) { s.gold -= rc; this.st.spent += rc; inv.repairAll(); out.push('tamir'); } }
      if (this.p.d.ammo && c.buyArrow) { const n = this._buy('arrow', c.buyArrow); if (n) out.push(n + ' ok'); }
    } else if (id === 'storage') {
      let k = 0;
      inv.slots.forEach((it, i) => {
        if (!it) return;
        const b = ITEM_BASES[it.base];
        const store = (c.storeSeal && it.rarity) || (c.storeMats && b.cat === 'mat' && !/^(hp|mp)\d$/.test(it.base) && it.base !== 'arrow');
        if (!store || inv.free(inv.storage) < 0 && !(isStack(it.base) && inv.storage.some(x => x && x.base === it.base))) return;
        if (inv.add(it, inv.storage, true)) { inv.slots[i] = null; k++; }
      });
      if (k) out.push(k + ' eşya depoya');
    }
    inv.changed();
    if (out.length) { this.hud.log('Oto av · ' + (id === 'merchant' ? 'Şifacı' : id === 'smith' ? 'Demirci' : 'Depo') + ': ' + out.join(', '), 'sys', '#9fe3ff'); SFX.play('coin'); }
  }
  _back(safe) {
    const pl = this.p, P = pl.pos, d = Math.hypot(P.x - this.anchor.x, P.z - this.anchor.z);
    if (d < this.cfg.r * 0.5) { this.state = 'hunt'; if (this.pets && this.pets.mounted) this.pets.toggleMount(false); return; }
    if (!this.cfg.walkBack) { this.toggle(false); return; }
    if (!safe && this.mm.list.some(m => this._attacking(m))) { if (this.pets && this.pets.mounted) this.pets.toggleMount(false); this.state = 'hunt'; return; }   // yolda saldırı: savaş
    if (d > 40) this._mount();
    this._walk(this.anchor.x, this.anchor.z);
  }
  onKill() { if (this.on) this.st.kills++; }
}
