// Savaş: hedefleme, otomatik saldırı (yakın / yay), yetenekler (ustalık sistemi), aşılama, durum etkileri,
// hasar formülleri, EXP + SP, berserk, ölüm ve yeniden doğma, sarf malzemesi kullanımı.

const expToNext = l => Math.round(60 * Math.pow(l, 1.85) + 60);
const MAX_LEVEL = 140;
const SP_PER_EXP = 14;           // her 1 EXP = 14 SP-EXP (400 SP-EXP = 1 SP)
const ZERK_MAX = 5;
const rnd = (a, b) => a + Math.random() * (b - a);

// Element → mermi görünümü
const projKind = elem => (elem === 'cold' ? 'ice' : elem === 'lightning' ? 'bolt' : elem === 'fire' || !elem ? 'fire' : elem);

class Combat {
  constructor(player, mm, world, camera) {
    this.player = player; this.mm = mm; this.world = world; this.camera = camera;
    this.hud = null; this.quests = null; this.loot = null; this.hotbar = null;
    this.target = null;
    this.attacking = false;
    this.cd = {}; this.cdMax = {};     // anahtar: yetenek id veya eşya bekleme grubu
    this.gcd = 0;
    this.casting = null;
    this.queued = null;               // menzile yürüyüp kullanılacak yetenek
    this.timers = [];
    this.inSafe = true;
    this.deathPos = null; this.recallPos = null;
    this.vfx = new VFX(world.scene, camera);
    this.potT = 0;

    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.3, 32),
      new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.85, depthTest: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.renderOrder = 4;
    this.ring.visible = false;
    world.scene.add(this.ring);

    window.addEventListener('keydown', e => {
      const a = document.activeElement;
      if (a && a.tagName === 'INPUT') return;
      if (e.code === 'Tab') { e.preventDefault(); this.targetNearest(); }
      else if (e.code === 'Space') { e.preventDefault(); this.toggleAttack(); }
      else if (e.code === 'Escape') { this.clearTarget(); }
      else if (e.code === 'KeyZ') this.activateZerk();
      else if (e.code === 'F1' || e.code === 'F2') { e.preventDefault(); if (this.hotbar) this.hotbar.setPage(e.code === 'F1' ? 0 : 1); }
      else {
        const m = /^Digit([1-8])$/.exec(e.code);
        if (m && this.hotbar) { const i = parseInt(m[1], 10) - 1; this.useSlot(this.hotbar.get(e.shiftKey ? 1 - this.hotbar.page : this.hotbar.page, i), i); }
      }
    });
  }

  // ---------- Hedefleme ----------
  pick(raycaster) {
    const hit = raycaster.intersectObjects(this.mm.hitMeshes(), false)[0];
    return hit ? hit.object.userData.monster : null;
  }
  select(m, attack) { this.target = m; if (attack) this.startAttack(); }
  clearTarget() { this.target = null; this.attacking = false; this.queued = null; }
  startAttack() {
    if (this.pets) this.pets.onAction();
    if (!this.target) { const t = this.mm.nearest(this.player.pos, 20); if (t) this.target = t; }
    if (!this.target) { this.hud.log('Hedef yok. Bir canavara dokun / tıkla.'); return; }
    this.attacking = true;
  }
  stopAttack() { this.attacking = false; this.queued = null; }
  toggleAttack() { if (this.attacking) this.stopAttack(); else this.startAttack(); }
  targetNearest() {
    const p = this.player.pos;
    const cands = this.mm.list.filter(m => !m.dead && Math.hypot(m.x - p.x, m.z - p.z) < 40 && m !== this.target)
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
    if (cands.length) this.target = cands[0];
    else if (!this.target) this.hud.log('Yakında canavar yok.');
  }
  dist(m) { return Math.hypot(m.x - this.player.pos.x, m.z - this.player.pos.z); }
  faceTarget(m) { this.player.heading = Math.atan2(m.x - this.player.pos.x, m.z - this.player.pos.z); }
  _target(maxAuto = 22) {
    let t = this.target && !this.target.dead ? this.target : null;
    if (!t) { t = this.mm.nearest(this.player.pos, maxAuto); if (t) this.target = t; }
    return t;
  }

  // ---------- Hasar ----------
  _K() { return 40 + 10 * this.player.stats.level; }
  _lvlPenalty(m) { const diff = m.level - this.player.stats.level; return diff > 0 ? Math.max(0.4, 1 - 0.04 * diff) : 1; }
  // Elementin ustalığı: Çin'de ustalığın kendisi, Avrupa'da büyünün geldiği sınıf
  _elemM(elem, mk) {
    const b = this.player.book.mastery;
    if (mk && MASTERIES[mk] && MASTERIES[mk].race === 'eu') return b[mk] || 0;
    return b[elem] || 0;
  }

  hitPhys(m, mult, o = {}) {
    if (m.dead) return;
    const pl = this.player, d = pl.d, K = this._K();
    let raw = rnd(d.phyMin, d.phyMax) * mult;
    const crit = Math.random() * 100 < d.crit;
    if (crit) raw *= 2;
    let dmg = raw * K / (K + m.pdef);
    let elem = null;
    if (pl.imbue) {
      const im = pl.imbue;
      dmg += rnd(d.magMin, d.magMax) * im.val * mult * (1 + this._elemM(im.elem, im.id && SKILLS_BY_ID[im.id] ? SKILLS_BY_ID[im.id].m : null) * 0.012) * K / (K + m.mdef);
      elem = im.elem;
      if (im.status && Math.random() < im.chance) m.applyStatus(im.status, im.sdur, dmg);
    }
    dmg *= this._lvlPenalty(m) * (m.dmgTakenMult || 1);
    if (o.status && Math.random() < o.chance) m.applyStatus(o.status, o.sdur, dmg);
    if (Math.random() < 1 / 30) pl.inv.wear('weapon');
    this.damageMonster(m, Math.max(1, Math.round(dmg)), crit, elem);
  }
  hitMag(m, mult, elem, o = {}) {
    if (m.dead) return;
    const pl = this.player, d = pl.d, K = this._K();
    let raw = rnd(d.magMin, d.magMax) * mult * (1 + this._elemM(elem, o.mk) * 0.012);
    const crit = Math.random() * 100 < d.crit * 0.5;
    if (crit) raw *= 1.8;
    let dmg = raw * K / (K + m.mdef) * this._lvlPenalty(m) * (m.dmgTakenMult || 1);
    if (o.status && Math.random() < o.chance) m.applyStatus(o.status, o.sdur, dmg);
    if (o.drain) { const st = pl.stats, h = Math.round(dmg * o.drain); st.hp = Math.min(st.maxHp, st.hp + h); if (h > 0) this.fx(pl, '+' + h, 'heal'); }
    this.damageMonster(m, Math.max(1, Math.round(dmg)), crit, elem);
  }
  damageMonster(m, dmg, crit, elem, dot) {
    if (m.dead) return;
    m.hp -= dmg;
    m.provoke();
    if (m.onHit && m.hp > 0) m.onHit();
    this.player.combatT = 5;
    this.fx(m, String(dmg), crit ? 'crit' : dot ? 'dot' : (elem ? ELEM_CLS[elem] : 'hit'));
    if (!dot) { SFX.play(crit ? 'crit' : 'hit'); this.vfx.hit(m, elem, crit); }
    if (m.hp <= 0) { m.hp = 0; this.killMonster(m); }
  }
  killMonster(m) {
    m.die();
    if (this.target === m) { this.target = null; this.attacking = false; this.queued = null; }
    if (m.pvp) { SFX.play('kill'); if (this.social) this.social.onPvpKill(m); return; }     // yapay oyuncu yenildi: EXP / ganimet yok, onur var
    const pl = this.player, s = pl.stats;
    const bonus = 1 + (pl.premT > 0 ? 0.5 : 0) + (pl.blessT > 0 ? 1 : 0);
    const exp = Math.max(1, Math.round(m.exp * clamp(1 + 0.15 * (m.level - s.level), 0.05, 1.5) * bonus * (this.social ? this.social.expMult() : 1)));
    if (m.rank === 'unique') { s.silk = (s.silk || 0) + 50; this.hud.log('+50 Silk (Unique)', 'lvl', '#ff9ae8'); }
    this.hud.log(m.displayName + ' öldürüldü. +' + exp + ' EXP', 'exp');
    SFX.play('kill');
    this.fx(pl, '+' + exp + ' EXP', 'exp');
    this.gainExp(exp);
    const sp = pl.book.gainSpExp(exp * SP_PER_EXP);
    if (sp) this.fx(pl, '+' + sp + ' SP', 'sp');
    if (pl.zerkT <= 0 && s.zerk < ZERK_MAX) {
      const before = Math.floor(s.zerk);
      s.zerk = Math.min(ZERK_MAX, s.zerk + m.zerkPts);
      if (s.zerk >= ZERK_MAX && before < ZERK_MAX) { this.hud.log('Berserk hazır! (Z ya da Berserk düğmesi)', 'lvl'); SFX.play('gem'); }
    }
    if (this.loot) this.loot.dropFrom(m);
    if (this.quests) this.quests.onKill(m.typeKey);
    if (this.auto) this.auto.onKill(m);
    if (this.social) this.social.onKill(m);
    if (m.onKilled) m.onKilled(this);
  }

  // Canavar oyuncuya vurur. kind: 'phys' | 'mag'
  damagePlayer(amount, m, kind = 'phys') {
    const pl = this.player, d = pl.d;
    if (pl.dead) return;
    pl.combatT = 5;
    if (kind === 'phys' && d.block && Math.random() * 100 < d.block) { this.fx(pl, 'Blok!', 'buff'); SFX.play('equip'); return; }
    const K = 40 + 10 * m.level, def = kind === 'mag' ? d.mdef : d.pdef;
    let dmg = amount * K / (K + def) * (0.9 + Math.random() * 0.2) * d.dmgTaken;
    dmg = Math.max(1, Math.round(dmg));
    if (pl.absorb) { const a = Math.min(pl.absorb.amt, dmg); pl.absorb.amt -= a; dmg -= a; if (a) this.fx(pl, 'Emildi ' + a, 'buff'); }
    if (dmg <= 0) return;
    if (this.pets) this.pets.onPlayerHit();
    if (m.pvp === 'duel' && pl.stats.hp - dmg < 1) { if (this.social) this.social.duelLost(m); return; }   // düelloda ölüm yok
    pl.stats.hp -= dmg;
    this.fx(pl, '-' + dmg, 'player');
    SFX.play('hurt');
    if (Math.random() < 1 / 25) pl.inv.wear(ARMOR_PARTS[Math.floor(Math.random() * 6)]);
    if (Math.random() < 1 / 40) pl.inv.wear('shield');
    const st = m.type.status;
    if (st && Math.random() < st.chance) this.statusPlayer(st.kind, st.dur, Math.max(1, Math.round(m.dmg * 0.12)));
    if (this.casting) { this.casting = null; this.hud.log('Büyü bozuldu!'); }
    if (pl.stats.hp <= 0) { pl.stats.hp = 0; this.die(m); }
  }
  statusPlayer(kind, dur, dps) {
    const pl = this.player;
    pl.status[kind] = { t: dur, dps, tick: 1 };
    this.fx(pl, STATUS_NAMES[kind] || kind, 'dmg');
    if (kind === 'slow') pl.recalc();
  }

  // ---------- EXP / seviye ----------
  gainExp(n) {
    const s = this.player.stats;
    if (s.level >= MAX_LEVEL) { s.exp = 0; return; }
    s.exp += n;
    let up = false;
    while (s.exp >= s.maxExp && s.level < MAX_LEVEL) {
      s.exp -= s.maxExp; s.level++; s.str++; s.int++; s.statPts += 3; s.silk = (s.silk || 0) + 5;
      s.maxExp = expToNext(s.level); up = true;
    }
    if (s.level >= MAX_LEVEL) s.exp = 0;
    if (up) {
      this.player.recalc();
      s.hp = s.maxHp; s.mp = s.maxMp;
      this.player.setName(this.player.name);
      this.hud.log('SEVİYE ATLADIN! Yeni seviye: ' + s.level + ' · +3 stat puanı (C)', 'lvl');
      SFX.play('levelup');
      this.fx(this.player, 'SEVİYE ATLADIN!', 'lvl');
      this.vfx.column(this.player.pos.x, this.player.pos.z, 0xffd23a, 6, 1.2); this.vfx.buffCast(this.player.pos.x, this.player.pos.z, 0xffd23a, VFX_PAL.force);
      if (this.onLevel) this.onLevel(s.level);
    }
  }
  allocate(stat, n = 1) {
    const s = this.player.stats;
    n = Math.min(n, s.statPts);
    if (n <= 0) return false;
    s.statPts -= n; s[stat] += n;
    const hpR = s.hp / s.maxHp, mpR = s.mp / s.maxMp;
    this.player.recalc();
    s.hp = Math.round(s.maxHp * hpR); s.mp = Math.round(s.maxMp * mpR);
    return true;
  }

  // ---------- Berserk ----------
  activateZerk() {
    const pl = this.player, s = pl.stats;
    if (pl.dead || pl.zerkT > 0) return;
    if (s.zerk < ZERK_MAX) { this.hud.log('Berserk küreleri dolu değil (' + Math.floor(s.zerk) + '/5).'); return; }
    s.zerk = 0; pl.zerkT = 30; pl.recalc();
    this.hud.banner('BERSERK!', 'Saldırı ve hız arttı', 'zerk');
    this.fx(pl, 'BERSERK!', 'lvl');
    this.vfx.burst(pl.pos.x, pl.pos.z, 0xff3a1a, 6, 0.7);
    SFX.play('buff');
  }

  // ---------- Ölüm / yeniden doğma ----------
  die(m) {
    const pl = this.player;
    pl.dead = true;
    this.attacking = false; this.target = null; this.casting = null; this.queued = null;
    this.deathPos = { x: pl.pos.x, z: pl.pos.z };
    this.pvpDeath = !!(m && m.pvp);
    this.hud.log((m ? m.displayName : 'Bir canavar') + ' seni yendi.', 'dmg');
    const rb = pl.buffs.fc_resur;
    if (rb && rb.st.revive) {                     // Kuvvet: Diriliş — bir kez yerinde dirilir
      const pct = rb.st.revive / 100;
      SFX.play('death');
      this.later(1.6, () => {
        if (!pl.dead) return;
        pl.revive(); pl.stats.hp = Math.max(1, Math.round(pl.stats.maxHp * pct));
        this.vfx.column(pl.pos.x, pl.pos.z, 0xfff0a0, 6, 1.2); SFX.play('levelup');
        this.hud.log('Diriliş ile yeniden ayağa kalktın.', 'lvl');
      });
      return;
    }
    this.hud.showDeath(true);
    SFX.play('death');
  }
  // Item Mall: Diriliş Parşömeni — öldüğün yerde tam canla
  resurrect() {
    const pl = this.player, s = pl.stats;
    if (!pl.dead || !pl.inv.take('rez', 1)) return false;
    pl.revive(); s.hp = s.maxHp; s.mp = s.maxMp;
    this.hud.showDeath(false);
    this.vfx.column(pl.pos.x, pl.pos.z, 0xfff0a0, 6, 1.2); SFX.play('levelup');
    this.hud.log('Diriliş Parşömeni ile dirildin.', 'lvl');
    return true;
  }
  respawn() {
    const pl = this.player, s = pl.stats;
    pl.revive();
    pl.teleport(0, 6);
    s.hp = Math.round(s.maxHp * 0.5); s.mp = Math.round(s.maxMp * 0.5);
    const murderer = this.social && this.social.murderT > 0;
    let loss = this.pvpDeath && !murderer ? 0 : Math.round(s.maxExp * (s.level < 10 ? 0.02 : 0.05) * (murderer ? 3 : 1));     // pelerinli PvP ölümü EXP kaybettirmez; katil ağır kaybeder
    s.exp = Math.max(0, s.exp - loss);
    if (murderer) { const g = Math.round(s.gold * 0.1); s.gold -= g; this.hud.log('Katil olarak öldün: -' + g + ' altın', 'dmg'); }
    this.pvpDeath = false;
    this.hud.showDeath(false);
    this.hud.log('Şehirde yeniden doğdun. -' + loss + ' EXP', 'dmg');
  }

  // ---------- Hotbar ----------
  slotKey(e) {
    if (!e) return null;
    if (e.t === 'sk') return e.id;
    if (e.t === 'it') { const b = ITEM_BASES[e.base]; return b ? (b.cd === 'pot' ? 'pot_' + b.use : b.cd || e.base) : null; }
    return null;
  }
  useSlot(e) {
    const pl = this.player;
    if (!e || pl.dead) return;
    if (e.t === 'atk') return this.toggleAttack();
    if (e.t === 'zerk') return this.activateZerk();
    if (e.t === 'sk') return this.castSkill(e.id);
    if (e.t === 'it') return this.useItem(e.base);
  }
  _setCd(key, t) { this.cd[key] = t; this.cdMax[key] = Math.max(0.01, t); }

  // ---------- Sarf malzemeleri ----------
  useItem(base) {
    const pl = this.player, s = pl.stats, b = ITEM_BASES[base], inv = pl.inv;
    if (!b || b.cat !== 'use') return false;
    const key = b.cd === 'pot' ? 'pot_' + b.use : b.cd;
    if (this.cd[key] > 0) return false;
    if (inv.count(base) <= 0) { this.hud.log(b.name + ' kalmadı.'); SFX.play('error'); return false; }
    if (s.level < (b.req || 1)) { this.hud.log(b.name + ' için ' + b.req + '. seviye gerekli.'); SFX.play('error'); return false; }
    let ok = true, cd = 1;
    if (['horse', 'camel', 'grabpet', 'atkpet', 'petpot'].includes(b.use)) {
      if (!this.pets || !this.pets.useItem(b)) return false;
      cd = b.use === 'petpot' ? 1 : 2;
      if (!b.keep) inv.take(base, 1);
      this._setCd(key, cd);
      return true;
    }
    if (['premium', 'bless', 'repair', 'resetstat', 'resetskill', 'invexp', 'stexp', 'silkbag', 'rez'].includes(b.use)) {
      if (b.use === 'rez') { this.hud.log('Diriliş Parşömeni ölünce ölüm ekranından kullanılır.'); return false; }
      if (b.use === 'premium') { pl.premT = (pl.premT || 0) + 3600; this.fx(pl, 'PREMIUM!', 'buff'); }
      else if (b.use === 'bless') { pl.blessT = (pl.blessT || 0) + 1800; this.fx(pl, 'Bereket!', 'buff'); }
      else if (b.use === 'repair') { if (!inv.repairCost()) { this.hud.log('Tamir edilecek eşya yok.'); return false; } inv.repairAll(); this.fx(pl, 'Tamir edildi', 'buff'); }
      else if (b.use === 'resetstat') {
        const base = 20 + s.level - 1, back = (s.str - base) + (s.int - base);
        if (back <= 0) { this.hud.log('Dağıtılmış stat puanın yok.'); return false; }
        s.str = base; s.int = base; s.statPts += back; pl.recalc(); s.hp = Math.min(s.hp, s.maxHp); this.hud.log(back + ' stat puanı geri verildi (C).', 'lvl');
      } else if (b.use === 'resetskill') {
        const n = pl.book.refund();
        if (!n) { this.hud.log('Harcanmış SP yok.'); return false; }
        pl.recalc(); this.hud.log(n.toLocaleString('tr-TR') + ' SP geri verildi (K).', 'lvl');
      } else if (b.use === 'invexp' || b.use === 'stexp') {
        if (!inv.expand(b.use === 'invexp' ? 'inv' : 'st')) { this.hud.log('Zaten en büyük boyutta.'); return false; }
        this.hud.log(b.use === 'invexp' ? 'Envanter genişledi: ' + inv.slots.length + ' yuva' : 'Depo genişledi: ' + inv.storage.length + ' yuva', 'lvl');
      } else if (b.use === 'silkbag') { const n = 5 + Math.floor(Math.random() * 11); s.silk = (s.silk || 0) + n; this.fx(pl, '+' + n + ' Silk', 'sp'); this.hud.log('+' + n + ' Silk', 'lvl', '#ff9ae8'); }
      SFX.play('buff'); pl.recalc();
      inv.take(base, 1); this._setCd(key || 'misc', 1);
      return true;
    }
    if (b.use === 'fwinv') {
      if (IS_DUNGEON) { this.hud.log('Zindandayken kullanılamaz.'); return false; }
      if (pl.combatT > 0) { this.hud.log('Savaştayken kullanılamaz.'); return false; }
      if (this.jobs && (this.jobs.cargoCount() || this.jobs.mission)) { this.hud.log('Kervanla / görevdeyken kullanılamaz.'); return false; }
      const lvl = Math.max(10, Math.min(135, Math.floor(s.level / 5) * 5));
      try { sessionStorage.setItem('srw-fw', JSON.stringify({ lvl, star: b.star, t: Date.now() })); } catch (e) { /* yok */ }
      inv.take(base, 1);
      this.hud.log('Davetiye parladı... Unutulmuş Dünya kapısı açılıyor!', 'lvl');
      if (this.travel) this.travel('forgotten', 'T');
      return true;
    }
    if (b.use === 'hp') {
      if (s.hp >= s.maxHp) { this.hud.log('Canın zaten dolu.'); return false; }
      s.hp = Math.min(s.maxHp, s.hp + b.amount); this.fx(pl, '+' + b.amount, 'heal'); SFX.play('potion');
    } else if (b.use === 'mp') {
      if (s.mp >= s.maxMp) { this.hud.log('Manan zaten dolu.'); return false; }
      s.mp = Math.min(s.maxMp, s.mp + b.amount); this.fx(pl, '+' + b.amount + ' MP', 'mana'); SFX.play('potion');
    } else if (b.use === 'cure') {
      if (!Object.keys(pl.status).length) { this.hud.log('Üzerinde kötü etki yok.'); return false; }
      pl.status = {}; pl.recalc(); this.fx(pl, 'Arındın', 'heal'); SFX.play('potion'); cd = 3;
    } else if (b.use === 'return' || b.use === 'reverse') {
      if (this.casting) return false;
      if (b.use === 'reverse' && !this.deathPos && !this.recallPos) { this.hud.log('Dönülecek bir nokta yok.'); return false; }
      if (this.jobs && (this.jobs.cargoCount() || this.jobs.mission)) { this.hud.log('Kervanla / görevdeyken parşömen kullanılamaz.'); return false; }
      this.casting = { t: 3, total: 3, name: b.use === 'return' ? 'Şehre dönüş' : 'Ters dönüş', kind: b.use };
      this.hud.log(b.name + '... 3 saniye kıpırdama.'); SFX.play('cast'); cd = 5;
    } else if (b.use === 'speed') {
      pl.speedScrollT = 600; pl.recalc(); this.fx(pl, 'Hız!', 'buff'); SFX.play('buff'); cd = 2;
    } else if (b.use === 'zerk') {
      if (s.zerk >= ZERK_MAX || pl.zerkT > 0) { this.hud.log('Berserk zaten dolu.'); return false; }
      s.zerk = ZERK_MAX; this.fx(pl, 'Berserk dolu!', 'buff'); SFX.play('gem'); cd = 2;
    }
    if (ok) { inv.take(base, 1); this._setCd(key, cd); }
    return ok;
  }

  // Otomatik iksir (Ayarlar)
  _autoPot(dt) {
    this.potT -= dt;
    if (this.potT > 0 || !Settings.data.autopot) return;
    this.potT = 0.5;
    const pl = this.player, s = pl.stats, inv = pl.inv;
    const best = kind => { for (let g = POT_GRADES.length; g >= 1; g--) { const b = kind + g; if (s.level >= ITEM_BASES[b].req && inv.count(b)) return b; } return null; };
    if (s.hp / s.maxHp < Settings.data.autohp && !this.cd.pot_hp) { const b = best('hp'); if (b) this.useItem(b); }
    if (s.mp / s.maxMp < Settings.data.automp && !this.cd.pot_mp) { const b = best('mp'); if (b) this.useItem(b); }
  }

  // ---------- Yetenekler ----------
  _checkWeapon(s) {
    const pl = this.player, wt = pl.inv.weaponType(), M = MASTERIES[s.m];
    if (!wt) return 'Yetenek kullanmak için silah kuşan.';
    if (M.weapons && !M.weapons.includes(wt)) return 'Bu yetenek için ' + M.weapons.map(w => WEAPON_TYPES[w].name).join(' / ') + ' gerekli.';
    if (s.needShield && !pl.inv.equip.shield) return 'Bu yetenek için kalkan gerekli.';
    return null;
  }
  _skillRange(s) {
    const d = this.player.d;
    if (s.type === 'atk') return (s.at === 'self') ? 99 : d.range + 0.5;
    if (s.type === 'nuke') return s.at === 'self' ? 99 : (s.range || 14);
    return 99;
  }
  _needsTarget(s) { return (s.type === 'atk' || s.type === 'nuke') && s.at !== 'self'; }

  castSkill(id) {
    const pl = this.player, s = SKILLS_BY_ID[id], r = pl.book.r(id);
    if (!s) return;
    if (!r) { this.hud.log(s.name + ' henüz öğrenilmedi.'); return; }
    if (s.type === 'passive') { this.hud.log(s.name + ' kalıcı bir yetenektir.'); return; }
    if (this.pets && (s.type === 'atk' || s.type === 'nuke' || s.type === 'dash')) this.pets.onAction();
    if (pl.disabled()) { this.hud.log('Hareket edemiyorsun!'); SFX.play('error'); return; }
    if (this.cd[id] > 0) { this.hud.log(s.name + ' bekleme süresinde.'); return; }
    if (this.gcd > 0) return;
    const err = this._checkWeapon(s);
    if (err) { this.hud.log(err); SFX.play('error'); return; }
    if (pl.stats.mp < rankMp(s, r)) { this.hud.log('Yeterli mana yok.'); SFX.play('error'); return; }
    let t = null;
    if (this._needsTarget(s)) {
      t = this._target();
      if (!t) { this.hud.log('Hedef yok.'); SFX.play('error'); return; }
      if (s.type === 'atk' && pl.d.ammo && pl.inv.count('arrow') < (s.hits || 1)) { this.hud.log('Okun kalmadı! Demirciden ok al.'); SFX.play('error'); return; }
      if (this.dist(t) > this._skillRange(s)) {           // önce menzile yürü
        this.queued = { id, t };
        pl.target = { x: t.x, z: t.z };
        return;
      }
    } else if (s.type === 'atk' || s.type === 'nuke') {
      t = this._target(8);
      if (!t || this.dist(t) > (s.aoe || 5) + 1) { this.hud.log('Yakında düşman yok.'); SFX.play('error'); return; }
    }
    this._execute(s, r, t);
  }

  _execute(s, r, t) {
    const pl = this.player, st = pl.stats, v = this.vfx, P = pl.pos;
    st.mp -= rankMp(s, r);
    this._setCd(s.id, s.cd); this.gcd = 0.4;
    this.queued = null;
    if (t) { this.target = t; this.faceTarget(t); this.attacking = true; }
    const o = { status: s.status, chance: s.chance, sdur: s.sdur, mk: s.m, drain: s.drain };
    const mult = sval(s.mult, s, r);
    const aoeTargets = (cx, cz, rad) => this.mm.list.filter(m => !m.dead && Math.hypot(m.x - cx, m.z - cz) <= rad + (m.type.hit || 1) * 0.5).slice(0, 10);

    if (s.type === 'atk') {
      const ranged = pl.d.ranged;
      pl.swingKind = ranged ? 'bow' : (pl.d.wtype === 'spear' || pl.d.wtype === 'glaive') ? 'thrust' : 'slash';
      SFX.play(ranged ? 'swing' : 'swing');
      const hits = s.hits || 1;
      const apply = (m) => {
        if (s.aoe) {
          const c = s.at === 'self' ? P : m;
          const list = aoeTargets(c.x, c.z, s.aoe);
          v.burst(c.x, c.z, pl.imbue ? ELEM_COLOR[pl.imbue.elem] : 0xffe9a8, s.aoe, 0.45);
          for (const x of list) this.hitPhys(x, mult, o);
        } else this.hitPhys(m, mult, o);
      };
      for (let h = 0; h < hits; h++) {
        this.later(h * 0.18, () => {
          if (pl.dead) return;
          const m = t || this.target;
          pl.swingT = 0.3;
          if (!s.aoe || s.at !== 'self') { if (!m || m.dead) return; }
          if (ranged && s.at !== 'self') {
            if (pl.d.ammo && !pl.inv.take('arrow', 1)) return;
            v.projectile({ x: P.x, y: P.y + 1.6, z: P.z }, m, pl.d.ammo ? 'arrow' : projKind(pl.d.magic), () => apply(m));
          } else {
            if (!ranged) v.slash(P.x, P.z, pl.heading, pl.imbue ? ELEM_COLOR[pl.imbue.elem] : 0xffffff);
            apply(m);
          }
        });
      }
    } else if (s.type === 'nuke') {
      pl.swingKind = 'cast'; pl.swingT = 0.3;
      SFX.play(s.elem === 'fire' ? 'fire' : 'cast');
      const col = ELEM_COLOR[s.elem];
      v.rune(P.x, P.z, col, 2.6, 0.7, P);
      const hitArea = (cx, cz) => {
        if (!s.meteor) v.nova(cx, cz, s.elem, s.aoe);
        for (const m of aoeTargets(cx, cz, s.aoe)) this.hitMag(m, mult, s.elem, o);
      };
      if (s.at === 'self') hitArea(P.x, P.z);
      else if (s.elem === 'lightning') { v.bolt(t.x, t.z, col); if (s.aoe) hitArea(t.x, t.z); else this.hitMag(t, mult, s.elem, o); }
      else if (s.meteor) { const tx = t.x, tz = t.z; v.meteor(tx, tz, s.aoe, () => hitArea(tx, tz)); }
      else if (s.proj || !s.aoe) {
        v.projectile({ x: P.x, y: P.y + 1.7, z: P.z }, t, projKind(s.elem), () => (s.aoe ? hitArea(t.x, t.z) : this.hitMag(t, mult, s.elem, o)));
      } else hitArea(t.x, t.z);
    } else if (s.type === 'buff') {
      const b = {}; for (const k in s.buff) b[k] = sval(s.buff[k], s, r);
      pl.addBuff(s.id, { t: s.dur, max: s.dur, icon: s.icon, name: s.name, st: b });
      this.fx(pl, s.name + '!', 'buff'); SFX.play('buff');
      const bc = ELEM_COLOR[MASTERIES[s.m].elem] || 0xffe9a8;
      v.column(P.x, P.z, bc, 4, 0.6); v.buffCast(P.x, P.z, bc, VFX_PAL[MASTERIES[s.m].elem]);
    } else if (s.type === 'imbue') {
      pl.imbue = { id: s.id, elem: s.elem, val: sval(s.val, s, r), t: s.dur, max: s.dur, status: s.status, chance: s.chance, sdur: s.sdur, icon: s.icon, name: s.name };
      this.fx(pl, s.name, 'buff'); SFX.play('buff');
      v.burst(P.x, P.z, ELEM_COLOR[s.elem], 2.2, 0.4); v.buffCast(P.x, P.z, ELEM_COLOR[s.elem], VFX_PAL[s.elem]);
    } else if (s.type === 'heal') {
      const h = Math.round(st.maxHp * sval(s.val, s, r) * (1 + this._elemM('force', s.m) * 0.01));
      st.hp = Math.min(st.maxHp, st.hp + h);
      this.fx(pl, '+' + h, 'heal'); SFX.play('potion');
      v.column(P.x, P.z, 0x8aff9a, 5, 0.8); v.heal(P.x, P.z);
    } else if (s.type === 'cure') {
      pl.status = {}; pl.recalc(); this.fx(pl, 'Arındın', 'heal'); SFX.play('buff');
      v.column(P.x, P.z, 0xffffff, 5, 0.6); v.buffCast(P.x, P.z, 0xffffff, VFX_PAL.force);
    } else if (s.type === 'absorb') {
      pl.absorb = { amt: Math.round(st.maxHp * sval(s.val, s, r)), t: s.dur };
      this.fx(pl, s.name, 'buff'); SFX.play('buff'); v.buffCast(P.x, P.z, 0xfff0a0, VFX_PAL.force);
    } else if (s.type === 'dash') {
      const dist = sval(s.dist, s, r), tt = this.target && !this.target.dead ? this.target : null;
      let ang = pl.heading;
      if (tt) ang = Math.atan2(tt.x - P.x, tt.z - P.z);
      const maxD = tt ? Math.max(0, Math.min(dist, this.dist(tt) - 2)) : dist;
      v.burst(P.x, P.z, 0xd8c8ff, 2, 0.35); v.emit(P.x, P.y + 1, P.z, 24, { pal: VFX_PAL.lightning, speed: 4, life: 0.4, size: 0.35, jitter: 1 });
      const lim = CONFIG.worldSize / 2 - 6;
      let nx = clamp(P.x + Math.sin(ang) * maxD, -lim, lim), nz = clamp(P.z + Math.cos(ang) * maxD, -lim, lim);
      if (typeof Dungeon !== 'undefined' && Dungeon.on) { for (let k = 0; k < 12 && !Dungeon.walk(nx, nz); k++) { nx = P.x + (nx - P.x) * 0.8; nz = P.z + (nz - P.z) * 0.8; } if (!Dungeon.walk(nx, nz)) { nx = P.x; nz = P.z; } }
      pl.teleport(nx, nz);
      pl.heading = ang;
      v.burst(P.x, P.z, 0xd8c8ff, 2.5, 0.4); v.emit(P.x, P.y + 1, P.z, 24, { pal: VFX_PAL.lightning, speed: 4, life: 0.4, size: 0.35, jitter: 1 }); SFX.play('cast');
    }
    if (this.hud) this.hud.flashKey(s.id);
  }

  fx(entity, text, cls) {
    const p = entity.pos || entity.group.position;
    const h = entity === this.player ? 3.0 : 2.4 * (entity.baseScale || 1);
    this.hud.floatText({ x: p.x + (Math.random() - 0.5) * 0.6, y: p.y + h, z: p.z }, text, cls);
  }
  later(sec, fn) { if (sec <= 0) fn(); else this.timers.push({ t: sec, fn }); }

  // ---------- Ana güncelleme ----------
  update(dt) {
    const pl = this.player, s = pl.stats;
    for (const k in this.cd) if (this.cd[k] > 0) { this.cd[k] -= dt; if (this.cd[k] <= 0) delete this.cd[k]; }
    if (this.gcd > 0) this.gcd -= dt;
    for (let i = this.timers.length - 1; i >= 0; i--) {
      this.timers[i].t -= dt;
      if (this.timers[i].t <= 0) { const f = this.timers[i].fn; this.timers.splice(i, 1); f(); }
    }
    this.vfx.auras(pl, dt);
    this.vfx.update(dt);

    // Güvenli bölge geçişleri
    const safe = inSafeZone(pl.pos.x, pl.pos.z);
    if (safe !== this.inSafe) {
      this.inSafe = safe;
      this.hud.log(safe ? 'Güvenli bölgeye girdin.' : 'Güvenli bölgeden çıktın. Dikkat!');
    }

    if (pl.dead) { this.ring.visible = false; return; }

    // oyuncu üzerindeki hasar etkileri (yanma / zehir / kanama)
    for (const k of ['burn', 'poison', 'bleed']) {
      const st = pl.status[k]; if (!st) continue;
      st.tick -= dt;
      if (st.tick <= 0) { st.tick = 1; s.hp -= st.dps; this.fx(pl, '-' + st.dps, 'dot'); if (s.hp <= 0) { s.hp = 0; this.die(null); return; } }
    }
    this._autoPot(dt);

    if (pl.attackCd > 0) pl.attackCd -= dt;
    if (pl.manualMove) { this.attacking = false; this.queued = null; }

    // Dönüş parşömeni
    if (this.casting) {
      if (pl.moving || pl.manualMove) { this.casting = null; this.hud.log('Büyü bozuldu (hareket ettin).'); }
      else {
        this.casting.t -= dt;
        if (this.casting.t <= 0) {
          const kind = this.casting.kind; this.casting = null;
          if (kind === 'reverse') {
            const p = this.deathPos || this.recallPos;
            pl.teleport(p.x, p.z); this.hud.log('Işınlandın.');
          } else if (IS_DUNGEON && this.travel) {          // zindanda: bağlı şehre dön
            this.travel(ZONE.parent, 'T');
          } else {
            this.recallPos = { x: pl.pos.x, z: pl.pos.z };
            pl.teleport(0, 6); this.hud.log('Şehre ulaştın.');
          }
          this.target = null; this.attacking = false;
        }
      }
    }

    // Hedef doğrulama
    if (this.target && (this.target.dead || this.dist(this.target) > 60)) { this.target = null; this.attacking = false; this.queued = null; }

    // Sıradaki yetenek: menzile girince kullan
    if (this.queued) {
      const q = this.queued, sk = SKILLS_BY_ID[q.id];
      if (q.t.dead) this.queued = null;
      else if (this.dist(q.t) <= this._skillRange(sk)) { pl.target = null; const r = pl.book.r(q.id); this.queued = null; if (s.mp >= rankMp(sk, r) && !this.cd[q.id]) this._execute(sk, r, q.t); }
      else pl.target = { x: q.t.x, z: q.t.z };
    }

    // Otomatik saldırı: menzile yürü, vur
    if (this.attacking && this.target && !this.queued && !pl.disabled()) {
      const t = this.target, d = this.dist(t), range = pl.d.range;
      if (d > range - 0.3) { pl.target = { x: t.x, z: t.z }; }
      else {
        pl.target = null;
        this.faceTarget(t);
        if (pl.attackCd <= 0 && this.gcd <= 0) {
          pl.attackCd = pl.d.atkInt * (pl.zerkT > 0 ? 0.7 : 1);
          pl.swingT = 0.3;
          if (pl.d.magic) {                     // asa / arp: büyülü uzak saldırı
            pl.swingKind = 'cast'; SFX.play('cast');
            this.vfx.projectile({ x: pl.pos.x, y: pl.pos.y + 1.7, z: pl.pos.z }, t, projKind(pl.d.magic), () => this.hitMag(t, 0.55, pl.d.magic));
          } else if (pl.d.ranged) {
            if (!pl.inv.take('arrow', 1)) { this.attacking = false; this.hud.log('Okun kalmadı! Demirciden ok al.'); SFX.play('error'); }
            else { pl.swingKind = 'bow'; SFX.play('swing'); this.vfx.projectile({ x: pl.pos.x, y: pl.pos.y + 1.6, z: pl.pos.z }, t, 'arrow', () => this.hitPhys(t, 1)); }
          } else {
            pl.swingKind = (pl.d.wtype === 'spear' || pl.d.wtype === 'glaive') ? 'thrust' : 'slash';
            SFX.play('swing');
            this.hitPhys(t, 1);
          }
        }
      }
    }

    // Hedef halkası
    if (this.target && !this.target.dead) {
      const t = this.target, k = (t.baseScale || 1) * (1 + Math.sin(performance.now() * 0.008) * 0.06);
      this.ring.visible = true;
      this.ring.position.set(t.x, terrainHeight(t.x, t.z) + 0.2, t.z);
      this.ring.scale.set(k, k, k);
    } else this.ring.visible = false;
  }
}
