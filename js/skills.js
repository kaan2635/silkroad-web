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
  force:     { name: 'Kuvvet',   full: 'Kuvvet Ustalığı', icon: '✨', kind: 'elem', elem: 'force', desc: 'Şifa, arınma ve koruma büyüleri.' },
  // --- Avrupa sınıfları: en çok iki tanesi seçilir (ana + yan sınıf), toplam sınır seviye x2 ---
  warrior: { name: 'Savaşçı', full: 'Savaşçı Ustalığı', icon: '🛡️', kind: 'weapon', race: 'eu', weapons: ['esword', 'tsword', 'axe'], desc: 'Ön saflarda dayanıklı dövüşçü: tek el kılıç + kalkan, çift el kılıç ya da çift balta.' },
  rogue:   { name: 'Haydut',  full: 'Haydut Ustalığı',  icon: '🗡️', kind: 'weapon', race: 'eu', weapons: ['xbow', 'dagger'], desc: 'Arbaletle uzaktan, hançerle gölgeden vurur; zehir ve gizlenme.' },
  wizard:  { name: 'Büyücü',  full: 'Büyücü Ustalığı',  icon: '🔥', kind: 'elem', race: 'eu', elem: 'fire', elems: ['fire', 'cold', 'lightning'], weapons: ['staff'], desc: 'Asayla ateş, buz ve şimşek büyüleri; alan hasarı ve ışınlanma.' },
  warlock: { name: 'Lanetçi', full: 'Lanetçi Ustalığı', icon: '💀', kind: 'elem', race: 'eu', elem: 'dark', elems: ['dark'], weapons: ['dstaff'], desc: 'Kara asayla lanetler, zehir, korku ve can emme.' },
  cleric:  { name: 'Rahip',   full: 'Rahip Ustalığı',   icon: '✝️', kind: 'elem', race: 'eu', elem: 'force', elems: ['force'], weapons: ['rod'], desc: 'Rahip asası + kalkan: şifa, koruma, diriliş ve kutsal ışık.' },
  bard:    { name: 'Ozan',    full: 'Ozan Ustalığı',    icon: '🎵', kind: 'elem', race: 'eu', elem: 'sound', elems: ['sound'], weapons: ['harp'], desc: 'Arpla güçlendiren şarkılar, uyutan ve sersemleten ezgiler.' }
};
for (const k in MASTERIES) MASTERIES[k].race = MASTERIES[k].race || 'ch';
const raceMasteries = (r = RACE) => Object.keys(MASTERIES).filter(k => MASTERIES[k].race === r);
const ELEM_COLOR = { cold: 0x8fdcff, lightning: 0xd8c8ff, fire: 0xff7a1a, force: 0xfff0a0, phys: 0xffe9a8, dark: 0xb070ff, sound: 0x7affe0 };
const ELEM_CLS = { cold: 'cold', lightning: 'bolt', fire: 'fire', force: 'heal', phys: 'hit', dark: 'bolt', sound: 'cold' };

const masteryCost = m => Math.round(4 + 1.6 * m + 0.18 * m * m);   // m-1 → m
const masteryLimit = (level, race) => level * (race === 'eu' ? 2 : 3);
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
  { id: 'fc_guard', m: 'force', name: 'Gök Kalkanı', icon: '🌟', type: 'absorb', reqM: 24, maxR: 3, step: 12, mp: 45, cd: 30, dur: 15, val: RK(0.2, 0.4), desc: 'Hasarı emen ışık kalkanı' },
  // ===== iSRO yüksek kademeler (ustalık 30–140) =====
  // --- Bicheon ---
  { id: 'bc_cut', m: 'bicheon', name: 'Kesik Bıçak', icon: '🗡️', type: 'atk', reqM: 34, maxR: 5, step: 6, mp: 48, cd: 6, hits: 2, mult: RK(1.6, 2.6), status: 'bleed', chance: 0.5, sdur: 5, desc: 'Cut Blade: iki derin kesik, kanatır' },
  { id: 'bc_force', m: 'bicheon', name: 'Kılıç Gücü', icon: '💫', type: 'atk', reqM: 48, maxR: 5, step: 6, mp: 70, cd: 9, hits: 1, mult: RK(3.0, 4.6), aoe: 3.5, at: 'target', status: 'knock', chance: 0.35, sdur: 2, desc: 'Blade Force: kılıçtan fırlayan güç dalgası' },
  { id: 'bc_bloom', m: 'bicheon', name: 'Çiçek Açan Kılıç', icon: '🌸', type: 'atk', reqM: 62, maxR: 5, step: 6, mp: 95, cd: 11, hits: 4, mult: RK(0.95, 1.5), aoe: 4.5, at: 'self', desc: 'Flower Bloom Blade: etrafa dört kılıç darbesi' },
  { id: 'bc_wall', m: 'bicheon', name: 'Çelik Duvar', icon: '🏰', type: 'buff', reqM: 72, maxR: 4, step: 8, mp: 110, cd: 6, dur: 300, needShield: true, buff: { pdefPct: RK(30, 55), block: RK(12, 24), dmgTaken: RK(0.92, 0.82) }, desc: 'Kalkanla aşılmaz savunma duruşu' },
  { id: 'bc_dance', m: 'bicheon', name: 'Tayfun Kılıç Dansı', icon: '🌀', type: 'atk', reqM: 86, maxR: 5, step: 6, mp: 150, cd: 14, hits: 6, mult: RK(0.9, 1.4), aoe: 5.5, at: 'self', status: 'stun', chance: 0.25, sdur: 1.2, desc: 'Typhoon Sword Dance: kılıçla dönen kasırga' },
  { id: 'bc_heaven', m: 'bicheon', name: 'Göksel Kılıç', icon: '☀️', type: 'atk', reqM: 108, maxR: 5, step: 6, mp: 210, cd: 16, hits: 1, mult: RK(6.5, 9.5), status: 'stun', chance: 0.5, sdur: 2, desc: 'Heaven Sword: tek ve yıkıcı darbe' },
  { id: 'bc_pass2', m: 'bicheon', name: 'Kılıç Ruhu', icon: '📕', type: 'passive', reqM: 56, maxR: 5, step: 12, pass: { patkPct: RK(4, 18), crit: RK(1, 5) }, desc: 'Kalıcı: fiziksel saldırı ve kritik' },
  // --- Heuksal ---
  { id: 'hk_wolf', m: 'heuksal', name: 'Kurt Isırığı Mızrağı', icon: '🐺', type: 'atk', reqM: 34, maxR: 5, step: 6, mp: 52, cd: 6, hits: 3, mult: RK(1.0, 1.6), status: 'bleed', chance: 0.45, sdur: 5, desc: 'Wolf Bite Spear: üç ısıran hamle' },
  { id: 'hk_chain', m: 'heuksal', name: 'Zincir Mızrak', icon: '⛓️', type: 'atk', reqM: 48, maxR: 5, step: 6, mp: 75, cd: 9, hits: 3, mult: RK(1.1, 1.7), aoe: 3.5, at: 'target', desc: 'Chain Spear: hedef ve yanındakileri deler' },
  { id: 'hk_ghost', m: 'heuksal', name: 'Hayalet Mızrak', icon: '👻', type: 'atk', reqM: 62, maxR: 5, step: 6, mp: 100, cd: 11, hits: 1, mult: RK(4.0, 6.0), status: 'knock', chance: 0.5, sdur: 2, desc: 'Ghost Spear: ruhları bile delen saplama' },
  { id: 'hk_bond', m: 'heuksal', name: 'Ruh Bağı', icon: '🔥', type: 'buff', reqM: 72, maxR: 4, step: 8, mp: 115, cd: 6, dur: 300, buff: { patkPct: RK(22, 40), hpPct: RK(5, 12) }, desc: 'Soul Bond: silahla ruh birleşir, saldırı ve can artar' },
  { id: 'hk_bloody', m: 'heuksal', name: 'Kanlı Fırtına', icon: '🩸', type: 'atk', reqM: 86, maxR: 5, step: 6, mp: 160, cd: 14, hits: 3, mult: RK(1.4, 2.1), aoe: 6, at: 'self', status: 'bleed', chance: 0.6, sdur: 6, desc: 'Bloody Storm: etrafa kanlı kasırga' },
  { id: 'hk_dragon', m: 'heuksal', name: 'Uçan Ejder', icon: '🐲', type: 'atk', reqM: 108, maxR: 5, step: 6, mp: 220, cd: 17, hits: 1, mult: RK(5.0, 7.5), aoe: 6, at: 'target', status: 'knock', chance: 0.6, sdur: 2.5, desc: 'Flying Dragon: havalanıp hedefin üstüne iner' },
  { id: 'hk_pass2', m: 'heuksal', name: 'Pala Ruhu', icon: '📗', type: 'passive', reqM: 56, maxR: 5, step: 12, pass: { patkPct: RK(3, 14), hpPct: RK(4, 14) }, desc: 'Kalıcı: fiziksel saldırı ve can' },
  // --- Pacheon ---
  { id: 'pc_anti', m: 'pacheon', name: 'Şeytan Kovan Yay', icon: '🎯', type: 'atk', reqM: 34, maxR: 5, step: 6, mp: 46, cd: 6, hits: 3, mult: RK(1.0, 1.6), desc: 'Anti Devil Bow: üç kutsanmış ok' },
  { id: 'pc_combo', m: 'pacheon', name: 'Ok Kombosu', icon: '🏹', type: 'atk', reqM: 48, maxR: 5, step: 6, mp: 70, cd: 9, hits: 5, mult: RK(0.8, 1.25), desc: 'Arrow Combo: beş okluk seri' },
  { id: 'pc_hawk', m: 'pacheon', name: 'Şahin Ruhu', icon: '🦅', type: 'buff', reqM: 60, maxR: 4, step: 8, mp: 100, cd: 6, dur: 300, buff: { crit: RK(10, 20), patkPct: RK(10, 22), range: RK(3, 6) }, desc: 'Mind Hawk: kritik, saldırı ve menzil artar' },
  { id: 'pc_autumn', m: 'pacheon', name: 'Sonbahar Rüzgârı', icon: '🍂', type: 'atk', reqM: 76, maxR: 5, step: 6, mp: 135, cd: 13, hits: 2, mult: RK(1.4, 2.1), aoe: 6, at: 'target', status: 'slow', chance: 0.6, sdur: 4, desc: 'Autumn Wind: hedefin çevresine yaprak gibi ok fırtınası' },
  { id: 'pc_soul', m: 'pacheon', name: 'Ruh Oku', icon: '✴️', type: 'atk', reqM: 104, maxR: 5, step: 7, mp: 205, cd: 15, hits: 1, mult: RK(7.0, 10.0), status: 'stun', chance: 0.4, sdur: 1.5, desc: 'Soul Arrow: ruhu delen tek ok' },
  { id: 'pc_pass2', m: 'pacheon', name: 'Kartal Nişanı', icon: '📙', type: 'passive', reqM: 56, maxR: 5, step: 12, pass: { crit: RK(2, 8), patkPct: RK(3, 12) }, desc: 'Kalıcı: kritik ve fiziksel saldırı' },
  // --- Soğuk ---
  { id: 'cd_wave', m: 'cold', name: 'Soğuk Dalga', icon: '🌊', type: 'nuke', elem: 'cold', reqM: 32, maxR: 5, step: 6, mp: 50, cd: 5, mult: RK(2.6, 3.8), range: 15, proj: true, status: 'slow', chance: 0.5, sdur: 4, desc: 'Cold Wave: buz dalgası, yavaşlatır' },
  { id: 'cd_wall', m: 'cold', name: 'Buz Duvarı', icon: '🧱', type: 'absorb', reqM: 46, maxR: 4, step: 8, mp: 85, cd: 25, dur: 20, val: RK(0.25, 0.45), desc: 'Ice Wall: hasarı emen buz duvarı' },
  { id: 'cd_frost', m: 'cold', name: 'Don Novası', icon: '❄️', type: 'nuke', elem: 'cold', reqM: 62, maxR: 5, step: 6, mp: 115, cd: 13, mult: RK(1.8, 2.8), aoe: 7, at: 'self', status: 'freeze', chance: 0.6, sdur: 2.5, desc: 'Frost Nova: çevreyi dondurur' },
  { id: 'cd_blizz', m: 'cold', name: 'Kar Kıyameti', icon: '🌨️', type: 'nuke', elem: 'cold', reqM: 88, maxR: 5, step: 6, mp: 170, cd: 15, mult: RK(2.4, 3.6), range: 16, aoe: 8, at: 'target', status: 'freeze', chance: 0.45, sdur: 2.5, desc: 'Snow Storm: hedefin üstüne kar fırtınası' },
  { id: 'cd_snow', m: 'cold', name: 'Kar Kalkanı', icon: '🛡️', type: 'buff', reqM: 110, maxR: 4, step: 8, mp: 200, cd: 8, dur: 300, buff: { pdefPct: RK(25, 45), mdefPct: RK(25, 45), dmgTaken: RK(0.9, 0.8) }, desc: 'Snow Shield: her türlü hasara karşı kar örtüsü' },
  // --- Şimşek ---
  { id: 'lt_thunder', m: 'lightning', name: 'Gök Gürültüsü Gücü', icon: '⚡', type: 'imbue', elem: 'lightning', reqM: 40, maxR: 5, step: 8, mp: 60, cd: 1, dur: 45, val: RK(0.55, 0.95), status: 'stun', chance: 0.15, sdur: 0.8, desc: 'Thunder Force: güçlü şimşek aşılaması' },
  { id: 'lt_flash', m: 'lightning', name: 'Şimşek Adımı', icon: '👣', type: 'dash', reqM: 52, maxR: 3, step: 12, mp: 70, cd: 6, dist: RK(14, 20), desc: 'Flash Step: çok uzağa anında ışınlanır' },
  { id: 'lt_lion', m: 'lightning', name: 'Aslan Kükremesi', icon: '🦁', type: 'nuke', elem: 'lightning', reqM: 64, maxR: 5, step: 6, mp: 120, cd: 12, mult: RK(2.0, 3.0), range: 16, aoe: 7, at: 'target', status: 'stun', chance: 0.35, sdur: 1.2, desc: 'Lion Thunder: hedef ve çevresine şimşek' },
  { id: 'lt_heaven', m: 'lightning', name: 'Göksel Yıldırım', icon: '🌩️', type: 'nuke', elem: 'lightning', reqM: 98, maxR: 5, step: 7, mp: 190, cd: 14, mult: RK(6.0, 8.5), range: 18, status: 'stun', chance: 0.5, sdur: 1.5, desc: 'Heaven Thunder: tek hedefe dev yıldırım' },
  { id: 'lt_pass', m: 'lightning', name: 'Elektrik Bedeni', icon: '📒', type: 'passive', reqM: 30, maxR: 5, step: 14, pass: { matkPct: RK(3, 15), crit: RK(1, 4) }, desc: 'Kalıcı: büyü saldırısı ve kritik' },
  // --- Ateş ---
  { id: 'fr_flame', m: 'fire', name: 'Alev Ruhu', icon: '🔥', type: 'imbue', elem: 'fire', reqM: 40, maxR: 5, step: 8, mp: 60, cd: 1, dur: 45, val: RK(0.55, 0.95), status: 'burn', chance: 0.3, sdur: 5, desc: 'Flame Spirit: güçlü ateş aşılaması' },
  { id: 'fr_wave', m: 'fire', name: 'Alev Dalgası', icon: '🌋', type: 'nuke', elem: 'fire', reqM: 50, maxR: 5, step: 6, mp: 85, cd: 7, mult: RK(2.8, 4.2), range: 15, aoe: 4, proj: true, status: 'burn', chance: 0.45, sdur: 5, desc: 'Flame Wave: patlayan alev topu' },
  { id: 'fr_phoenix', m: 'fire', name: 'Anka Kuşu', icon: '🐦‍🔥', type: 'nuke', elem: 'fire', reqM: 72, maxR: 5, step: 6, mp: 140, cd: 13, mult: RK(2.6, 3.8), range: 16, aoe: 6, at: 'target', status: 'burn', chance: 0.6, sdur: 6, desc: 'Phoenix: alevden kuş hedefe dalar' },
  { id: 'fr_inferno', m: 'fire', name: 'Cehennem Ateşi', icon: '💥', type: 'nuke', elem: 'fire', reqM: 100, maxR: 5, step: 7, mp: 210, cd: 16, mult: RK(3.0, 4.4), aoe: 8, at: 'self', status: 'burn', chance: 0.7, sdur: 6, desc: 'Inferno: çevreni ateş denizine çevirir' },
  { id: 'fr_pass', m: 'fire', name: 'Ateş Kalbi', icon: '📒', type: 'passive', reqM: 30, maxR: 5, step: 14, pass: { matkPct: RK(4, 18) }, desc: 'Kalıcı: büyü saldırısı' },
  // --- Kuvvet ---
  { id: 'fc_heal2', m: 'force', name: 'Büyük Şifa', icon: '💖', type: 'heal', reqM: 38, maxR: 5, step: 8, mp: 90, cd: 8, val: RK(0.4, 0.65), desc: 'Canının büyük kısmını yeniler' },
  { id: 'fc_bless', m: 'force', name: 'Kutsama', icon: '🙏', type: 'buff', reqM: 52, maxR: 4, step: 8, mp: 100, cd: 6, dur: 600, buff: { hpPct: RK(6, 14), mpPct: RK(8, 20) }, desc: 'Azami can ve mana artar' },
  { id: 'fc_resur', m: 'force', name: 'Diriliş', icon: '🕯️', type: 'buff', reqM: 66, maxR: 4, step: 10, mp: 160, cd: 300, dur: 600, buff: { revive: RK(30, 80) }, desc: 'Resurrection: ölürsen bu canla yerinde dirilirsin (bir kez)' },
  { id: 'fc_aura', m: 'force', name: 'Kuvvet Aurası', icon: '🔆', type: 'buff', reqM: 88, maxR: 4, step: 10, mp: 180, cd: 60, dur: 30, buff: { dmgTaken: RK(0.85, 0.7), regen: RK(1, 2.5) }, desc: 'Hasarı azaltan ve can yenileyen aura' },
  { id: 'fc_holy', m: 'force', name: 'Kutsal Işık', icon: '✨', type: 'nuke', elem: 'force', reqM: 106, maxR: 5, step: 6, mp: 200, cd: 14, mult: RK(2.8, 4.2), aoe: 7, at: 'self', desc: 'Holy Light: çevreye kutsal patlama' },
  // ===== Avrupa =====
  // --- Savaşçı ---
  { id: 'wr_smash', m: 'warrior', name: 'Saplama Ezişi', icon: '💥', type: 'atk', reqM: 1, maxR: 5, step: 6, mp: 7, cd: 3, hits: 2, mult: RK(0.85, 1.6), desc: 'Stab Smash: iki ağır darbe' },
  { id: 'wr_shout', m: 'warrior', name: 'Savaş Çığlığı', icon: '📣', type: 'buff', reqM: 4, maxR: 4, step: 10, mp: 22, cd: 5, dur: 180, buff: { patkPct: RK(10, 24) }, desc: 'Warcry: fiziksel saldırı artar' },
  { id: 'wr_dash', m: 'warrior', name: 'Hücum', icon: '🐂', type: 'dash', reqM: 8, maxR: 3, step: 12, mp: 18, cd: 9, dist: RK(9, 14), desc: 'Sprint Assault: hedefe atılır' },
  { id: 'wr_iron', m: 'warrior', name: 'Demir Deri', icon: '🛡️', type: 'buff', reqM: 12, maxR: 4, step: 10, mp: 26, cd: 5, dur: 180, buff: { pdefPct: RK(15, 35), hpPct: RK(4, 10) }, desc: 'Iron Skin: fiziksel savunma ve can artar' },
  { id: 'wr_ground', m: 'warrior', name: 'Yer Sarsıntısı', icon: '🌋', type: 'atk', reqM: 20, maxR: 5, step: 7, mp: 34, cd: 10, hits: 1, mult: RK(1.4, 2.4), aoe: 5, at: 'self', status: 'stun', chance: 0.45, sdur: 1.5, desc: 'Ground Impact: yere vurup çevreyi sersemletir' },
  { id: 'wr_pass', m: 'warrior', name: 'Savaşçı Disiplini', icon: '📕', type: 'passive', reqM: 10, maxR: 5, step: 12, pass: { hpPct: RK(4, 16), patkPct: RK(2, 10) }, desc: 'Kalıcı: can ve fiziksel saldırı' },
  { id: 'wr_whirl', m: 'warrior', name: 'Balta Kasırgası', icon: '🌀', type: 'atk', reqM: 34, maxR: 5, step: 7, mp: 60, cd: 11, hits: 3, mult: RK(1.0, 1.6), aoe: 5, at: 'self', status: 'bleed', chance: 0.4, sdur: 5, desc: 'Hurricane: dönerek etrafı biçer' },
  { id: 'wr_dragon', m: 'warrior', name: 'Ejder Kesiği', icon: '🐉', type: 'atk', reqM: 52, maxR: 5, step: 7, mp: 95, cd: 12, hits: 1, mult: RK(3.6, 5.4), status: 'knock', chance: 0.5, sdur: 2, desc: 'Dragon Slash: yere seren dev darbe' },
  { id: 'wr_rage', m: 'warrior', name: 'Öfke', icon: '😤', type: 'buff', reqM: 70, maxR: 4, step: 9, mp: 130, cd: 60, dur: 40, buff: { patkPct: RK(25, 45), speedPct: RK(10, 20), crit: RK(5, 12) }, desc: 'Berserker Rage: kısa süre büyük güç' },
  { id: 'wr_taunt', m: 'warrior', name: 'Kale Duruşu', icon: '🏰', type: 'buff', reqM: 86, maxR: 4, step: 9, mp: 150, cd: 8, dur: 300, buff: { pdefPct: RK(30, 50), mdefPct: RK(15, 30), dmgTaken: RK(0.9, 0.8) }, desc: 'Defensive Stance: aşılmaz savunma' },
  { id: 'wr_exec', m: 'warrior', name: 'İnfaz', icon: '⚔️', type: 'atk', reqM: 104, maxR: 5, step: 7, mp: 210, cd: 16, hits: 2, mult: RK(3.4, 5.0), status: 'stun', chance: 0.5, sdur: 1.5, desc: 'Execution: iki öldürücü darbe' },
  // --- Haydut ---
  { id: 'rg_shot', m: 'rogue', name: 'Çifte Atış', icon: '🎯', type: 'atk', reqM: 1, maxR: 5, step: 6, mp: 6, cd: 2.5, hits: 2, mult: RK(0.8, 1.5), desc: 'Hızlı iki saldırı' },
  { id: 'rg_stab', m: 'rogue', name: 'Sırttan Bıçak', icon: '🔪', type: 'atk', reqM: 5, maxR: 5, step: 7, mp: 14, cd: 6, hits: 1, mult: RK(2.0, 3.4), status: 'bleed', chance: 0.5, sdur: 5, desc: 'Back Stab: kanatan sinsi darbe' },
  { id: 'rg_hide', m: 'rogue', name: 'Gizlenme', icon: '🌫️', type: 'buff', reqM: 9, maxR: 3, step: 12, mp: 20, cd: 5, dur: 120, buff: { speedPct: RK(15, 30), crit: RK(5, 12) }, desc: 'Stealth: gölgelere karışır, hız ve kritik artar' },
  { id: 'rg_poison', m: 'rogue', name: 'Zehirli Silah', icon: '🧪', type: 'imbue', elem: 'dark', reqM: 14, maxR: 5, step: 8, mp: 20, cd: 1, dur: 45, val: RK(0.18, 0.5), status: 'poison', chance: 0.35, sdur: 6, desc: 'Poison: saldırılar zehirler' },
  { id: 'rg_rain', m: 'rogue', name: 'Cıvata Yağmuru', icon: '🌧️', type: 'atk', reqM: 22, maxR: 5, step: 7, mp: 36, cd: 10, hits: 1, mult: RK(1.3, 2.3), aoe: 5, at: 'target', desc: 'Hedefin çevresine yağmur gibi saldırı' },
  { id: 'rg_pass', m: 'rogue', name: 'Haydut İçgüdüsü', icon: '📙', type: 'passive', reqM: 10, maxR: 5, step: 12, pass: { crit: RK(2, 9), patkPct: RK(2, 9) }, desc: 'Kalıcı: kritik ve fiziksel saldırı' },
  { id: 'rg_venom', m: 'rogue', name: 'Zehir Bulutu', icon: '☠️', type: 'atk', reqM: 38, maxR: 5, step: 7, mp: 66, cd: 12, hits: 1, mult: RK(1.3, 2.1), aoe: 5.5, at: 'self', status: 'poison', chance: 0.8, sdur: 8, desc: 'Etrafa zehir saçar' },
  { id: 'rg_pierce', m: 'rogue', name: 'Delici Cıvata', icon: '➹', type: 'atk', reqM: 56, maxR: 5, step: 7, mp: 100, cd: 12, hits: 1, mult: RK(4.0, 6.0), status: 'knock', chance: 0.4, sdur: 2, desc: 'Zırhı delip geçen saldırı' },
  { id: 'rg_shadow', m: 'rogue', name: 'Gölge Darbesi', icon: '🌑', type: 'atk', reqM: 78, maxR: 5, step: 7, mp: 150, cd: 14, hits: 4, mult: RK(1.2, 1.8), status: 'stun', chance: 0.3, sdur: 1.2, desc: 'Shadow Strike: gölgeden dört darbe' },
  { id: 'rg_assn', m: 'rogue', name: 'Suikast', icon: '🗡️', type: 'atk', reqM: 104, maxR: 5, step: 7, mp: 205, cd: 16, hits: 1, mult: RK(7.0, 10.0), status: 'bleed', chance: 0.7, sdur: 6, desc: 'Assassination: tek ve ölümcül darbe' },
  // --- Büyücü ---
  { id: 'wz_fire', m: 'wizard', name: 'Ateş Oku', icon: '☄️', type: 'nuke', elem: 'fire', reqM: 1, maxR: 5, step: 6, mp: 12, cd: 3, mult: RK(2.0, 3.2), range: 14, proj: true, status: 'burn', chance: 0.25, sdur: 4, desc: 'Fire Bolt: uzaktan ateş' },
  { id: 'wz_ice', m: 'wizard', name: 'Buz Mızrağı', icon: '🧊', type: 'nuke', elem: 'cold', reqM: 5, maxR: 5, step: 6, mp: 15, cd: 4, mult: RK(2.0, 3.2), range: 14, proj: true, status: 'slow', chance: 0.5, sdur: 3, desc: 'Ice Lance: yavaşlatan buz' },
  { id: 'wz_blink', m: 'wizard', name: 'Işınlanma', icon: '✨', type: 'dash', reqM: 8, maxR: 3, step: 12, mp: 16, cd: 7, dist: RK(10, 16), desc: 'Teleportation: ileri ışınlanır' },
  { id: 'wz_bolt', m: 'wizard', name: 'Şimşek Çarpması', icon: '🌩', type: 'nuke', elem: 'lightning', reqM: 12, maxR: 5, step: 7, mp: 22, cd: 6, mult: RK(2.6, 4.0), range: 15, status: 'stun', chance: 0.3, sdur: 1, desc: 'Lightning Strike: tek hedefe yıldırım' },
  { id: 'wz_rain', m: 'wizard', name: 'Ateş Yağmuru', icon: '🔥', type: 'nuke', elem: 'fire', reqM: 22, maxR: 5, step: 7, mp: 40, cd: 11, mult: RK(1.5, 2.4), range: 15, aoe: 6, at: 'target', status: 'burn', chance: 0.5, sdur: 4, desc: 'Fire Rain: hedefin çevresine ateş' },
  { id: 'wz_pass', m: 'wizard', name: 'Büyücü Bilgeliği', icon: '📘', type: 'passive', reqM: 10, maxR: 5, step: 12, pass: { matkPct: RK(4, 16), mpPct: RK(4, 14) }, desc: 'Kalıcı: büyü saldırısı ve mana' },
  { id: 'wz_mana', m: 'wizard', name: 'Mana Kalkanı', icon: '🔮', type: 'absorb', reqM: 30, maxR: 4, step: 9, mp: 60, cd: 25, dur: 18, val: RK(0.22, 0.4), desc: 'Mana Shield: hasarı emen büyü kalkanı' },
  { id: 'wz_nova', m: 'wizard', name: 'Buzul Patlaması', icon: '❄️', type: 'nuke', elem: 'cold', reqM: 44, maxR: 5, step: 7, mp: 80, cd: 12, mult: RK(1.8, 2.8), aoe: 7, at: 'self', status: 'freeze', chance: 0.55, sdur: 2.5, desc: 'Frost Nova: çevreyi dondurur' },
  { id: 'wz_thunder', m: 'wizard', name: 'Gök Gürültüsü', icon: '⛈️', type: 'nuke', elem: 'lightning', reqM: 62, maxR: 5, step: 7, mp: 120, cd: 13, mult: RK(2.2, 3.2), range: 16, aoe: 7, at: 'target', status: 'stun', chance: 0.35, sdur: 1.2, desc: 'Thunder Storm: geniş alana şimşek' },
  { id: 'wz_earth', m: 'wizard', name: 'Toprak Kalkanı', icon: '🪨', type: 'buff', reqM: 76, maxR: 4, step: 9, mp: 130, cd: 8, dur: 300, buff: { pdefPct: RK(20, 40), mdefPct: RK(20, 40) }, desc: 'Earth Barrier: savunma büyüsü' },
  { id: 'wz_meteor', m: 'wizard', name: 'Kıyamet Ateşi', icon: '🌋', type: 'nuke', elem: 'fire', reqM: 100, maxR: 5, step: 7, mp: 220, cd: 17, mult: RK(3.4, 5.0), range: 17, aoe: 8, at: 'target', meteor: true, status: 'burn', chance: 0.6, sdur: 6, desc: 'Meteor: gökten dev ateş topu' },
  // --- Lanetçi ---
  { id: 'wl_curse', m: 'warlock', name: 'Lanet Oku', icon: '💀', type: 'nuke', elem: 'dark', reqM: 1, maxR: 5, step: 6, mp: 12, cd: 3, mult: RK(1.9, 3.0), range: 14, proj: true, status: 'poison', chance: 0.45, sdur: 6, desc: 'Dark Bolt: zehirleyen lanet' },
  { id: 'wl_blood', m: 'warlock', name: 'Kan Laneti', icon: '🩸', type: 'nuke', elem: 'dark', reqM: 5, maxR: 5, step: 7, mp: 18, cd: 6, mult: RK(2.2, 3.6), range: 14, status: 'bleed', chance: 0.7, sdur: 6, desc: 'Blood Curse: hedefi içten kanatır' },
  { id: 'wl_drain', m: 'warlock', name: 'Can Emme', icon: '🧛', type: 'nuke', elem: 'dark', reqM: 10, maxR: 5, step: 8, mp: 24, cd: 8, mult: RK(1.8, 2.8), range: 14, proj: true, drain: 0.4, desc: 'Life Drain: verdiği hasarın %40\'ı kadar can kazandırır' },
  { id: 'wl_fear', m: 'warlock', name: 'Korku', icon: '😱', type: 'nuke', elem: 'dark', reqM: 18, maxR: 5, step: 7, mp: 34, cd: 12, mult: RK(1.0, 1.6), aoe: 6, at: 'self', status: 'stun', chance: 0.6, sdur: 2, desc: 'Fear: çevredekileri dehşete düşürür' },
  { id: 'wl_pass', m: 'warlock', name: 'Karanlık Ruh', icon: '📒', type: 'passive', reqM: 10, maxR: 5, step: 12, pass: { matkPct: RK(4, 18) }, desc: 'Kalıcı: büyü saldırısı' },
  { id: 'wl_veil', m: 'warlock', name: 'Karanlık Perde', icon: '🌑', type: 'buff', reqM: 30, maxR: 4, step: 9, mp: 60, cd: 6, dur: 240, buff: { mdefPct: RK(15, 35), dmgTaken: RK(0.95, 0.85) }, desc: 'Dark Veil: büyü savunması ve hasar azaltma' },
  { id: 'wl_cloud', m: 'warlock', name: 'Kara Bulut', icon: '☁️', type: 'nuke', elem: 'dark', reqM: 44, maxR: 5, step: 7, mp: 85, cd: 12, mult: RK(1.6, 2.5), range: 15, aoe: 6.5, at: 'target', status: 'poison', chance: 0.8, sdur: 8, desc: 'Dark Cloud: zehirli kara bulut' },
  { id: 'wl_terror', m: 'warlock', name: 'Dehşet', icon: '👁️', type: 'nuke', elem: 'dark', reqM: 64, maxR: 5, step: 7, mp: 125, cd: 14, mult: RK(2.2, 3.2), aoe: 7, at: 'self', status: 'stun', chance: 0.55, sdur: 2.2, desc: 'Terror: geniş alanda korku' },
  { id: 'wl_harvest', m: 'warlock', name: 'Ruh Hasadı', icon: '⚰️', type: 'nuke', elem: 'dark', reqM: 100, maxR: 5, step: 7, mp: 210, cd: 16, mult: RK(5.5, 8.0), range: 16, drain: 0.3, status: 'bleed', chance: 0.6, sdur: 6, desc: 'Soul Harvest: dev hasar, can emer' },
  // --- Rahip ---
  { id: 'cl_heal', m: 'cleric', name: 'Şifa Işığı', icon: '💚', type: 'heal', reqM: 1, maxR: 5, step: 7, mp: 18, cd: 5, val: RK(0.22, 0.48), desc: 'Healing: canını yeniler' },
  { id: 'cl_strike', m: 'cleric', name: 'Kutsal Darbe', icon: '✝️', type: 'nuke', elem: 'force', reqM: 1, maxR: 5, step: 6, mp: 12, cd: 3, mult: RK(1.8, 2.9), range: 12, desc: 'Holy Strike: kutsal ışık vurur' },
  { id: 'cl_cure', m: 'cleric', name: 'Kutsal Arınma', icon: '🕊️', type: 'cure', reqM: 4, maxR: 1, step: 1, mp: 14, cd: 7, desc: 'Cure: tüm kötü etkileri kaldırır' },
  { id: 'cl_bless', m: 'cleric', name: 'Kutsama Zırhı', icon: '🛡️', type: 'buff', reqM: 10, maxR: 4, step: 10, mp: 28, cd: 5, dur: 300, buff: { pdefPct: RK(10, 25), mdefPct: RK(10, 25) }, desc: 'Blessing: savunmalar artar' },
  { id: 'cl_regen', m: 'cleric', name: 'Yenilenme', icon: '🌿', type: 'buff', reqM: 18, maxR: 4, step: 9, mp: 34, cd: 30, dur: 20, buff: { regen: RK(1.5, 4) }, desc: 'Regeneration: sürekli can yeniler' },
  { id: 'cl_pass', m: 'cleric', name: 'İman', icon: '📒', type: 'passive', reqM: 10, maxR: 5, step: 12, pass: { hpPct: RK(3, 12), mpPct: RK(4, 14) }, desc: 'Kalıcı: can ve mana' },
  { id: 'cl_shield', m: 'cleric', name: 'Kutsal Kalkan', icon: '🌟', type: 'absorb', reqM: 28, maxR: 4, step: 9, mp: 55, cd: 25, dur: 18, val: RK(0.25, 0.45), desc: 'Holy Shield: hasarı emer' },
  { id: 'cl_res', m: 'cleric', name: 'Diriliş Duası', icon: '🕯️', type: 'buff', reqM: 40, maxR: 4, step: 10, mp: 90, cd: 300, dur: 600, buff: { revive: RK(40, 100) }, desc: 'Resurrection: ölürsen yerinde dirilirsin (bir kez)' },
  { id: 'cl_heal2', m: 'cleric', name: 'Büyük Şifa', icon: '💖', type: 'heal', reqM: 58, maxR: 5, step: 8, mp: 110, cd: 8, val: RK(0.45, 0.75), desc: 'Great Healing: canın büyük kısmı' },
  { id: 'cl_aura', m: 'cleric', name: 'Kutsal Aura', icon: '🔆', type: 'buff', reqM: 78, maxR: 4, step: 9, mp: 150, cd: 60, dur: 30, buff: { dmgTaken: RK(0.8, 0.65), regen: RK(1, 2.5) }, desc: 'Holy Aura: hasar azalır, can yenilenir' },
  { id: 'cl_wrath', m: 'cleric', name: 'Göğün Gazabı', icon: '☀️', type: 'nuke', elem: 'force', reqM: 100, maxR: 5, step: 7, mp: 200, cd: 15, mult: RK(3.0, 4.5), aoe: 7, at: 'self', status: 'stun', chance: 0.4, sdur: 1.5, desc: 'Heaven\'s Wrath: kutsal patlama' },
  // --- Ozan ---
  { id: 'bd_note', m: 'bard', name: 'Keskin Nota', icon: '🎵', type: 'nuke', elem: 'sound', reqM: 1, maxR: 5, step: 6, mp: 10, cd: 3, mult: RK(1.8, 2.9), range: 13, proj: true, desc: 'Sharp Note: ses dalgası' },
  { id: 'bd_speed', m: 'bard', name: 'Hız Şarkısı', icon: '💨', type: 'buff', reqM: 4, maxR: 3, step: 12, mp: 18, cd: 5, dur: 300, buff: { speedPct: RK(15, 35) }, desc: 'Moving March: hareket hızı' },
  { id: 'bd_war', m: 'bard', name: 'Savaş Marşı', icon: '🥁', type: 'buff', reqM: 10, maxR: 4, step: 10, mp: 28, cd: 5, dur: 300, buff: { patkPct: RK(8, 20), matkPct: RK(8, 20) }, desc: 'War March: tüm saldırılar artar' },
  { id: 'bd_sleep', m: 'bard', name: 'Ninni', icon: '😴', type: 'nuke', elem: 'sound', reqM: 16, maxR: 5, step: 7, mp: 30, cd: 12, mult: RK(0.6, 1.0), range: 14, aoe: 6, at: 'target', status: 'freeze', chance: 0.75, sdur: 3, desc: 'Lullaby: düşmanları uyutur' },
  { id: 'bd_pass', m: 'bard', name: 'Ozan Ruhu', icon: '📒', type: 'passive', reqM: 10, maxR: 5, step: 12, pass: { mpPct: RK(4, 16), matkPct: RK(2, 10) }, desc: 'Kalıcı: mana ve büyü saldırısı' },
  { id: 'bd_mana', m: 'bard', name: 'Mana Ezgisi', icon: '🎶', type: 'buff', reqM: 24, maxR: 4, step: 9, mp: 30, cd: 30, dur: 60, buff: { mregen: RK(1, 2.5), regen: RK(0.5, 1.2) }, desc: 'Mana Song: mana ve can yeniler' },
  { id: 'bd_chaos', m: 'bard', name: 'Kaos Notası', icon: '🎼', type: 'nuke', elem: 'sound', reqM: 36, maxR: 5, step: 7, mp: 65, cd: 11, mult: RK(1.8, 2.8), range: 15, aoe: 6, at: 'target', status: 'stun', chance: 0.4, sdur: 1.2, desc: 'Chaos Note: sersemleten akor' },
  { id: 'bd_guard', m: 'bard', name: 'Koruma Şarkısı', icon: '🛡️', type: 'buff', reqM: 50, maxR: 4, step: 9, mp: 90, cd: 6, dur: 300, buff: { pdefPct: RK(15, 30), mdefPct: RK(15, 30), dmgTaken: RK(0.95, 0.88) }, desc: 'Guard Song: savunma şarkısı' },
  { id: 'bd_dance', m: 'bard', name: 'Ölüm Dansı', icon: '💃', type: 'nuke', elem: 'sound', reqM: 70, maxR: 5, step: 7, mp: 130, cd: 13, mult: RK(2.4, 3.4), aoe: 7, at: 'self', status: 'stun', chance: 0.35, sdur: 1.5, desc: 'Dance of Death: çevreye ses patlaması' },
  { id: 'bd_symph', m: 'bard', name: 'Senfoni', icon: '🎻', type: 'buff', reqM: 96, maxR: 4, step: 10, mp: 190, cd: 60, dur: 60, buff: { patkPct: RK(18, 32), matkPct: RK(18, 32), speedPct: RK(10, 20), crit: RK(4, 10) }, desc: 'Symphony: kısa süre her şey güçlenir' }
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
  const names = { pdefPct: 'Fiz. savunma %', mdefPct: 'Büyü savunma %', patkPct: 'Fiz. saldırı %', matkPct: 'Büyü saldırı %', speedPct: 'Hız %', crit: 'Kritik +', block: 'Blok %', range: 'Menzil +', hpPct: 'Can %', mpPct: 'Mana %', regen: 'Can yenileme %/sn ', dmgTaken: 'Alınan hasar x', revive: 'Diriliş canı %', mregen: 'Mana yenileme %/sn ' };
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
    this.race = 'ch';
    this.rank = {};             // id -> kademe
    this.sp = 0; this.spExp = 0;
    this.onChange = null;
  }
  changed() { if (this.onChange) this.onChange(); }
  total() { let t = 0; for (const k in this.mastery) t += this.mastery[k]; return t; }
  limit() { return masteryLimit(this.p.stats.level, this.race); }
  // Avrupa: seçilen sınıflar (ustalığı > 0), ana = en yüksek
  classes() { return raceMasteries(this.race).filter(k => this.mastery[k] > 0).sort((a, b) => this.mastery[b] - this.mastery[a]); }
  r(id) { return this.rank[id] || 0; }

  canRaise(k) {
    const m = this.mastery[k] + 1;
    if (MASTERIES[k].race !== this.race) return { ok: false, msg: 'Bu ustalık ' + RACE_NAMES[MASTERIES[k].race] + ' ırkına özel.' };
    if (this.race === 'eu' && m === 1 && this.classes().length >= 2) return { ok: false, msg: 'Avrupalılar en çok iki sınıf seçebilir (ana + yan sınıf).' };
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
    if (MASTERIES[s.m].race !== this.race) return { ok: false, msg: 'Bu yetenek ' + RACE_NAMES[MASTERIES[s.m].race] + ' ırkına özel.' };
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
  // Ustalık sıfırlama: harcanan bütün SP geri
  refund() {
    let n = 0;
    for (const k in this.mastery) { for (let m = 1; m <= this.mastery[k]; m++) n += masteryCost(m); this.mastery[k] = 0; }
    for (const id in this.rank) { const s = SKILLS_BY_ID[id]; for (let r = 1; r <= this.rank[id]; r++) n += rankCost(s, r); }
    this.rank = {}; this.sp += n; this.changed();
    return n;
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
const SKILL_TYPE_NAMES = { atk: 'Saldırı', nuke: 'Büyü', buff: 'Güçlendirme', imbue: 'Aşılama', heal: 'Şifa', cure: 'Arınma', dash: 'Işınlanma', passive: 'Kalıcı', absorb: 'Kalkan' };
