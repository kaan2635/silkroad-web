// Ustalıklar (Çin ırkı, Silkroad'daki 7 ustalık) ve yetenek ağaçları.
// Her ustalığın seviyesi SP ile yükselir (karakter seviyesini geçemez, toplamı seviye x3).
// Yetenekler kademelidir: her kademe belirli bir ustalık seviyesi ve SP ister.

const MASTERIES = {
  bicheon:   { name: 'Bicheon',  full: 'Kılıç ve Bıçak Ustalığı', icon: '⚔️', kind: 'weapon', weapons: ['sword', 'blade'], desc: 'Kılıç ve bıçakla hızlı saldırılar, kalkan savunması.' },
  heuksal:   { name: 'Heuksal',  full: 'Mızrak ve Pala Ustalığı', icon: '🔱', kind: 'weapon', weapons: ['spear', 'glaive'], desc: 'İki elli silahlarla güçlü ve geniş alanlı saldırılar.' },
  pacheon:   { name: 'Pacheon',  full: 'Yay Ustalığı', icon: '🏹', kind: 'weapon', weapons: ['bow'], desc: 'Uzaktan ok saldırıları ve kritik vuruşlar.' },
  cold:      { name: 'Soğuk',    full: 'Soğuk Ustalığı', icon: '❄️', kind: 'elem', elem: 'cold', desc: 'Savunma büyüleri, dondurma ve yavaşlatma.' },
  lightning: { name: 'Şimşek',   full: 'Şimşek Ustalığı', icon: '⚡', kind: 'elem', elem: 'lightning', desc: 'Hız, ışınlanma ve sersemleten yıldırımlar.' },
  fire:      { name: 'Ateş',     full: 'Ateş Ustalığı', icon: '🔥', kind: 'elem', elem: 'fire', desc: 'Yüksek hasarlı yakıcı büyüler.' },
  force:     { name: 'Kuvvet',   full: 'Kuvvet Ustalığı', icon: '✨', kind: 'elem', elem: 'force', desc: 'Şifa, arınma ve koruma büyüleri.' }
};
const ELEM_COLOR = { cold: 0x8fdcff, lightning: 0xd8c8ff, fire: 0xff7a1a, force: 0xfff0a0, phys: 0xffe9a8 };
const ELEM_CLS = { cold: 'cold', lightning: 'bolt', fire: 'fire', force: 'heal', phys: 'hit' };

const masteryCost = m => Math.round(4 + 1.6 * m + 0.18 * m * m);   // m-1 → m
const masteryLimit = level => level * 3;
const skillCost = reqM => Math.round(6 + 0.9 * reqM + 0.11 * reqM * reqM);
const RK = (a, b) => (r, max) => a + (b - a) * (max > 1 ? (r - 1) / (max - 1) : 0);   // kademe ile doğrusal artış

const SKILL_DEFS = [
  // --- Bicheon ---
  { id: 'bc_chain', m: 'bicheon', name: 'Zincir Darbe', icon: '💥', type: 'atk', reqM: 1, maxR: 5, step: 6, mp: 6, cd: 2.5, hits: 3, mult: RK(0.55, 1.1), desc: '3 hızlı vuruş' },
  { id: 'bc_stab', m: 'bicheon', name: 'Ölüm Saplaması', icon: '🎯', type: 'atk', reqM: 6, maxR: 5, step: 7, mp: 12, cd: 7, hits: 1, mult: RK(1.8, 3.2), status: 'stun', chance: 0.35, sdur: 1.5, desc: 'Güçlü saplama, sersemletebilir' },
  { id: 'bc_shield', m: 'bicheon', name: 'Kalkan Duruşu', icon: '🛡️', type: 'buff', reqM: 4, maxR: 4, step: 10, mp: 20, cd: 5, dur: 120, needShield: true, buff: { pdefPct: RK(15, 35), block: RK(8, 20) }, desc: 'Kalkanla fiziksel savunma ve blok artar' },
  { id: 'bc_whirl', m: 'bicheon', name: 'Kılıç Kasırgası', icon: '🌪️', type: 'atk', reqM: 14, maxR: 5, step: 8, mp: 25, cd: 9, hits: 1, mult: RK(1.2, 2.2), aoe: 4.5, at: 'self', desc: 'Etrafındaki tüm düşmanlara vurur' },
  { id: 'bc_ghost', m: 'bicheon', name: 'Hayalet Kılıç', icon: '👻', type: 'atk', reqM: 26, maxR: 4, step: 10, mp: 40, cd: 12, hits: 5, mult: RK(0.6, 1.0), status: 'knock', chance: 0.3, sdur: 2, desc: '5 vuruşluk zincir, yere serebilir' },
  { id: 'bc_pass', m: 'bicheon', name: 'Kılıç Disiplini', icon: '📕', type: 'passive', reqM: 8, maxR: 5, step: 9, pass: { patkPct: RK(3, 15), block: RK(2, 6) }, desc: 'Kalıcı: fiziksel saldırı ve blok' },
  // --- Heuksal ---
  { id: 'hk_pierce', m: 'heuksal', name: 'Delen Mızrak', icon: '🔱', type: 'atk', reqM: 1, maxR: 5, step: 6, mp: 7, cd: 3, hits: 2, mult: RK(0.85, 1.6), desc: 'İki güçlü hamle' },
  { id: 'hk_wind', m: 'heuksal', name: 'Rüzgâr Çevirmesi', icon: '🌀', type: 'atk', reqM: 5, maxR: 5, step: 7, mp: 18, cd: 8, hits: 1, mult: RK(1.1, 2.0), aoe: 5, at: 'self', desc: 'Silahı çevirerek etrafa vurur' },
  { id: 'hk_soul', m: 'heuksal', name: 'Ruh Mızrağı', icon: '⚜️', type: 'buff', reqM: 10, maxR: 4, step: 10, mp: 25, cd: 5, dur: 120, buff: { patkPct: RK(10, 25) }, desc: 'Fiziksel saldırı artar' },
  { id: 'hk_bloom', m: 'heuksal', name: 'Kan Çiçeği', icon: '🌺', type: 'atk', reqM: 16, maxR: 4, step: 9, mp: 28, cd: 9, hits: 1, mult: RK(2.2, 3.8), status: 'bleed', chance: 0.6, sdur: 5, desc: 'Ağır darbe, kanatır' },
  { id: 'hk_storm', m: 'heuksal', name: 'Ejder Fırtınası', icon: '🐉', type: 'atk', reqM: 26, maxR: 4, step: 10, mp: 45, cd: 13, hits: 1, mult: RK(1.8, 3.0), aoe: 6, at: 'target', status: 'knock', chance: 0.4, sdur: 2, desc: 'Hedef ve çevresine büyük darbe' },
  { id: 'hk_pass', m: 'heuksal', name: 'Mızrak Disiplini', icon: '📗', type: 'passive', reqM: 8, maxR: 5, step: 9, pass: { patkPct: RK(2, 10), hpPct: RK(3, 12) }, desc: 'Kalıcı: fiziksel saldırı ve can' },
  // --- Pacheon ---
  { id: 'pc_double', m: 'pacheon', name: 'Çifte Ok', icon: '🏹', type: 'atk', reqM: 1, maxR: 5, step: 6, mp: 6, cd: 2.5, hits: 2, mult: RK(0.8, 1.5), desc: 'Arka arkaya iki ok' },
  { id: 'pc_pierce', m: 'pacheon', name: 'Delici Ok', icon: '➹', type: 'atk', reqM: 6, maxR: 5, step: 7, mp: 12, cd: 6, hits: 1, mult: RK(2.0, 3.6), desc: 'Zırh delen güçlü ok' },
  { id: 'pc_eagle', m: 'pacheon', name: 'Kartal Gözü', icon: '🦅', type: 'buff', reqM: 10, maxR: 4, step: 10, mp: 22, cd: 5, dur: 120, buff: { crit: RK(8, 20), range: RK(2, 6) }, desc: 'Kritik şansı ve menzil artar' },
  { id: 'pc_rain', m: 'pacheon', name: 'Ok Yağmuru', icon: '🌧️', type: 'atk', reqM: 16, maxR: 4, step: 9, mp: 30, cd: 10, hits: 1, mult: RK(1.3, 2.3), aoe: 5, at: 'target', desc: 'Hedefin çevresine ok yağdırır' },
  { id: 'pc_storm', m: 'pacheon', name: 'Fırtına Oku', icon: '🌩️', type: 'atk', reqM: 26, maxR: 4, step: 10, mp: 42, cd: 12, hits: 4, mult: RK(0.8, 1.3), status: 'knock', chance: 0.3, sdur: 2, desc: '4 ok, yere serebilir' },
  { id: 'pc_pass', m: 'pacheon', name: 'Keskin Nişan', icon: '📙', type: 'passive', reqM: 8, maxR: 5, step: 9, pass: { crit: RK(2, 8), patkPct: RK(2, 8) }, desc: 'Kalıcı: kritik ve fiziksel saldırı' },
  // --- Soğuk ---
  { id: 'cd_imbue', m: 'cold', name: 'Buz Aşılama', icon: '🧊', type: 'imbue', elem: 'cold', reqM: 1, maxR: 5, step: 7, mp: 8, cd: 1, dur: 40, val: RK(0.18, 0.45), status: 'slow', chance: 0.25, sdur: 3, desc: 'Saldırılara soğuk hasarı ekler, yavaşlatabilir' },
  { id: 'cd_armor', m: 'cold', name: 'Buz Zırhı', icon: '🥶', type: 'buff', reqM: 4, maxR: 5, step: 8, mp: 20, cd: 5, dur: 180, buff: { pdefPct: RK(10, 30), mdefPct: RK(10, 30) }, desc: 'Fiziksel ve büyü savunması artar' },
  { id: 'cd_shield', m: 'cold', name: 'Buz Kalkanı', icon: '❄️', type: 'buff', reqM: 10, maxR: 3, step: 12, mp: 30, cd: 25, dur: 8, buff: { dmgTaken: RK(0.6, 0.4) }, desc: 'Kısa süre alınan hasar çok azalır' },
  { id: 'cd_nova', m: 'cold', name: 'Kar Fırtınası', icon: '🌨️', type: 'nuke', elem: 'cold', reqM: 18, maxR: 4, step: 9, mp: 40, cd: 12, mult: RK(1.2, 2.2), aoe: 6, at: 'self', status: 'freeze', chance: 0.5, sdur: 2, desc: 'Etrafını dondurur' },
  { id: 'cd_pass', m: 'cold', name: 'Buz Kalbi', icon: '📘', type: 'passive', reqM: 6, maxR: 5, step: 9, pass: { mdefPct: RK(4, 16), mpPct: RK(3, 12) }, desc: 'Kalıcı: büyü savunması ve mana' },
  // --- Şimşek ---
  { id: 'lt_imbue', m: 'lightning', name: 'Şimşek Aşılama', icon: '⚡', type: 'imbue', elem: 'lightning', reqM: 1, maxR: 5, step: 7, mp: 9, cd: 1, dur: 40, val: RK(0.22, 0.55), status: 'stun', chance: 0.12, sdur: 0.7, desc: 'Saldırılara şimşek hasarı ekler, çarpabilir' },
  { id: 'lt_walk', m: 'lightning', name: 'Hayalet Adım', icon: '👣', type: 'dash', reqM: 5, maxR: 3, step: 12, mp: 15, cd: 8, dist: RK(9, 14), desc: 'Hedefe/ileri anında ışınlanır' },
  { id: 'lt_haste', m: 'lightning', name: 'Rüzgâr Yürüyüşü', icon: '💨', type: 'buff', reqM: 8, maxR: 3, step: 12, mp: 18, cd: 5, dur: 60, buff: { speedPct: RK(20, 40) }, desc: 'Hareket hızı artar' },
  { id: 'lt_bolt', m: 'lightning', name: 'Yıldırım', icon: '🌩', type: 'nuke', elem: 'lightning', reqM: 12, maxR: 5, step: 8, mp: 22, cd: 6, mult: RK(2.4, 4.0), range: 15, status: 'stun', chance: 0.3, sdur: 1, desc: 'Hedefe yıldırım düşürür' },
  { id: 'lt_chain', m: 'lightning', name: 'Zincirleme Şimşek', icon: '⛈️', type: 'nuke', elem: 'lightning', reqM: 22, maxR: 4, step: 10, mp: 42, cd: 11, mult: RK(1.6, 2.6), range: 15, aoe: 6, at: 'target', desc: 'Hedef ve çevresine şimşek' },
  // --- Ateş ---
  { id: 'fr_imbue', m: 'fire', name: 'Ateş Aşılama', icon: '🔥', type: 'imbue', elem: 'fire', reqM: 1, maxR: 5, step: 7, mp: 9, cd: 1, dur: 40, val: RK(0.2, 0.5), status: 'burn', chance: 0.2, sdur: 4, desc: 'Saldırılara ateş hasarı ekler, yakabilir' },
  { id: 'fr_ball', m: 'fire', name: 'Ateş Topu', icon: '☄️', type: 'nuke', elem: 'fire', reqM: 3, maxR: 5, step: 7, mp: 15, cd: 4, mult: RK(2.2, 3.6), range: 14, proj: true, status: 'burn', chance: 0.35, sdur: 4, desc: 'Uzaktan ateş topu' },
  { id: 'fr_body', m: 'fire', name: 'Alev Bedeni', icon: '♨️', type: 'buff', reqM: 10, maxR: 4, step: 10, mp: 25, cd: 5, dur: 120, buff: { patkPct: RK(8, 20), matkPct: RK(8, 20) }, desc: 'Tüm saldırı gücü artar' },
  { id: 'fr_ring', m: 'fire', name: 'Alev Halkası', icon: '⭕', type: 'nuke', elem: 'fire', reqM: 18, maxR: 4, step: 9, mp: 38, cd: 11, mult: RK(1.4, 2.4), aoe: 6, at: 'self', status: 'burn', chance: 0.6, sdur: 4, desc: 'Etrafında alev patlaması' },
  { id: 'fr_meteor', m: 'fire', name: 'Göktaşı', icon: '🌋', type: 'nuke', elem: 'fire', reqM: 30, maxR: 3, step: 12, mp: 60, cd: 16, mult: RK(3.0, 4.5), range: 16, aoe: 7, at: 'target', status: 'burn', chance: 0.5, sdur: 5, desc: 'Gökten dev ateş topu' },
  // --- Kuvvet ---
  { id: 'fc_heal', m: 'force', name: 'Şifa', icon: '💚', type: 'heal', reqM: 1, maxR: 5, step: 7, mp: 20, cd: 6, val: RK(0.2, 0.45), desc: 'Canını yeniler' },
  { id: 'fc_cure', m: 'force', name: 'Arınma', icon: '🕊️', type: 'cure', reqM: 5, maxR: 1, step: 1, mp: 15, cd: 8, desc: 'Tüm kötü etkileri kaldırır' },
  { id: 'fc_vital', m: 'force', name: 'Canlılık', icon: '💪', type: 'buff', reqM: 9, maxR: 4, step: 10, mp: 30, cd: 5, dur: 300, buff: { hpPct: RK(8, 20) }, desc: 'Azami can artar' },
  { id: 'fc_regen', m: 'force', name: 'Yenilenme Aurası', icon: '🌿', type: 'buff', reqM: 15, maxR: 4, step: 9, mp: 35, cd: 30, dur: 20, buff: { regen: RK(1.5, 4) }, desc: 'Saniyede canının bir kısmını yeniler' },
  { id: 'fc_guard', m: 'force', name: 'Gök Kalkanı', icon: '🌟', type: 'absorb', reqM: 24, maxR: 3, step: 12, mp: 45, cd: 30, dur: 15, val: RK(0.2, 0.4), desc: 'Hasarı emen ışık kalkanı' }
];
const SKILLS_BY_ID = {};
SKILL_DEFS.forEach(s => { SKILLS_BY_ID[s.id] = s; });

// Kademe r için gerekli ustalık seviyesi, SP maliyeti, mana
const rankReq = (s, r) => s.reqM + (r - 1) * s.step;
const rankCost = (s, r) => skillCost(rankReq(s, r));
const rankMp = (s, r) => Math.round((s.mp || 0) * (1 + 0.55 * (r - 1)));
const sval = (f, s, r) => (typeof f === 'function' ? f(r, s.maxR) : f);

// Kısa açıklama (kademe r)
function skillDetail(s, r) {
  if (r < 1) r = 1;
  const p = [];
  if (s.type === 'atk' || s.type === 'nuke') {
    p.push((s.hits > 1 ? s.hits + ' x ' : '') + '%' + Math.round(sval(s.mult, s, r) * 100) + (s.type === 'nuke' ? ' büyü' : ' fiziksel') + ' hasar');
    if (s.aoe) p.push(s.aoe + ' m alan');
  }
  if (s.type === 'imbue') p.push('Büyü saldırısının %' + Math.round(sval(s.val, s, r) * 100) + '\'i kadar ek hasar, ' + s.dur + ' sn');
  if (s.type === 'heal') p.push('Canın %' + Math.round(sval(s.val, s, r) * 100) + '\'i');
  if (s.type === 'absorb') p.push('Canın %' + Math.round(sval(s.val, s, r) * 100) + '\'i kadar hasar emer, ' + s.dur + ' sn');
  if (s.type === 'dash') p.push(Math.round(sval(s.dist, s, r)) + ' m');
  const names = { pdefPct: 'Fiz. savunma %', mdefPct: 'Büyü savunma %', patkPct: 'Fiz. saldırı %', matkPct: 'Büyü saldırı %', speedPct: 'Hız %', crit: 'Kritik +', block: 'Blok %', range: 'Menzil +', hpPct: 'Can %', mpPct: 'Mana %', regen: 'Can yenileme %/sn ', dmgTaken: 'Alınan hasar x' };
  const b = s.buff || s.pass;
  if (b) for (const k in b) { const v = sval(b[k], s, r); p.push(names[k] + (k === 'dmgTaken' ? v.toFixed(2) : Math.round(v * 10) / 10)); }
  if (s.dur && s.type === 'buff') p.push(s.dur + ' sn');
  if (s.status) p.push('%' + Math.round(s.chance * 100) + ' ' + STATUS_NAMES[s.status]);
  return p.join(' · ');
}
const STATUS_NAMES = { stun: 'sersemletme', freeze: 'dondurma', knock: 'yere serme', slow: 'yavaşlatma', burn: 'yakma', bleed: 'kanatma', poison: 'zehir' };

// Oyuncunun ustalık / yetenek defteri
class SkillBook {
  constructor(player) {
    this.p = player;
    this.mastery = {}; for (const k in MASTERIES) this.mastery[k] = 0;
    this.rank = {};             // id -> kademe
    this.sp = 0; this.spExp = 0;
    this.onChange = null;
  }
  changed() { if (this.onChange) this.onChange(); }
  total() { let t = 0; for (const k in this.mastery) t += this.mastery[k]; return t; }
  limit() { return masteryLimit(this.p.stats.level); }
  r(id) { return this.rank[id] || 0; }

  canRaise(k) {
    const m = this.mastery[k] + 1;
    if (m > this.p.stats.level) return { ok: false, msg: 'Ustalık seviyesi karakter seviyesini geçemez.' };
    if (this.total() + 1 > this.limit()) return { ok: false, msg: 'Toplam ustalık sınırına ulaştın (' + this.limit() + ').' };
    if (this.sp < masteryCost(m)) return { ok: false, msg: 'Yeterli SP yok (' + masteryCost(m) + ' gerekli).' };
    return { ok: true, cost: masteryCost(m) };
  }
  raise(k) {
    const c = this.canRaise(k);
    if (!c.ok) return c;
    this.sp -= c.cost; this.mastery[k]++;
    this.changed();
    return { ok: true, msg: MASTERIES[k].name + ' ustalığı ' + this.mastery[k] + '. seviye!' };
  }
  canLearn(id) {
    const s = SKILLS_BY_ID[id], r = this.r(id) + 1;
    if (r > s.maxR) return { ok: false, msg: 'En üst kademede.' };
    const need = rankReq(s, r);
    if (this.mastery[s.m] < need) return { ok: false, msg: MASTERIES[s.m].name + ' ' + need + '. seviye gerekli.' };
    const cost = rankCost(s, r);
    if (this.sp < cost) return { ok: false, msg: 'Yeterli SP yok (' + cost + ' gerekli).' };
    return { ok: true, cost };
  }
  learn(id) {
    const c = this.canLearn(id);
    if (!c.ok) return c;
    this.sp -= c.cost; this.rank[id] = this.r(id) + 1;
    this.changed();
    const s = SKILLS_BY_ID[id];
    return { ok: true, first: this.rank[id] === 1, msg: s.name + (this.rank[id] > 1 ? ' ' + this.rank[id] + '. kademe' : ' öğrenildi') + '!' };
  }
  // SP deneyimi: 400 SP-EXP = 1 SP (Silkroad'daki gibi)
  gainSpExp(n) {
    this.spExp += n;
    let got = 0;
    while (this.spExp >= 400) { this.spExp -= 400; this.sp++; got++; }
    if (got) this.changed();
    return got;
  }
  passives() {
    const t = {};
    for (const id in this.rank) {
      const s = SKILLS_BY_ID[id];
      if (!s || s.type !== 'passive') continue;
      for (const k in s.pass) t[k] = (t[k] || 0) + sval(s.pass[k], s, this.rank[id]);
    }
    return t;
  }
  serialize() { return { m: { ...this.mastery }, r: { ...this.rank }, sp: this.sp, se: this.spExp }; }
  load(d) {
    if (!d) return;
    for (const k in MASTERIES) this.mastery[k] = clamp((d.m && d.m[k]) | 0, 0, 200);
    this.rank = {};
    for (const id in d.r || {}) if (SKILLS_BY_ID[id]) this.rank[id] = clamp(d.r[id] | 0, 0, SKILLS_BY_ID[id].maxR);
    this.sp = Math.max(0, d.sp | 0); this.spExp = clamp(d.se | 0, 0, 399);
    this.changed();
  }
}
