// Eşya verileri (Silkroad tarzı): 10 derece, 5 silah türü + kalkan, 6 parça zırh (kumaş/hafif/ağır),
// küpe/kolye/yüzük, mühürler (Yıldız/Ay/Güneş), mavi statlar, dayanıklılık, simya (+12), yığınlanan sarf malzemeleri.

const RARITY = [
  { name: 'Sıradan',      color: '#e8e8e8', hex: 0xe8e8e8, mult: 1.0,  val: 1.0, blues: [0, 1] },
  { name: 'Yıldız Mührü', color: '#ffe066', hex: 0xffe066, mult: 1.18, val: 4,   blues: [2, 3] },
  { name: 'Ay Mührü',     color: '#ffb44a', hex: 0xffb44a, mult: 1.32, val: 9,   blues: [3, 4] },
  { name: 'Güneş Mührü',  color: '#ff6a3a', hex: 0xff6a3a, mult: 1.5,  val: 20,  blues: [4, 5] }
];
const BLUE_COLOR = '#6ab4ff';
const MAX_DEGREE = 10;
const degreeReq = d => (d - 1) * 8 + 1;              // 1, 9, 17, 25 ... 73
const degreeOf = level => clamp(Math.floor((level - 1) / 8) + 1, 1, MAX_DEGREE);

const EQUIP_SLOTS = {
  weapon:   { name: 'Silah',   icon: '⚔️' },
  shield:   { name: 'Kalkan',  icon: '🛡️' },
  head:     { name: 'Baş',     icon: '🪖' },
  shoulder: { name: 'Omuz',    icon: '🧣' },
  chest:    { name: 'Göğüs',   icon: '🥋' },
  hands:    { name: 'Eller',   icon: '🧤' },
  legs:     { name: 'Bacak',   icon: '👖' },
  feet:     { name: 'Ayak',    icon: '👢' },
  earring:  { name: 'Küpe',    icon: '🔸' },
  necklace: { name: 'Kolye',   icon: '📿' },
  ring1:    { name: 'Yüzük',   icon: '💍' },
  ring2:    { name: 'Yüzük',   icon: '💍' }
};
const ARMOR_PARTS = ['head', 'shoulder', 'chest', 'hands', 'legs', 'feet'];
const PART_W = { head: 0.15, shoulder: 0.12, chest: 0.30, hands: 0.10, legs: 0.22, feet: 0.11 };
const PART_NAME = { head: 'Miğfer', shoulder: 'Omuzluk', chest: 'Göğüslük', hands: 'Eldiven', legs: 'Dizlik', feet: 'Çizme' };
const ARMOR_TYPES = {
  garment:   { name: 'Kumaş', phy: 0.7, mag: 1.35, mp: 1 },
  protector: { name: 'Hafif', phy: 1.0, mag: 1.0,  hp: 0.5, mp: 0.5 },
  armor:     { name: 'Ağır',  phy: 1.35, mag: 0.65, hp: 1 }
};
const WEAPON_TYPES = {
  sword:  { name: 'Kılıç',  icon: '⚔️', phy: 0.85, mag: 1.15, spd: 1.0,  range: 2.7, oneHand: true },
  blade:  { name: 'Bıçak',  icon: '🗡️', phy: 1.05, mag: 0.85, spd: 1.0,  range: 2.7, oneHand: true },
  spear:  { name: 'Mızrak', icon: '🔱', phy: 1.15, mag: 1.35, spd: 1.25, range: 3.4 },
  glaive: { name: 'Pala',   icon: '🪓', phy: 1.45, mag: 0.95, spd: 1.25, range: 3.4 },
  bow:    { name: 'Yay',    icon: '🏹', phy: 1.05, mag: 0.6,  spd: 1.1,  range: 16, ranged: true }
};
const DEG_PREFIX = ['Söğüt', 'Bambu', 'Demir', 'Çelik', 'Yeşim', 'Kaplan', 'Anka', 'Ejder', 'Gök', 'Cennet'];
const WEAPON_NOUN = { sword: 'Kılıcı', blade: 'Bıçağı', spear: 'Mızrağı', glaive: 'Palası', bow: 'Yayı' };

// Mavi statlar (büyü seçenekleri). max(d) = derece başına üst sınır
const BLUES = {
  str:  { name: 'GÜÇ',          fmt: v => 'GÜÇ +' + v,            max: d => 2 + d },
  int:  { name: 'ZEKÂ',         fmt: v => 'ZEKÂ +' + v,           max: d => 2 + d },
  hp:   { name: 'Can',          fmt: v => 'Can %' + v + ' artar', max: () => 15 },
  mp:   { name: 'Mana',         fmt: v => 'Mana %' + v + ' artar', max: () => 15 },
  crit: { name: 'Kritik',       fmt: v => 'Kritik +' + v,         max: () => 8 },
  dur:  { name: 'Dayanıklılık', fmt: v => 'Dayanıklılık %' + (v * 20) + ' artar', max: () => 8 }
};
const BLUE_BY_KIND = {
  weapon: ['str', 'int', 'crit', 'dur'], shield: ['str', 'int', 'hp', 'dur'],
  armor: ['str', 'int', 'hp', 'mp', 'dur'], acc: ['str', 'int', 'hp', 'mp']
};

// --- Taban eşyalar (programla üretilir) ---
const ITEM_BASES = {};
(function buildBases() {
  const P = d => 8 + d * 14 + d * d * 3;       // silah fiziksel taban saldırı
  const D = d => 6 + d * 10 + d * d * 2;       // tam setin taban savunması
  for (let d = 1; d <= MAX_DEGREE; d++) {
    const req = degreeReq(d), val = Math.round(60 * d * d + 40 * d);
    for (const t in WEAPON_TYPES) {
      const w = WEAPON_TYPES[t], two = w.oneHand || w.ranged ? 1 : 1.35;
      ITEM_BASES[t + '_' + d] = {
        cat: 'weapon', wtype: t, slot: 'weapon', d, req, icon: w.icon,
        name: DEG_PREFIX[d - 1] + ' ' + WEAPON_NOUN[t],
        phy: Math.round(P(d) * w.phy * two), mag: Math.round(P(d) * w.mag * two), value: val * (two > 1 ? 1.3 : 1)
      };
    }
    ITEM_BASES['shield_' + d] = { cat: 'shield', slot: 'shield', d, req, icon: '🛡️', name: DEG_PREFIX[d - 1] + ' Kalkanı',
      pdef: Math.round(D(d) * 0.35), mdef: Math.round(D(d) * 0.3), block: 10 + d, value: val * 0.8 };
    for (const at in ARMOR_TYPES) {
      const a = ARMOR_TYPES[at];
      for (const p of ARMOR_PARTS) {
        ITEM_BASES[p + '_' + at + '_' + d] = {
          cat: 'armor', atype: at, slot: p, d, req, icon: EQUIP_SLOTS[p].icon,
          name: DEG_PREFIX[d - 1] + ' ' + a.name + ' ' + PART_NAME[p],
          pdef: Math.max(1, Math.round(D(d) * PART_W[p] * a.phy)), mdef: Math.max(1, Math.round(D(d) * PART_W[p] * a.mag)),
          hp: a.hp ? Math.round((8 + d * 9) * PART_W[p] * 4 * a.hp) : 0, mp: a.mp ? Math.round((8 + d * 9) * PART_W[p] * 4 * a.mp) : 0,
          value: val * PART_W[p] * 2.2
        };
      }
    }
    ITEM_BASES['earring_' + d] = { cat: 'acc', slot: 'earring', d, req, icon: '🔸', name: DEG_PREFIX[d - 1] + ' Küpesi',
      mdef: Math.round(D(d) * 0.12), mp: 10 + d * 12, value: val * 0.9 };
    ITEM_BASES['necklace_' + d] = { cat: 'acc', slot: 'necklace', d, req, icon: '📿', name: DEG_PREFIX[d - 1] + ' Kolyesi',
      pdef: Math.round(D(d) * 0.08), mdef: Math.round(D(d) * 0.08), hp: 15 + d * 15, value: val };
    ITEM_BASES['ring_' + d] = { cat: 'acc', slot: 'ring', d, req, icon: '💍', name: DEG_PREFIX[d - 1] + ' Yüzüğü',
      pdef: Math.round(D(d) * 0.1), hp: 10 + d * 12, value: val * 0.85 };
  }
})();

// --- Sarf ve malzemeler (yığınlanır) ---
const POT_GRADES = [
  { n: 'Küçük', req: 1, hp: 90, mp: 70, price: 15 },
  { n: 'Orta', req: 12, hp: 260, mp: 200, price: 45 },
  { n: 'Büyük', req: 25, hp: 600, mp: 460, price: 110 },
  { n: 'Çok Büyük', req: 40, hp: 1150, mp: 880, price: 240 },
  { n: 'Ejder', req: 60, hp: 2000, mp: 1550, price: 450 }
];
POT_GRADES.forEach((g, i) => {
  ITEM_BASES['hp' + (i + 1)] = { cat: 'use', use: 'hp', amount: g.hp, req: g.req, icon: '🧪', name: 'Can İksiri (' + g.n + ')', stack: 250, value: g.price, cd: 'pot' };
  ITEM_BASES['mp' + (i + 1)] = { cat: 'use', use: 'mp', amount: g.mp, req: g.req, icon: '💧', name: 'Mana İksiri (' + g.n + ')', stack: 250, value: Math.round(g.price * 1.2), cd: 'pot' };
});
Object.assign(ITEM_BASES, {
  pill:   { cat: 'use', use: 'cure', icon: '💊', name: 'Evrensel Hap', stack: 250, value: 30, sub: 'Yanma, zehir, donma ve sersemlemeyi geçirir', cd: 'pill' },
  ret:    { cat: 'use', use: 'return', icon: '📜', name: 'Dönüş Parşömeni', stack: 50, value: 50, sub: '3 sn sonra şehre ışınlar', cd: 'scroll' },
  rev:    { cat: 'use', use: 'reverse', icon: '🌀', name: 'Ters Dönüş Parşömeni', stack: 50, value: 200, sub: 'Son öldüğün ya da döndüğün yere ışınlar', cd: 'scroll' },
  spd:    { cat: 'use', use: 'speed', icon: '🐎', name: 'Hız Parşömeni', stack: 50, value: 120, sub: '10 dakika %30 hız', cd: 'spd' },
  zerk:   { cat: 'use', use: 'zerk', icon: '😤', name: 'Berserk İksiri', stack: 50, value: 300, sub: 'Berserk kürelerini doldurur', cd: 'zerk' },
  arrow:  { cat: 'ammo', icon: '➶', name: 'Ok Destesi', stack: 1000, value: 0.5, sub: 'Yay için gerekli' },
  elx_w:  { cat: 'mat', icon: '⚗️', name: 'Güçlendirme İksiri (Silah)', stack: 50, value: 400, sub: 'Simya: silahı + yükseltir', elx: 'weapon' },
  elx_a:  { cat: 'mat', icon: '⚗️', name: 'Güçlendirme İksiri (Zırh)', stack: 50, value: 300, sub: 'Simya: zırh parçasını + yükseltir', elx: 'armor' },
  elx_s:  { cat: 'mat', icon: '⚗️', name: 'Güçlendirme İksiri (Kalkan)', stack: 50, value: 300, sub: 'Simya: kalkanı + yükseltir', elx: 'shield' },
  elx_c:  { cat: 'mat', icon: '⚗️', name: 'Güçlendirme İksiri (Takı)', stack: 50, value: 350, sub: 'Simya: takıyı + yükseltir', elx: 'acc' },
  luck:   { cat: 'mat', icon: '✨', name: 'Şans Tozu', stack: 50, value: 250, sub: 'Simyada başarı şansı +%12' },
  astral: { cat: 'mat', icon: '🔷', name: 'Koruma Taşı', stack: 20, value: 2500, sub: 'Simya başarısız olursa eşya +0\'a düşmez, sadece -1' },
  q_fang: { cat: 'quest', icon: '🦷', name: 'Kurt Dişi', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_tail: { cat: 'quest', icon: '🦂', name: 'Akrep İğnesi', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_scale: { cat: 'quest', icon: '🐍', name: 'Yılan Pulu', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_fur: { cat: 'quest', icon: '🐻', name: 'Ayı Postu', stack: 50, value: 0, sub: 'Görev eşyası' }
});
for (const k in BLUES) ITEM_BASES['ms_' + k] = { cat: 'mat', icon: '🔮', name: 'Büyü Taşı (' + BLUES[k].name + ')', stack: 50, value: 600, sub: 'Simya: eşyaya ' + BLUES[k].name + ' mavi statı ekler/artırır', stone: k };

const isStack = b => !!(ITEM_BASES[b] && ITEM_BASES[b].stack);
const isGear = b => { const c = ITEM_BASES[b] && ITEM_BASES[b].cat; return c === 'weapon' || c === 'shield' || c === 'armor' || c === 'acc'; };
function elixirFor(base) { const b = ITEM_BASES[base]; return b.cat === 'weapon' ? 'elx_w' : b.cat === 'shield' ? 'elx_s' : b.cat === 'armor' ? 'elx_a' : 'elx_c'; }
const maxDur = it => { const b = ITEM_BASES[it.base]; const bl = (it.blues || []).find(x => x[0] === 'dur'); return Math.round((20 + b.d * 6) * (1 + (bl ? bl[1] * 0.2 : 0))); };

let _itemUid = 1;
function makeItem(base, rarity = 0, plus = 0, blues = null) {
  if (isStack(base)) return { uid: _itemUid++, base, n: Math.max(1, rarity || 1) };
  const it = { uid: _itemUid++, base, rarity, plus, blues: blues || [], dur: 0 };
  it.dur = maxDur(it);
  return it;
}
function makeStack(base, n = 1) { return { uid: _itemUid++, base, n }; }

function rollBlues(base, rarity, rng = Math.random) {
  const b = ITEM_BASES[base], kind = b.cat, pool = BLUE_BY_KIND[kind].slice(), r = RARITY[rarity];
  let n = r.blues[0] + (rng() < 0.5 ? r.blues[1] - r.blues[0] : 0);
  if (rarity === 0) n = rng() < 0.15 ? 1 : 0;
  const out = [];
  while (n-- > 0 && pool.length) {
    const k = pool.splice(Math.floor(rng() * pool.length), 1)[0], mx = BLUES[k].max(b.d);
    out.push([k, Math.max(1, Math.round(mx * (0.3 + rng() * 0.7)))]);
  }
  return out;
}

const PLUS_MULT = p => 1 + 0.09 * p + 0.008 * p * p;
function itemInfo(it) {
  const b = ITEM_BASES[it.base];
  if (!b) return { name: '?', icon: '❔', color: '#999', stack: true };
  if (isStack(it.base)) {
    return { name: b.name, baseName: b.name, icon: b.icon, color: b.cat === 'quest' ? '#ffd23a' : b.cat === 'mat' ? '#9fe3ff' : '#e8e8e8',
      stack: true, n: it.n, max: b.stack, sub: b.sub || '', req: b.req || 1, value: b.value, cat: b.cat };
  }
  const r = RARITY[it.rarity] || RARITY[0], pm = PLUS_MULT(it.plus || 0), m = r.mult * pm;
  const broken = it.dur <= 0, k = broken ? 0.3 : 1;
  const st = v => (v ? Math.max(1, Math.round(v * m * k)) : 0);
  const bl = {};
  for (const [kk, v] of it.blues || []) bl[kk] = (bl[kk] || 0) + v;
  const color = it.rarity > 0 ? r.color : (it.blues && it.blues.length ? BLUE_COLOR : r.color);
  const typeName = b.cat === 'weapon' ? WEAPON_TYPES[b.wtype].name : b.cat === 'armor' ? ARMOR_TYPES[b.atype].name + ' ' + EQUIP_SLOTS[b.slot].name : (EQUIP_SLOTS[b.slot] || EQUIP_SLOTS.ring1).name;
  return {
    name: b.name + (it.plus ? ' (+' + it.plus + ')' : ''), baseName: b.name, cat: b.cat, slot: b.slot, req: b.req, d: b.d,
    wtype: b.wtype, atype: b.atype, typeName, icon: b.icon,
    phy: st(b.phy), mag: st(b.mag), pdef: st(b.pdef), mdef: st(b.mdef), hp: st(b.hp), mp: st(b.mp), block: b.block || 0,
    blues: bl, dur: it.dur, maxDur: maxDur(it), broken,
    value: Math.round(b.value * r.val * (1 + 0.35 * (it.plus || 0))),
    color, hex: parseInt(color.slice(1), 16), rarityName: r.name
  };
}
function sellPrice(it) {
  const n = itemInfo(it);
  return n.stack ? Math.max(0, Math.floor(n.value * 0.3)) * it.n : Math.max(1, Math.round(n.value * 0.3));
}
function itemStatText(n) {
  if (n.stack) return n.sub || '';
  const p = [];
  if (n.phy) p.push('Fiz. Saldırı ' + Math.round(n.phy * 0.9) + '–' + Math.round(n.phy * 1.1));
  if (n.mag) p.push('Büyü Saldırı ' + Math.round(n.mag * 0.9) + '–' + Math.round(n.mag * 1.1));
  if (n.pdef) p.push('Fiz. Savunma ' + n.pdef);
  if (n.mdef) p.push('Büyü Savunma ' + n.mdef);
  if (n.block) p.push('Blok %' + n.block);
  if (n.hp) p.push('Can +' + n.hp);
  if (n.mp) p.push('Mana +' + n.mp);
  return p.join(' · ');
}
function blueText(n) {
  if (!n.blues) return '';
  return Object.keys(n.blues).map(k => BLUES[k].fmt(n.blues[k])).join('<br>');
}

// --- Simya ---
const MAX_PLUS = 12;
const PLUS_CHANCE = [1, 0.92, 0.85, 0.75, 0.62, 0.5, 0.4, 0.32, 0.25, 0.19, 0.14, 0.1, 0.07];   // indeks = hedef +
function alchemyChance(it, lucky) { return Math.min(0.97, PLUS_CHANCE[(it.plus || 0) + 1] + (lucky ? 0.12 : 0)); }

// --- Düşen eşyalar ---
function randomGear(level, rng = Math.random, rareBoost = 1) {
  let d = degreeOf(level);
  if (d > 1 && rng() < 0.3) d--;
  const r = rng();
  const kind = r < 0.3 ? 'weapon' : r < 0.38 ? 'shield' : r < 0.82 ? 'armor' : 'acc';
  let base;
  if (kind === 'weapon') base = Object.keys(WEAPON_TYPES)[Math.floor(rng() * 5)] + '_' + d;
  else if (kind === 'shield') base = 'shield_' + d;
  else if (kind === 'armor') base = ARMOR_PARTS[Math.floor(rng() * 6)] + '_' + Object.keys(ARMOR_TYPES)[Math.floor(rng() * 3)] + '_' + d;
  else base = ['earring', 'necklace', 'ring'][Math.floor(rng() * 3)] + '_' + d;
  const q = rng();
  const rarity = q < 0.0018 * rareBoost ? 3 : q < 0.007 * rareBoost ? 2 : q < 0.025 * rareBoost ? 1 : 0;
  const it = makeItem(base, rarity, 0, rollBlues(base, rarity, rng));
  it.dur = Math.max(1, Math.round(it.dur * (0.6 + rng() * 0.4)));
  return it;
}
const potFor = (level, kind) => { let g = 1; POT_GRADES.forEach((p, i) => { if (level >= p.req) g = i + 1; }); return kind + g; };
