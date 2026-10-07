// Canavarlar: modeller, yapay zeka (dolaşma, kovalama, saldırı, geri dönüş), yeniden doğma.

const SAFE_HALF = TOWN_HALF + 3;   // şehir ve çevresi: canavar girmez, saldırmaz
function inSafeZone(x, z) { return Math.max(Math.abs(x), Math.abs(z)) < SAFE_HALF; }
const LEASH = 45;          // canavar yuvasından bu kadar uzaklaşırsa geri döner
const RESPAWN_TIME = 18;

// Canavar türleri: çarpanlar (seviyeye göre formülle ölçeklenir). magic: büyü saldırısı. status: oyuncuya etki.
const MONSTER_TYPES = {
  // --- Jangan ---
  wolf:      { name: 'Kurt', model: 'quad', look: { fur: 0x7a7a82, dark: 0x3a3a42 }, hpM: 1.1, dmgM: 0.9, defM: 0.8, expM: 1.0, speed: 6.5, aggro: 11, range: 2.0, atkInt: 1.4, hit: 1.2, scale: 1.0, labelY: 2.5 },
  boar:      { name: 'Yaban Öküzü', model: 'quad', look: { fur: 0x6a4a32, dark: 0x3a2818, tusks: true, legH: 0.5, body: [0.85, 0.75, 1.5] }, hpM: 1.3, dmgM: 0.95, defM: 1.0, expM: 1.1, speed: 5.2, aggro: 7, range: 2.0, atkInt: 1.6, hit: 1.3, scale: 1.0, labelY: 2.4 },
  scorpion:  { name: 'Dev Akrep', model: 'scorpion', look: { shell: 0x8a3a1c, dark: 0x4a1e0e }, hpM: 1.3, dmgM: 1.0, defM: 1.2, expM: 1.15, speed: 4.6, aggro: 8, range: 2.3, atkInt: 1.8, hit: 1.5, scale: 1.25, labelY: 3.3, status: { kind: 'poison', chance: 0.15, dur: 6 } },
  tiger:     { name: 'Kaplan', model: 'quad', look: { fur: 0xd8822a, dark: 0x2a1a10, stripes: true, body: [0.8, 0.7, 1.8] }, hpM: 1.25, dmgM: 1.2, defM: 1.0, expM: 1.25, speed: 7, aggro: 12, range: 2.3, atkInt: 1.3, hit: 1.4, scale: 1.2, labelY: 2.8, status: { kind: 'bleed', chance: 0.1, dur: 4 } },
  golem:     { name: 'Kum Devi', model: 'golem', look: { c: 0xa07a4c }, hpM: 1.8, dmgM: 1.25, defM: 1.5, expM: 1.5, speed: 3.8, aggro: 9, range: 2.8, atkInt: 2.0, hit: 2.0, scale: 1.5, labelY: 3.6, status: { kind: 'stun', chance: 0.08, dur: 1.2 } },
  bandit:    { name: 'Haydut', model: 'human', look: { robe: 0x3a3a44, dark: 0x24242c, hat: 'band', weapon: 'blade' }, hpM: 1.2, dmgM: 1.1, defM: 1.0, expM: 1.2, speed: 5.5, aggro: 12, range: 2.4, atkInt: 1.6, hit: 1.3, scale: 1.0, labelY: 3.3 },
  // --- Donwhang ---
  jackal:    { name: 'Çakal', model: 'quad', look: { fur: 0xc8a068, dark: 0x6a4a2a, body: [0.6, 0.55, 1.35] }, hpM: 1.0, dmgM: 1.0, defM: 0.9, expM: 1.0, speed: 7.2, aggro: 12, range: 2.0, atkInt: 1.2, hit: 1.2, scale: 0.95, labelY: 2.4 },
  sandscorp: { name: 'Kum Akrebi', model: 'scorpion', look: { shell: 0xc8a050, dark: 0x6a4a1a }, hpM: 1.3, dmgM: 1.05, defM: 1.3, expM: 1.15, speed: 4.8, aggro: 8, range: 2.3, atkInt: 1.7, hit: 1.5, scale: 1.3, labelY: 3.3, status: { kind: 'poison', chance: 0.2, dur: 6 } },
  snake:     { name: 'Dev Yılan', model: 'snake', look: { c: 0x5a7a2a, belly: 0xc8b878 }, hpM: 1.25, dmgM: 1.15, defM: 1.0, expM: 1.2, speed: 5.0, aggro: 10, range: 2.6, atkInt: 1.5, hit: 1.6, scale: 1.2, labelY: 2.6, status: { kind: 'poison', chance: 0.22, dur: 7 } },
  mummy:     { name: 'Mumya', model: 'char', char: 'zombie', look: { tint: 0xd8c8a0, h: 2.3, plain: true }, hpM: 1.5, dmgM: 1.15, defM: 1.2, expM: 1.3, speed: 3.6, aggro: 9, range: 2.3, atkInt: 1.8, hit: 1.3, scale: 1.1, labelY: 3.2, status: { kind: 'slow', chance: 0.15, dur: 3 } },
  skeleton:  { name: 'İskelet Asker', model: 'char', char: 'skeleton', look: { h: 2.3 }, hpM: 1.3, dmgM: 1.25, defM: 1.1, expM: 1.3, speed: 5.2, aggro: 11, range: 2.4, atkInt: 1.5, hit: 1.3, scale: 1.1, labelY: 3.2, status: { kind: 'bleed', chance: 0.1, dur: 4 } },
  dbandit:   { name: 'Çöl Haydudu', model: 'human', look: { robe: 0xb89058, dark: 0x6a4a2a, hat: 'band', weapon: 'glaive' }, hpM: 1.25, dmgM: 1.15, defM: 1.05, expM: 1.25, speed: 5.6, aggro: 12, range: 2.6, atkInt: 1.6, hit: 1.3, scale: 1.05, labelY: 3.3 },
  // --- Hotan ---
  icewolf:   { name: 'Buz Kurdu', model: 'quad', look: { fur: 0xe8eef4, dark: 0x8aa8c8, eye: 0x3ad8ff }, hpM: 1.15, dmgM: 1.0, defM: 0.9, expM: 1.05, speed: 7, aggro: 12, range: 2.0, atkInt: 1.3, hit: 1.2, scale: 1.1, labelY: 2.6, status: { kind: 'slow', chance: 0.15, dur: 3 } },
  bear:      { name: 'Kar Yetisi', model: 'quad', look: { fur: 0x4a3222, dark: 0x2a1a10, body: [1.2, 1.1, 1.9], legH: 0.75, noTail: true }, hpM: 1.7, dmgM: 1.3, defM: 1.3, expM: 1.45, speed: 4.6, aggro: 8, range: 2.6, atkInt: 1.9, hit: 1.9, scale: 1.35, labelY: 3.4, status: { kind: 'stun', chance: 0.08, dur: 1.2 } },
  ghost:     { name: 'Hayalet Savaşçı', model: 'char', char: 'ghost', look: { h: 2.4, ghost: true }, magic: true, hpM: 1.2, dmgM: 1.25, defM: 1.0, expM: 1.3, speed: 5.5, aggro: 12, range: 7, atkInt: 1.8, hit: 1.3, scale: 1.15, labelY: 3.3, status: { kind: 'freeze', chance: 0.07, dur: 1.5 } },
  stonegolem:{ name: 'Taş Dev', model: 'golem', look: { c: 0x8a8a92 }, hpM: 1.9, dmgM: 1.3, defM: 1.6, expM: 1.55, speed: 3.8, aggro: 9, range: 2.9, atkInt: 2.0, hit: 2.0, scale: 1.6, labelY: 3.7, status: { kind: 'stun', chance: 0.1, dur: 1.3 } },
  hbandit:   { name: 'Tepe Haydudu', model: 'human', look: { robe: 0x2a4a2a, dark: 0x14240f, hat: 'band', weapon: 'spear' }, hpM: 1.3, dmgM: 1.2, defM: 1.1, expM: 1.3, speed: 5.8, aggro: 12, range: 2.8, atkInt: 1.5, hit: 1.3, scale: 1.05, labelY: 3.3 },
  demon:     { name: 'Şeytan Muhafız', model: 'char', char: 'vampire', look: { tint: 0xff6a5a, h: 2.6, horns: true }, magic: true, hpM: 1.5, dmgM: 1.35, defM: 1.3, expM: 1.5, speed: 5.0, aggro: 12, range: 6, atkInt: 1.7, hit: 1.4, scale: 1.2, labelY: 3.6, status: { kind: 'burn', chance: 0.15, dur: 4 } },
  // --- Konstantinopolis ---
  gwolf: { name: 'Gri Kurt', model: 'quad', look: { fur: 0x8a8a8a, dark: 0x4a4a4a }, hpM: 1.05, dmgM: 0.9, defM: 0.8, expM: 1.0, speed: 6.4, aggro: 10, range: 2.0, atkInt: 1.4, hit: 1.2, scale: 1.0, labelY: 2.5 },
  stag: { name: 'Yaban Geyiği', model: 'quad', look: { fur: 0x8a5a32, dark: 0x4a2e18, horns: true }, hpM: 1.15, dmgM: 0.95, defM: 0.9, expM: 1.05, speed: 6.2, aggro: 7, range: 2.2, atkInt: 1.5, hit: 1.3, scale: 1.1, labelY: 2.8 },
  goblin: { name: 'Goblin', model: 'human', look: { robe: 0x4a6a2a, dark: 0x2a3a14, weapon: 'blade' }, hpM: 1.1, dmgM: 1.05, defM: 0.95, expM: 1.1, speed: 5.6, aggro: 11, range: 2.2, atkInt: 1.4, hit: 1.2, scale: 0.9, labelY: 2.6 },
  hound: { name: 'Cehennem Tazısı', model: 'quad', look: { fur: 0x5a1a14, dark: 0x2a0a08, eye: 0xffa020 }, hpM: 1.15, dmgM: 1.1, defM: 0.9, expM: 1.15, speed: 7, aggro: 12, range: 2.0, atkInt: 1.3, hit: 1.2, scale: 1.1, labelY: 2.6, status: { kind: 'burn', chance: 0.12, dur: 4 } },
  orc: { name: 'Ork Savaşçısı', model: 'human', look: { robe: 0x3a5a2a, dark: 0x1a2a10, weapon: 'glaive', skin: 0x5a8a3a }, hpM: 1.35, dmgM: 1.15, defM: 1.1, expM: 1.25, speed: 5.4, aggro: 11, range: 2.6, atkInt: 1.6, hit: 1.4, scale: 1.1, labelY: 3.2 },
  ewarrior: { name: 'Karanlık Şövalye', model: 'human', look: { robe: 0x2a2a34, dark: 0x101014, weapon: 'sword' }, hpM: 1.4, dmgM: 1.2, defM: 1.25, expM: 1.3, speed: 5.6, aggro: 12, range: 2.4, atkInt: 1.5, hit: 1.3, scale: 1.05, labelY: 3.3, status: { kind: 'bleed', chance: 0.1, dur: 4 } },
  ebandit: { name: 'Kanun Kaçağı', model: 'human', look: { robe: 0x6a3a2a, dark: 0x3a1a10, hat: 'band', weapon: 'blade' }, hpM: 1.2, dmgM: 1.1, defM: 1.0, expM: 1.2, speed: 5.6, aggro: 12, range: 2.4, atkInt: 1.5, hit: 1.3, scale: 1.0, labelY: 3.3 },
  // --- Küçük Asya ---
  spider: { name: 'Dev Örümcek', model: 'scorpion', look: { shell: 0x2a2a2a, dark: 0x101010 }, hpM: 1.2, dmgM: 1.05, defM: 1.0, expM: 1.1, speed: 5.8, aggro: 10, range: 2.2, atkInt: 1.4, hit: 1.4, scale: 1.1, labelY: 2.4, status: { kind: 'poison', chance: 0.18, dur: 6 } },
  wasp: { name: 'Zehirli Eşekarısı', model: 'char', look: { h: 1.6 }, hpM: 1.0, dmgM: 1.15, defM: 0.85, expM: 1.1, speed: 6.8, aggro: 12, range: 2.2, atkInt: 1.2, hit: 1.2, scale: 1.0, labelY: 2.6, status: { kind: 'poison', chance: 0.2, dur: 5 }, char: 'ghost' },
  raptor: { name: 'Pençe Kertenkele', model: 'quad', look: { fur: 0x5a7a3a, dark: 0x2a3a1a }, hpM: 1.15, dmgM: 1.15, defM: 0.95, expM: 1.15, speed: 7.2, aggro: 12, range: 2.2, atkInt: 1.2, hit: 1.3, scale: 1.1, labelY: 2.6, status: { kind: 'bleed', chance: 0.12, dur: 4 } },
  mushroom: { name: 'Mantar Ruhu', model: 'golem', look: { c: 0xc84a3a }, magic: true, hpM: 1.35, dmgM: 1.05, defM: 1.2, expM: 1.2, speed: 4.2, aggro: 8, range: 2.4, atkInt: 1.8, hit: 1.4, scale: 1.1, labelY: 2.4, status: { kind: 'poison', chance: 0.15, dur: 5 } },
  darkorc: { name: 'Kara Ork', model: 'human', look: { robe: 0x3a3a3a, dark: 0x1a1a1a, weapon: 'glaive', skin: 0x4a5a3a }, hpM: 1.45, dmgM: 1.25, defM: 1.2, expM: 1.3, speed: 5.6, aggro: 12, range: 2.6, atkInt: 1.6, hit: 1.5, scale: 1.15, labelY: 3.3, status: { kind: 'stun', chance: 0.08, dur: 1.2 } },
  abandit: { name: 'Korsan', model: 'human', look: { robe: 0x2a4a7a, dark: 0x101a3a, hat: 'band', weapon: 'blade' }, hpM: 1.25, dmgM: 1.15, defM: 1.05, expM: 1.25, speed: 5.8, aggro: 12, range: 2.4, atkInt: 1.5, hit: 1.3, scale: 1.0, labelY: 3.3 },
  // --- Semerkant ---
  raptor2: { name: 'Bozkır Kertenkelesi', model: 'quad', look: { fur: 0x8a6a3a, dark: 0x4a3a1a }, hpM: 1.2, dmgM: 1.15, defM: 1.0, expM: 1.2, speed: 7.4, aggro: 12, range: 2.4, atkInt: 1.2, hit: 1.4, scale: 1.2, labelY: 2.7, status: { kind: 'bleed', chance: 0.12, dur: 4 } },
  tribal: { name: 'Kabile Devi', model: 'golem', look: { c: 0x8a5a3a }, hpM: 1.6, dmgM: 1.3, defM: 1.35, expM: 1.45, speed: 4.6, aggro: 10, range: 2.8, atkInt: 1.9, hit: 1.9, scale: 1.35, labelY: 3.6, status: { kind: 'stun', chance: 0.1, dur: 1.3 } },
  ninja: { name: 'Gölge Suikastçı', model: 'human', look: { robe: 0x1a1a22, dark: 0x0a0a0e, weapon: 'blade' }, hpM: 1.25, dmgM: 1.35, defM: 1.0, expM: 1.35, speed: 7, aggro: 14, range: 2.4, atkInt: 1.1, hit: 1.3, scale: 1.0, labelY: 3.3, status: { kind: 'bleed', chance: 0.15, dur: 5 } },
  rocbat: { name: 'Kaya Yarasası', model: 'char', look: { h: 1.6 }, hpM: 1.15, dmgM: 1.2, defM: 0.95, expM: 1.25, speed: 7.4, aggro: 13, range: 2.2, atkInt: 1.2, hit: 1.3, scale: 1.1, labelY: 2.8, status: { kind: 'slow', chance: 0.12, dur: 3 }, char: 'ghost' },
  flydemon: { name: 'Kanatlı Şeytan', model: 'char', look: { tint: 0x8a2a2a, h: 2.4 }, magic: true, hpM: 1.4, dmgM: 1.35, defM: 1.2, expM: 1.45, speed: 6, aggro: 13, range: 6, atkInt: 1.6, hit: 1.5, scale: 1.2, labelY: 3.4, status: { kind: 'burn', chance: 0.15, dur: 4 }, char: 'vampire' },
  sbandit: { name: 'Bozkır Atlısı', model: 'human', look: { robe: 0x8a6a3a, dark: 0x4a3a1a, hat: 'band', weapon: 'spear' }, hpM: 1.35, dmgM: 1.25, defM: 1.15, expM: 1.3, speed: 6, aggro: 12, range: 2.8, atkInt: 1.5, hit: 1.3, scale: 1.05, labelY: 3.3 },
  // --- İskenderiye ---
  mummy2: { name: 'Firavun Muhafızı', model: 'char', look: { tint: 0xd8c070, h: 2.4 }, hpM: 1.55, dmgM: 1.25, defM: 1.3, expM: 1.4, speed: 4.4, aggro: 10, range: 2.4, atkInt: 1.7, hit: 1.4, scale: 1.15, labelY: 3.3, status: { kind: 'slow', chance: 0.15, dur: 3 }, char: 'zombie' },
  scarab: { name: 'Dev Bokböceği', model: 'scorpion', look: { shell: 0x1a6a6a, dark: 0x0a3a3a }, hpM: 1.45, dmgM: 1.2, defM: 1.5, expM: 1.35, speed: 5, aggro: 9, range: 2.4, atkInt: 1.7, hit: 1.6, scale: 1.3, labelY: 2.8 },
  anubisw: { name: 'Anubis Askeri', model: 'char', look: { tint: 0x2a2a2a, h: 2.4 }, hpM: 1.5, dmgM: 1.35, defM: 1.3, expM: 1.45, speed: 5.8, aggro: 12, range: 2.6, atkInt: 1.5, hit: 1.4, scale: 1.15, labelY: 3.4, status: { kind: 'bleed', chance: 0.12, dur: 4 }, char: 'skeleton' },
  sandgolem: { name: 'Kum Golemi', model: 'golem', look: { c: 0xd8b070 }, hpM: 2.0, dmgM: 1.35, defM: 1.6, expM: 1.6, speed: 3.8, aggro: 9, range: 2.9, atkInt: 2.0, hit: 2.0, scale: 1.6, labelY: 3.8, status: { kind: 'stun', chance: 0.1, dur: 1.3 } },
  kingscorp: { name: 'Kral Akrep', model: 'scorpion', look: { shell: 0x6a1010, dark: 0x2a0606 }, hpM: 1.6, dmgM: 1.4, defM: 1.4, expM: 1.55, speed: 5, aggro: 9, range: 2.6, atkInt: 1.6, hit: 1.6, scale: 1.4, labelY: 3.4, status: { kind: 'poison', chance: 0.25, dur: 7 } },
  egbandit: { name: 'Mezar Yağmacısı', model: 'human', look: { robe: 0xc8a868, dark: 0x6a5a3a, hat: 'band', weapon: 'blade' }, hpM: 1.4, dmgM: 1.3, defM: 1.2, expM: 1.35, speed: 6, aggro: 12, range: 2.4, atkInt: 1.5, hit: 1.3, scale: 1.05, labelY: 3.3 },
  // --- Şambala ---
  frostwolf: { name: 'Ayaz Kurdu', model: 'quad', look: { fur: 0xf0f4fa, dark: 0x9ab8d8, eye: 0x3ad8ff }, hpM: 1.3, dmgM: 1.25, defM: 1.1, expM: 1.3, speed: 7.2, aggro: 12, range: 2.0, atkInt: 1.3, hit: 1.3, scale: 1.15, labelY: 2.7, status: { kind: 'freeze', chance: 0.06, dur: 1.5 } },
  iceyeti: { name: 'Buzul Yetisi', model: 'golem', look: { c: 0xe8eef4 }, hpM: 1.8, dmgM: 1.4, defM: 1.4, expM: 1.6, speed: 4.6, aggro: 9, range: 2.7, atkInt: 1.8, hit: 1.9, scale: 1.4, labelY: 3.5, status: { kind: 'slow', chance: 0.18, dur: 3 } },
  icegolem: { name: 'Buz Golemi', model: 'golem', look: { c: 0x9ad0f0 }, hpM: 2.1, dmgM: 1.45, defM: 1.7, expM: 1.7, speed: 3.8, aggro: 9, range: 2.9, atkInt: 2.0, hit: 2.0, scale: 1.6, labelY: 3.8, status: { kind: 'freeze', chance: 0.08, dur: 1.6 } },
  lavademon: { name: 'Lav Şeytanı', model: 'char', look: { tint: 0xff5a2a, h: 2.6, glow: 0xff3a00 }, magic: true, hpM: 1.7, dmgM: 1.55, defM: 1.4, expM: 1.7, speed: 5.2, aggro: 12, range: 6, atkInt: 1.6, hit: 1.5, scale: 1.25, labelY: 3.6, status: { kind: 'burn', chance: 0.22, dur: 5 }, char: 'vampire' },
  firedragon: { name: 'Ateş Ejderi', model: 'quad', look: { fur: 0xb82a10, dark: 0x3a0806, horns: true, eye: 0xffd23a, body: [1.2, 1.1, 2.2] }, hpM: 2.2, dmgM: 1.6, defM: 1.6, expM: 1.9, speed: 5.6, aggro: 12, range: 3.2, atkInt: 1.7, hit: 2.4, scale: 1.6, labelY: 3.6, status: { kind: 'burn', chance: 0.25, dur: 5 } },
  monk: { name: 'Sürgün Rahip', model: 'human', look: { robe: 0xc8702a, dark: 0x6a3010, hat: 'band', weapon: 'spear' }, hpM: 1.5, dmgM: 1.45, defM: 1.3, expM: 1.5, speed: 6, aggro: 12, range: 2.8, atkInt: 1.4, hit: 1.3, scale: 1.05, labelY: 3.3 },
  // --- Zindanlar ---
  cavebat: { name: 'Mağara Yarasası', model: 'char', look: { h: 1.5 }, hpM: 1.05, dmgM: 1.1, defM: 0.9, expM: 1.15, speed: 7.2, aggro: 13, range: 2.0, atkInt: 1.2, hit: 1.2, scale: 1.0, labelY: 2.6, char: 'ghost' },
  slime: { name: 'Balçık', model: 'golem', look: { c: 0x5aa83a }, hpM: 1.3, dmgM: 1.05, defM: 1.3, expM: 1.2, speed: 4.2, aggro: 8, range: 2.2, atkInt: 1.8, hit: 1.3, scale: 1.0, labelY: 2.2, status: { kind: 'poison', chance: 0.15, dur: 5 } },
  skelminion: { name: 'İskelet Er', model: 'char', look: { h: 2.1 }, hpM: 1.2, dmgM: 1.15, defM: 1.05, expM: 1.25, speed: 5.4, aggro: 12, range: 2.4, atkInt: 1.5, hit: 1.3, scale: 1.0, labelY: 3.1, char: 'skeleton' },
  skelmage: { name: 'İskelet Büyücü', model: 'char', look: { h: 2.2 }, magic: true, hpM: 1.15, dmgM: 1.3, defM: 0.95, expM: 1.35, speed: 5, aggro: 13, range: 7, atkInt: 1.8, hit: 1.3, scale: 1.0, labelY: 3.2, status: { kind: 'freeze', chance: 0.08, dur: 1.5 }, char: 'skeleton' },
  terracotta: { name: 'Toprak Asker', model: 'human', look: { robe: 0xa86a4a, dark: 0x6a3a2a, weapon: 'spear' }, hpM: 1.5, dmgM: 1.25, defM: 1.4, expM: 1.4, speed: 4.8, aggro: 12, range: 2.8, atkInt: 1.6, hit: 1.4, scale: 1.1, labelY: 3.3 },
  terracotta2: { name: 'Toprak General', model: 'human', look: { robe: 0x8a4a2a, dark: 0x4a2010, weapon: 'glaive' }, hpM: 1.7, dmgM: 1.35, defM: 1.5, expM: 1.55, speed: 4.8, aggro: 12, range: 2.9, atkInt: 1.6, hit: 1.5, scale: 1.25, labelY: 3.5, status: { kind: 'stun', chance: 0.1, dur: 1.3 } },
  tombspirit: { name: 'Mezar Ruhu', model: 'char', look: { h: 2.2, ghost: true }, magic: true, hpM: 1.3, dmgM: 1.35, defM: 1.1, expM: 1.45, speed: 5.8, aggro: 13, range: 6, atkInt: 1.6, hit: 1.3, scale: 1.1, labelY: 3.2, status: { kind: 'freeze', chance: 0.08, dur: 1.5 }, char: 'ghost' },
  jiangshi: { name: 'Jiangshi', model: 'char', look: { tint: 0x9ac8c8, h: 2.3 }, hpM: 1.55, dmgM: 1.3, defM: 1.25, expM: 1.45, speed: 4.6, aggro: 10, range: 2.4, atkInt: 1.6, hit: 1.3, scale: 1.1, labelY: 3.2, status: { kind: 'slow', chance: 0.18, dur: 3 }, char: 'zombie' },
  jiangshi2: { name: 'Kadim Jiangshi', model: 'char', look: { tint: 0x6a9a9a, h: 2.4 }, hpM: 1.75, dmgM: 1.4, defM: 1.35, expM: 1.6, speed: 4.8, aggro: 10, range: 2.4, atkInt: 1.6, hit: 1.3, scale: 1.2, labelY: 3.3, status: { kind: 'stun', chance: 0.1, dur: 1.3 }, char: 'zombie' },
  tombsnake: { name: 'Mezar Yılanı', model: 'snake', look: { c: 0x4a2a5a, belly: 0xa88ac8 }, hpM: 1.6, dmgM: 1.4, defM: 1.3, expM: 1.55, speed: 5.2, aggro: 10, range: 2.8, atkInt: 1.5, hit: 1.7, scale: 1.4, labelY: 2.8, status: { kind: 'poison', chance: 0.25, dur: 7 } },
  templeguard: { name: 'Tapınak Muhafızı', model: 'char', look: { tint: 0xd8b060, h: 2.4 }, hpM: 1.7, dmgM: 1.4, defM: 1.5, expM: 1.6, speed: 5, aggro: 12, range: 2.6, atkInt: 1.6, hit: 1.4, scale: 1.15, labelY: 3.4, char: 'skeleton' },
  priestess: { name: 'Kara Rahibe', model: 'human', look: { robe: 0x1a1a2a, dark: 0x0a0a14, weapon: null }, magic: true, hpM: 1.45, dmgM: 1.5, defM: 1.2, expM: 1.6, speed: 5, aggro: 13, range: 7, atkInt: 1.7, hit: 1.3, scale: 1.0, labelY: 3.3, status: { kind: 'burn', chance: 0.15, dur: 4 } },
  scarab2: { name: 'Kutsal Bokböceği', model: 'scorpion', look: { shell: 0xd8a830, dark: 0x6a4a10 }, hpM: 1.7, dmgM: 1.45, defM: 1.6, expM: 1.7, speed: 5, aggro: 10, range: 2.6, atkInt: 1.6, hit: 1.6, scale: 1.4, labelY: 3.0, status: { kind: 'poison', chance: 0.2, dur: 6 } },
  gladiator: { name: 'Gladyatör', model: 'human', look: { robe: 0xa88a3a, dark: 0x5a3a1a, weapon: 'sword' }, hpM: 1.8, dmgM: 1.5, defM: 1.5, expM: 1.7, speed: 5.8, aggro: 12, range: 2.6, atkInt: 1.4, hit: 1.3, scale: 1.1, labelY: 3.3, status: { kind: 'bleed', chance: 0.15, dur: 5 } },
  harpy: { name: 'Harpi', model: 'char', look: { tint: 0x4aa8a0, h: 2.3 }, magic: true, hpM: 1.6, dmgM: 1.55, defM: 1.3, expM: 1.75, speed: 6.6, aggro: 13, range: 5, atkInt: 1.4, hit: 1.3, scale: 1.1, labelY: 3.4, status: { kind: 'slow', chance: 0.15, dur: 3 }, char: 'vampire' },
  minotaur: { name: 'Minotor', model: 'golem', look: { c: 0x6a4228 }, hpM: 2.2, dmgM: 1.6, defM: 1.6, expM: 1.9, speed: 5, aggro: 10, range: 3.0, atkInt: 1.8, hit: 2.0, scale: 1.5, labelY: 3.8, status: { kind: 'stun', chance: 0.14, dur: 1.5 } },
  icewraith: { name: 'Buz Hayaleti', model: 'char', look: { h: 2.2, ghost: true }, magic: true, hpM: 1.6, dmgM: 1.55, defM: 1.3, expM: 1.75, speed: 6, aggro: 13, range: 6, atkInt: 1.6, hit: 1.3, scale: 1.1, labelY: 3.2, status: { kind: 'freeze', chance: 0.12, dur: 1.6 }, char: 'ghost' },
  lavagolem: { name: 'Lav Golemi', model: 'golem', look: { c: 0xb83a1a }, hpM: 2.3, dmgM: 1.6, defM: 1.8, expM: 1.9, speed: 3.8, aggro: 9, range: 3.0, atkInt: 2.0, hit: 2.0, scale: 1.6, labelY: 3.8, status: { kind: 'burn', chance: 0.2, dur: 5 } },
  // --- Yeni Unique'ler ---
  u_cerberus: { name: 'Cerberus', model: 'quad', look: { fur: 0x3a0a08, dark: 0x1a0404, eye: 0xffa020, horns: true, body: [1.1, 1.0, 2.0] }, unique: { hp: 10, dmg: 1.7, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 3.4, atkInt: 1.4, hit: 2.4, scale: 2.6, labelY: 3.4, status: { kind: 'burn', chance: 0.22, dur: 5 } },
  u_ivy: { name: 'Kaptan Ivy', model: 'human', look: { robe: 0x5a2a7a, dark: 0x2a0a3a, hat: 'band', weapon: 'sword' }, unique: { hp: 12, dmg: 1.75, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 3.4, atkInt: 1.4, hit: 2.4, scale: 1.7, labelY: 3.4, status: { kind: 'bleed', chance: 0.2, dur: 5 } },
  u_shaitan: { name: 'Demon Shaitan', model: 'char', look: { tint: 0xb02010, h: 2.8, horns: true, glow: 0xff2a00 }, magic: true, char: 'vampire', unique: { hp: 16, dmg: 1.95, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 2.6, labelY: 3.4, status: { kind: 'burn', chance: 0.25, dur: 5 } },
  u_roc: { name: 'Roc', model: 'quad', look: { fur: 0x6a4a2a, dark: 0x2a1a0a, eye: 0xffd23a, body: [1.4, 1.2, 2.4] }, unique: { hp: 17, dmg: 2.0, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 3.4, atkInt: 1.4, hit: 2.4, scale: 3.0, labelY: 3.4, status: { kind: 'stun', chance: 0.2, dur: 1.6 } },
  u_sphinx: { name: 'Sfenks', model: 'golem', look: { c: 0xe0c070 }, unique: { hp: 18, dmg: 2.05, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 3.4, atkInt: 1.4, hit: 2.4, scale: 3.0, labelY: 3.4, status: { kind: 'stun', chance: 0.22, dur: 1.6 } },
  u_shadowyarkan: { name: 'Gölge Yarkan', model: 'quad', look: { fur: 0x2a0a3a, dark: 0x0a0414, horns: true, eye: 0xc86aff, body: [1.3, 1.2, 2.4] }, magic: true, unique: { hp: 20, dmg: 2.2, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 3.0, labelY: 3.4, status: { kind: 'freeze', chance: 0.22, dur: 2 } },
  u_bonelord: { name: 'Kemik Lordu', model: 'char', look: { h: 2.6, glow: 0x8a4aff }, magic: true, char: 'skeleton', unique: { hp: 11, dmg: 1.8, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 2.2, labelY: 3.4, status: { kind: 'freeze', chance: 0.15, dur: 1.6 } },
  u_medusa: { name: 'Medusa', model: 'snake', look: { c: 0x2a8a4a, belly: 0xd8c878 }, magic: true, unique: { hp: 18, dmg: 2.0, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 3.2, labelY: 3.4, status: { kind: 'stun', chance: 0.25, dur: 2 } },
  u_isis: { name: 'İsis', model: 'human', look: { robe: 0xf0e8d0, dark: 0xd8a830, weapon: null }, magic: true, unique: { hp: 14, dmg: 1.9, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 2.0, labelY: 3.4, status: { kind: 'freeze', chance: 0.18, dur: 1.8 } },
  u_anubis: { name: 'Anubis', model: 'char', look: { tint: 0x1a1a1a, h: 2.6, glow: 0xffc83a }, char: 'skeleton', unique: { hp: 15, dmg: 1.95, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 3.4, atkInt: 1.4, hit: 2.4, scale: 2.4, labelY: 3.4, status: { kind: 'bleed', chance: 0.22, dur: 5 } },
  u_haroeris: { name: 'Haroeris', model: 'char', look: { tint: 0xd8a830, h: 2.6 }, magic: true, char: 'vampire', unique: { hp: 15, dmg: 2.0, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 2.4, labelY: 3.4, status: { kind: 'burn', chance: 0.2, dur: 5 } },
  u_seth: { name: 'Seth', model: 'char', look: { tint: 0x5a2a8a, h: 2.8, horns: true }, magic: true, char: 'vampire', unique: { hp: 17, dmg: 2.1, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 2.6, labelY: 3.4, status: { kind: 'stun', chance: 0.22, dur: 1.8 } },
  u_yuno: { name: 'Yuno', model: 'human', look: { robe: 0xf4f4ff, dark: 0x8a8ac8, weapon: null }, magic: true, unique: { hp: 16, dmg: 2.05, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 2.0, labelY: 3.4, status: { kind: 'freeze', chance: 0.2, dur: 2 } },
  u_jupiter: { name: 'Jüpiter', model: 'golem', look: { c: 0xffd870 }, magic: true, unique: { hp: 20, dmg: 2.25, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 3.2, labelY: 3.4, status: { kind: 'stun', chance: 0.25, dur: 2 } },
  u_frostqueen: { name: 'Buz Kraliçesi', model: 'human', look: { robe: 0xc8e8ff, dark: 0x5a8ac8, weapon: null }, magic: true, unique: { hp: 18, dmg: 2.2, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 2.2, labelY: 3.4, status: { kind: 'freeze', chance: 0.28, dur: 2 } },
  u_flamelord: { name: 'Alev Lordu', model: 'char', look: { tint: 0xff4a10, h: 2.8, horns: true, glow: 0xff3a00 }, magic: true, char: 'vampire', unique: { hp: 20, dmg: 2.3, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 3.0, labelY: 3.4, status: { kind: 'burn', chance: 0.3, dur: 6 } },
  u_fwboss: { name: 'Unutulmuş Kral', model: 'quad', look: { fur: 0x3a1a5a, dark: 0x140a20, horns: true, eye: 0xff6ae8, body: [1.3, 1.2, 2.4] }, magic: true, unique: { hp: 14, dmg: 1.9, exp: 40, drop: 1.2 }, hpM: 1.4, dmgM: 1.3, defM: 1.35, expM: 1.35, speed: 6, aggro: 16, range: 7, atkInt: 1.4, hit: 2.4, scale: 2.8, labelY: 3.4, status: { kind: 'stun', chance: 0.2, dur: 1.6 } },
  // --- Meslek sistemi ---
  kthief:    { name: 'Kervan Hırsızı', model: 'human', look: { robe: 0x5a1a1a, dark: 0x2a0a0a, hat: 'band', weapon: 'blade' }, job: true, hpM: 0.8, dmgM: 0.8, defM: 0.9, expM: 0.8, speed: 6.4, aggro: 18, range: 2.4, atkInt: 1.4, hit: 1.3, scale: 1.0, labelY: 3.3 },
  kguard:    { name: 'Kervan Muhafızı', model: 'human', look: { robe: 0x1a3a8a, dark: 0x0a1a4a, hat: 'band', weapon: 'spear' }, job: true, hpM: 1.4, dmgM: 1.1, defM: 1.2, expM: 0.9, speed: 6.0, aggro: 14, range: 2.8, atkInt: 1.5, hit: 1.3, scale: 1.05, labelY: 3.3 },
  kcamel:    { name: 'Tüccar Kervanı', model: 'camel', look: {}, passive: true, job: true, hpM: 3.0, dmgM: 0, defM: 1.0, expM: 0.5, speed: 3.2, aggro: 0, range: 0, atkInt: 99, hit: 2.0, scale: 1.3, labelY: 3.8 },
  // --- Unique'ler ---
  u_tiger:   { name: 'Kaplan Kız', model: 'human', look: { robe: 0xe07a1a, dark: 0x2a1a10, hat: 'ears', weapon: 'blade', stripes: true }, unique: { hp: 10, dmg: 1.7, exp: 40, drop: 1 }, hpM: 1.3, dmgM: 1.2, defM: 1.2, expM: 1.3, speed: 6.8, aggro: 16, range: 2.8, atkInt: 1.2, hit: 1.8, scale: 1.6, labelY: 3.6, status: { kind: 'bleed', chance: 0.2, dur: 5 } },
  u_uruchi:  { name: 'Uruchi', model: 'human', look: { robe: 0x8a1010, dark: 0x1a0606, hat: 'horns', weapon: 'glaive', skin: 0xb83a2a }, unique: { hp: 14, dmg: 1.8, exp: 40, drop: 1 }, hpM: 1.4, dmgM: 1.25, defM: 1.3, expM: 1.3, speed: 6, aggro: 16, range: 3.4, atkInt: 1.4, hit: 2.4, scale: 2.5, labelY: 3.5, status: { kind: 'burn', chance: 0.25, dur: 5 } },
  u_isyutaru:{ name: 'Isyutaru', model: 'char', char: 'vampire', look: { tint: 0xb08aff, h: 2.6, horns: true, glow: 0x8a4aff }, magic: true, unique: { hp: 15, dmg: 1.9, exp: 40, drop: 1 }, hpM: 1.4, dmgM: 1.3, defM: 1.3, expM: 1.3, speed: 6, aggro: 16, range: 8, atkInt: 1.5, hit: 2.4, scale: 2.4, labelY: 3.6, status: { kind: 'freeze', chance: 0.18, dur: 2 } },
  u_yarkan:  { name: 'Lord Yarkan', model: 'quad', look: { fur: 0x5a1010, dark: 0x1a0606, horns: true, eye: 0xffd23a, body: [1.2, 1.1, 2.2] }, unique: { hp: 16, dmg: 2.0, exp: 40, drop: 1.2 }, hpM: 1.5, dmgM: 1.35, defM: 1.4, expM: 1.4, speed: 6.5, aggro: 18, range: 3.6, atkInt: 1.5, hit: 2.6, scale: 3.0, labelY: 3.0, status: { kind: 'stun', chance: 0.2, dur: 1.5 } }
};
// Rütbe: normal / şampiyon / dev (Silkroad'daki Champion ve Giant canavarlar). Unique'ler ayrıca tanımlanır.
const MOB_RANKS = {
  normal:   { label: '', hp: 1, dmg: 1, exp: 1, scale: 1, zerk: 0.25, drop: 1, color: '#ffb0a0' },
  champion: { label: 'Şampiyon', hp: 3, dmg: 1.4, exp: 3, scale: 1.2, zerk: 1, drop: 2.5, color: '#ffd23a' },
  strong:   { label: 'Güçlü', hp: 1.8, dmg: 1.2, exp: 1.8, scale: 1.08, zerk: 0.5, drop: 1.5, color: '#a8f07a' },
  elite:    { label: 'Elit', hp: 6, dmg: 1.7, exp: 7, scale: 1.4, zerk: 1.5, drop: 4, color: '#7ae8ff' },
  party:    { label: 'Parti', hp: 9, dmg: 1.45, exp: 9, scale: 1.3, zerk: 2, drop: 5, color: '#c89aff' },
  giant:    { label: 'Dev', hp: 12, dmg: 2.2, exp: 14, scale: 1.9, zerk: 2.5, drop: 6, color: '#ff7a3a' },
  unique:   { label: 'Unique', hp: 1, dmg: 1, exp: 1, scale: 1, zerk: 5, drop: 20, color: '#ff4ad8' }
};
// Erken seviyeler eski eğri; 25 / 40'tan sonra doğrusal (yüksek seviyede vuruş sayısı makul kalsın)
const mobHp = M => (M <= 25 ? 30 + 22 * M + 1.6 * M * M : 1580 + 45 * (M - 25) + 0.05 * (M - 25) * (M - 25));
const mobDmg = M => (M <= 40 ? 8 + 4 * M + 0.05 * M * M : 248 + 4.5 * (M - 40));
const mobDef = M => 2 + 4 * M;
const mobExp = M => 10 + 6 * M + 0.4 * M * M;
function rollRank() { const r = Math.random(); if (IS_DUNGEON && r < 0.12) return 'party'; return r < 0.01 ? 'giant' : r < 0.022 ? 'elite' : r < 0.06 ? 'champion' : r < 0.12 ? 'strong' : 'normal'; }

function buildQuad(o = {}) {
  const g = new THREE.Group();
  const fur = new THREE.MeshLambertMaterial({ color: o.fur || 0x7a7a82 });
  const dark = new THREE.MeshLambertMaterial({ color: o.dark || 0x3a3a42 });
  const eye = new THREE.MeshBasicMaterial({ color: o.eye || 0xff3a2a });
  const box = (w, h, d, mat, x, y, z, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
  };
  const [bw, bh, bl] = o.body || [0.7, 0.65, 1.5], lh = o.legH || 0.7, by = lh + bh * 0.4;
  box(bw, bh, bl, fur, 0, by, 0);
  const hz = bl / 2 + 0.25, hy = by + bh * 0.25;
  box(bw * 0.72, bh * 0.7, 0.6, fur, 0, hy, hz);
  box(bw * 0.38, bh * 0.3, 0.4, dark, 0, hy - 0.12, hz + 0.45);
  box(0.12, 0.2, 0.12, fur, -bw * 0.25, hy + bh * 0.45, hz - 0.1);
  box(0.12, 0.2, 0.12, fur, bw * 0.25, hy + bh * 0.45, hz - 0.1);
  box(0.08, 0.08, 0.05, eye, -bw * 0.2, hy + 0.08, hz + 0.29);
  box(0.08, 0.08, 0.05, eye, bw * 0.2, hy + 0.08, hz + 0.29);
  if (o.tusks) for (const sx of [-1, 1]) { const t = box(0.06, 0.06, 0.3, new THREE.MeshLambertMaterial({ color: 0xf0e8d0 }), sx * 0.15, hy - 0.2, hz + 0.6); t.rotation.x = -0.6; }
  if (o.horns) for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.6, 6), new THREE.MeshLambertMaterial({ color: 0xe8d8b0 })); h.position.set(sx * bw * 0.3, hy + bh * 0.6, hz - 0.1); h.rotation.z = -sx * 0.5; h.rotation.x = -0.4; g.add(h); }
  if (o.stripes) for (let i = 0; i < 5; i++) box(bw + 0.02, 0.08, 0.12, dark, 0, by + bh * 0.1, -bl / 2 + 0.25 + i * (bl - 0.4) / 4);
  if (!o.noTail) { const tail = box(0.15, 0.15, 0.8, dark, 0, by + 0.1, -bl / 2 - 0.35); tail.rotation.x = 0.6; }
  const legs = [];
  for (const [lx, lz] of [[-bw * 0.36, bl * 0.36], [bw * 0.36, bl * 0.36], [-bw * 0.36, -bl * 0.36], [bw * 0.36, -bl * 0.36]]) {
    const pivot = new THREE.Group(); pivot.position.set(lx, lh, lz);
    box(0.18 * (bw / 0.7), lh, 0.18 * (bw / 0.7), dark, 0, -lh / 2, 0, pivot);
    g.add(pivot); legs.push(pivot);
  }
  return { group: g, legs, kind: 'quad' };
}
function buildWolf() { return buildQuad(); }

// Deve: hörgüçlü dört ayaklı + yük sandıkları (kervan / tüccar taşıyıcısı)
function buildCamel(cargo = true) {
  const q = buildQuad({ fur: 0xc8a068, dark: 0x8a6a3a, body: [0.9, 0.8, 1.9], legH: 1.25, noTail: false, eye: 0x1a1a1a });
  const g = q.group, fur = new THREE.MeshLambertMaterial({ color: 0xc8a068 });
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), fur); hump.scale.set(1, 0.8, 1.3); hump.position.set(0, 2.05, -0.1); hump.castShadow = true; g.add(hump);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.0, 0.32), fur); neck.position.set(0, 2.05, 1.05); neck.rotation.x = 0.45; neck.castShadow = true; g.add(neck);
  if (cargo) {
    const box = new THREE.MeshLambertMaterial({ color: 0x7a4a22 }), cloth = new THREE.MeshLambertMaterial({ color: 0xa8281e });
    for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.8), box); b.position.set(sx * 0.68, 1.6, -0.1); b.castShadow = true; g.add(b); }
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.1), cloth); c.position.set(0, 2.0, -0.1); g.add(c);
  }
  return q;
}

function buildSnake(o = {}) {
  const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: o.c || 0x5a7a2a }), belly = new THREE.MeshLambertMaterial({ color: o.belly || 0xc8b878 });
  const segs = [];
  for (let i = 0; i < 9; i++) {
    const r = 0.42 - i * 0.03, m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), i % 2 ? mat : belly);
    m.scale.set(1, 0.8, 1.2); m.position.set(0, r * 0.8, -i * 0.55); m.castShadow = true; g.add(m); segs.push(m);
  }
  const head = new THREE.Group(); head.position.set(0, 1.0, 0.45); g.add(head);
  const hm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.7), mat); hm.castShadow = true; head.add(hm);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), new THREE.MeshBasicMaterial({ color: 0xffd23a })); e.position.set(sx * 0.18, 0.1, 0.33); head.add(e); }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.9, 8), mat); neck.position.set(0, 0.55, 0.2); neck.rotation.x = 0.5; g.add(neck);
  return { group: g, legs: [], segs, head, kind: 'snake' };
}

// Kenney karakter modeli (parçalı) ya da yoksa insansı yedek
function buildCharMob(t) {
  const L = t.look || {}, key = 'graveyard/character-' + t.char;
  if (typeof Assets !== 'undefined' && Assets.hasChar(key)) {
    const c = Assets.charModel(key, L.h || 2.3, L.tint);
    if (L.plain) c.group.traverse(o => { if (o.isMesh) { o.material.map = null; o.material.needsUpdate = true; } });
    if (L.ghost) c.group.traverse(o => { if (o.isMesh) { o.material.transparent = true; o.material.opacity = 0.72; o.material.emissive = new THREE.Color(0x1a3a6a); } });
    if (L.glow) c.group.traverse(o => { if (o.isMesh) o.material.emissive = new THREE.Color(L.glow).multiplyScalar(0.25); });
    if (L.horns) for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 6), new THREE.MeshLambertMaterial({ color: 0x2a1a1a })); h.position.set(sx * 0.22, (L.h || 2.3) * 0.98, 0); h.rotation.z = -sx * 0.4; c.group.add(h); }
    return { group: c.group, legs: [c.legL, c.legR].filter(Boolean), arms: [c.armL, c.armR].filter(Boolean), armR: c.armR, kind: L.ghost ? 'float' : 'char' };
  }
  const h = buildHumanoid({ robe: L.tint || 0x8a8a8a, robeDark: 0x3a3a3a, hat: null, weapon: null });
  return { group: h.group, legs: [h.legL, h.legR], arms: [h.armL, h.armR], armR: h.armR, kind: 'biped' };
}

function buildHumanMob(L) {
  const h = buildHumanoid({ robe: L.robe, robeDark: L.dark, hat: L.hat === 'band' ? 'band' : null, weapon: L.weapon || 'blade', skin: L.skin });
  if (L.hat === 'ears' || L.hat === 'horns') {
    for (const sx of [-1, 1]) {
      const m = L.hat === 'ears' ? new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 4), new THREE.MeshLambertMaterial({ color: 0xe07a1a })) : new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 6), new THREE.MeshLambertMaterial({ color: 0x1a1010 }));
      m.position.set(sx * 0.18, L.hat === 'ears' ? 2.28 : 2.35, 0); m.rotation.z = -sx * (L.hat === 'ears' ? 0.2 : 0.5); h.group.add(m);
    }
  }
  if (L.stripes) for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.46 + i * 0.02, 0.48 + i * 0.02, 0.07, 10), new THREE.MeshLambertMaterial({ color: 0x1a1008 })); st.position.y = 1.15 + i * 0.25; h.group.add(st); }
  return { group: h.group, legs: [h.legL, h.legR], arms: [h.armL, h.armR], armR: h.armR, kind: 'biped' };
}

function buildScorpion(o = {}) {
  const g = new THREE.Group();
  const shell = new THREE.MeshLambertMaterial({ color: o.shell || 0x8a3a1c });
  const dark = new THREE.MeshLambertMaterial({ color: o.dark || 0x4a1e0e });
  const sphere = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m;
  };
  sphere(0.7, shell, 0, 0.55, 0, 1.0, 0.55, 1.5);
  sphere(0.38, shell, 0, 0.6, 0.95);
  // kıskaçlar
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.9), dark);
    arm.position.set(sx * 0.7, 0.6, 1.2); arm.rotation.y = -sx * 0.35; arm.castShadow = true; g.add(arm);
    sphere(0.3, shell, sx * 0.95, 0.6, 1.75, 0.8, 0.5, 1.2);
  }
  // kuyruk
  const seg = [[0, 0.75, -0.95, 0.3], [0, 1.1, -1.4, 0.27], [0, 1.55, -1.45, 0.24], [0, 1.95, -1.1, 0.22]];
  for (const [x, y, z, r] of seg) sphere(r, shell, x, y, z);
  const sting = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 8), new THREE.MeshLambertMaterial({ color: 0xe0b020 }));
  sting.position.set(0, 2.0, -0.7); sting.rotation.x = Math.PI * 0.8; g.add(sting);
  // bacaklar
  for (const sx of [-1, 1]) for (const lz of [-0.5, 0, 0.5]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), dark);
    leg.position.set(sx * 0.85, 0.3, lz); leg.rotation.z = sx * -0.5; g.add(leg);
  }
  return { group: g, legs: [], kind: 'scorpion' };
}

function buildGolem(o = {}) {
  const h = buildHumanoid({ robe: 0xb08a58, robeDark: 0x7a5c36, hat: null, weapon: null });
  h.group.traverse(o2 => { if (o2.material && o2.material.color) { o2.material = o2.material.clone(); o2.material.color.lerp(new THREE.Color(o.c || 0xa07a4c), 0.65); } });
  return { group: h.group, legs: [h.legL, h.legR], arms: [h.armL, h.armR], armR: h.armR, kind: 'biped' };
}

function pushOut(p, radius, obstacles) {
  for (const o of obstacles) {
    const dx = p.x - o.x, dz = p.z - o.z, min = o.r + radius;
    if (Math.abs(dx) > min || Math.abs(dz) > min) continue;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min) {
      const d = Math.sqrt(d2) || 0.001;
      p.x = o.x + (dx / d) * min; p.z = o.z + (dz / d) * min;
    }
  }
  if (Dungeon.on) Dungeon.clamp(p, Math.min(radius, 0.7));
}

class Monster {
  constructor(world, typeKey, level, home, opts = {}) {
    this.world = world;
    this.typeKey = typeKey;
    this.type = MONSTER_TYPES[typeKey];
    this.level = level;
    this.home = { x: home.x, z: home.z };
    this.status = {};
    this.fixedRank = opts.rank || null;
    this.shadow = !!opts.shadow;
    this._stats(this.fixedRank || rollRank());
    this.state = 'idle';
    this.dead = false;
    this.provoked = false;
    this.atkCd = 0;
    this.attackAnim = 0;
    this.deadT = 0;
    this.walkPhase = Math.random() * 6;
    this.heading = Math.random() * 6.283;
    this.wanderT = Math.random() * 4;
    this.wanderTarget = null;
    this.moving = false;

    this.group = new THREE.Group();
    const t = this.type, L = t.look || {};
    const parts = t.model === 'camel' ? buildCamel() : t.model === 'quad' ? buildQuad(L) : t.model === 'scorpion' ? buildScorpion(L) : t.model === 'golem' ? buildGolem(L) :
      t.model === 'snake' ? buildSnake(L) : t.model === 'char' ? buildCharMob(t) : buildHumanMob(L);
    this.kind = parts.kind;
    this.segs = parts.segs || null; this.headPart = parts.head || null;
    this.body = parts.group;
    this.legs = parts.legs;
    this.arms = parts.arms || [];
    this.armR = parts.armR || null;
    this.group.add(this.body);
    this.mats = [];
    this.body.traverse(o => { if (o.material && o.material.emissive) { o.material = o.material.clone(); this.mats.push(o.material); } });
    this.group.scale.setScalar(this.baseScale);

    // Tıklama için görünmez, cömert bir vuruş alanı (dokunmatik için de rahat)
    const s = this.type.hit;
    this.hit = new THREE.Mesh(new THREE.CylinderGeometry(s, s, 2.4, 8), new THREE.MeshBasicMaterial({ visible: false }));
    this.hit.position.y = 1.2;
    this.hit.userData.monster = this;
    this.group.add(this.hit);

    this._makeLabel();

    this.group.position.set(home.x, terrainHeight(home.x, home.z), home.z);
    world.scene.add(this.group);
    if (typeof MobModels !== 'undefined') MobModels.attach(this);
  }

  // İskeletli model animasyonları
  _play(name, fade = 0.2) {
    const a = this.actions && (this.actions[name] || this.actions.idle);
    if (!a || this.base === a) return;
    if (this.base) this.base.fadeOut(fade);
    a.reset().setEffectiveWeight(1).fadeIn(fade).play();
    this.base = a;
  }
  _oneShot(name, speed = 1) {
    const a = this.actions && this.actions[name];
    if (!a) return false;
    a.reset(); a.timeScale = speed; a.setEffectiveWeight(1); a.fadeIn(0.08).play();
    if (this.base) this.base.fadeOut(0.08);
    const back = this.base; this.base = null; this._shot = { a, back, t: a.getClip().duration / speed - 0.12 };
    return true;
  }
  onHit() {
    if (!this.actions || this.dead || this._shot || !this.actions.hit) return;
    if (Math.random() < 0.35) this._oneShot('hit', 1.4);
  }

  _stats(rank) {
    const t = this.type, M = this.level, rk = MOB_RANKS[rank];
    this.rank = rank;
    const u = t.unique || {};
    this.maxHp = Math.round(t.hpM * mobHp(M) * rk.hp * (u.hp || 1));
    this.hp = this.maxHp;
    this.dmg = Math.round(t.dmgM * mobDmg(M) * rk.dmg * (u.dmg || 1));
    this.pdef = Math.round(t.defM * mobDef(M) * (t.magic ? 0.8 : 1.1));
    this.mdef = Math.round(t.defM * mobDef(M) * (t.magic ? 1.1 : 0.8));
    this.exp = Math.round(t.expM * mobExp(M) * rk.exp * (u.exp || 1));
    this.zerkPts = rk.zerk;
    this.dropMult = rk.drop * (u.drop || 1);
    this.baseScale = t.scale * (1 + 0.25 * Math.min(1, (M - 1) / 60)) * rk.scale;   // seviyeyle hafif büyür (en çok %25)
    this.displayName = (rk.label && rank !== 'unique' ? rk.label + ' ' : '') + t.name;
    if (this.shadow) { this.displayName = 'Gölge ' + t.name; this.maxHp = this.hp = Math.round(this.maxHp * 1.6); this.dmg = Math.round(this.dmg * 1.3); this.exp *= 2; this.dropMult *= 1.6; this.baseScale *= 1.1; }
  }
  _makeLabel() {
    if (this.label) { this.group.remove(this.label); this.label.material.map.dispose(); this.label.material.dispose(); }
    const rk = MOB_RANKS[this.rank];
    this.label = makeLabel(this.displayName, 'Sv. ' + this.level + (this.rank !== 'normal' ? ' · ' + rk.label : ''), rk.color, '#ffd9a0');
    this.label.scale.set(this.rank === 'normal' ? 3.8 : 4.6, this.rank === 'normal' ? 1.2 : 1.45, 1);
    this.label.position.y = this.labelH || this.type.labelY / this.type.scale / (this.rank === 'giant' ? 1.1 : 1);
    this.group.add(this.label);
  }

  // Durum etkisi uygula (yanma, kanama, sersemleme, donma, yere serme, yavaşlatma)
  applyStatus(kind, dur, hitDmg) {
    const resist = this.rank === 'unique' ? 0.3 : this.rank === 'giant' ? 0.6 : 1;
    const st = this.status[kind];
    const dps = kind === 'burn' ? Math.max(1, Math.round(hitDmg * 0.15)) : kind === 'bleed' ? Math.max(1, Math.round(hitDmg * 0.12)) : 0;
    const t = (kind === 'stun' || kind === 'freeze' || kind === 'knock') ? dur * resist : dur;
    if (st) { st.t = Math.max(st.t, t); st.dps = Math.max(st.dps, dps); }
    else this.status[kind] = { t, dps, tick: 1 };
    this._tint();
  }
  disabled() { return !!(this.status.stun || this.status.freeze || this.status.knock); }
  _tint() {
    const s = this.status;
    const c = s.freeze ? 0x2a5aa8 : s.burn ? 0x6a2200 : s.stun || s.knock ? 0x4a4a00 : s.slow ? 0x1a3a5a : s.bleed ? 0x5a0000 : 0x000000;
    for (const m of this.mats) m.emissive.setHex(c || m.userData.baseEm || 0);
  }
  // Unique özel saldırısı: oyuncunun altında kırmızı halka, 1.3 sn sonra alan hasarı
  _slam(dt, player, combat) {
    this.slamCd = (this.slamCd === undefined ? 6 : this.slamCd) - dt;
    if (this.tele) {
      this.tele.t -= dt;
      const k = 1 - this.tele.t / 1.3;
      this.tele.mesh.scale.setScalar(4.5 * (0.4 + 0.6 * k)); this.tele.mesh.material.opacity = 0.3 + 0.5 * k;
      if (this.tele.t <= 0) {
        const { x, z } = this.tele; this.world.scene.remove(this.tele.mesh); this.tele = null;
        combat.vfx.burst(x, z, 0xff3a1a, 5, 0.6);
        if (!player.dead && Math.hypot(player.pos.x - x, player.pos.z - z) < 4.7) combat.damagePlayer(this.dmg * 2.2, this, this.type.magic ? 'mag' : 'phys');
      }
    } else if (this.slamCd <= 0) {
      this.slamCd = 8 + Math.random() * 3;
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.3, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(player.pos.x, terrainHeight(player.pos.x, player.pos.z) + 0.12, player.pos.z);
      this.world.scene.add(m);
      this.tele = { t: 1.3, x: player.pos.x, z: player.pos.z, mesh: m };
    }
  }

  _updateStatus(dt, combat) {
    let changed = false;
    for (const k in this.status) {
      const st = this.status[k];
      st.t -= dt;
      if (st.dps) { st.tick -= dt; if (st.tick <= 0) { st.tick = 1; combat.damageMonster(this, st.dps, false, k === 'burn' ? 'fire' : null, true); if (this.dead) return; } }
      if (st.t <= 0) { delete this.status[k]; changed = true; }
    }
    if (changed) this._tint();
  }

  get x() { return this.group.position.x; }
  get z() { return this.group.position.z; }

  // Hasar aldı: pasif olsa bile kovalamaya başla
  provoke() { this.provoked = true; if (this.state === 'idle' || this.state === 'return') this.state = 'chase'; }

  die() {
    if (this.actions && this.actions.death) { if (this._shot) { this._shot.a.fadeOut(0.1); this._shot = null; } this._play('death', 0.12); }
    this.dead = true; this.state = 'dead'; this.deadT = 0; this.moving = false;
    this.label.visible = false;
    this.status = {}; this._tint();
    if (this.tele) { this.world.scene.remove(this.tele.mesh); this.tele = null; }
  }

  respawn() {
    const old = this.rank;
    this._stats(this.fixedRank || rollRank());
    if (old !== this.rank) this._makeLabel();
    this.dead = false; this.state = 'idle'; this.hp = this.maxHp; this.provoked = false;
    this.group.position.set(this.home.x, terrainHeight(this.home.x, this.home.z), this.home.z);
    this.group.rotation.z = 0; this.group.visible = true; this.group.scale.setScalar(this.baseScale);
    this.wanderTarget = null;
    if (this.actions) { if (this.actions.death) this.actions.death.stop(); this.base = null; this._shot = null; this._play('idle', 0); }
  }

  _moveToward(tx, tz, speed, dt) {
    const p = this.group.position;
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { this.moving = false; return d; }
    this.heading += angleDiff(this.heading, Math.atan2(dx, dz)) * Math.min(1, dt * 10);
    const step = Math.min(d, speed * dt);
    p.x += (dx / d) * step; p.z += (dz / d) * step;
    pushOut(p, 0.6 * this.baseScale, this.world.obstacles);
    this.moving = true;
    return d - step;
  }

  update(dt, player, combat) {
    const p = this.group.position;

    if (this.state === 'dead') {
      this.deadT += dt;
      const k = Math.min(1, this.deadT / 0.5);
      if (this.actions && this.actions.death) { if (this.deadT < 4.2) this.mixer.update(dt); if (this.fly) p.y = terrainHeight(p.x, p.z) + Math.max(0, this.fly * (1 - k)); }
      else { this.group.rotation.z = k * (Math.PI / 2); p.y = terrainHeight(p.x, p.z) + k * 0.35 * this.baseScale; }
      if (this.deadT > 4) this.group.visible = false;
      if (this.deadT >= (this.respawnTime || RESPAWN_TIME)) { if (this.noRespawn) { this.removed = true; return; } this.respawn(); }
      return;
    }

    const dpx = player.pos.x - p.x, dpz = player.pos.z - p.z, dp = Math.hypot(dpx, dpz);
    this.group.visible = dp < (CONFIG.isTouch ? 110 : 170);                          // sis ötesindekiler çizilmez
    if (dp > 140 && this.state === 'idle') return;          // uzaktaki canavarlar uyur
    this.label.visible = Settings.data.names && (combat.target === this || (this.state === 'chase' && dp < 30) || dp < 16 || this.rank === 'unique' && dp < 60);
    if (this.atkCd > 0) this.atkCd -= dt;
    if (this.attackAnim > 0) this.attackAnim = Math.max(0, this.attackAnim - dt);
    this._updateStatus(dt, combat);
    if (this.dead) return;
    if (this.disabled()) {
      this.moving = false;
      if (this.mixer) { this._play('idle'); this.mixer.update(dt * 0.15); }
      if (this.status.knock) this.group.rotation.z = Math.min(1.2, this.group.rotation.z + dt * 8);
      p.y = terrainHeight(p.x, p.z);
      return;
    }
    if (this.group.rotation.z) this.group.rotation.z = 0;
    const slow = this.status.slow ? 0.5 : 1;
    if (this.lifeT !== undefined && (this.lifeT -= dt) <= 0) { this.removed = true; return; }
    // yol boyunca yürüyen kervan devesi (saldırmaz)
    if (this.walker) {
      const w = this.walker, wp = w.path[w.i];
      if (!wp) { if (w.onEnd) w.onEnd(this); this.walker = null; this.removed = true; return; }
      const rem = this._moveToward(wp.x, wp.z, w.speed * slow, dt);
      if (rem < 1) w.i++;
      p.y = terrainHeight(p.x, p.z); this.group.rotation.y = this.heading; this._animate(dt);
      return;
    }
    // kervan muhafızı: deveyi takip eder
    if (this.follow) {
      if (this.follow.dead || this.follow.removed) this.follow = null;
      else { this.home.x = this.follow.x + this.fOff.x; this.home.z = this.follow.z + this.fOff.z; if (this.state === 'idle') { this.wanderTarget = null; const r = this._moveToward(this.home.x, this.home.z, this.type.speed * 0.6, dt); if (r < 0.5) this.moving = false; } }
    }

    const playerSafe = player.dead || inSafeZone(player.pos.x, player.pos.z);
    const homeDist = Math.hypot(p.x - this.home.x, p.z - this.home.z);
    this.moving = false;

    if (this.state === 'idle') {
      if (!playerSafe && dp < this.type.aggro) { this.state = 'chase'; }
      else {
        this.wanderT -= dt;
        if (this.wanderTarget) {
          const rem = this._moveToward(this.wanderTarget.x, this.wanderTarget.z, this.type.speed * 0.35, dt);
          if (rem < 0.4) { this.wanderTarget = null; this.wanderT = 2 + Math.random() * 4; }
        } else if (this.wanderT <= 0) {
          const a = Math.random() * 6.283, r = 2 + Math.random() * 7;
          this.wanderTarget = { x: this.home.x + Math.cos(a) * r, z: this.home.z + Math.sin(a) * r };
        }
      }
    } else if (this.state === 'chase') {
      if (this.rank === 'unique') this._slam(dt, player, combat);
      const ent = this.targetEnt && !this.targetEnt.dead ? this.targetEnt : null;
      if (ent && (dp > 7 || playerSafe) && !inSafeZone(ent.x, ent.z)) {
        const ex = ent.x - p.x, ez = ent.z - p.z, de = Math.hypot(ex, ez);
        if (de > this.type.range * 0.85 + (ent.r || 0.8)) this._moveToward(ent.x, ent.z, this.type.speed * slow, dt);
        else { this.heading = Math.atan2(ex, ez); if (this.atkCd <= 0) { this.atkCd = this.type.atkInt / slow; this.attackAnim = 0.3; ent.hurt(this.dmg, this); } }
      } else if (playerSafe || (homeDist > LEASH && !this.noLeash)) { this.state = 'return'; this.provoked = false; if (this.noLeash) { this.home.x = p.x; this.home.z = p.z; } }
      else if (dp > this.type.range * 0.85) {
        this._moveToward(player.pos.x, player.pos.z, this.type.speed * slow, dt);
      } else {
        this.heading = Math.atan2(dpx, dpz);
        if (this.atkCd <= 0) {
          this.atkCd = this.type.atkInt / slow;
          this.attackAnim = 0.3;
          combat.damagePlayer(this.dmg, this, this.type.magic ? 'mag' : 'phys');
        }
      }
    } else if (this.state === 'return') {
      const rem = this._moveToward(this.home.x, this.home.z, this.type.speed * 1.4, dt);
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.3 * dt);
      if (rem < 1.2) { this.state = 'idle'; this.hp = this.maxHp; this.wanderT = 2; }
      else if (!playerSafe && dp < this.type.aggro * 0.6 && this.provoked) this.state = 'chase';
    }

    p.y = terrainHeight(p.x, p.z);
    this.group.rotation.y = this.heading;
    this._animate(dt);
  }

  _animate(dt) {
    if (this.kind === 'gltf') {
      const run = this.state === 'chase' || this.state === 'return';
      if (this.attackAnim > 0 && !this._atkStarted) { this._atkStarted = true; if (!this._oneShot(this.actions.attack2 && Math.random() < 0.3 ? 'attack2' : 'attack', 1.25)) this._atkStarted = false; }
      if (this.attackAnim <= 0) this._atkStarted = false;
      if (this._shot) { this._shot.t -= dt * this.mixer.timeScale; if (this._shot.t <= 0) { this._shot.a.fadeOut(0.15); this._shot = null; } }
      if (!this._shot) this._play(this.moving ? (run ? 'run' : 'walk') : 'idle');
      this.mixer.timeScale = this.status.slow ? 0.5 : 1;
      if (this.base && this.moving) this.base.timeScale = run ? Math.min(1.6, this.type.speed / 5.5) : 1;
      this.mixer.update(dt);
      if (this.headBone) this.headBone.scale.setScalar(0.74);
      if (this.fly) this.body.position.y = this.fly + Math.sin(performance.now() * 0.002 + this.walkPhase) * 0.15;
      if (this.tailPart) this.tailPart.rotation.x = Math.sin(performance.now() * 0.004 + this.walkPhase) * 0.08 - (this.attackAnim > 0 ? 0.5 * Math.sin((1 - this.attackAnim / 0.3) * Math.PI) : 0);
      return;
    }
    if (this.moving) this.walkPhase += dt * (this.state === 'chase' || this.state === 'return' ? 12 : 7);
    const s = this.moving ? Math.sin(this.walkPhase) * 0.8 : 0;
    const atk = this.attackAnim > 0 ? Math.sin((1 - this.attackAnim / 0.3) * Math.PI) : 0;
    if (this.kind === 'quad') {
      this.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 3 ? s : -s); });
    } else if (this.kind === 'biped' || this.kind === 'char') {
      if (this.legs.length === 2) { this.legs[0].rotation.x = s; this.legs[1].rotation.x = -s; }
      if (this.arms.length === 2) { this.arms[0].rotation.x = -s * 0.8; this.arms[1].rotation.x = s * 0.8; }
      if (this.armR && atk) this.armR.rotation.x = -2.3 * atk;
    } else if (this.kind === 'float') {
      this.body.position.y = 0.3 + Math.sin(performance.now() * 0.003 + this.walkPhase) * 0.2;
      if (this.arms.length === 2) { this.arms[0].rotation.x = -1.2 - atk; this.arms[1].rotation.x = -1.2 - atk; }
    } else if (this.kind === 'snake') {
      const t = performance.now() * 0.006 + this.walkPhase;
      this.segs.forEach((m, i) => { m.position.x = Math.sin(t - i * 0.7) * 0.25 * (this.moving ? 1.6 : 0.6); });
      this.headPart.position.y = 1.0 + atk * 0.4; this.headPart.position.z = 0.45 + atk * 0.6;
    }
    // saldırı: öne atılma efekti
    this.body.position.z = atk * 0.5;
    if (this.kind === 'scorpion') this.body.rotation.y = Math.sin(this.walkPhase * 0.5) * 0.05;
  }
}

class MonsterManager {
  constructor(world) {
    this.world = world;
    this.list = [];
    this._spawn();
  }

  _spawn() {
    const rng = mulberry32(4242);
    const rand = (a, b) => a + rng() * (b - a);
    const w = this.world;
    const freeSpot = (x, z) => {
      if (Dungeon.on) { if (!Dungeon.walk(x, z) || !Dungeon.walk(x + 1.5, z) || !Dungeon.walk(x - 1.5, z) || !Dungeon.walk(x, z + 1.5) || !Dungeon.walk(x, z - 1.5) || Math.hypot(x, z) < 20) return false; for (const o of w.obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + 2) return false; return true; }
      if (Math.abs(x) > 270 || Math.abs(z) > 270) return false;
      if (Math.max(Math.abs(x), Math.abs(z)) < SAFE_HALF + 12) return false;
      for (const o of w.obstacles) if (Math.hypot(x - o.x, z - o.z) < o.r + 2) return false;
      return true;
    };
    const ring = (type, count, d0, d1, l0, l1) => {
      let made = 0, tries = 0;
      while (made < count && tries++ < 500) {
        const a = rng() * 6.283, d = rand(d0, d1), x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (!freeSpot(x, z)) continue;
        // yol üstünde doğmasınlar
        if (!Dungeon.on && Math.abs(x - roadCenterX(z)) < 8) continue;
        const lvl = Math.round(l0 + (l1 - l0) * clamp((d - d0) / (d1 - d0), 0, 1)) ;
        this.list.push(new Monster(w, type, lvl, { x, z }));
        made++;
      }
    };
    for (const sp of ZONE.spawns) ring(...sp);
    // Harabelerde haydut kampları
    if (!ZONE.ruinMob) return;
    const [rt, r0, r1] = ZONE.ruinMob;
    for (const c of RUINS) {
      for (let i = 0; i < 4; i++) {
        const a = rng() * 6.283, d = rand(3, 6);
        const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
        if (!freeSpot(x, z)) { i--; if (rng() < 0.2) break; continue; }
        this.list.push(new Monster(w, rt, r0 + Math.floor(rng() * (r1 - r0 + 1)), { x, z }));
      }
    }
  }

  // --- Unique canavarlar: gerçek zamanlı doğma, duyuru ---
  _uniques(dt) {
    this._uT = (this._uT || 0) - dt;
    if (this._uT > 0) return;
    this._uT = 1;
    const now = Date.now(), clk = UniqueClock.get();
    for (const u of ZONE.uniques) {
      const live = this.list.find(m => m.typeKey === u.id && !m.removed);
      if (live) continue;
      if (ZONE.fw) { if (this._fwDone) continue; this._fwDone = true; clk[u.id] = 0; }          // Unutulmuş Dünya: bir kez, hemen
      else if (clk[u.id] === undefined) { UniqueClock.set(u.id, now + (IS_DUNGEON ? 5000 : 90000)); continue; }      // ilk doğma
      if (!ZONE.fw && now < clk[u.id]) continue;
      const shadow = !IS_DUNGEON && Math.random() < 0.12;                 // Gölge Unique: daha güçlü, daha iyi ganimet
      const m = new Monster(this.world, u.id, u.level + (shadow ? 15 : 0), { x: u.x, z: u.z }, { rank: 'unique', shadow });
      m.noRespawn = true; m.respawnTime = 8;
      m.onKilled = () => {
        UniqueClock.set(u.id, Date.now() + u.every * 1000);
        if (this.announce) this.announce(m.type.name + ' yenildi!', 'Bir sonraki ortaya çıkış: ~' + Math.round(u.every / 60) + ' dk', 'kill');
      };
      UniqueClock.set(u.id, now + 3600e3);      // yaşarken yeniden doğmasın
      this.list.push(m);
      if (this.announce) this.announce(m.type.name + ' ortaya çıktı!', regionAt(u.x, u.z) + ' · Sv. ' + u.level, 'spawn');
    }
  }
  uniqueStatus() {
    const now = Date.now(), clk = UniqueClock.get();
    return ZONE.uniques.map(u => {
      const live = this.list.find(m => m.typeKey === u.id && !m.dead);
      return { id: u.id, name: MONSTER_TYPES[u.id].name, level: u.level, region: regionAt(u.x, u.z), live: !!live, mins: live ? 0 : Math.max(0, Math.ceil(((clk[u.id] || now) - now) / 60000)) };
    });
  }

  update(dt, player, combat) {
    this._uniques(dt);
    for (const m of this.list) m.update(dt, player, combat);
    for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i].removed) { this.world.scene.remove(this.list[i].group); this.list.splice(i, 1); }
  }

  nearest(pos, maxDist) {
    let best = null, bd = maxDist;
    for (const m of this.list) {
      if (m.dead) continue;
      const d = Math.hypot(m.x - pos.x, m.z - pos.z);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  hitMeshes() { return this.list.filter(m => !m.dead).map(m => m.hit); }
}
