// Otomatik avlanma (Auto-hunt): başlatıldığı noktanın çevresinde en yakın canavarı seçer, hotbardaki
// saldırı yeteneklerini sırayla kullanır, süresi biten güçlendirme / aşılamaları yeniler, iksir içer,
// yakındaki ganimeti toplar ve alanın dışına çıkınca başlangıç noktasına döner.
// Elle yürüme (WASD / joystick / yere tıklama), ölüm, şehir ya da bölge değişimi oto avı durdurur.
class AutoHunt {
  constructor(player, combat, monsters, hotbar, loot, hud) {
    this.p = player; this.c = combat; this.mm = monsters; this.hb = hotbar; this.loot = loot; this.hud = hud;
    this.on = false; this.anchor = null; this.skip = new WeakSet(); this.t = 0; this.idleT = 0; this.kills = 0; this.startT = 0;
    this.onChange = null;
  }
  get radius() { return Settings.data.huntR || 28; }
  toggle(force) {
    const on = force === undefined ? !this.on : force;
    if (on === this.on) return;
    if (on) {
      if (this.p.dead) return;
      if (inSafeZone(this.p.pos.x, this.p.pos.z) && !IS_DUNGEON) { this.hud.log('Oto av şehir dışında çalışır. Önce av alanına yürü.', 'dmg'); SFX.play('error'); return; }
      this.on = true; this.anchor = { x: this.p.pos.x, z: this.p.pos.z }; this.kills = 0; this.startT = performance.now();
      this.hud.log('Oto av başladı (' + this.radius + ' m alan). Durdurmak için yeniden bas ya da elle yürü.', 'lvl', '#8ef07a');
      SFX.play('buff');
    } else {
      this.on = false; this.c.stopAttack();
      this.hud.log('Oto av durdu' + (this.kills ? ' · ' + this.kills + ' av' : '') + '.', 'sys');
    }
    if (this.onChange) this.onChange(this.on);
  }
  // Elle hareket algılanınca çağrılır
  manual() { if (this.on) this.toggle(false); }

  _slots() {
    const out = [];
    for (const page of this.hb.pages) for (const e of page) if (e && e.t === 'sk') out.push(e.id);
    return out;
  }
  _validTarget(m) {
    if (!m || m.dead || m.removed || m.walker || m.pvp || m.type.job) return false;
    if (m.rank === 'unique' && m.level > this.p.stats.level + 5) return false;      // çok güçlü unique'e kendiliğinden dalmaz
    if (inSafeZone(m.x, m.z)) return false;
    return Math.hypot(m.x - this.anchor.x, m.z - this.anchor.z) < this.radius + 6;
  }
  _pickTarget() {
    const p = this.p.pos;
    // önce bize saldıranlar
    let best = null, bd = 1e9;
    for (const m of this.mm.list) {
      if (!this._validTarget(m) && !(m.state === 'chase' && !m.dead && !m.walker && !m.targetEnt && Math.hypot(m.x - p.x, m.z - p.z) < 12)) continue;
      const d = Math.hypot(m.x - p.x, m.z - p.z) - (m.state === 'chase' ? 30 : 0) + (m.rank === 'unique' ? 10 : 0);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }
  // Süresi biten güçlendirme / aşılama yeteneklerini yenile, sonra saldırı yeteneği
  _useSkills(t) {
    const c = this.c, pl = this.p, book = pl.book;
    if (c.gcd > 0 || c.queued || pl.disabled()) return;
    const ids = this._slots();
    for (const id of ids) {
      const s = SKILLS_BY_ID[id]; if (!s || !book.r(id) || c.cd[id] > 0) continue;
      if (pl.stats.mp < rankMp(s, book.r(id))) continue;
      if (c._checkWeapon(s)) continue;
      if (s.type === 'buff' && (!pl.buffs[id] || pl.buffs[id].t < 3) && !(s.buff && s.buff.revive && pl.buffs[id])) { c.castSkill(id); return; }
      if (s.type === 'imbue' && (!pl.imbue || pl.imbue.t < 1.5)) { c.castSkill(id); return; }
      if (s.type === 'heal' && pl.stats.hp / pl.stats.maxHp < 0.55) { c.castSkill(id); return; }
      if (s.type === 'absorb' && !pl.absorb && pl.stats.hp / pl.stats.maxHp < 0.8) { c.castSkill(id); return; }
      if (s.type === 'cure' && Object.keys(pl.status).some(k => pl.status[k])) { c.castSkill(id); return; }
    }
    if (!t) return;
    for (const id of ids) {
      const s = SKILLS_BY_ID[id]; if (!s || !book.r(id) || c.cd[id] > 0) continue;
      if ((s.type !== 'atk' && s.type !== 'nuke') || pl.stats.mp < rankMp(s, book.r(id)) * 1.5) continue;
      if (c._checkWeapon(s)) continue;
      if (s.at === 'self' && c.dist(t) > (s.aoe || 5)) continue;
      c.target = t; c.castSkill(id); return;
    }
  }
  _potions() {
    const c = this.c, s = this.p.stats, inv = this.p.inv;
    const best = kind => { for (let g = POT_GRADES.length; g >= 1; g--) { const b = kind + g; if (s.level >= ITEM_BASES[b].req && inv.count(b)) return b; } return null; };
    if (s.hp / s.maxHp < (Settings.data.autohp || 0.45) && !c.cd.pot_hp) { const b = best('hp'); if (b) c.useItem(b); }
    if (s.mp / s.maxMp < (Settings.data.automp || 0.3) && !c.cd.pot_mp) { const b = best('mp'); if (b) c.useItem(b); }
    const bad = ['burn', 'poison', 'freeze', 'stun'].some(k => this.p.status[k]);
    if (bad && !c.cd.pill && inv.count('pill')) c.useItem('pill');
  }
  update(dt) {
    if (!this.on) return;
    const pl = this.p, c = this.c;
    if (pl.dead) { this.toggle(false); return; }
    this._potions();
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 0.25;
    if (pl.disabled()) return;
    const P = pl.pos, far = Math.hypot(P.x - this.anchor.x, P.z - this.anchor.z);
    let t = c.target && !c.target.dead ? c.target : null;
    if (t && !this._validTarget(t) && t.state !== 'chase') t = null;
    if (!t || (c.dist(t) > 18 && t.state !== 'chase')) { const n = this._pickTarget(); if (n) t = n; }
    if (t) {
      this.idleT = 0;
      if (c.target !== t) { c.select(t, true); }
      else if (!c.attacking && !c.queued) c.startAttack();
      this._useSkills(t);
      return;
    }
    // hedef yok: güçlendirmeleri tazele, ganimeti topla, merkeze dön
    this._useSkills(null);
    for (const d of this.loot.drops) if (Math.hypot(d.x - P.x, d.z - P.z) < 1.0) this.skip.add(d);     // üstünde durduğumuz halde alınamayan (çanta dolu) ganimet
    const drop = this.loot.drops.filter(d => d.cool <= 0 && !this.skip.has(d) && Math.hypot(d.x - P.x, d.z - P.z) < 14 && Math.hypot(d.x - this.anchor.x, d.z - this.anchor.z) < this.radius + 6)
      .sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
    if (drop) { pl.target = { x: drop.x, z: drop.z }; return; }
    if (far > 6 && !pl.target) pl.target = { x: this.anchor.x + (Math.random() - 0.5) * 4, z: this.anchor.z + (Math.random() - 0.5) * 4 };
    this.idleT += 0.25;
  }
  // kills: Combat.killMonster bildirir
  onKill() { if (this.on) this.kills++; }
}
