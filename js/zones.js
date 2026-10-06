// Bölgeler (haritalar): Jangan (Sv. 1–20) → Donwhang (20–40) → Hotan (40–80).
// Her bölge ayrı bir haritadır; geçişte kayıt yapılır ve sayfa yükleme ekranıyla yeniden kurulur (Silkroad'daki gibi).
// Yol kuzey ucu (z−) batıdaki sonraki şehre, güney ucu (z+) doğudaki önceki şehre çıkar.

const ZONES = {
  jangan: {
    id: 'jangan', name: 'Jangan', town: 'Jangan Şehri', next: 'donwhang', prev: null, seed: 0, amp: 1,
    ponds: [{ x: -90, z: 60 }, { x: 120, z: -80 }, { x: 80, z: 150 }, { x: -130, z: -120 }, { x: 170, z: 110 }],
    pondNames: ['Yeşim Vahası', 'Ejder Gölü', 'Gümüş Vaha', 'Kervan Vahası', 'Gün Batımı Vahası'],
    ruins: [{ x: 55, z: -75 }, { x: -75, z: -45 }, { x: -20, z: 110 }], ruinName: 'Haydut Harabeleri', ruinLv: 'Sv. 8–13',
    rings: [{ r: 110, name: 'Kurt Vadisi', lv: 'Sv. 1–5' }, { r: 195, name: 'Akrep Çölü', lv: 'Sv. 5–11' }, { r: 9999, name: 'Kaplan Dağları', lv: 'Sv. 13–20' }],
    spawns: [['wolf', 14, 40, 105, 1, 5], ['boar', 9, 50, 105, 2, 6], ['scorpion', 14, 100, 190, 5, 10], ['tiger', 10, 200, 270, 13, 17], ['golem', 8, 215, 275, 16, 20]],
    ruinMob: ['bandit', 8, 13],
    uniques: [{ id: 'u_tiger', level: 20, x: 150, z: 205, every: 600 }],
    shop: [1, 2, 3], tele: [{ zone: 'donwhang', cost: 500 }],
    col: { sand: 0xdcbf86, dark: 0xc29a5c, rock: 0xa88a62, grass: 0x7d9a52, road: 0x9a8260, outer: 0xc9a468, mount: 0xb89868, skyH: 0xf0d9a8, skyZ: 0x5fa4e0 },
    flora: { palms: 50, cacti: 90, rocks: 130, pines: 0, crypts: 0, bushes: 130 }, tint: null,
    npc: { merchant: 'Şifacı Ali', smith: 'Demirci Wen', armor: 'Zırhçı Mei', acc: 'Takıcı Su', storage: 'Depocu Lin', captain: 'Kaptan Lee', tele: 'Işınlayıcı Bao', job: 'Lonca Ustası Fu', stable: 'Seyis Tan', special: 'Ticaret Ustası Hu', den: 'Hırsız Simsarı Kara' }
  },
  donwhang: {
    id: 'donwhang', name: 'Donwhang', town: 'Donwhang Şehri', next: 'hotan', prev: 'jangan', seed: 1.7, amp: 0.85,
    ponds: [{ x: -60, z: -120 }, { x: 140, z: 40 }, { x: -150, z: 150 }],
    pondNames: ['Hilal Gölü', 'Deve Vahası', 'Kayıp Vaha'],
    ruins: [{ x: 90, z: -60 }, { x: -110, z: 30 }, { x: 40, z: 140 }], ruinName: 'Haydut Kalesi', ruinLv: 'Sv. 28–33',
    rings: [{ r: 110, name: 'Çakal Ovası', lv: 'Sv. 20–26' }, { r: 195, name: 'Yılan Kanyonu', lv: 'Sv. 25–32' }, { r: 9999, name: 'Mumya Çölü', lv: 'Sv. 32–40' }],
    spawns: [['jackal', 14, 40, 105, 20, 24], ['sandscorp', 10, 50, 105, 21, 26], ['snake', 14, 100, 190, 25, 31], ['mummy', 10, 200, 270, 32, 37], ['skeleton', 9, 210, 275, 34, 39]],
    ruinMob: ['dbandit', 28, 33],
    uniques: [{ id: 'u_uruchi', level: 40, x: -190, z: -180, every: 720 }],
    shop: [3, 4, 5], tele: [{ zone: 'jangan', cost: 500 }, { zone: 'hotan', cost: 1500 }],
    col: { sand: 0xe6c886, dark: 0xcfa45a, rock: 0xb08a5a, grass: 0x8a9a52, road: 0xa08460, outer: 0xd8b070, mount: 0xc8a068, skyH: 0xf5dfae, skyZ: 0x6aa8dc },
    flora: { palms: 25, cacti: 70, rocks: 150, pines: 0, crypts: 16, bushes: 80 }, tint: 0xfff0d0,
    npc: { merchant: 'Şifacı Mo', smith: 'Demirci Chang', armor: 'Zırhçı Ling', acc: 'Takıcı Yun', storage: 'Depocu Han', captain: 'Komutan Zhao', tele: 'Işınlayıcı Wei', job: 'Lonca Ustası Ma', stable: 'Seyis Bo', special: 'Ticaret Ustası Jin', den: 'Hırsız Simsarı Sinsi' }
  },
  hotan: {
    id: 'hotan', name: 'Hotan', town: 'Hotan Şehri', next: null, prev: 'donwhang', seed: 3.3, amp: 1.55,
    ponds: [{ x: 70, z: 95 }, { x: -120, z: -40 }, { x: 160, z: -150 }, { x: -70, z: 185 }, { x: 125, z: 10 }, { x: -170, z: 110 }],
    pondNames: ['Yeşim Nehri', 'Buzlu Göl', 'Kunlun Pınarı', 'Ak Su', 'Kara Su', 'Ay Gölü'],
    ruins: [{ x: -80, z: -140 }, { x: 150, z: 170 }], ruinName: 'Tepe Haydutları', ruinLv: 'Sv. 50–56',
    rings: [{ r: 110, name: 'Buzul Eteği', lv: 'Sv. 40–48' }, { r: 195, name: 'Hayalet Ormanı', lv: 'Sv. 48–58' }, { r: 250, name: 'Kunlun Geçidi', lv: 'Sv. 58–70' }, { r: 9999, name: 'Taklamakan', lv: 'Sv. 70–80' }],
    spawns: [['icewolf', 13, 40, 105, 40, 45], ['bear', 10, 50, 108, 43, 48], ['ghost', 14, 110, 190, 48, 56], ['stonegolem', 10, 200, 248, 58, 66], ['demon', 10, 252, 280, 70, 79]],
    ruinMob: ['hbandit', 50, 56],
    uniques: [{ id: 'u_isyutaru', level: 60, x: 210, z: -40, every: 900 }, { id: 'u_yarkan', level: 80, x: -250, z: 250, every: 1200 }],
    shop: [6, 7, 8], tele: [{ zone: 'donwhang', cost: 1500 }, { zone: 'jangan', cost: 2000 }],
    col: { sand: 0xc8b48a, dark: 0xa89870, rock: 0xd8d8dc, grass: 0x6a9a4a, road: 0x8a7a62, outer: 0xb8a888, mount: 0xe8eef4, skyH: 0xe8ecf0, skyZ: 0x4a8ad0 },
    flora: { palms: 8, cacti: 0, rocks: 170, pines: 140, crypts: 0, bushes: 150 }, tint: 0xe8f0ff,
    npc: { merchant: 'Şifacı Aysu', smith: 'Demirci Tarık', armor: 'Zırhçı Ilgın', acc: 'Takıcı Nur', storage: 'Depocu Emre', captain: 'Bey Arslan', tele: 'Işınlayıcı Kaya', job: 'Lonca Ustası Oğuz', stable: 'Seyis Batu', special: 'Ticaret Ustası Kerim', den: 'Hırsız Simsarı Gölge' }
  }
};

// Mevcut bölge kayıttan okunur (yeni karakter Jangan'da başlar)
const CUR_ZONE_ID = (() => {
  try { const s = JSON.parse(localStorage.getItem('silkroad-web-save')); if (s && s.zone && ZONES[s.zone]) return s.zone; } catch (e) { /* yok */ }
  return 'jangan';
})();
const ZONE = ZONES[CUR_ZONE_ID];
CONFIG.sky.horizon = ZONE.col.skyH; CONFIG.sky.zenith = ZONE.col.skyZ;

// Unique zamanlayıcıları (gerçek zaman, ms) — bölge geçişlerinde korunur
const UniqueClock = {
  KEY: 'silkroad-web-uniques',
  get() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { return {}; } },
  set(id, t) { const d = this.get(); d[id] = t; try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch (e) { /* yoksay */ } }
};
