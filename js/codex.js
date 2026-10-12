// Canavar Külliyatı (Bestiary), Başarımlar, Unvanlar, Günlük Av Sözleşmeleri ve Etkileşimli Dünya Nesneleri (Sandıklar, Kadim Sunaklar, Tuzaklar).
// Kısayol: Y tuşu veya alt/sağ çubuktaki 📖 Külliyat düğmesi.

const CODEX_TIERS = [
  { n: 1,   stars: 1, title: 'Keşif',   dmg: 0.02, drop: 0.04, gold: 250,  sp: 15,  silk: 0 },
  { n: 15,  stars: 2, title: 'Avcı',    dmg: 0.05, drop: 0.08, gold: 900,  sp: 50,  silk: 2 },
  { n: 50,  stars: 3, title: 'Usta',    dmg: 0.09, drop: 0.14, gold: 2800, sp: 150, silk: 5 },
  { n: 120, stars: 4, title: 'Efsane',  dmg: 0.14, drop: 0.22, gold: 7500, sp: 400, silk: 15 }
];

const CODEX_TITLES = [
  { id: 'novice',   name: 'Gezgin Savaşçı',       color: '#bfe8ff', desc: '+%3 EXP, +25 Can',                       bon: { exp: 0.03, hpFlat: 25 }, req: () => true, reqTxt: 'Başlangıç unvanı' },
  { id: 'hunter',   name: 'İpek Yolu Avcısı',     color: '#98f5a8', desc: '+%5 Tüm Hasar, +%4 EXP',                 bon: { dmg: 0.05, exp: 0.04 }, req: c => c.st.kills >= 50, reqTxt: '50 canavar avla' },
  { id: 'slayer',   name: 'Kıdemli Avcı',         color: '#ffd86a', desc: '+%8 Tüm Hasar, +%3 Kritik',              bon: { dmg: 0.08, crit: 3 }, req: c => c.st.kills >= 300, reqTxt: '300 canavar avla' },
  { id: 'giant',    name: 'Dev Kıran',            color: '#ff9a5a', desc: '+%10 Maks Can, +%8 Savunma',             bon: { hpPct: 0.10, def: 0.08 }, req: c => c.st.elites >= 15, reqTxt: '15 Şampiyon/Dev/Elit avla' },
  { id: 'unique1',  name: 'Unique Avcısı',        color: '#ff6ae8', desc: '+%10 Tüm Hasar, +%5 Kritik',             bon: { dmg: 0.10, crit: 5 }, req: c => c.st.uniques >= 1, reqTxt: '1 Unique boss yen' },
  { id: 'unique10', name: 'Efsanevi Katil',       color: '#ff4a6a', desc: '+%15 Tüm Hasar, +%7 Kritik, +%10 EXP',   bon: { dmg: 0.15, crit: 7, exp: 0.10 }, req: c => c.st.uniques >= 10, reqTxt: '10 Unique boss yen' },
  { id: 'treasure', name: 'Hazine Avcısı',        color: '#ffe066', desc: '+%18 Eşya & Altın Düşürme, +%6 Hız',     bon: { drop: 0.18, speed: 0.06 }, req: c => c.st.chests >= 5, reqTxt: '5 Hazine Sandığı aç' },
  { id: 'shrine',   name: 'Kadim Âlim',           color: '#6ae0ff', desc: '+%12 Büyü & Fizik Hasarı, +%12 Maks MP', bon: { dmg: 0.12, mpPct: 0.12 }, req: c => c.st.shrines >= 3, reqTxt: '3 Kadim Sunak etkinleştir' },
  { id: 'alch',     name: 'Simya Ustası',         color: '#c88aff', desc: '+%10 Hasar, +%10 Savunma, +%4 Kritik',   bon: { dmg: 0.10, def: 0.10, crit: 4 }, req: c => c.st.maxPlus >= 5, reqTxt: 'Bir ekipmanı +5 veya üstüne bas' },
  { id: 'bestiary', name: 'Külliyat Üstadı',      color: '#7affa8', desc: '+%12 Hasar, +%10 Can/MP, +%12 EXP',      bon: { dmg: 0.12, hpPct: 0.10, mpPct: 0.10, exp: 0.12 }, req: c => Object.keys(c.kills).length >= 12, reqTxt: '12 farklı canavar türünü keşfet' },
  { id: 'bounty',   name: 'Lonca Başavcısı',      color: '#ffb84a', desc: '+%12 Hasar, +%15 Eşya Düşürme',          bon: { dmg: 0.12, drop: 0.15 }, req: c => c.st.bounties >= 5, reqTxt: '5 Av Sözleşmesi tamamla' },
  { id: 'emperor',  name: 'İpek Yolu Hükümdarı',  color: '#ffdf3a', desc: '+%18 Hasar, +%15 Can/Savunma, +%8 Hız',  bon: { dmg: 0.18, hpPct: 0.15, def: 0.15, speed: 0.08, crit: 6 }, req: c => (c.p && c.p.stats.level >= 80) || c.st.kills >= 1000, reqTxt: '80. Seviyeye veya 1000 ava ulaş' }
];

const CODEX_ACHIEVEMENTS = [
  { id: 'k10',    name: 'İlk Kan',              desc: '10 canavar avla',                         cur: c => c.st.kills, target: 10,   gold: 500,    sp: 25,  silk: 2 },
  { id: 'k100',   name: 'Bozkır Muhafızı',      desc: '100 canavar avla',                        cur: c => c.st.kills, target: 100,  gold: 2500,   sp: 100, silk: 5 },
  { id: 'k500',   name: 'Savaş Meydanı Ustası', desc: '500 canavar avla',                        cur: c => c.st.kills, target: 500,  gold: 10000,  sp: 350, silk: 15 },
  { id: 'k2000',  name: 'Binlerin Kâbusu',      desc: '2.000 canavar avla',                      cur: c => c.st.kills, target: 2000, gold: 45000,  sp: 900, silk: 40 },
  { id: 'el10',   name: 'Şampiyon Avcısı',      desc: '10 Şampiyon, Elit veya Dev canavar avla', cur: c => c.st.elites, target: 10,  gold: 3000,   sp: 120, silk: 6 },
  { id: 'el50',   name: 'Devlerin Korkulu Rüyası', desc: '50 Şampiyon, Elit veya Dev avla',      cur: c => c.st.elites, target: 50,  gold: 18000,  sp: 450, silk: 20 },
  { id: 'uq1',    name: 'Efsane Avcısı',        desc: 'İlk Unique Boss canavarını yen',          cur: c => c.st.uniques, target: 1,  gold: 8000,   sp: 250, silk: 15 },
  { id: 'uq10',   name: 'Unique Hükümdarı',     desc: '10 Unique Boss canavarını yen',           cur: c => c.st.uniques, target: 10, gold: 50000,  sp: 900, silk: 50 },
  { id: 'ch5',    name: 'Meraklı Kaşif',        desc: 'Dünyadaki 5 Hazine Sandığını aç',         cur: c => c.st.chests, target: 5,   gold: 3500,   sp: 100, silk: 8 },
  { id: 'ch25',   name: 'Kayıp Hazineler',      desc: 'Dünyadaki 25 Hazine Sandığını aç',        cur: c => c.st.chests, target: 25,  gold: 22000,  sp: 450, silk: 25 },
  { id: 'sh3',    name: 'Kadim Kutsama',        desc: '3 Kadim Sunağı etkinleştir',              cur: c => c.st.shrines, target: 3,  gold: 2500,   sp: 90,  silk: 6 },
  { id: 'sh15',   name: 'Ruhların Dostu',       desc: '15 Kadim Sunağı etkinleştir',             cur: c => c.st.shrines, target: 15, gold: 16000,  sp: 400, silk: 20 },
  { id: 'sp8',    name: 'Doğa Bilgini',         desc: '8 farklı canavar türünü keşfet',          cur: c => Object.keys(c.kills).length, target: 8,  gold: 3000,  sp: 120, silk: 8 },
  { id: 'sp20',   name: 'Büyük Ansiklopedi',    desc: '20 farklı canavar türünü keşfet',         cur: c => Object.keys(c.kills).length, target: 20, gold: 18000, sp: 500, silk: 25 },
  { id: 'bn5',    name: 'Sözleşme Avcısı',      desc: '5 Günlük Av Sözleşmesi tamamla',          cur: c => c.st.bounties, target: 5, gold: 7500,   sp: 220, silk: 12 },
  { id: 'pl5',    name: 'Parlayan Çelik',       desc: 'Simyada +5 veya üstü bir ekipman elde et', cur: c => c.st.maxPlus, target: 5, gold: 6000,   sp: 180, silk: 10 },
  { id: 'pl8',    name: 'Efsanevi Demirci',     desc: 'Simyada +8 veya üstü bir ekipman elde et', cur: c => c.st.maxPlus, target: 8, gold: 35000,  sp: 700, silk: 35 },
  { id: 'lv30',   name: 'İpek Yolu Gazisi',     desc: '30. Seviyeye ulaş',                       cur: c => c.p ? c.p.stats.level : 1, target: 30, gold: 12000, sp: 300, silk: 15 }
];

const Codex = {
  KEY: 'silkroad-web-codex',
  p: null, world: null, hud: null, loot: null, vfx: null, ui: null,
  kills: {}, claimedTiers: {}, claimedAch: {}, fgw: {}, fgwClaimed: {}, title: 'novice',
  st: { kills: 0, elites: 0, uniques: 0, chests: 0, shrines: 0, bounties: 0, maxPlus: 0 },
  bounties: [], shrineBuff: null, onChange: null,

  init(player, world, hud, loot, vfx, combat) {
    this.p = player; this.world = world; this.hud = hud; this.loot = loot; this.vfx = vfx; this.combat = combat;
    this.load();
    this._scanMaxPlus();
    if (!this.bounties || !this.bounties.length || this.bountyZone !== ZONE.id) this.rollBounties();
    this._applyTitleBadge();
    this.p.recalc();
  },

  load() {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY));
      if (!d) return;
      this.kills = d.kills || {};
      this.claimedTiers = d.claimedTiers || {};
      this.claimedAch = d.claimedAch || {};
      this.fgw = d.fgw || {};
      this.fgwClaimed = d.fgwClaimed || {};
      this.title = d.title || 'novice';
      if (d.st) Object.assign(this.st, d.st);
      this.bounties = d.bounties || [];
      this.bountyZone = d.bountyZone || '';
    } catch (e) { /* yoksay */ }
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify({
        kills: this.kills, claimedTiers: this.claimedTiers, claimedAch: this.claimedAch,
        fgw: this.fgw, fgwClaimed: this.fgwClaimed,
        title: this.title, st: this.st, bounties: this.bounties, bountyZone: this.bountyZone
      }));
    } catch (e) { /* yoksay */ }
  },

  registerTalisman(id) {
    if (!this.p || !this.p.inv || this.fgw[id]) return false;
    if (!this.p.inv.take(id, 1)) return false;
    this.fgw[id] = 1;
    SFX.play('quest');
    if (this.hud && ITEM_BASES[id]) this.hud.log('FGW Koleksiyonuna eklendi: ' + ITEM_BASES[id].name, 'gain');
    this.save();
    if (this.onChange) this.onChange();
    return true;
  },

  registerAllTalismans() {
    if (typeof FGW_BOOKS === 'undefined' || !this.p || !this.p.inv) return 0;
    let n = 0;
    for (const bk of FGW_BOOKS) {
      for (const [id] of bk.talismans) {
        if (!this.fgw[id] && this.p.inv.count(id) > 0 && this.p.inv.take(id, 1)) {
          this.fgw[id] = 1;
          n++;
        }
      }
    }
    if (n > 0) {
      SFX.play('quest');
      if (this.hud) this.hud.log(n + ' FGW Tılsımı koleksiyon kitabına kaydedildi!', 'gain');
      this.save();
      if (this.onChange) this.onChange();
    }
    return n;
  },

  claimFgwBook(bookId) {
    if (typeof FGW_BOOKS === 'undefined' || !this.p || !this.p.inv) return false;
    const bk = FGW_BOOKS.find(b => b.id === bookId);
    if (!bk || this.fgwClaimed[bookId]) return false;
    if (!bk.talismans.every(([id]) => !!this.fgw[id])) return false;
    if (this.p.inv.free() < 0) {
      if (this.hud) this.hud.log('Envanter dolu! Önce 1 yuva boşalt.', 'dmg');
      SFX.play('error');
      return false;
    }
    const wt = this.p.inv.weaponType() || raceWeapons()[0];
    const base = wt + '_' + bk.rewardDeg + 'c';
    const wItem = makeSeal(ITEM_BASES[base] ? base : (wt + '_' + bk.rewardDeg), bk.rewardRarity);
    wItem.plus = 3;
    this.p.inv.add(wItem);
    this.fgwClaimed[bookId] = 1;
    const n = itemInfo(wItem);
    SFX.play('levelup');
    if (this.hud) {
      this.hud.banner('FGW Koleksiyonu Tamamlandı!', n.name + ' kazandın!', 'seal');
      this.hud.log('Unutulmuş Dünya Ödülü: ' + n.name + ' envanterine eklendi!', 'lvl', n.color);
    }
    this.save();
    if (this.onChange) this.onChange();
    return true;
  },

  _scanMaxPlus() {
    if (!this.p || !this.p.inv) return;
    let mp = this.st.maxPlus || 0;
    for (const k in this.p.inv.equip) { const it = this.p.inv.equip[k]; if (it && (it.plus || 0) > mp) mp = it.plus; }
    for (const it of (this.p.inv.slots || [])) if (it && (it.plus || 0) > mp) mp = it.plus;
    for (const it of (this.p.inv.storage || [])) if (it && (it.plus || 0) > mp) mp = it.plus;
    this.st.maxPlus = mp;
  },

  onAlchemy(plus) {
    if (plus > (this.st.maxPlus || 0)) { this.st.maxPlus = plus; this.save(); if (this.onChange) this.onChange(); }
  },

  // Tür başına külliyat kademesi (0..4)
  tierOf(typeKey) {
    const k = this.kills[typeKey] || 0;
    let t = 0;
    for (const c of CODEX_TIERS) if (k >= c.n) t = c.stars;
    return t;
  },

  mobDmgMult(typeKey) {
    const k = this.kills[typeKey] || 0;
    let b = 1;
    for (const c of CODEX_TIERS) if (k >= c.n) b = 1 + c.dmg;
    return b;
  },

  mobDropMult(typeKey) {
    const k = this.kills[typeKey] || 0;
    let b = 1;
    for (const c of CODEX_TIERS) if (k >= c.n) b = 1 + c.drop;
    return b;
  },

  // Aktif unvan + külliyat genel bonusları + kadim sunak kutsaması
  bonuses() {
    const T = CODEX_TITLES.find(t => t.id === this.title) || CODEX_TITLES[0];
    const tb = (T && T.req(this)) ? T.bon : CODEX_TITLES[0].bon;
    const speciesCount = Object.keys(this.kills).length;
    let totalStars = 0;
    for (const k in this.kills) totalStars += this.tierOf(k);
    const sb = this.shrineBuff && Date.now() < this.shrineBuff.until ? this.shrineBuff : null;
    return {
      dmg: 1 + (tb.dmg || 0) + totalStars * 0.004 + (sb && sb.kind === 0 ? 0.18 : 0),
      def: 1 + (tb.def || 0) + (sb && sb.kind === 1 ? 0.22 : 0),
      hpPct: (tb.hpPct || 0) + (sb && sb.kind === 1 ? 0.15 : 0),
      mpPct: (tb.mpPct || 0),
      hpFlat: (tb.hpFlat || 0) + speciesCount * 10,
      mpFlat: speciesCount * 6,
      crit: (tb.crit || 0),
      exp: 1 + (tb.exp || 0) + (sb && sb.kind === 2 ? 0.25 : 0),
      drop: 1 + (tb.drop || 0) + (sb && sb.kind === 2 ? 0.15 : 0),
      speed: 1 + (tb.speed || 0)
    };
  },

  setTitle(id) {
    const t = CODEX_TITLES.find(x => x.id === id);
    if (!t || !t.req(this)) return false;
    this.title = id;
    this._applyTitleBadge();
    this.p.recalc();
    this.save();
    if (this.hud) this.hud.log('Unvan kuşanıldı: ' + t.name, 'gain');
    if (this.onChange) this.onChange();
    return true;
  },

  _applyTitleBadge() {
    if (!this.p || !this.p.group) return;
    if (this.p.titleSprite) {
      if (this.p.titleSprite.material && this.p.titleSprite.material.map) this.p.titleSprite.material.map.dispose();
      this.p.group.remove(this.p.titleSprite);
      this.p.titleSprite = null;
    }
    const t = CODEX_TITLES.find(x => x.id === this.title) || CODEX_TITLES[0];
    if (!t) return;
    const sp = makeLabel('« ' + t.name + ' »', 'Sv. ' + (this.p.stats ? this.p.stats.level : 1), t.color, '#ffe9a8');
    sp.scale.set(3.2, 0.95, 1);
    sp.position.y = 3.05;
    this.p.group.add(sp);
    this.p.titleSprite = sp;
  },

  onMonsterKilled(m) {
    if (!m || !m.typeKey) return;
    const tk = m.typeKey;
    const prevT = this.tierOf(tk);
    this.kills[tk] = (this.kills[tk] || 0) + 1;
    this.st.kills = (this.st.kills || 0) + 1;
    if (m.rank && m.rank !== 'normal') this.st.elites = (this.st.elites || 0) + 1;
    if (m.rank === 'unique' || (m.type && m.type.unique)) this.st.uniques = (this.st.uniques || 0) + 1;
    const newT = this.tierOf(tk);
    if (newT > prevT) {
      const td = CODEX_TIERS[newT - 1];
      this.p.recalc();
      if (this.hud) this.hud.banner('Külliyat: ' + m.type.name + ' (' + td.title + ' ' + '★'.repeat(newT) + ')', 'Külliyat (Y) penceresinden ödülünü al!', 'quest');
    } else if (this.kills[tk] === 1) {
      this.p.recalc();
    }
    // Günlük Av Sözleşmeleri ilerlemesi
    for (const b of this.bounties) {
      if (b.done || b.claimed) continue;
      if (b.kind === 'mob' && b.targetKey === tk) b.cur = Math.min(b.need, (b.cur || 0) + 1);
      else if (b.kind === 'any') b.cur = Math.min(b.need, (b.cur || 0) + 1);
      else if (b.kind === 'elite' && m.rank && m.rank !== 'normal') b.cur = Math.min(b.need, (b.cur || 0) + 1);
      if (b.cur >= b.need && !b.done) {
        b.done = true;
        if (this.hud) this.hud.banner('Av Sözleşmesi Tamamlandı!', b.title + ' — Ödülü Külliyat (Y) penceresinde!', 'quest');
        SFX.play('quest');
      }
    }
    this.save();
    if (this.onChange) this.onChange();
  },

  claimBestiaryTier(typeKey, stars) {
    const ck = typeKey + ':' + stars;
    if (this.claimedTiers[ck]) return false;
    const td = CODEX_TIERS.find(t => t.stars === stars);
    if (!td || (this.kills[typeKey] || 0) < td.n) return false;
    this.claimedTiers[ck] = 1;
    this.p.stats.gold += td.gold;
    this.p.book.sp += td.sp;
    this.p.book.changed();
    if (td.silk) this.p.stats.silk = (this.p.stats.silk || 0) + td.silk;
    SFX.play('quest');
    if (this.hud) this.hud.log(`${MONSTER_TYPES[typeKey]?.name || typeKey} (${td.title}) ödülü alındı: +${td.gold} Altın, +${td.sp} SP${td.silk ? ', +' + td.silk + ' Silk' : ''}`, 'gain');
    this.save();
    if (this.onChange) this.onChange();
    return true;
  },

  claimAchievement(id) {
    if (this.claimedAch[id]) return false;
    const a = CODEX_ACHIEVEMENTS.find(x => x.id === id);
    if (!a || a.cur(this) < a.target) return false;
    this.claimedAch[id] = 1;
    this.p.stats.gold += a.gold;
    this.p.book.sp += a.sp;
    this.p.book.changed();
    if (a.silk) this.p.stats.silk = (this.p.stats.silk || 0) + a.silk;
    SFX.play('levelup');
    if (this.hud) this.hud.banner('Başarım Ödülü Alındı!', `${a.name}: +${a.gold.toLocaleString('tr-TR')} Altın, +${a.sp} SP, +${a.silk} Silk`, 'quest');
    this.save();
    if (this.onChange) this.onChange();
    return true;
  },

  rollBounties() {
    this.bountyZone = ZONE.id;
    const L = this.p ? this.p.stats.level : 1;
    const zSpawns = (ZONE.spawns || []).map(s => Array.isArray(s) ? s[0] : s.type).filter(k => MONSTER_TYPES[k]);
    const pool = zSpawns.length ? zSpawns : ['wolf', 'boar', 'scorpion', 'tiger'];
    const m1 = pool[Math.floor(Math.random() * pool.length)];
    const m2 = pool.filter(x => x !== m1)[Math.floor(Math.random() * Math.max(1, pool.length - 1))] || m1;
    const mult = Math.max(1, Math.round(L * 0.85));
    this.bounties = [
      { id: 'b1_' + Date.now(), kind: 'mob', targetKey: m1, title: `${MONSTER_TYPES[m1].name} Avı`, desc: `Bu bölgede 12 ${MONSTER_TYPES[m1].name} avla`, cur: 0, need: 12, gold: 800 * mult, exp: 350 * mult, sp: 40 + mult * 8, silk: 2, elx: 'elx_w' },
      { id: 'b2_' + Date.now(), kind: 'mob', targetKey: m2, title: `${MONSTER_TYPES[m2].name} Temizliği`, desc: `Bu bölgede 18 ${MONSTER_TYPES[m2].name} avla`, cur: 0, need: 18, gold: 1200 * mult, exp: 520 * mult, sp: 65 + mult * 10, silk: 3, elx: 'elx_a' },
      { id: 'b3_' + Date.now(), kind: 'elite', title: 'Şampiyon & Dev Avı', desc: 'Herhangi bir bölgede 3 Şampiyon/Güçlü/Elit/Dev avla', cur: 0, need: 3, gold: 1800 * mult, exp: 750 * mult, sp: 95 + mult * 14, silk: 5, elx: 'luck' },
      { id: 'b4_' + Date.now(), kind: 'explore', title: 'Hazine & Sunak Keşfi', desc: '2 Hazine Sandığı aç veya Kadim Sunak etkinleştir', cur: 0, need: 2, gold: 1500 * mult, exp: 600 * mult, sp: 80 + mult * 12, silk: 4, elx: 'elx_s' }
    ];
    this.save();
    if (this.onChange) this.onChange();
  },

  claimBounty(idx) {
    const b = this.bounties[idx];
    if (!b || !b.done || b.claimed) return false;
    b.claimed = true;
    this.st.bounties = (this.st.bounties || 0) + 1;
    this.p.stats.gold += b.gold;
    this.p.book.sp += b.sp;
    this.p.book.changed();
    this.p.stats.silk = (this.p.stats.silk || 0) + (b.silk || 0);
    if (b.elx && ITEM_BASES[b.elx]) this.p.inv.add(makeStack(b.elx, 1));
    if (this.combat) this.combat.gainExp(b.exp);
    SFX.play('quest');
    if (this.hud) this.hud.banner('Sözleşme Ödülü Alındı!', `+${b.gold.toLocaleString('tr-TR')} Altın · +${b.sp} SP · +${b.silk} Silk`, 'quest');
    this.save();
    if (this.onChange) this.onChange();
    return true;
  },

  // Etkileşimli 3B Sandıklar, Kadim Sunaklar ve Zindan Diken Tuzakları
  updateWorld(dt) {
    if (!this.world || !this.p || this.p.dead) return;
    const px = this.p.pos.x, pz = this.p.pos.z, now = performance.now() * 0.001;

    // 1) Hazine Sandıkları
    for (const ch of this.world.chests || []) {
      if (ch.opened) {
        ch.respawnT -= dt;
        if (ch.respawnT <= 0) {
          ch.opened = false;
          if (ch.openMesh && ch.openMesh.parent) ch.openMesh.parent.remove(ch.openMesh);
          for (const c of ch.group.children) c.visible = true;
          if (ch.label) ch.label.visible = true;
        }
        continue;
      }
      if (Math.hypot(px - ch.x, pz - ch.z) < 2.8) {
        ch.opened = true;
        ch.respawnT = 95;
        for (const c of ch.group.children) if (c !== ch.label) c.visible = false;
        if (typeof Assets !== 'undefined' && Assets.has('rpg/Chest_Ingots')) {
          const om = Assets.mesh('rpg/Chest_Ingots');
          if (om) { ch.group.add(om); ch.openMesh = om; }
        }
        if (ch.label) ch.label.visible = false;
        this.st.chests = (this.st.chests || 0) + 1;
        for (const b of this.bounties) if (!b.done && b.kind === 'explore') { b.cur = Math.min(b.need, (b.cur || 0) + 1); if (b.cur >= b.need) b.done = true; }
        const L = Math.max(1, this.p.stats.level);
        const gold = Math.round((ch.boss ? 950 : 280) * (1 + L * 0.35) * (0.85 + Math.random() * 0.3));
        const sp = Math.round((ch.boss ? 85 : 25) + L * 2);
        this.p.stats.gold += gold;
        this.p.book.sp += sp;
        this.p.book.changed();
        if (this.loot) {
          const pool = ['elx_w', 'elx_a', 'elx_s', 'luck', potFor(L, 'hp'), potFor(L, 'mp')];
          const pick = pool[Math.floor(Math.random() * pool.length)];
          if (ITEM_BASES[pick]) this.loot.spawn('item', ch.x + (Math.random() - 0.5) * 1.8, ch.z + (Math.random() - 0.5) * 1.8, { item: makeStack(pick, ch.boss ? 2 : 1), from: { x: ch.x, z: ch.z } });
          if (ch.boss || Math.random() < 0.35) {
            const gItem = randomGear(L, Math.random, ch.boss ? 4 : 1.5);
            if (gItem) this.loot.spawn('item', ch.x + (Math.random() - 0.5) * 1.8, ch.z + (Math.random() - 0.5) * 1.8, { item: gItem, from: { x: ch.x, z: ch.z } });
          }
        }
        if (this.vfx) this.vfx.burst(ch.x, ch.z, 0xffd84a, 6, 0.8);
        SFX.play('quest');
        if (this.hud) {
          this.hud.floatText({ x: ch.x, y: terrainHeight(ch.x, ch.z) + 1.8, z: ch.z }, `+${gold} Altın · +${sp} SP`, 'exp');
          this.hud.log(`Hazine Sandığı açıldı! +${gold.toLocaleString('tr-TR')} Altın, +${sp} SP`, 'gain');
        }
        this.save();
        if (this.onChange) this.onChange();
      }
    }

    // 2) Kadim Sunaklar
    for (const sh of this.world.shrines || []) {
      const cr = sh.group.userData.crystal;
      if (cr) { cr.rotation.y = now * 1.5; cr.position.y = 2.65 + Math.sin(now * 2.4) * 0.14; }
      if (sh.cd > 0) { sh.cd -= dt; continue; }
      if (Math.hypot(px - sh.x, pz - sh.z) < 3.0) {
        sh.cd = 120;
        this.shrineBuff = { kind: sh.kind, name: sh.name, desc: sh.desc, until: Date.now() + 180000 };
        this.st.shrines = (this.st.shrines || 0) + 1;
        for (const b of this.bounties) if (!b.done && b.kind === 'explore') { b.cur = Math.min(b.need, (b.cur || 0) + 1); if (b.cur >= b.need) b.done = true; }
        this.p.recalc();
        this.p.stats.hp = this.p.stats.maxHp;
        this.p.stats.mp = this.p.stats.maxMp;
        if (this.vfx) { this.vfx.column(sh.x, sh.z, sh.col || 0x6ae0ff, 5, 1.1); this.vfx.burst(sh.x, sh.z, sh.col || 0x6ae0ff, 5, 0.8); }
        SFX.play('levelup');
        if (this.hud) {
          this.hud.banner(sh.name + ' Kutsaması!', sh.desc + ' · Can ve Mana tamamen yenilendi!', 'quest');
          this.hud.log(`${sh.name} etkinleştirildi: ${sh.desc}`, 'gain');
        }
        this.save();
        if (this.onChange) this.onChange();
      }
    }

    // 3) Zindan Diken Tuzakları
    for (const tr of this.world.traps || []) {
      const wave = Math.sin(now * 2.2 + tr.phase);
      const active = wave > 0.35;
      tr.group.position.y = active ? 0 : -0.85;
      if (tr.hitCd > 0) tr.hitCd -= dt;
      if (active && tr.hitCd <= 0 && Math.hypot(px - tr.x, pz - tr.z) < 1.35) {
        tr.hitCd = 2.0;
        const dmg = Math.max(5, Math.round(this.p.stats.maxHp * 0.08));
        this.p.stats.hp = Math.max(1, this.p.stats.hp - dmg);
        if (this.hud) {
          this.hud.floatText({ x: px, y: this.p.pos.y + 1.8, z: pz }, `-${dmg} Tuzak!`, 'player');
          this.hud.log('Zindan diken tuzağına bastın! (-' + dmg + ' Can)', 'dmg');
        }
        SFX.play('hit');
      }
    }
  }
};

function initCodexUI(ui) {
  const $ = id => document.getElementById(id);
  const w = $('codexw');
  if (!w) return;
  ui.w.codex = w;
  Codex.ui = ui;
  w.querySelector('.x').addEventListener('click', () => ui.toggle('codex', false));
  const st = { tab: 'bestiary', filter: 'zone' };
  const fmt = n => Math.round(n).toLocaleString('tr-TR');

  function refresh() {
    Codex._scanMaxPlus();
    const tabs = [
      ['bestiary', '📖 Canavar Külliyatı'],
      ['fgw',      '📿 FGW Tılsımları'],
      ['bounty',   '🎯 Av Sözleşmeleri'],
      ['ach',      '🏆 Başarımlar'],
      ['titles',   '👑 Unvanlar']
    ];
    $('codex-tabs').innerHTML = tabs.map(t => `<button data-ctab="${t[0]}" class="${st.tab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('');
    const bon = Codex.bonuses();
    let h = `<div class="bot-stats" style="margin-bottom:8px">
      <div><small>Keşfedilen Tür</small><b>${Object.keys(Codex.kills).length} / ${Object.keys(MONSTER_TYPES).length}</b></div>
      <div><small>Toplam Av</small><b>${fmt(Codex.st.kills)}</b></div>
      <div><small>Külliyat Hasar</small><b>+%${Math.round((bon.dmg - 1) * 100)}</b></div>
      <div><small>Külliyat Can/MP</small><b>+${bon.hpFlat} / +${bon.mpFlat}</b></div>
      <div><small>Açılan Sandık</small><b>${Codex.st.chests}</b></div>
      <div><small>Kadim Sunak</small><b>${Codex.st.shrines}</b></div>
    </div>`;

    if (Codex.shrineBuff && Date.now() < Codex.shrineBuff.until) {
      const rem = Math.ceil((Codex.shrineBuff.until - Date.now()) / 1000);
      h += `<div class="ev-card on" style="margin-bottom:8px;padding:6px 10px"><b>✨ Aktif Sunak Kutsaması: ${Codex.shrineBuff.name}</b> — <span>${Codex.shrineBuff.desc} (${rem} sn)</span></div>`;
    }

    if (st.tab === 'bestiary') {
      const zoneKeys = new Set((ZONE.spawns || []).map(s => Array.isArray(s) ? s[0] : s.type).concat((ZONE.uniques || []).map(u => u.id)));
      if (ZONE.ruinMob) zoneKeys.add(ZONE.ruinMob[0]);
      if (ZONE.boss) zoneKeys.add(ZONE.boss.type);
      h += `<div class="seg" style="margin-bottom:8px">
        <button class="tg ${st.filter === 'zone' ? 'on' : ''}" data-cflt="zone">Bu Bölge (${ZONE.name})</button>
        <button class="tg ${st.filter === 'known' ? 'on' : ''}" data-cflt="known">Keşfedilenler (${Object.keys(Codex.kills).length})</button>
        <button class="tg ${st.filter === 'unique' ? 'on' : ''}" data-cflt="unique">Unique Bosslar</button>
        <button class="tg ${st.filter === 'all' ? 'on' : ''}" data-cflt="all">Tümü (${Object.keys(MONSTER_TYPES).length})</button>
      </div>`;
      const keys = Object.keys(MONSTER_TYPES).filter(k => {
        if (MONSTER_TYPES[k].passive) return false;
        if (st.filter === 'zone') return zoneKeys.has(k);
        if (st.filter === 'known') return (Codex.kills[k] || 0) > 0;
        if (st.filter === 'unique') return !!MONSTER_TYPES[k].unique;
        return true;
      });
      h += '<div class="ev-list">';
      for (const k of keys) {
        const m = MONSTER_TYPES[k], kills = Codex.kills[k] || 0, tier = Codex.tierOf(k);
        const nextT = CODEX_TIERS.find(t => kills < t.n);
        const stars = '★'.repeat(tier) + '☆'.repeat(4 - tier);
        let claimBtns = '';
        for (const td of CODEX_TIERS) {
          if (kills >= td.n && !Codex.claimedTiers[k + ':' + td.stars]) {
            claimBtns += `<button class="tg on" data-cclaim="${k}:${td.stars}">Ödül Al (${td.title}: +${td.gold}G)</button> `;
          }
        }
        h += `<div class="ev-card ${tier > 0 ? 'on' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <b>${m.unique ? '👑 ' : ''}${m.name} <span style="color:#ffd86a">${stars}</span></b>
            <small>Av: <b>${fmt(kills)}</b>${nextT ? ' / ' + nextT.n : ' (MAKS)'}</small>
          </div>
          <div style="font-size:12px;opacity:.85;margin-top:3px">
            Tür Bonusu: <b>+%${Math.round((Codex.mobDmgMult(k) - 1) * 100)} Hasar</b> · <b>+%${Math.round((Codex.mobDropMult(k) - 1) * 100)} Düşürme</b>
            ${m.status ? ` · Durum: <i>${m.status.kind}</i>` : ''}
          </div>
          ${claimBtns ? `<div style="margin-top:5px">${claimBtns}</div>` : ''}
        </div>`;
      }
      h += '</div>';
    } else if (st.tab === 'bounty') {
      h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span class="soc-hint">Bölgeye özel Av Sözleşmeleri: tamamla ve anında ödül kazan!</span>
        <button class="tg" data-croll="1">🔄 Yeni Sözleşmeler</button>
      </div><div class="ev-list">`;
      Codex.bounties.forEach((b, idx) => {
        const pct = Math.min(100, Math.round((b.cur / b.need) * 100));
        h += `<div class="ev-card ${b.done ? 'on' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <b>🎯 ${b.title}</b>
            <span><b>${b.cur} / ${b.need}</b> (%${pct})</span>
          </div>
          <div style="font-size:12px;margin:4px 0">${b.desc}</div>
          <div style="font-size:12px;color:#ffd86a">Ödül: +${fmt(b.gold)} Altın · +${fmt(b.exp)} EXP · +${b.sp} SP · +${b.silk} Silk</div>
          <div style="margin-top:6px">
            ${b.claimed ? '<span style="color:#7affa8">✔ Ödül Alındı</span>' : b.done ? `<button class="tg on" data-cbounty="${idx}">🎁 Ödülü Al</button>` : '<small>Devam ediyor...</small>'}
          </div>
        </div>`;
      });
      h += '</div>';
    } else if (st.tab === 'ach') {
      h += '<div class="ev-list">';
      for (const a of CODEX_ACHIEVEMENTS) {
        const cur = Math.min(a.target, a.cur(Codex)), done = cur >= a.target, claimed = !!Codex.claimedAch[a.id];
        h += `<div class="ev-card ${done ? 'on' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <b>🏆 ${a.name}</b>
            <span><b>${fmt(cur)} / ${fmt(a.target)}</b></span>
          </div>
          <div style="font-size:12px;margin:3px 0">${a.desc}</div>
          <div style="font-size:12px;color:#ffd86a">Ödül: +${fmt(a.gold)} Altın · +${a.sp} SP · +${a.silk} Silk</div>
          <div style="margin-top:5px">
            ${claimed ? '<span style="color:#7affa8">✔ Tamamlandı</span>' : done ? `<button class="tg on" data-cach="${a.id}">🎁 Ödülü Al</button>` : ''}
          </div>
        </div>`;
      }
      h += '</div>';
    } else if (st.tab === 'titles') {
      h += '<p class="soc-hint">Kazandığın unvanı kuşanarak hem karakterinin baş üstü unvanını değiştirir hem de kalıcı güçlendirme alırsın.</p><div class="ev-list">';
      for (const t of CODEX_TITLES) {
        const ok = t.req(Codex), eq = Codex.title === t.id;
        h += `<div class="ev-card ${eq ? 'on' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <b style="color:${t.color}">« ${t.name} »</b>
            ${eq ? '<span style="color:#7affa8"><b>Kuşanıldı</b></span>' : ok ? `<button class="tg on" data-ctitle="${t.id}">Kuşan</button>` : `<small>🔒 ${t.reqTxt}</small>`}
          </div>
          <div style="font-size:12px;margin-top:3px">${t.desc}</div>
        </div>`;
      }
      h += '</div>';
    } else if (st.tab === 'fgw') {
      const inv = Codex.p ? Codex.p.inv : null;
      h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span class="soc-hint">Unutulmuş Dünya (FGW) ve Unique bosslardan düşen 8 Tılsımı koleksiyon kitabına kaydet; <b>Seal of Sun / Seal of Nova</b> silah kazan!</span>
        <button class="tg on" data-cfgwall="1">📥 Çantadaki Tılsımları Kaydet</button>
      </div><div class="ev-list">`;
      for (const bk of (typeof FGW_BOOKS !== 'undefined' ? FGW_BOOKS : [])) {
        const doneCount = bk.talismans.filter(([id]) => !!Codex.fgw[id]).length;
        const allDone = doneCount === 8;
        const claimed = !!Codex.fgwClaimed[bk.id];
        h += `<div class="ev-card ${allDone ? 'on' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <b>📜 ${bk.name} <small style="color:#b8a888">(${bk.sub})</small></b>
            <span style="color:${allDone ? '#7affa8' : '#ffd86a'}"><b>${doneCount} / 8 Tılsım</b></span>
          </div>
          <div style="font-size:12px;color:#ffb86a;margin:4px 0">🎁 Koleksiyon Ödülü: <b>${bk.rewardLabel} (+3)</b></div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin-top:6px">
            ${bk.talismans.map(([id, nm, ic], idx) => {
              const has = !!Codex.fgw[id];
              const inBag = inv ? inv.count(id) : 0;
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 7px;border-radius:5px;background:${has ? 'rgba(60,150,90,0.22)' : 'rgba(20,16,28,0.55)'};border:1px solid ${has ? '#5ef29a' : 'rgba(255,220,150,0.16)'};font-size:11px">
                <span>${ic} <b>#${idx + 1}</b> ${nm}</span>
                ${has ? '<b style="color:#7affa8">✔</b>' : inBag > 0 ? `<button class="tg on" data-cfgw="${id}" style="padding:1px 6px;font-size:10px">Kaydet (${inBag})</button>` : '<span style="opacity:.45">Eksik</span>'}
              </div>`;
            }).join('')}
          </div>
          <div style="margin-top:8px;text-align:right">
            ${claimed ? '<span style="color:#7affa8"><b>✔ Silah Ödülü Alındı</b></span>' : allDone ? `<button class="tg on" data-cfgwclaim="${bk.id}">⚔️ ${bk.rewardLabel} Ödülünü Al!</button>` : ''}
          </div>
        </div>`;
      }
      h += '</div>';
    }
    $('codex-body').innerHTML = h;
  }

  w.addEventListener('click', e => {
    const t = e.target.closest('[data-ctab]');
    if (t) { st.tab = t.dataset.ctab; SFX.play('tab'); refresh(); return; }
    const flt = e.target.closest('[data-cflt]');
    if (flt) { st.filter = flt.dataset.cflt; SFX.play('ui'); refresh(); return; }
    const cl = e.target.closest('[data-cclaim]');
    if (cl) { const [tk, s] = cl.dataset.cclaim.split(':'); Codex.claimBestiaryTier(tk, +s); refresh(); return; }
    const rl = e.target.closest('[data-croll]');
    if (rl) { Codex.rollBounties(); SFX.play('ui'); refresh(); return; }
    const bn = e.target.closest('[data-cbounty]');
    if (bn) { Codex.claimBounty(+bn.dataset.cbounty); refresh(); return; }
    const ac = e.target.closest('[data-cach]');
    if (ac) { Codex.claimAchievement(ac.dataset.cach); refresh(); return; }
    const ti = e.target.closest('[data-ctitle]');
    if (ti) { Codex.setTitle(ti.dataset.ctitle); refresh(); return; }
    const fgwAll = e.target.closest('[data-cfgwall]');
    if (fgwAll) { Codex.registerAllTalismans(); refresh(); return; }
    const fgw1 = e.target.closest('[data-cfgw]');
    if (fgw1) { Codex.registerTalisman(fgw1.dataset.cfgw); refresh(); return; }
    const fgwC = e.target.closest('[data-cfgwclaim]');
    if (fgwC) { Codex.claimFgwBook(fgwC.dataset.cfgwclaim); refresh(); return; }
  });

  const hb = $('hb-codex');
  if (hb) hb.addEventListener('click', () => ui.toggle('codex'));
  const mb = $('btn-codex');
  if (mb) mb.addEventListener('click', () => ui.toggle('codex'));
  window.addEventListener('keydown', e => {
    const a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'SELECT')) return;
    if (e.code === 'KeyY' && !e.repeat) ui.toggle('codex');
  });
  Codex.onChange = () => { if (ui.isOpen('codex')) refresh(); };
  const oldToggle = ui.toggle;
  ui.toggle = (k, f, s) => { oldToggle(k, f, s); if (k === 'codex' && ui.isOpen('codex')) refresh(); };
}
