// Eşya verileri (Silkroad tarzı): 10 derece, 5 silah türü + kalkan, 6 parça zırh (kumaş/hafif/ağır),
// küpe/kolye/yüzük, mühürler (Yıldız/Ay/Güneş), mavi statlar, dayanıklılık, simya (+12), yığınlanan sarf malzemeleri.

// Nadirlik: normal + Silkroad'daki üç mühür (Seal of Star / Moon / Sun)
const RARITY = [
  { name: 'Sıradan',      tr: 'Sıradan',      sym: '',  color: '#e8e8e8', hex: 0xe8e8e8, mult: 1.0,  val: 1.0, blues: [0, 1] },
  { name: 'Seal of Star', tr: 'Yıldız Mührü', sym: '★ ', color: '#ffe066', hex: 0xffe066, mult: 1.2,  val: 4,   blues: [2, 3] },
  { name: 'Seal of Moon', tr: 'Ay Mührü',     sym: '☾ ', color: '#ffb44a', hex: 0xffb44a, mult: 1.35, val: 9,   blues: [3, 4] },
  { name: 'Seal of Sun',  tr: 'Güneş Mührü',  sym: '☀ ', color: '#ff6a3a', hex: 0xff6a3a, mult: 1.55, val: 20,  blues: [4, 5] },
  { name: 'Seal of Nova', tr: 'Nova Mührü',   sym: '✦ ', color: '#c86aff', hex: 0xc86aff, mult: 1.8,  val: 45,  blues: [5, 6] }
];
// Her derecede 3 ara seviye (kademe): gerekli seviye derece başı +0 / +3 / +5
const TIERS = [{ suf: '', add: 0 }, { suf: 'b', add: 3 }, { suf: 'c', add: 5 }];
const TIER_ADJ = { weapon: ['', 'Keskin ', 'Usta İşi '], armor: ['', 'Sağlam ', 'Usta İşi '], shield: ['', 'Sağlam ', 'Usta İşi '], acc: ['', 'Parlak ', 'Kusursuz '] };
const BLUE_COLOR = '#6ab4ff';
const MAX_DEGREE = 14;
// iSRO'daki derece bantları (gerekli seviye): 1–9 eski, 10–14 Efsane güncellemeleri
const DEG_REQ = [1, 8, 16, 24, 32, 42, 52, 64, 76, 90, 101, 110, 120, 130];
const degreeReq = d => DEG_REQ[clamp(d, 1, MAX_DEGREE) - 1];
const degreeBand = d => (d < MAX_DEGREE ? DEG_REQ[d] : 141) - DEG_REQ[d - 1];
const degreeOf = level => { let d = 1; DEG_REQ.forEach((r, i) => { if (level >= r) d = i + 1; }); return d; };

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
  ring2:    { name: 'Yüzük',   icon: '💍' },
  av_hat:   { name: 'Avatar Şapka', icon: '🎩' },
  av_dress: { name: 'Avatar Giysi', icon: '👘' },
  av_attach:{ name: 'Avatar Süs',   icon: '🪽' }
};
const ARMOR_PARTS = ['head', 'shoulder', 'chest', 'hands', 'legs', 'feet'];
const PART_W = { head: 0.15, shoulder: 0.12, chest: 0.30, hands: 0.10, legs: 0.22, feet: 0.11 };
const PART_NAME = { head: 'Miğfer', shoulder: 'Omuzluk', chest: 'Göğüslük', hands: 'Eldiven', legs: 'Dizlik', feet: 'Çizme' };
// race: 'ch' Çin, 'eu' Avrupa — iki ırk birbirinin silah ve zırhını kullanamaz (takı, kalkan ve avatar ortak)
const ARMOR_TYPES = {
  garment:   { name: 'Kumaş', phy: 0.7, mag: 1.35, mp: 1, race: 'ch', vis: 'garment' },
  protector: { name: 'Hafif', phy: 1.0, mag: 1.0,  hp: 0.5, mp: 0.5, race: 'ch', vis: 'protector' },
  armor:     { name: 'Ağır',  phy: 1.35, mag: 0.65, hp: 1, race: 'ch', vis: 'armor' },
  robe:      { name: 'Cüppe', phy: 0.7, mag: 1.35, mp: 1, race: 'eu', vis: 'garment' },
  light:     { name: 'Deri',  phy: 1.0, mag: 1.0,  hp: 0.5, mp: 0.5, race: 'eu', vis: 'protector' },
  heavy:     { name: 'Plaka', phy: 1.35, mag: 0.65, hp: 1, race: 'eu', vis: 'armor' }
};
const WEAPON_TYPES = {
  sword:  { name: 'Kılıç',  icon: '⚔️', phy: 0.85, mag: 1.15, spd: 1.0,  range: 2.7, oneHand: true },
  blade:  { name: 'Bıçak',  icon: '🗡️', phy: 1.05, mag: 0.85, spd: 1.0,  range: 2.7, oneHand: true },
  spear:  { name: 'Mızrak', icon: '🔱', phy: 1.15, mag: 1.35, spd: 1.25, range: 3.4 },
  glaive: { name: 'Pala',   icon: '🪓', phy: 1.45, mag: 0.95, spd: 1.25, range: 3.4 },
  bow:    { name: 'Yay',    icon: '🏹', phy: 1.05, mag: 0.6,  spd: 1.1,  range: 16, ranged: true, ammo: true },
  // --- Avrupa ---
  esword: { name: 'Tek El Kılıcı', icon: '🗡️', phy: 0.95, mag: 0.95, spd: 1.0,  range: 2.7, oneHand: true, race: 'eu' },
  tsword: { name: 'Çift El Kılıcı', icon: '⚔️', phy: 1.45, mag: 0.8, spd: 1.3,  range: 3.2, race: 'eu' },
  axe:    { name: 'Çift Balta', icon: '🪓', phy: 0.95, mag: 0.7,  spd: 0.85, range: 2.6, race: 'eu', dual: true },
  xbow:   { name: 'Arbalet', icon: '🏹', phy: 1.15, mag: 0.55, spd: 1.2,  range: 15, ranged: true, ammo: true, race: 'eu' },
  dagger: { name: 'Hançer', icon: '🔪', phy: 0.75, mag: 0.7,  spd: 0.7,  range: 2.4, race: 'eu' },
  staff:  { name: 'Asa', icon: '🪄', phy: 0.5,  mag: 1.5,  spd: 1.2,  range: 12, ranged: true, magic: 'fire', race: 'eu' },
  dstaff: { name: 'Kara Asa', icon: '🪄', phy: 0.5, mag: 1.5, spd: 1.2,  range: 12, ranged: true, magic: 'dark', race: 'eu' },
  rod:    { name: 'Rahip Asası', icon: '⚚', phy: 0.75, mag: 1.25, spd: 1.0, range: 2.6, oneHand: true, race: 'eu' },
  harp:   { name: 'Arp', icon: '🎵', phy: 0.6,  mag: 1.35, spd: 1.1,  range: 11, ranged: true, magic: 'sound', race: 'eu' }
};
for (const k in WEAPON_TYPES) WEAPON_TYPES[k].race = WEAPON_TYPES[k].race || 'ch';
let RACE = 'ch';                                   // oyuncunun ırkı (main.js ayarlar)
const RACE_NAMES = { ch: 'Çin', eu: 'Avrupa' };
const raceWeapons = (r = RACE) => Object.keys(WEAPON_TYPES).filter(k => WEAPON_TYPES[k].race === r);
const raceArmors = (r = RACE) => Object.keys(ARMOR_TYPES).filter(k => ARMOR_TYPES[k].race === r);
// eşyanın ırkı (null = ortak)
const itemRace = b => (b.cat === 'weapon' ? WEAPON_TYPES[b.wtype].race : b.cat === 'armor' ? ARMOR_TYPES[b.atype].race : null);
const DEG_PREFIX = ['Söğüt', 'Bambu', 'Demir', 'Çelik', 'Yeşim', 'Kaplan', 'Anka', 'Ejder', 'Gök', 'Cennet', 'Firavun', 'Jüpiter', 'Şambala', 'Ejderkral'];
const WEAPON_NOUN = { sword: 'Kılıcı', blade: 'Bıçağı', spear: 'Mızrağı', glaive: 'Palası', bow: 'Yayı',
  esword: 'Uzun Kılıcı', tsword: 'Büyük Kılıcı', axe: 'Baltaları', xbow: 'Arbaleti', dagger: 'Hançeri', staff: 'Asası', dstaff: 'Kara Asası', rod: 'Rahip Asası', harp: 'Arpı' };
// Avrupa eşyaları kendi derece adlarını taşır (iSRO'daki gibi farklı seriler)
const DEG_PREFIX_EU = ['Meşe', 'Bronz', 'Demir', 'Çelik', 'Şövalye', 'Aslan', 'Grifon', 'Ejder', 'Kutsal', 'İmparatorluk', 'Osiris', 'Jüpiter', 'Şambala', 'Titan'];

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
  armor: ['str', 'int', 'hp', 'mp', 'dur'], acc: ['str', 'int', 'hp', 'mp'], avatar: []
};

// --- Taban eşyalar (programla üretilir) ---
const ITEM_BASES = {};
(function buildBases() {
  const P = d => 8 + d * 14 + d * d * 3;       // silah fiziksel taban saldırı
  const D = d => 6 + d * 10 + d * d * 2;       // tam setin taban savunması
  for (let d = 1; d <= MAX_DEGREE; d++) {
    TIERS.forEach((T, ti) => {
      const dd = d + ti * 0.33, req = degreeReq(d) + Math.round(T.add * degreeBand(d) / 8), val = Math.round(60 * dd * dd + 40 * dd), sf = T.suf;
      const common = { d, tier: ti, req };
      for (const t in WEAPON_TYPES) {
        const w = WEAPON_TYPES[t], two = w.oneHand || w.ranged ? 1 : 1.35;
        ITEM_BASES[t + '_' + d + sf] = { ...common, cat: 'weapon', wtype: t, slot: 'weapon', icon: w.icon,
          name: TIER_ADJ.weapon[ti] + (w.race === 'eu' ? DEG_PREFIX_EU : DEG_PREFIX)[d - 1] + ' ' + WEAPON_NOUN[t],
          phy: Math.round(P(dd) * w.phy * two), mag: Math.round(P(dd) * w.mag * two), value: val * (two > 1 ? 1.3 : 1) };
      }
      ITEM_BASES['shield_' + d + sf] = { ...common, cat: 'shield', slot: 'shield', icon: '🛡️', name: TIER_ADJ.shield[ti] + DEG_PREFIX[d - 1] + ' Kalkanı',
        pdef: Math.round(D(dd) * 0.35), mdef: Math.round(D(dd) * 0.3), block: 10 + d + ti, value: val * 0.8 };
      for (const at in ARMOR_TYPES) {
        const a = ARMOR_TYPES[at];
        for (const p of ARMOR_PARTS) {
          ITEM_BASES[p + '_' + at + '_' + d + sf] = { ...common, cat: 'armor', atype: at, slot: p, icon: EQUIP_SLOTS[p].icon,
            name: TIER_ADJ.armor[ti] + (a.race === 'eu' ? DEG_PREFIX_EU : DEG_PREFIX)[d - 1] + ' ' + a.name + ' ' + PART_NAME[p],
            pdef: Math.max(1, Math.round(D(dd) * PART_W[p] * a.phy)), mdef: Math.max(1, Math.round(D(dd) * PART_W[p] * a.mag)),
            hp: a.hp ? Math.round((8 + dd * 9) * PART_W[p] * 4 * a.hp) : 0, mp: a.mp ? Math.round((8 + dd * 9) * PART_W[p] * 4 * a.mp) : 0,
            value: val * PART_W[p] * 2.2 };
        }
      }
      ITEM_BASES['earring_' + d + sf] = { ...common, cat: 'acc', slot: 'earring', icon: '🔸', name: TIER_ADJ.acc[ti] + DEG_PREFIX[d - 1] + ' Küpesi',
        mdef: Math.round(D(dd) * 0.12), mp: Math.round(10 + dd * 12), value: val * 0.9 };
      ITEM_BASES['necklace_' + d + sf] = { ...common, cat: 'acc', slot: 'necklace', icon: '📿', name: TIER_ADJ.acc[ti] + DEG_PREFIX[d - 1] + ' Kolyesi',
        pdef: Math.round(D(dd) * 0.08), mdef: Math.round(D(dd) * 0.08), hp: Math.round(15 + dd * 15), value: val };
      ITEM_BASES['ring_' + d + sf] = { ...common, cat: 'acc', slot: 'ring', icon: '💍', name: TIER_ADJ.acc[ti] + DEG_PREFIX[d - 1] + ' Yüzüğü',
        pdef: Math.round(D(dd) * 0.1), hp: Math.round(10 + dd * 12), value: val * 0.85 };
    });
  }
})();
// Seviyeye göre en uygun kademe soneki ('', 'b', 'c')
function tierFor(d, level) { let s = ''; TIERS.forEach(T => { if (degreeReq(d) + Math.round(T.add * degreeBand(d) / 8) <= level) s = T.suf; }); return s; }

// --- Sarf ve malzemeler (yığınlanır) ---
const POT_GRADES = [
  { n: 'Küçük', req: 1, hp: 90, mp: 70, price: 15 },
  { n: 'Orta', req: 12, hp: 260, mp: 200, price: 45 },
  { n: 'Büyük', req: 25, hp: 600, mp: 460, price: 110 },
  { n: 'Çok Büyük', req: 40, hp: 1150, mp: 880, price: 240 },
  { n: 'Ejder', req: 60, hp: 2000, mp: 1550, price: 450 },
  { n: 'Kral', req: 85, hp: 3400, mp: 2600, price: 800 },
  { n: 'İmparator', req: 110, hp: 5200, mp: 4000, price: 1300 }
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
  arrow:  { cat: 'ammo', icon: '➶', name: 'Ok Destesi', stack: 1000, value: 0.5, sub: 'Yay ve arbalet için gerekli' },
  elx_w:  { cat: 'mat', icon: '⚗️', name: 'Güçlendirme İksiri (Silah)', stack: 50, value: 400, sub: 'Simya: silahı + yükseltir', elx: 'weapon' },
  elx_a:  { cat: 'mat', icon: '⚗️', name: 'Güçlendirme İksiri (Zırh)', stack: 50, value: 300, sub: 'Simya: zırh parçasını + yükseltir', elx: 'armor' },
  elx_s:  { cat: 'mat', icon: '⚗️', name: 'Güçlendirme İksiri (Kalkan)', stack: 50, value: 300, sub: 'Simya: kalkanı + yükseltir', elx: 'shield' },
  elx_c:  { cat: 'mat', icon: '⚗️', name: 'Güçlendirme İksiri (Takı)', stack: 50, value: 350, sub: 'Simya: takıyı + yükseltir', elx: 'acc' },
  luck:   { cat: 'mat', icon: '✨', name: 'Şans Tozu', stack: 50, value: 250, sub: 'Simyada başarı şansı +%12' },
  astral: { cat: 'mat', icon: '🔷', name: 'Koruma Taşı', stack: 20, value: 2500, sub: 'Simya başarısız olursa eşya +0\'a düşmez, sadece -1' },
  q_fang: { cat: 'quest', icon: '🦷', name: 'Kurt Dişi', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_tail: { cat: 'quest', icon: '🦂', name: 'Akrep İğnesi', stack: 50, value: 0, sub: 'Görev eşyası' },
  horse:  { cat: 'use', use: 'horse', keep: true, icon: '🐴', name: 'At Kartı', stack: 1, value: 2500, sub: 'Atını çağırır / iner. Atlıyken %70 daha hızlı (saldırınca inersin)', cd: 'mount' },
  camel:  { cat: 'use', use: 'camel', icon: '🐫', name: 'Kervan Devesi Düdüğü', stack: 20, value: 400, sub: 'Ticaret malı taşıyan kervan devesini çağırır (Tüccar)', cd: 'camel' },
  pet_grab: { cat: 'use', use: 'grabpet', keep: true, icon: '🦊', name: 'Toplayıcı Tilki', stack: 1, value: 4000, sub: 'Çağır / gönder. Yerdeki ganimeti senin için toplar', cd: 'pet' },
  pet_atk:  { cat: 'use', use: 'atkpet', keep: true, icon: '🐺', name: 'Savaş Kurdu', stack: 1, value: 8000, sub: 'Çağır / gönder. Hedefine saldırır, seninle güçlenir', cd: 'pet' },
  pet_pot:  { cat: 'use', use: 'petpot', icon: '🍖', name: 'Evcil Can İksiri', stack: 100, value: 40, sub: 'Savaş kurdunun canını yeniler', cd: 'petpot' },
  sg:     { cat: 'quest', icon: '💰', name: 'Çalıntı Mal', stack: 100, value: 0, sub: 'Hırsız Simsarı\'na sat' },
  q_scale: { cat: 'quest', icon: '🐍', name: 'Yılan Pulu', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_fur: { cat: 'quest', icon: '', name: 'Yeti Postu', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_antler: { cat: 'quest', icon: '', name: 'Geyik Boynuzu', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_silk: { cat: 'quest', icon: '', name: 'Örümcek İpeği', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_feather: { cat: 'quest', icon: '', name: 'Roc Tüyü', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_scarab: { cat: 'quest', icon: '', name: 'Bokböceği Kabuğu', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_ember: { cat: 'quest', icon: '', name: 'Sönmez Kor', stack: 50, value: 0, sub: 'Görev eşyası' },
  q_clay: { cat: 'quest', icon: '', name: 'Toprak Asker Parçası', stack: 50, value: 0, sub: 'Görev eşyası' }
});
for (const k in BLUES) ITEM_BASES['ms_' + k] = { cat: 'mat', icon: '🔮', name: 'Büyü Taşı (' + BLUES[k].name + ')', stack: 50, value: 600, sub: 'Simya: eşyaya ' + BLUES[k].name + ' mavi statı ekler/artırır', stone: k };

// --- Item Mall (Silk ile): avatarlar, premium, simya, evcil, genişletme ---
const AVATARS = {
  av_hat_straw:  { slot: 'av_hat', name: 'Gezgin Şapkası', icon: '👒', look: { kind: 'hat', c1: 0xe8c070, c2: 0xc0302a }, fb: [['hp', 3]], silk: 40 },
  av_hat_ears:   { slot: 'av_hat', name: 'Tilki Kulakları', icon: '🦊', look: { kind: 'ears', c1: 0xe07a2a }, fb: [['crit', 2]], silk: 60 },
  av_hat_crown:  { slot: 'av_hat', name: 'Altın Taç', icon: '👑', look: { kind: 'crown' }, fb: [['str', 3], ['int', 3]], silk: 120 },
  av_dress_red:  { slot: 'av_dress', name: 'İmparatorluk Cübbesi', icon: '👘', look: { c1: 0xa8181e, c2: 0x3a0808, c3: 0xffd23a }, fb: [['hp', 5], ['str', 2]], silk: 100 },
  av_dress_blue: { slot: 'av_dress', name: 'Bilge Cübbesi', icon: '🥻', look: { c1: 0x1e4aa8, c2: 0x0a1a48, c3: 0xe8e8ff }, fb: [['mp', 5], ['int', 2]], silk: 100 },
  av_dress_white:{ slot: 'av_dress', name: 'Ak Kaplan Giysisi', icon: '🐯', look: { c1: 0xf0f0f0, c2: 0x2a2a2a, c3: 0xe07a2a }, fb: [['hp', 4], ['crit', 2]], silk: 140 },
  av_att_flag:   { slot: 'av_attach', name: 'Savaş Sancağı', icon: '🚩', look: { kind: 'flag', c1: 0xc0302a }, fb: [['str', 2]], silk: 60 },
  av_att_halo:   { slot: 'av_attach', name: 'Işık Halesi', icon: '😇', look: { kind: 'halo', c1: 0xfff0a0 }, fb: [['int', 3]], silk: 90 },
  av_att_wings:  { slot: 'av_attach', name: 'Anka Kanatları', icon: '🪽', look: { kind: 'wings', c1: 0xff7a2a }, fb: [['hp', 3], ['mp', 3]], silk: 150 }
};
for (const id in AVATARS) { const a = AVATARS[id]; ITEM_BASES[id] = { cat: 'avatar', slot: a.slot, d: 1, tier: 0, req: 1, icon: a.icon, name: a.name, look: a.look, fb: a.fb, value: a.silk * 10, silk: a.silk }; }
Object.assign(ITEM_BASES, {
  prem:     { cat: 'use', use: 'premium', icon: '🎟️', name: 'Premium Bilet', stack: 20, value: 0, sub: '60 dk: EXP ve SP +%50, ganimet +%30', cd: 'prem' },
  bless:    { cat: 'use', use: 'bless', icon: '📗', name: 'Bereket Parşömeni', stack: 20, value: 0, sub: '30 dk: EXP ve SP +%100', cd: 'prem' },
  rez:      { cat: 'use', use: 'rez', icon: '🕯️', name: 'Diriliş Parşömeni', stack: 20, value: 0, sub: 'Öldüğün yerde tam canla dirilirsin, EXP kaybetmezsin' },
  hammer:   { cat: 'use', use: 'repair', icon: '🔨', name: 'Tamir Çekici', stack: 20, value: 0, sub: 'Tüm eşyalarını her yerde tamir eder', cd: 'hammer' },
  reset_stat:  { cat: 'use', use: 'resetstat', icon: '🔄', name: 'Stat Sıfırlama Parşömeni', stack: 5, value: 0, sub: 'GÜÇ/ZEKÂ puanlarını geri verir', cd: 'reset' },
  reset_skill: { cat: 'use', use: 'resetskill', icon: '♻️', name: 'Ustalık Sıfırlama Parşömeni', stack: 5, value: 0, sub: 'Harcanan tüm SP\'yi geri verir', cd: 'reset' },
  inv_exp:  { cat: 'use', use: 'invexp', icon: '🎒', name: 'Envanter Genişletme', stack: 5, value: 0, sub: 'Envantere kalıcı +16 yuva (en çok 96)', cd: 'reset' },
  st_exp:   { cat: 'use', use: 'stexp', icon: '📦', name: 'Depo Genişletme', stack: 5, value: 0, sub: 'Depoya kalıcı +24 yuva (en çok 120)', cd: 'reset' },
  immortal: { cat: 'mat', icon: '💠', name: 'Ölümsüz Taş', stack: 20, value: 0, sub: 'Simya başarısız olursa eşyanın +seviyesi hiç düşmez' },
  pet_grab2:{ cat: 'use', use: 'grabpet', keep: true, pet: 2, icon: '🐿️', name: 'Altın Sincap', stack: 1, value: 0, sub: 'Premium toplayıcı: daha geniş alan, daha hızlı, 32 yuvalı çanta', cd: 'pet' },
  horse2:   { cat: 'use', use: 'horse', keep: true, speed: 2.0, icon: '🏇', name: 'Savaş Atı Kartı', stack: 1, value: 0, sub: 'Atlıyken %100 daha hızlı', cd: 'mount' },
  fw_inv1:  { cat: 'use', use: 'fwinv', star: 1, icon: '', name: 'Unutulmuş Dünya Davetiyesi ★', stack: 10, value: 3000, sub: '20 dakikalık zindan; seviyene göre kurulur. Boss: Unutulmuş Kral' },
  fw_inv3:  { cat: 'use', use: 'fwinv', star: 3, icon: '', name: 'Unutulmuş Dünya Davetiyesi ★★★', stack: 10, value: 9000, sub: 'Daha çok ve güçlü canavar, daha iyi ganimet' },
  fw_inv5:  { cat: 'use', use: 'fwinv', star: 5, icon: '', name: 'Unutulmuş Dünya Davetiyesi ★★★★★', stack: 10, value: 25000, sub: 'En zor kademe: mühürlü eşya şansı çok yüksek' },
  gchat:    { cat: 'mat', icon: '📢', name: 'Küresel Sohbet Parşömeni', stack: 50, value: 0, sub: 'Sohbette Küresel kanaldan tüm sunucuya mesaj gönderir (/k mesaj)' },
  silkbag:  { cat: 'use', use: 'silkbag', icon: '🧧', name: 'Silk Kesesi', stack: 50, value: 0, sub: 'Açınca 5–15 Silk verir', cd: 'silkbag' }
});
const MALL = [
  { id: 'prem', name: '🎟️ Premium', items: [['prem', 1, 50], ['bless', 1, 30], ['rez', 3, 20], ['hammer', 3, 15]] },
  { id: 'alc', name: '⚗️ Simya', items: [['immortal', 1, 25], ['astral', 3, 30], ['luck', 5, 15], ['elx_w', 5, 25], ['elx_a', 5, 20], ['elx_s', 5, 20], ['elx_c', 5, 20], ['ms_str', 1, 15], ['ms_int', 1, 15], ['ms_hp', 1, 15], ['ms_crit', 1, 20]] },
  { id: 'pet', name: '🐾 Evcil & Binek', items: [['pet_grab2', 1, 150], ['pet_grab', 1, 60], ['pet_atk', 1, 100], ['pet_pot', 20, 10], ['horse2', 1, 120], ['horse', 1, 40]] },
  { id: 'scroll', name: '📜 Parşömen', items: [['gchat', 5, 10], ['fw_inv3', 1, 30], ['rev', 5, 10], ['spd', 5, 10], ['zerk', 3, 20], ['ret', 10, 5], ['reset_stat', 1, 80], ['reset_skill', 1, 120]] },
  { id: 'avatar', name: '👘 Avatar', items: Object.keys(AVATARS).map(id => [id, 1, AVATARS[id].silk]) },
  { id: 'exp', name: '🎒 Genişletme', items: [['inv_exp', 1, 100], ['st_exp', 1, 60]] }
];

const isStack = b => !!(ITEM_BASES[b] && ITEM_BASES[b].stack);
const isGear = b => { const c = ITEM_BASES[b] && ITEM_BASES[b].cat; return c === 'weapon' || c === 'shield' || c === 'armor' || c === 'acc' || c === 'avatar'; };
function elixirFor(base) { const b = ITEM_BASES[base]; return b.cat === 'weapon' ? 'elx_w' : b.cat === 'shield' ? 'elx_s' : b.cat === 'armor' ? 'elx_a' : 'elx_c'; }
const maxDur = it => { const b = ITEM_BASES[it.base]; const bl = (it.blues || []).find(x => x[0] === 'dur'); return Math.round((20 + b.d * 6) * (1 + (bl ? bl[1] * 0.2 : 0))); };

let _itemUid = 1;
function makeItem(base, rarity = 0, plus = 0, blues = null) {
  if (isStack(base)) return { uid: _itemUid++, base, n: Math.max(1, rarity || 1) };
  const fb = ITEM_BASES[base] && ITEM_BASES[base].fb;
  const it = { uid: _itemUid++, base, rarity, plus, blues: fb ? fb.map(x => x.slice()) : (blues || []), dur: 0 };
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
    return { name: b.name, baseName: b.name, icon: itemIcon(it.base), color: b.cat === 'quest' ? '#ffd23a' : b.cat === 'mat' ? '#9fe3ff' : '#e8e8e8',
      stack: true, n: it.n, max: b.stack, sub: b.sub || '', req: b.req || 1, value: b.value, cat: b.cat };
  }
  const r = RARITY[it.rarity] || RARITY[0], pm = PLUS_MULT(it.plus || 0), m = r.mult * pm;
  const broken = it.dur <= 0, k = broken ? 0.3 : 1;
  const st = v => (v ? Math.max(1, Math.round(v * m * k)) : 0);
  const bl = {};
  for (const [kk, v] of it.blues || []) bl[kk] = (bl[kk] || 0) + v;
  const color = it.rarity > 0 ? r.color : (it.blues && it.blues.length ? BLUE_COLOR : r.color);
  const typeName = b.cat === 'avatar' ? EQUIP_SLOTS[b.slot].name : b.cat === 'weapon' ? WEAPON_TYPES[b.wtype].name : b.cat === 'armor' ? ARMOR_TYPES[b.atype].name + ' ' + EQUIP_SLOTS[b.slot].name : (EQUIP_SLOTS[b.slot] || EQUIP_SLOTS.ring1).name;
  return {
    name: r.sym + b.name + (it.plus ? ' (+' + it.plus + ')' : ''), baseName: b.name, tier: b.tier || 0, cat: b.cat, slot: b.slot, req: b.req, d: b.d,
    wtype: b.wtype, atype: b.atype, typeName, icon: itemIcon(it.base),
    phy: st(b.phy), mag: st(b.mag), pdef: st(b.pdef), mdef: st(b.mdef), hp: st(b.hp), mp: st(b.mp), block: b.block || 0,
    blues: bl, dur: it.dur, maxDur: maxDur(it), broken,
    value: Math.round(b.value * r.val * (1 + 0.35 * (it.plus || 0))),
    color, hex: parseInt(color.slice(1), 16), rarityName: it.rarity ? r.name + ' (' + r.tr + ')' : r.name, seal: it.rarity || 0
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
  let sf = tierFor(d, level + 2);
  if (sf && rng() < 0.35) sf = sf === 'c' ? 'b' : '';
  const r = rng();
  const kind = r < 0.3 ? 'weapon' : r < 0.38 ? 'shield' : r < 0.82 ? 'armor' : 'acc';
  let base;
  const race = rng() < 0.75 ? RACE : (RACE === 'eu' ? 'ch' : 'eu');      // düşen eşyaların çoğu kendi ırkına
  const ws = raceWeapons(race), as = raceArmors(race);
  if (kind === 'weapon') base = ws[Math.floor(rng() * ws.length)] + '_' + d;
  else if (kind === 'shield') base = 'shield_' + d;
  else if (kind === 'armor') base = ARMOR_PARTS[Math.floor(rng() * 6)] + '_' + as[Math.floor(rng() * as.length)] + '_' + d;
  else base = ['earring', 'necklace', 'ring'][Math.floor(rng() * 3)] + '_' + d;
  base += sf;
  // Mühür şansı (ekipman düşüşü başına): Star %7, Moon %2.2, Sun %0.6 — rütbe ile artar
  const q = rng();
  const rarity = d >= 8 && q < 0.0012 * rareBoost ? 4 : q < 0.006 * rareBoost ? 3 : q < 0.028 * rareBoost ? 2 : q < 0.098 * rareBoost ? 1 : 0;
  return makeSeal(base, rarity, rng, true);
}
// Belirli nadirlikte eşya üret (mühürlü eşyalar tam dayanıklı)
function makeSeal(base, rarity, rng = Math.random, worn = false) {
  const it = makeItem(base, rarity, 0, rollBlues(base, rarity, rng));
  if (worn && !rarity) it.dur = Math.max(1, Math.round(it.dur * (0.6 + rng() * 0.4)));
  return it;
}
const potFor = (level, kind) => { let g = 1; POT_GRADES.forEach((p, i) => { if (level >= p.req) g = i + 1; }); return kind + g; };
